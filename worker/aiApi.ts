import {
  AI_ANALYSIS_REQUEST_VERSION,
  SCAM_ANALYSIS_REQUEST_VERSION,
  SCAM_ANALYSIS_RESPONSE_VERSION,
  TRANSLATION_REQUEST_VERSION,
  TRANSLATION_RESPONSE_VERSION,
  type AiAnalysisRequestV3,
  type AiAnalysisSuccessV3,
  type AiApiErrorV1,
  type ScamAnalysisRequestV1,
  type ScamAnalysisResponseV1,
  type TranslationRequestV2,
  type TranslationResponseV2,
} from '../src/lib/aiContracts'

const API_STATUS_PATH = '/api/ai/status'
const API_ANALYZE_PATH = '/api/ai/analyze'
const MAX_MESSAGE_CHARACTERS = 10_000
const MAX_REQUEST_BYTES = 48 * 1024
const MAX_RESPONSE_BYTES = 48 * 1024
const DEFAULT_PROVIDER_TIMEOUT_MS = 8_000

export interface AiProvider {
  translate(
    request: TranslationRequestV2,
    signal: AbortSignal,
  ): Promise<TranslationResponseV2>
  analyze(
    request: ScamAnalysisRequestV1,
    signal: AbortSignal,
  ): Promise<ScamAnalysisResponseV1>
}

export interface AiApiOptions {
  provider?: AiProvider
  providerTimeoutMs?: number
}

export class AiProviderError extends Error {
  constructor(
    readonly code: 'rate_limited' | 'unavailable' | 'invalid_response',
    readonly retryAfterSeconds?: number,
  ) {
    super(code)
  }
}

class InputError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

class ProviderTimeoutError extends Error {}
class ProviderFailureError extends Error {}
class InvalidProviderOutputError extends Error {}

function responseHeaders(): Headers {
  return new Headers({
    'Cache-Control': 'no-store, no-cache, max-age=0, private',
    'Content-Security-Policy':
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    'Content-Type': 'application/json; charset=utf-8',
    Expires: '0',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    Pragma: 'no-cache',
  })
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(),
  })
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  state: AiApiErrorV1['status'] = 'error',
): Response {
  const body: AiApiErrorV1 = {
    status: state,
    error: { code, message },
  }
  return jsonResponse(body, status)
}

function inputError(error: InputError): Response {
  return errorResponse(error.statusCode, error.code, error.message)
}

