import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AI_ANALYSIS_REQUEST_VERSION,
  SCAM_ANALYSIS_REQUEST_VERSION,
  SCAM_ANALYSIS_RESPONSE_VERSION,
  TRANSLATION_REQUEST_VERSION,
  TRANSLATION_RESPONSE_VERSION,
  type AiAnalysisRequestV3,
  type ScamAnalysisRequestV1,
  type ScamAnalysisResponseV1,
  type TranslationRequestV2,
  type TranslationResponseV2,
} from '../src/lib/aiContracts'
import {
  AiProviderError,
  createAiApi as createAiApiImplementation,
  type AiApiOptions,
  type AiProvider,
  type AiRequestRateLimiter,
} from './aiApi'

const endpoint = 'https://shurokkha.example/api/ai/analyze'
const sampleMessage = 'আপনার OTP এখনই পাঠান।'
const validRequest: AiAnalysisRequestV3 = {
  version: AI_ANALYSIS_REQUEST_VERSION,
  message: sampleMessage,
  userInitiated: true,
}
const translationResult: TranslationResponseV2 = {
  version: TRANSLATION_RESPONSE_VERSION,
  sourceLanguage: 'bn',
  detectedLanguage: 'bangla',
  targetLanguage: 'en',
  translatedText: 'Send your OTP now.',
}
const banglaTranslationResult: TranslationResponseV2 = {
  version: TRANSLATION_RESPONSE_VERSION,
  sourceLanguage: 'en',
  detectedLanguage: 'english',
  targetLanguage: 'bn',
  translatedText: 'এখনই আপনার OTP পাঠান।',
}
const analysisResult: ScamAnalysisResponseV1 = {
  version: SCAM_ANALYSIS_RESPONSE_VERSION,
  verdict: 'suspicious',
  summary: 'The message requests a one-time code.',
  indicators: [
    {
      category: 'secret_request',
      explanation: 'It asks the recipient to share an authentication code.',
    },
  ],
}

function request(
  method = 'POST',
  body: BodyInit | null = JSON.stringify(validRequest),
  headers: HeadersInit = { 'Content-Type': 'application/json' },
): Request {
  const requestHeaders = new Headers(headers)
  if (!requestHeaders.has('CF-Connecting-IP')) {
    requestHeaders.set('CF-Connecting-IP', '203.0.113.10')
  }
  return new Request(endpoint, { method, body, headers: requestHeaders })
}

function createAiApi(options: AiApiOptions = {}) {
  const rateLimiter: AiRequestRateLimiter = {
    limit: vi.fn(async () => ({ success: true })),
  }
  return createAiApiImplementation({
    ...options,
    rateLimiter: options.rateLimiter ?? rateLimiter,
  })
}

