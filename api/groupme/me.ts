import { getCurrentUser } from "../../src/groupme.js"
import { requireGroupMeSession } from "../_lib/auth.js"
import { json, requirePost, type ApiRequest, type ApiResponse } from "../_lib/http.js"

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (!requirePost(request, response)) return
  const session = requireGroupMeSession(request, response)
  if (!session) return

  try {
    const user = await getCurrentUser(session.accessToken)
    json(response, 200, { user: { id: user.id, name: user.name, avatarUrl: user.avatar_url ?? null } })
  } catch (error) {
    json(response, 401, { error: error instanceof Error ? error.message : "Could not load GroupMe profile" })
  }
}