function methodNotAllowed(allowed: string, message: string): Response {
  const response = errorResponse(405, 'method_not_allowed', message)
  response.headers.set('Allow', allowed)
  return response
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readRequestJson(request: Request): Promise<unknown> {
  if (
    request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !==
    'application/json'
  ) {
    throw new InputError(
      415,
      'unsupported_content_type',
      'Content-Type must be application/json.',
    )
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength !== null) {
    const parsedLength = Number(contentLength)
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new InputError(400, 'invalid_content_length', 'Content-Length is invalid.')
    }
    if (parsedLength > MAX_REQUEST_BYTES) {
      throw new InputError(
        413,
        'request_too_large',
        'Request body exceeds the allowed size.',
      )
    }
  }

  if (!request.body) {
    throw new InputError(400, 'invalid_json', 'A JSON request body is required.')
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel()
        throw new InputError(
          413,
          'request_too_large',
          'Request body exceeds the allowed size.',
        )
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  let bodyText: string
  try {
    bodyText = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new InputError(400, 'invalid_json', 'Request body must be valid UTF-8 JSON.')
  }

  try {
    return JSON.parse(bodyText) as unknown
  } catch {
    throw new InputError(400, 'invalid_json', 'Request body must be valid JSON.')
  }
}

function validateRequest(value: unknown): AiAnalysisRequestV3 {
  if (!isRecord(value) || value.version !== AI_ANALYSIS_REQUEST_VERSION) {
    throw new InputError(
      400,
      'invalid_request',
      'A supported request version is required.',
    )
  }
  if (typeof value.message !== 'string' || value.message.trim().length === 0) {
    throw new InputError(400, 'empty_message', 'Message must not be empty.')
  }
  if (value.message.length > MAX_MESSAGE_CHARACTERS) {
    throw new InputError(
      413,
      'message_too_large',
      'Message exceeds the allowed length.',
    )
  }
  if (value.userInitiated !== true) {
    throw new InputError(
      400,
      'user_action_required',
      'Start analysis using the on-page action.',
    )
  }

  return {
    version: AI_ANALYSIS_REQUEST_VERSION,
    message: value.message,
    userInitiated: true,
  }
}

function isSameOriginBrowserRequest(request: Request): boolean {
  const requestOrigin = new URL(request.url).origin
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')

  return (
    (origin === null || origin === requestOrigin) &&
    (fetchSite === null || fetchSite === 'same-origin')
  )
}

function isTranslationResponse(value: unknown): value is TranslationResponseV2 {
  return (
    isRecord(value) &&
    value.version === TRANSLATION_RESPONSE_VERSION &&
    (typeof value.sourceLanguage === 'string' || value.sourceLanguage === null) &&
    (value.sourceLanguage === null || value.sourceLanguage.length <= 50) &&
    (value.detectedLanguage === 'bangla' ||
      value.detectedLanguage === 'english' ||
      value.detectedLanguage === 'other' ||
      value.detectedLanguage === 'uncertain') &&
    (value.targetLanguage === 'en' || value.targetLanguage === 'bn') &&
    typeof value.translatedText === 'string' &&
    value.translatedText.trim().length > 0 &&
    value.translatedText.length <= MAX_MESSAGE_CHARACTERS * 2
  )
}

function isScamAnalysisResponse(value: unknown): value is ScamAnalysisResponseV1 {
  if (
    !isRecord(value) ||
    value.version !== SCAM_ANALYSIS_RESPONSE_VERSION ||
    !['suspicious', 'no_indicators', 'uncertain'].includes(String(value.verdict)) ||
    typeof value.summary !== 'string' ||
    value.summary.trim().length === 0 ||
    value.summary.length > 2_000 ||
    !Array.isArray(value.indicators) ||
    value.indicators.length > 20
  ) {
    return false
  }

  return value.indicators.every(
    (indicator) =>
      isRecord(indicator) &&
      [
        'secret_request',
        'urgency',
        'prize_claim',
        'link',
        'impersonation',
        'other',
      ].includes(String(indicator.category)) &&
      typeof indicator.explanation === 'string' &&
      indicator.explanation.trim().length > 0 &&
      indicator.explanation.length <= 800,
  )
}

async function runProviderStage<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let timedOut = false
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
      reject(new ProviderTimeoutError())
    }, timeoutMs)
  })

  try {
    return await Promise.race([operation(controller.signal), timeout])
  } catch (error) {
    if (error instanceof ProviderTimeoutError || timedOut) {
      throw new ProviderTimeoutError()
    }
    if (error instanceof AiProviderError) throw error
    throw new ProviderFailureError()
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    if (!timedOut) controller.abort()
  }
}

