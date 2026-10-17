import { createBot, listGroups, sealInstallation } from "../../src/groupme.js"
import { requireGroupMeSession } from "../_lib/auth.js"
import { json, publicBaseUrl, readJson, requirePost, type ApiRequest, type ApiResponse } from "../_lib/http.js"

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (!requirePost(request, response)) return
  const session = requireGroupMeSession(request, response)
  if (!session) return

  const secret = process.env.INSTALLATION_SECRET
  if (!secret || secret.length < 32) {
    return json(response, 503, { error: "Bot installer is not configured on this deployment" })
  }

  try {
    const body = await readJson<{ groupId?: string }>(request)
    const accessToken = session.accessToken
    const groupId = body.groupId?.trim()
    if (!groupId) return json(response, 400, { error: "A group is required" })

    const groups = await listGroups(accessToken)
    const group = groups.find(candidate => candidate.id === groupId)
    if (!group) return json(response, 403, { error: "That group is not available to this GroupMe account" })

    const installation = sealInstallation({ accessToken, groupId, installedAt: Date.now() }, secret)
    const callbackUrl = `${publicBaseUrl(request)}/api/groupme/callback?installation=${encodeURIComponent(installation)}`
    const bot = await createBot(accessToken, groupId, callbackUrl)

    json(response, 201, {
      bot: { id: bot.bot_id, name: bot.name, groupId: bot.group_id },
      group
    })
  } catch (error) {
    json(response, 400, { error: error instanceof Error ? error.message : "Could not install the bot" })
  }
}
