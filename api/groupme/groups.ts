import { listGroups } from "../../src/groupme.js"
import { requireGroupMeSession } from "../_lib/auth.js"
import { json, requirePost, type ApiRequest, type ApiResponse } from "../_lib/http.js"

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (!requirePost(request, response)) return
  const session = requireGroupMeSession(request, response)
  if (!session) return

  try {
    const groups = await listGroups(session.accessToken)
    json(response, 200, { groups })
  } catch (error) {
    json(response, 400, { error: error instanceof Error ? error.message : "Could not load groups" })
  }
}
