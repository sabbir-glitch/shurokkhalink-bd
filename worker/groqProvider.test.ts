import { describe, expect, it, vi } from 'vitest'
import {
  SCAM_ANALYSIS_REQUEST_VERSION,
  SCAM_ANALYSIS_RESPONSE_VERSION,
  TRANSLATION_REQUEST_VERSION,
  TRANSLATION_RESPONSE_VERSION,
} from '../src/lib/aiContracts'
import { createGroqProvider } from './groqProvider'

const translationJson = JSON.stringify({
  sourceLanguage: 'bn',
  detectedLanguage: 'bangla',
  translatedText: 'Send your OTP now.',
})
const analysisJson = JSON.stringify({
  verdict: 'suspicious',
  summary: 'The message requests a one-time code.',
  indicators: [
    {
      category: 'secret_request',
      explanation: 'It asks for an authentication code.',
    },
  ],
})

function completion(content: string, status = 200, headers?: HeadersInit): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers },
  )
}

describe('Groq provider adapter', () => {
  it('uses the configured model and performs translation before English analysis', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(completion(translationJson))
      .mockResolvedValueOnce(completion(analysisJson))
    const provider = createGroqProvider('worker-secret', fetcher)
    const translation = await provider.translate(
      {
        version: TRANSLATION_REQUEST_VERSION,
        text: 'আপনার OTP এখনই পাঠান।',
        targetLanguage: 'en',
      },
      new AbortController().signal,
    )
    const analysis = await provider.analyze(
      {
        version: SCAM_ANALYSIS_REQUEST_VERSION,
        englishText: translation.translatedText,
      },
      new AbortController().signal,
    )

    expect(translation).toEqual({
      version: TRANSLATION_RESPONSE_VERSION,
      sourceLanguage: 'bn',
      detectedLanguage: 'bangla',
      targetLanguage: 'en',
      translatedText: 'Send your OTP now.',
    })
    expect(analysis).toEqual({
      version: SCAM_ANALYSIS_RESPONSE_VERSION,
      verdict: 'suspicious',
      summary: 'The message requests a one-time code.',
      indicators: [
        {
          category: 'secret_request',
          explanation: 'It asks for an authentication code.',
        },
      ],
    })
    expect(fetcher).toHaveBeenCalledTimes(2)

    const [translationUrl, translationOptions] = fetcher.mock.calls[0]
    const [analysisUrl, analysisOptions] = fetcher.mock.calls[1]
    expect(translationUrl).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    )
    expect(analysisUrl).toBe(translationUrl)
    expect(new Headers(translationOptions?.headers).get('Authorization')).toBe(
      'Bearer worker-secret',
    )

    const translationBody = JSON.parse(String(translationOptions?.body))
    expect(translationBody).toMatchObject({
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system' },
        { role: 'user', content: 'আপনার OTP এখনই পাঠান।' },
      ],
    })
    const analysisBody = JSON.parse(String(analysisOptions?.body))
    expect(analysisBody.messages[1]).toEqual({
      role: 'user',
      content: 'Send your OTP now.',
    })
    expect(analysisBody.messages[1].content).not.toContain('আপনার OTP')
  })

  it('instructs faithful translation of Banglish threats and implied consequences', async () => {
    const banglish =
      'Apnar account block hobey. Ekhoni OTP pathan. na hoile apnar khobor ache'
    const faithfulTranslation =
      "Your account will be blocked. Send the OTP immediately. Otherwise, you'll face the consequences."
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        completion(
          JSON.stringify({
            sourceLanguage: 'bn-Latn',
            detectedLanguage: 'bangla',
            translatedText: faithfulTranslation,
          }),
        ),
      )

    const translation = await createGroqProvider('worker-secret', fetcher).translate(
      {
        version: TRANSLATION_REQUEST_VERSION,
        text: banglish,
        targetLanguage: 'en',
      },
      new AbortController().signal,
    )

    expect(translation.translatedText).toBe(faithfulTranslation)
    const [, options] = fetcher.mock.calls[0]
    const requestBody = JSON.parse(String(options?.body))
    const systemPrompt = requestBody.messages[0].content
    expect(requestBody.messages[1].content).toBe(banglish)
    expect(systemPrompt).toContain('including threats, coercion, urgency, negation')
    expect(systemPrompt).toContain('Keep an implied consequence implied and unspecified')
    expect(systemPrompt).toContain('Do not soften or exaggerate the source')
  })

  it('rejects malformed or unstructured model output', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(completion('not JSON'))
    const provider = createGroqProvider('worker-secret', fetcher)

    await expect(
      provider.translate(
        { version: TRANSLATION_REQUEST_VERSION, text: 'sample', targetLanguage: 'en' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('returns a rate-limit error without exposing provider response content', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('private provider details', {
          status: 429,
          headers: { 'Retry-After': '30' },
        }),
      )
    const provider = createGroqProvider('worker-secret', fetcher)

    await expect(
      provider.translate(
        { version: TRANSLATION_REQUEST_VERSION, text: 'sample', targetLanguage: 'en' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 30,
      message: 'rate_limited',
    })
  })

  it('maps provider and network failures to opaque unavailable errors', async () => {
    const httpFetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('secret provider error', { status: 500 }))
    const networkFetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('worker-secret and message content'))
    const input = {
      version: TRANSLATION_REQUEST_VERSION,
      text: 'private message',
      targetLanguage: 'en' as const,
    }

    await expect(
      createGroqProvider('worker-secret', httpFetcher).translate(
        input,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'unavailable',
      message: 'unavailable',
    })
    await expect(
      createGroqProvider('worker-secret', networkFetcher).translate(
        input,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'unavailable', message: 'unavailable' })
  })

  it('validates analysis fields and indicator categories before returning them', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        completion(
          JSON.stringify({
            verdict: 'safe',
            summary: 'Looks fine.',
            indicators: [],
          }),
        ),
      )

    await expect(
      createGroqProvider('worker-secret', fetcher).analyze(
        { version: SCAM_ANALYSIS_REQUEST_VERSION, englishText: 'sample' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'invalid_response' })
  })
})
