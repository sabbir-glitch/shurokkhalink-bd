export const AI_ANALYSIS_REQUEST_VERSION = 'ai-analysis-request.v1' as const
export const TRANSLATION_REQUEST_VERSION = 'translation-request.v1' as const
export const TRANSLATION_RESPONSE_VERSION = 'translation-response.v1' as const
export const SCAM_ANALYSIS_REQUEST_VERSION = 'scam-analysis-request.v1' as const
export const SCAM_ANALYSIS_RESPONSE_VERSION = 'scam-analysis-response.v1' as const

export interface AiConsentV1 {
  messageProcessing: boolean
  translation: boolean
  externalAiProcessing: boolean
}

export interface AiAnalysisRequestV1 {
  version: typeof AI_ANALYSIS_REQUEST_VERSION
  message: string
  consent: AiConsentV1
}

export interface TranslationRequestV1 {
  version: typeof TRANSLATION_REQUEST_VERSION
  text: string
}

export interface TranslationResponseV1 {
  version: typeof TRANSLATION_RESPONSE_VERSION
  sourceLanguage: string | null
  translatedText: string
}

export interface ScamAnalysisRequestV1 {
  version: typeof SCAM_ANALYSIS_REQUEST_VERSION
  englishText: string
}

export type ScamVerdictV1 = 'suspicious' | 'no_indicators' | 'uncertain'

export interface ScamIndicatorV1 {
  category:
    'secret_request' | 'urgency' | 'prize_claim' | 'link' | 'impersonation' | 'other'
  explanation: string
}

export interface ScamAnalysisResponseV1 {
  version: typeof SCAM_ANALYSIS_RESPONSE_VERSION
  verdict: ScamVerdictV1
  summary: string
  indicators: ScamIndicatorV1[]
}

export interface AiAnalysisSuccessV1 {
  status: 'completed'
  version: 'ai-analysis-response.v1'
  translation: TranslationResponseV1
  analysis: ScamAnalysisResponseV1
}

export interface AiApiErrorV1 {
  status: 'error' | 'unavailable'
  error: {
    code: string
    message: string
  }
}
