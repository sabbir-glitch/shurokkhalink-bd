import { createAiApi } from './aiApi'

interface AssetBinding {
  fetch(request: Request): Promise<Response>
}

export interface WorkerEnvironment {
  ASSETS: AssetBinding
}

const handleApiRequest = createAiApi()

export default {
  async fetch(request: Request, environment: WorkerEnvironment): Promise<Response> {
    const apiResponse = await handleApiRequest(request)
    if (apiResponse) return apiResponse
    return environment.ASSETS.fetch(request)
  },
}
