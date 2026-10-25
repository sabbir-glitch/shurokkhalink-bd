import {
  AI_ANALYSIS_REQUEST_VERSION,
  SCAM_ANALYSIS_RESPONSE_VERSION,
  TRANSLATION_RESPONSE_VERSION,
  type AiAnalysisSuccessV3,
  type ScamAnalysisResponseV1,
  type ScamIndicatorV1,
  type TranslationResponseV2,
} from './aiContracts'

const MAX_MESSAGE_CHARACTERS = 10_000

export class AiAnalysisError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isVerdict(value: unknown): value is ScamAnalysisResponseV1['verdict'] {
  return value === 'suspicious' || value === 'no_indicators' || value === 'uncertain'
}

function isCategory(value: unknown): value is ScamIndicatorV1['category'] {
  return (
    value === 'secret_request' ||
    value === 'urgency' ||
    value === 'prize_claim' ||
    value === 'link' ||
    value === 'impersonation' ||
    value === 'other'
  )
}

function isIndicator(value: unknown): value is ScamIndicatorV1 {
  return (
    isRecord(value) &&
    isCategory(value.category) &&
    typeof value.explanation === 'string' &&
    value.explanation.trim().length > 0 &&
    value.explanation.length <= 800
  )
}

function isTranslation(value: unknown): value is TranslationResponseV2 {
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

function isAnalysis(value: unknown): value is ScamAnalysisResponseV1 {
  if (
    !isRecord(value) ||
    value.version !== SCAM_ANALYSIS_RESPONSE_VERSION ||
    !isVerdict(value.verdict) ||
    typeof value.summary !== 'string' ||
    value.summary.trim().length === 0 ||
    value.summary.length > 2_000 ||
    !Array.isArray(value.indicators) ||
    value.indicators.length > 20
  ) {
    return false
  }

  return value.indicators.every(isIndicator)
}

function validateSuccess(value: unknown): AiAnalysisSuccessV3 | null {
  if (
    !isRecord(value) ||
    value.status !== 'completed' ||
    value.version !== 'ai-analysis-response.v3' ||
    (value.englishTranslation !== null &&
      !isTranslation(value.englishTranslation)) ||
    (value.banglaTranslation !== null &&
      !isTranslation(value.banglaTranslation)) ||
    (isTranslation(value.englishTranslation) &&
      value.englishTranslation.targetLanguage !== 'en') ||
    (isTranslation(value.banglaTranslation) &&
      value.banglaTranslation.targetLanguage !== 'bn') ||
    (value.englishTranslation === null && value.banglaTranslation === null) ||
    (isTranslation(value.englishTranslation) &&
      isTranslation(value.banglaTranslation) &&
      (value.englishTranslation.detectedLanguage !== 'other' ||
        value.banglaTranslation.detectedLanguage !== 'other')) ||
    (isTranslation(value.englishTranslation) &&
      value.banglaTranslation === null &&
      value.englishTranslation.detectedLanguage !== 'bangla') ||
    (value.englishTranslation === null &&
      isTranslation(value.banglaTranslation) &&
      value.banglaTranslation.detectedLanguage !== 'english') ||
    !isAnalysis(value.analysis)
  ) {
    return null
  }
  return {
    status: 'completed',
    version: 'ai-analysis-response.v3',
    englishTranslation: value.englishTranslation,
    banglaTranslation: value.banglaTranslation,
    analysis: value.analysis,
  }
}

export async function analyzeWithAi(
  message: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<AiAnalysisSuccessV3> {
  const response = await fetcher('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    cache: 'no-store',
    signal,
    body: JSON.stringify({
      version: AI_ANALYSIS_REQUEST_VERSION,
      message,
      userInitiated: true,
    }),
  })

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new AiAnalysisError(
      'invalid_response',
      'The analysis service returned an invalid response.',
    )
  }

  if (!response.ok) {
    const code =
      isRecord(body) && isRecord(body.error) && typeof body.error.code === 'string'
        ? body.error.code
        : 'service_error'
    const message =
      isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string'
        ? body.error.message
        : 'The analysis service could not complete the request.'
    throw new AiAnalysisError(code, message)
  }

  const result = validateSuccess(body)
  if (!result) {
    throw new AiAnalysisError(
      'invalid_response',
      'The analysis service returned an invalid response. No result is shown.',
    )
  }
  return result
}
