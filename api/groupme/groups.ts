import { listGroups } from "../../src/groupme.js"
import { json, readJson, requirePost, type ApiRequest, type ApiResponse } from "../_lib/http.js"

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (!requirePost(request, response)) return

  try {
    const { accessToken } = await readJson<{ accessToken?: string }>(request)
    if (!accessToken?.trim()) return json(response, 400, { error: "GroupMe access token is required" })
    const groups = await listGroups(accessToken.trim())
    json(response, 200, { groups })
  } catch (error) {
    json(response, 400, { error: error instanceof Error ? error.message : "Could not load groups" })
  }
}