function makeProvider(): AiProvider {
  return {
    translate: vi.fn(async (input: TranslationRequestV2) =>
      input.targetLanguage === 'en'
        ? translationResult
        : {
            ...banglaTranslationResult,
            detectedLanguage: 'bangla' as const,
          },
    ),
    analyze: vi.fn(async () => analysisResult),
  }
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

describe('Cloudflare Worker AI API foundation', () => {
  let externalFetch: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    externalFetch = vi.spyOn(globalThis, 'fetch')
  })

  it('reports unavailable status without returning secret configuration', async () => {
    const handler = createAiApi()
    const response = await handler(
      new Request('https://shurokkha.example/api/ai/status'),
    )

    expect(response?.status).toBe(200)
    await expect(json(response!)).resolves.toEqual({
      status: 'unavailable',
      configured: false,
      version: 'ai-api.v1',
    })
  })

  it('allows only GET on the status route and POST on the analysis route', async () => {
    const handler = createAiApi()
    const status = await handler(
      new Request('https://shurokkha.example/api/ai/status', { method: 'POST' }),
    )
    const analysis = await handler(request('GET', null))

    expect(status?.status).toBe(405)
    expect((await json(status!)).status).toBe('error')
    expect(analysis?.status).toBe(405)
    expect((await json(analysis!)).status).toBe('error')
    expect(status?.headers.get('Allow')).toBe('GET')
    expect(analysis?.headers.get('Allow')).toBe('POST')
  })

  it('never returns provider credential-shaped properties from status', async () => {
    const provider = Object.assign(makeProvider(), {
      apiKey: 'test-secret-that-must-not-be-returned',
    })
    const response = await createAiApi({ provider })(
      new Request('https://shurokkha.example/api/ai/status'),
    )
    const responseText = await response!.text()

    expect(responseText).not.toContain('test-secret-that-must-not-be-returned')
    expect(JSON.parse(responseText)).toEqual({
      status: 'ready',
      configured: true,
      version: 'ai-api.v1',
    })
  })

  it('returns JSON 404 for unimplemented API routes', async () => {
    const response = await createAiApi()(
      new Request('https://shurokkha.example/api/ai/unknown'),
    )

    expect(response?.status).toBe(404)
    expect((await json(response!)).error).toEqual({
      code: 'not_found',
      message: 'API route was not found.',
    })
  })

  it('returns unavailable instead of a fabricated result when no provider is configured', async () => {
    const response = await createAiApi()(request())

    expect(response?.status).toBe(503)
    expect(await json(response!)).toEqual({
      status: 'unavailable',
      error: {
        code: 'ai_not_configured',
        message:
          'AI analysis is unavailable because a provider has not been configured.',
      },
    })
    expect(externalFetch).not.toHaveBeenCalled()
  })

  it('rejects non-JSON and malformed JSON bodies', async () => {
    const handler = createAiApi()
    const wrongType = await handler(
      request('POST', 'plain text', { 'Content-Type': 'text/plain' }),
    )
    const malformed = await handler(
      request('POST', '{', { 'Content-Type': 'application/json' }),
    )

    expect(wrongType?.status).toBe(415)
    expect((await json(wrongType!)).error).toMatchObject({
      code: 'unsupported_content_type',
    })
    expect(malformed?.status).toBe(400)
    expect((await json(malformed!)).error).toMatchObject({ code: 'invalid_json' })
  })

  it('rejects empty and whitespace-only messages', async () => {
    const handler = createAiApi()
    for (const message of ['', ' \n\t ']) {
      const response = await handler(
        request('POST', JSON.stringify({ ...validRequest, message })),
      )
      expect(response?.status).toBe(400)
      expect((await json(response!)).error).toMatchObject({
        code: 'empty_message',
      })
    }
  })

  it('rejects messages that exceed the character and request-byte limits', async () => {
    const handler = createAiApi()
    const overCharacterLimit = await handler(
      request('POST', JSON.stringify({ ...validRequest, message: 'x'.repeat(10_001) })),
    )
    const overByteLimit = await handler(
      request(
        'POST',
        JSON.stringify({ ...validRequest, message: '🙂'.repeat(13_000) }),
      ),
    )

    expect(overCharacterLimit?.status).toBe(413)
    expect((await json(overCharacterLimit!)).error).toMatchObject({
      code: 'message_too_large',
    })
    expect(overByteLimit?.status).toBe(413)
    expect((await json(overByteLimit!)).error).toMatchObject({
      code: 'request_too_large',
    })
  })

  it('requires the explicit user action marker', async () => {
    const handler = createAiApi()
    const missingAction = await handler(
      request('POST', JSON.stringify({ ...validRequest, userInitiated: undefined })),
    )
    expect(missingAction?.status).toBe(400)
    expect((await json(missingAction!)).error).toMatchObject({
      code: 'user_action_required',
    })
  })

  it('rejects unsupported request versions', async () => {
    const response = await createAiApi()(
      request('POST', JSON.stringify({ ...validRequest, version: 'v0' })),
    )

    expect(response?.status).toBe(400)
    expect((await json(response!)).error).toMatchObject({
      code: 'invalid_request',
    })
  })

  it('rejects cross-origin browser requests before invoking the provider', async () => {
    const provider = makeProvider()
    const handler = createAiApi({ provider })
    const response = await handler(
      request('POST', JSON.stringify(validRequest), {
        'Content-Type': 'application/json',
        Origin: 'https://other.example',
      }),
    )

    expect(response?.status).toBe(403)
    expect((await json(response!)).error).toMatchObject({
      code: 'origin_not_allowed',
    })
    expect(provider.translate).not.toHaveBeenCalled()
  })

  it('blocks requests that exceed the per-IP rate limit before calling the provider', async () => {
    const provider = makeProvider()
    const limit = vi.fn(async () => ({ success: false }))
    const response = await createAiApi({
      provider,
      rateLimiter: { limit },
    })(request())

    expect(response?.status).toBe(429)
    expect((await json(response!)).error).toMatchObject({
      code: 'rate_limited',
    })
    expect(response?.headers.get('Cache-Control')).toContain('no-store')
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.10' })
    expect(provider.translate).not.toHaveBeenCalled()
    expect(provider.analyze).not.toHaveBeenCalled()
  })

  it('fails closed when the rate limiter is unavailable or the client IP is missing', async () => {
    const provider = makeProvider()
    const missingLimiter = await createAiApiImplementation({ provider })(request())
    const limiterFailure = await createAiApi({
      provider,
      rateLimiter: {
        limit: vi.fn().mockRejectedValue(new Error('rate limiter unavailable')),
      },
    })(request())
    const missingIpRequest = new Request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequest),
    })
    const missingIp = await createAiApi({ provider })(missingIpRequest)

    expect(missingLimiter?.status).toBe(503)
    expect((await json(missingLimiter!)).error).toMatchObject({
      code: 'rate_limit_unavailable',
    })
    expect(limiterFailure?.status).toBe(503)
    expect((await json(limiterFailure!)).error).toMatchObject({
      code: 'rate_limit_unavailable',
    })
    expect(missingIp?.status).toBe(503)
    expect((await json(missingIp!)).error).toMatchObject({
      code: 'rate_limit_unavailable',
    })
    expect(provider.translate).not.toHaveBeenCalled()
  })

  it('translates first, then analyses only the English translation', async () => {
    const calls: string[] = []
    const provider: AiProvider = {
      translate: vi.fn(async (input: TranslationRequestV2) => {
        calls.push('translate')
        expect(input).toEqual({
          version: TRANSLATION_REQUEST_VERSION,
          text: sampleMessage,
          targetLanguage: 'en',
        })
        return translationResult
      }),
      analyze: vi.fn(async (input: ScamAnalysisRequestV1) => {
        calls.push('analyze')
        expect(input).toEqual({
          version: SCAM_ANALYSIS_REQUEST_VERSION,
          englishText: translationResult.translatedText,
        })
        return analysisResult
      }),
    }
    const response = await createAiApi({ provider })(request())

    expect(response?.status).toBe(200)
    expect(calls).toEqual(['translate', 'analyze'])
    expect(await json(response!)).toEqual({
      status: 'completed',
      version: 'ai-analysis-response.v3',
      englishTranslation: translationResult,
      banglaTranslation: null,
      analysis: analysisResult,
    })
    expect(externalFetch).not.toHaveBeenCalled()
  })

  it('treats Banglish as Bangla and analyses its English translation', async () => {
    const provider = makeProvider()
    const banglishMessage = 'Apnar OTP ekhoni pathan'
    const requestBody: AiAnalysisRequestV3 = {
      ...validRequest,
      message: banglishMessage,
    }
    const response = await createAiApi({ provider })(
      request('POST', JSON.stringify(requestBody)),
    )

    expect(response?.status).toBe(200)
    expect(provider.translate).toHaveBeenCalledOnce()
    expect(provider.translate).toHaveBeenCalledWith(
      {
        version: TRANSLATION_REQUEST_VERSION,
        text: banglishMessage,
        targetLanguage: 'en',
      },
      expect.any(AbortSignal),
    )
    expect(provider.analyze).toHaveBeenCalledWith(
      {
        version: SCAM_ANALYSIS_REQUEST_VERSION,
        englishText: translationResult.translatedText,
      },
      expect.any(AbortSignal),
    )
    expect(await json(response!)).toMatchObject({
      englishTranslation: translationResult,
      banglaTranslation: null,
    })
  })

  it('detects English, translates it into Bangla, and analyses the English original', async () => {
    const provider = makeProvider()
    vi.mocked(provider.translate).mockImplementation(async (input) =>
      input.targetLanguage === 'en'
        ? { ...translationResult, detectedLanguage: 'english' }
        : banglaTranslationResult,
    )
    const requestBody: AiAnalysisRequestV3 = {
      ...validRequest,
      message: 'Send your OTP now.',
    }
    const response = await createAiApi({ provider })(
      request('POST', JSON.stringify(requestBody)),
    )

    expect(response?.status).toBe(200)
    expect(provider.translate).toHaveBeenCalledWith(
      {
        version: TRANSLATION_REQUEST_VERSION,
        text: requestBody.message,
        targetLanguage: 'bn',
      },
      expect.any(AbortSignal),
    )
    expect(provider.analyze).toHaveBeenCalledWith(
      {
        version: SCAM_ANALYSIS_REQUEST_VERSION,
        englishText: requestBody.message,
      },
      expect.any(AbortSignal),
    )
    expect(await json(response!)).toMatchObject({
      englishTranslation: null,
      banglaTranslation: banglaTranslationResult,
    })
  })

  it('detects other-language text, translates into both languages, then analyses English', async () => {
    const provider = makeProvider()
    const calls: string[] = []
    vi.mocked(provider.translate).mockImplementation(async (input) => {
      calls.push(`translate-${input.targetLanguage}`)
      return input.targetLanguage === 'en'
        ? { ...translationResult, detectedLanguage: 'other' }
        : { ...banglaTranslationResult, detectedLanguage: 'other' }
    })
    vi.mocked(provider.analyze).mockImplementation(async (input) => {
      calls.push(`analyze-${input.englishText}`)
      return analysisResult
    })
    const requestBody: AiAnalysisRequestV3 = {
      ...validRequest,
      message: 'Mensaje sospechoso',
    }
    const response = await createAiApi({ provider })(
      request('POST', JSON.stringify(requestBody)),
    )

    expect(response?.status).toBe(200)
    expect(calls).toEqual(['translate-en', 'translate-bn', 'analyze-Send your OTP now.'])
    expect(await json(response!)).toMatchObject({
      englishTranslation: { ...translationResult, detectedLanguage: 'other' },
      banglaTranslation: { ...banglaTranslationResult, detectedLanguage: 'other' },
    })
  })

  it('does not analyse when translation or language detection is malformed', async () => {
    const provider = makeProvider()
    vi.mocked(provider.translate).mockResolvedValue({
      ...translationResult,
      detectedLanguage: 'uncertain',
    } as TranslationResponseV2)
    const response = await createAiApi({ provider })(request())
    const body = await json(response!)

    expect(response?.status).toBe(502)
    expect(body.status).toBe('unavailable')
    expect(body.error).toMatchObject({
      code: 'invalid_provider_response',
    })
    expect(provider.analyze).not.toHaveBeenCalled()
  })

  it('does not analyse or return a result when the requested translation is empty', async () => {
    const provider = makeProvider()
    vi.mocked(provider.translate).mockResolvedValue({
      ...translationResult,
      translatedText: '',
    })
    const response = await createAiApi({ provider })(request())

    expect(response?.status).toBe(502)
    expect((await json(response!)).status).toBe('unavailable')
    expect(provider.analyze).not.toHaveBeenCalled()
  })

  it('does not return a result when analysis output is malformed', async () => {
    const provider = makeProvider()
    vi.mocked(provider.analyze).mockResolvedValue({
      ...analysisResult,
      verdict: 'safe',
    } as ScamAnalysisResponseV1)
    const response = await createAiApi({ provider })(request())
    const body = await json(response!)

    expect(response?.status).toBe(502)
    expect(body.status).toBe('unavailable')
    expect(body).not.toHaveProperty('analysis')
    expect(body).not.toHaveProperty('verdict')
  })

  it('rejects provider output that would exceed the response-size limit', async () => {
    const provider = makeProvider()
    vi.mocked(provider.translate).mockResolvedValue({
      ...translationResult,
      translatedText: '\u0985'.repeat(20_000),
    })
    const response = await createAiApi({ provider })(request())
    const body = await json(response!)

    expect(response?.status).toBe(502)
    expect(body.status).toBe('unavailable')
    expect(body).not.toHaveProperty('analysis')
  })

  it('returns an explicit unexpected-error response without logging request data', async () => {
    const handler = createAiApi()
    const log = vi.spyOn(console, 'error')
    const invalidRequest = {
      get url() {
        throw new Error(sampleMessage)
      },
    } as Request
    const response = await handler(invalidRequest)
    const bodyText = await response!.text()

    expect(response?.status).toBe(500)
    expect(bodyText).not.toContain(sampleMessage)
    expect(bodyText).toContain('"status":"error"')
    expect(log).not.toHaveBeenCalled()
  })

  it('returns a provider failure without logging or exposing the thrown message', async () => {
    const provider = makeProvider()
    const log = vi.spyOn(console, 'log')
    const error = vi.spyOn(console, 'error')
    vi.mocked(provider.translate).mockRejectedValue(
      new Error(`private message: ${sampleMessage}`),
    )
    const response = await createAiApi({ provider })(request())
    const bodyText = await response!.text()

    expect(response?.status).toBe(502)
    expect(bodyText).not.toContain(sampleMessage)
    expect(bodyText).toContain('"status":"unavailable"')
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('returns an unavailable rate-limit response and a bounded Retry-After hint', async () => {
    const provider = makeProvider()
    vi.mocked(provider.translate).mockRejectedValue(
      new AiProviderError('rate_limited', 30),
    )
    const response = await createAiApi({ provider })(request())
    const body = await json(response!)

    expect(response?.status).toBe(503)
    expect(response?.headers.get('Retry-After')).toBe('30')
    expect(body.status).toBe('unavailable')
    expect(body.error).toMatchObject({ code: 'provider_rate_limited' })
    expect(body).not.toHaveProperty('analysis')
    expect(provider.analyze).not.toHaveBeenCalled()
  })

  it('does not forward invalid provider retry hints', async () => {
    const provider = makeProvider()
    vi.mocked(provider.translate).mockRejectedValue(
      new AiProviderError('rate_limited', 86_400),
    )
    const response = await createAiApi({ provider })(request())

    expect(response?.status).toBe(503)
    expect(response?.headers.get('Retry-After')).toBeNull()
    expect((await json(response!)).status).toBe('unavailable')
  })

  it('times out translation and analysis stages without returning a safe verdict', async () => {
    const translationProvider = makeProvider()
    let translationAborted = false
    vi.mocked(translationProvider.translate).mockImplementation(
      (_input, signal) =>
        new Promise<TranslationResponseV2>(() => {
          signal.addEventListener('abort', () => {
            translationAborted = true
          })
        }),
    )
    const translationResponse = await createAiApi({
      provider: translationProvider,
      providerTimeoutMs: 5,
    })(request())
    expect(translationResponse?.status).toBe(504)
    expect((await json(translationResponse!)).status).toBe('unavailable')
    expect(translationAborted).toBe(true)

    const analysisProvider = makeProvider()
    let analysisAborted = false
    vi.mocked(analysisProvider.analyze).mockImplementation(
      (_input, signal) =>
        new Promise<ScamAnalysisResponseV1>(() => {
          signal.addEventListener('abort', () => {
            analysisAborted = true
          })
        }),
    )
    const analysisResponse = await createAiApi({
      provider: analysisProvider,
      providerTimeoutMs: 5,
    })(request())
    const body = await json(analysisResponse!)
    expect(analysisResponse?.status).toBe(504)
    expect(body.status).toBe('unavailable')
    expect(body).not.toHaveProperty('analysis')
    expect(body).not.toHaveProperty('verdict')
    expect(analysisAborted).toBe(true)
  })

  it('applies no-store and security headers to API responses', async () => {
    const handler = createAiApi()
    const status = await handler(new Request('https://shurokkha.example/api/ai/status'))
    const analysis = await handler(request())

    for (const response of [status!, analysis!]) {
      expect(response.headers.get('Cache-Control')).toContain('no-store')
      expect(response.headers.get('Content-Type')).toContain('application/json')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Content-Security-Policy')).toContain(
        "default-src 'none'",
      )
    }
  })

  it('does not fetch submitted URLs', async () => {
    const provider = makeProvider()
    const message = 'Read https://192.0.2.19/private-path only as text.'
    const response = await createAiApi({ provider })(
      request('POST', JSON.stringify({ ...validRequest, message })),
    )

    expect(response?.status).toBe(200)
    expect(externalFetch).not.toHaveBeenCalled()
  })

  it('serves non-API requests from the configured static asset binding', async () => {
    const assetResponse = new Response('static app')
    const assetFetch = vi.fn(async () => assetResponse)
    const { default: worker } = await import('./index')
    const response = await worker.fetch(new Request('https://shurokkha.example/'), {
      ASSETS: { fetch: assetFetch },
      AI_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    })

    expect(response).toBe(assetResponse)
    expect(assetFetch).toHaveBeenCalledOnce()
  })

  it('reads Groq credentials from the Worker environment without exposing them', async () => {
    const { default: worker } = await import('./index')
    const secret = 'test-groq-secret'
    const response = await worker.fetch(
      new Request('https://shurokkha.example/api/ai/status'),
      {
        ASSETS: { fetch: vi.fn() },
        AI_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
        GROQ_API_KEY: secret,
      },
    )
    const responseText = await response.text()

    expect(response.status).toBe(200)
    expect(JSON.parse(responseText)).toEqual({
      status: 'ready',
      configured: true,
      version: 'ai-api.v1',
    })
    expect(responseText).not.toContain(secret)
    expect(externalFetch).not.toHaveBeenCalled()
  })

  it('uses the configured rate-limit binding before any provider call', async () => {
    const { default: worker } = await import('./index')
    const limit = vi.fn(async () => ({ success: false }))
    const response = await worker.fetch(request(), {
      ASSETS: { fetch: vi.fn() },
      AI_RATE_LIMITER: { limit },
      GROQ_API_KEY: 'test-groq-secret',
    })

    expect(response.status).toBe(429)
    expect((await json(response)).error).toMatchObject({ code: 'rate_limited' })
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.10' })
    expect(externalFetch).not.toHaveBeenCalled()
  })
})
