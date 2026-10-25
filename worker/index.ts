import { createAiApi } from './aiApi'
import { createGroqProvider } from './groqProvider'

interface AssetBinding {
  fetch(request: Request): Promise<Response>
}

export interface WorkerEnvironment {
  ASSETS: AssetBinding
  GROQ_API_KEY?: string
}

export default {
  async fetch(request: Request, environment: WorkerEnvironment): Promise<Response> {
    const apiKey = environment.GROQ_API_KEY
    const handleApiRequest = createAiApi({
      provider: apiKey?.trim() ? createGroqProvider(apiKey) : undefined,
    })
    const apiResponse = await handleApiRequest(request)
    if (apiResponse) return apiResponse
    return environment.ASSETS.fetch(request)
  },
}