async function handleAnalysis(
  request: Request,
  options: Required<Pick<AiApiOptions, 'providerTimeoutMs'>> & AiApiOptions,
): Promise<Response> {
  if (request.method !== 'POST') {
    return methodNotAllowed('POST', 'Use POST for message analysis.')
  }
  if (!isSameOriginBrowserRequest(request)) {
    return errorResponse(
      403,
      'origin_not_allowed',
      'Cross-origin analysis requests are not allowed.',
    )
  }

  let     body: AiAnalysisRequestV3
  try {
    body = validateRequest(await readRequestJson(request))
  } catch (error) {
    if (error instanceof InputError) return inputError(error)
    return errorResponse(500, 'internal_error', 'Request could not be processed.')
  }

  if (!options.provider) {
    return errorResponse(
      503,
      'ai_not_configured',
      'AI analysis is unavailable because a provider has not been configured.',
      'unavailable',
    )
  }

  const provider = options.provider
  try {
    let englishTranslation: TranslationResponseV2 | null = null
    let banglaTranslation: TranslationResponseV2 | null = null
    const detected = await runProviderStage(
      (signal) =>
        provider.translate(
          {
            version: TRANSLATION_REQUEST_VERSION,
            text: body.message,
            targetLanguage: 'en',
          },
          signal,
        ),
      options.providerTimeoutMs,
    )
    if (!isTranslationResponse(detected) || detected.targetLanguage !== 'en') {
      throw new InvalidProviderOutputError()
    }
    if (detected.detectedLanguage === 'uncertain') {
      throw new InvalidProviderOutputError()
    }

    let englishText = body.message
    if (detected.detectedLanguage === 'english') {
      banglaTranslation = await runProviderStage(
        (signal) =>
          provider.translate(
            {
              version: TRANSLATION_REQUEST_VERSION,
              text: body.message,
              targetLanguage: 'bn',
            },
            signal,
          ),
        options.providerTimeoutMs,
      )
      if (!isTranslationResponse(banglaTranslation) || banglaTranslation.targetLanguage !== 'bn') {
        throw new InvalidProviderOutputError()
      }
      if (banglaTranslation.detectedLanguage !== 'english') {
        throw new InvalidProviderOutputError()
      }
    } else {
      englishTranslation = detected
      englishText = detected.translatedText
    }
    if (detected.detectedLanguage === 'other') {
      banglaTranslation = await runProviderStage(
        (signal) =>
          provider.translate(
            {
              version: TRANSLATION_REQUEST_VERSION,
              text: body.message,
              targetLanguage: 'bn',
            },
            signal,
          ),
        options.providerTimeoutMs,
      )
      if (!isTranslationResponse(banglaTranslation) || banglaTranslation.targetLanguage !== 'bn') {
        throw new InvalidProviderOutputError()
      }
      if (banglaTranslation.detectedLanguage !== 'other') {
        throw new InvalidProviderOutputError()
      }
    }
    const analysisRequest: ScamAnalysisRequestV1 = {
      version: SCAM_ANALYSIS_REQUEST_VERSION,
      englishText,
    }
    const analysis = await runProviderStage(
      (signal) => provider.analyze(analysisRequest, signal),
      options.providerTimeoutMs,
    )
    if (!isScamAnalysisResponse(analysis)) {
      throw new InvalidProviderOutputError()
    }

    const success: AiAnalysisSuccessV3 = {
      status: 'completed',
      version: 'ai-analysis-response.v3',
      englishTranslation,
      banglaTranslation,
      analysis,
    }
    const responseText = JSON.stringify(success)
    if (new TextEncoder().encode(responseText).byteLength > MAX_RESPONSE_BYTES) {
      throw new InvalidProviderOutputError()
    }
    return new Response(responseText, {
      status: 200,
      headers: responseHeaders(),
    })
  } catch (error) {
    if (error instanceof AiProviderError && error.code === 'rate_limited') {
      const response = errorResponse(
        503,
        'provider_rate_limited',
        'AI analysis is temporarily unavailable. No result was produced.',
        'unavailable',
      )
      const retryAfterSeconds = error.retryAfterSeconds
      if (
        typeof retryAfterSeconds === 'number' &&
        Number.isInteger(retryAfterSeconds) &&
        retryAfterSeconds > 0 &&
        retryAfterSeconds <= 3_600
      ) {
        response.headers.set('Retry-After', String(retryAfterSeconds))
      }
      return response
    }
    if (error instanceof AiProviderError && error.code === 'invalid_response') {
      return errorResponse(
        502,
        'invalid_provider_response',
        'AI analysis returned an invalid response. No result was produced.',
        'unavailable',
      )
    }
    if (error instanceof AiProviderError) {
      return errorResponse(
        503,
        'provider_unavailable',
        'AI analysis is temporarily unavailable. No result was produced.',
        'unavailable',
      )
    }
    if (error instanceof ProviderTimeoutError) {
      return errorResponse(
        504,
        'provider_timeout',
        'AI analysis did not complete in time. No result was produced.',
        'unavailable',
      )
    }
    if (error instanceof InvalidProviderOutputError) {
      return errorResponse(
        502,
        'invalid_provider_response',
        'AI analysis returned an invalid response. No result was produced.',
        'unavailable',
      )
    }
    if (error instanceof ProviderFailureError) {
      return errorResponse(
        502,
        'provider_failure',
        'AI analysis is unavailable because the provider failed. No result was produced.',
        'unavailable',
      )
    }
    return errorResponse(500, 'internal_error', 'Analysis could not be processed.')
  }
}

export function createAiApi(options: AiApiOptions = {}) {
  const resolvedOptions = {
    ...options,
    providerTimeoutMs: options.providerTimeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS,
  }

  return async function handleApiRequest(request: Request): Promise<Response | null> {
    try {
      const pathname = new URL(request.url).pathname

      if (pathname === API_STATUS_PATH) {
        if (request.method !== 'GET') {
          return methodNotAllowed('GET', 'Use GET for service status.')
        }
        return jsonResponse({
          status: resolvedOptions.provider ? 'ready' : 'unavailable',
          configured: Boolean(resolvedOptions.provider),
          version: 'ai-api.v1',
        })
      }

      if (pathname === API_ANALYZE_PATH) {
        return await handleAnalysis(request, resolvedOptions)
      }

      if (pathname === '/api' || pathname.startsWith('/api/')) {
        return errorResponse(404, 'not_found', 'API route was not found.')
      }

      return null
    } catch {
      return errorResponse(500, 'internal_error', 'Request could not be processed.')
    }
  }
}
