import { createAiApi, type AiRequestRateLimiter } from './aiApi'
import { createGroqProvider } from './groqProvider'

interface AssetBinding {
  fetch(request: Request): Promise<Response>
}

export interface WorkerEnvironment {
  ASSETS: AssetBinding
  AI_RATE_LIMITER: AiRequestRateLimiter
  GROQ_API_KEY?: string
}

export default {
  async fetch(request: Request, environment: WorkerEnvironment): Promise<Response> {
    const apiKey = environment.GROQ_API_KEY
    const handleApiRequest = createAiApi({
      provider: apiKey?.trim() ? createGroqProvider(apiKey) : undefined,
      rateLimiter: environment.AI_RATE_LIMITER,
    })
    const apiResponse = await handleApiRequest(request)
    if (apiResponse) return apiResponse
    return environment.ASSETS.fetch(request)
  },
}
