import {
  analyzeCallback,
  deleteGroupMessage,
  formatRemoval,
  formatWarning,
  listBots,
  openInstallation,
  postBotMessage,
  type GroupMeCallback
} from "../../src/groupme.js"
import { json, readJson, requirePost, type ApiRequest, type ApiResponse } from "../_lib/http.js"

const recentlyProcessed = new Map<string, number>()

const rememberMessage = (messageId: string): boolean => {
  const now = Date.now()
  for (const [id, timestamp] of recentlyProcessed) {
    if (now - timestamp > 10 * 60_000) recentlyProcessed.delete(id)
  }
  if (recentlyProcessed.has(messageId)) return false
  recentlyProcessed.set(messageId, now)
  return true
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (!requirePost(request, response)) return

  try {
    const secret = process.env.INSTALLATION_SECRET
    if (!secret) throw new Error("Installer is not configured")

    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`)
    const installationToken = url.searchParams.get("installation")
    if (!installationToken) return json(response, 401, { error: "Missing installation token" })

    const installation = openInstallation(installationToken, secret)
    const message = await readJson<GroupMeCallback>(request)
    if (message.group_id !== installation.groupId) return json(response, 403, { error: "Group mismatch" })
    if (message.id && !rememberMessage(message.id)) return json(response, 202, { ok: true, duplicate: true })

    const result = analyzeCallback(message)
    if (!result?.suspicious) return json(response, 202, { ok: true, flagged: false })

    const deletion = message.id
      ? await deleteGroupMessage(installation.accessToken, installation.groupId, message.id)
      : { deleted: false, status: 0 }

    const bots = await listBots(installation.accessToken)
    const bot = bots.find(candidate => candidate.group_id === installation.groupId && candidate.callback_url?.includes(installationToken))
      ?? bots.find(candidate => candidate.group_id === installation.groupId && candidate.name === "MTC Bot")
    if (!bot) throw new Error("MTC Bot installation could not be found")

    const botMessage = deletion.deleted
      ? formatRemoval(message, result)
      : formatWarning(message, result)
    await postBotMessage(bot.bot_id, botMessage)
    json(response, 202, {
      ok: true,
      flagged: true,
      deleted: deletion.deleted,
      deletionStatus: deletion.status
    })
  } catch (error) {
    json(response, 400, { error: error instanceof Error ? error.message : "Callback failed" })
  }
}
