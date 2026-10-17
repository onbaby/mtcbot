import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

import { analyzeMessage, type AnalysisResult } from "./detector.js"

const GROUPME_API = "https://api.groupme.com/v3"

export interface GroupMeGroup {
  id: string
  name: string
}

export interface GroupMeBot {
  bot_id: string
  callback_url?: string
  group_id: string
  name: string
}

export interface GroupMeCallback {
  group_id?: string
  id?: string
  name?: string
  sender_type?: string
  system?: boolean
  text?: string | null
}

interface InstallationPayload {
  accessToken: string
  groupId: string
  installedAt: number
}

type Fetcher = typeof fetch

const unwrap = <T>(payload: unknown): T => {
  if (typeof payload === "object" && payload !== null && "response" in payload) {
    return (payload as { response: T }).response
  }
  return payload as T
}

const groupMeRequest = async <T>(
  path: string,
  options: RequestInit,
  accessToken: string | undefined,
  fetcher: Fetcher
): Promise<T> => {
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")
  if (options.body) headers.set("Content-Type", "application/json")
  if (accessToken) headers.set("X-Access-Token", accessToken)

  const response = await fetcher(`${GROUPME_API}${path}`, { ...options, headers })
  const payload = await response.json().catch(() => null) as unknown

  if (!response.ok) {
    const meta = typeof payload === "object" && payload !== null && "meta" in payload
      ? (payload as { meta?: { errors?: string[] } }).meta
      : undefined
    const message = meta?.errors?.join(", ") || `GroupMe request failed (${response.status})`
    throw new Error(message)
  }

  return unwrap<T>(payload)
}

export const listGroups = async (accessToken: string, fetcher: Fetcher = fetch): Promise<GroupMeGroup[]> => {
  const groups = await groupMeRequest<Array<{ id: string; name: string }>>(
    "/groups?per_page=100&omit=memberships",
    { method: "GET" },
    accessToken,
    fetcher
  )
  return groups.map(group => ({ id: String(group.id), name: group.name }))
}

export const createBot = async (
  accessToken: string,
  groupId: string,
  callbackUrl: string,
  fetcher: Fetcher = fetch
): Promise<GroupMeBot> => {
  const response = await groupMeRequest<GroupMeBot | { bot: GroupMeBot }>(
    "/bots",
    {
      method: "POST",
      body: JSON.stringify({
        bot: {
          name: "MTC Bot",
          group_id: groupId,
          callback_url: callbackUrl,
          active: true
        }
      })
    },
    accessToken,
    fetcher
  )
  return "bot" in response ? response.bot : response
}

export const listBots = async (accessToken: string, fetcher: Fetcher = fetch): Promise<GroupMeBot[]> => {
  return groupMeRequest<GroupMeBot[]>("/bots", { method: "GET" }, accessToken, fetcher)
}

export const postBotMessage = async (botId: string, text: string, fetcher: Fetcher = fetch): Promise<void> => {
  await groupMeRequest<unknown>(
    "/bots/post",
    { method: "POST", body: JSON.stringify({ bot_id: botId, text }) },
    undefined,
    fetcher
  )
}

export interface DeleteMessageResult {
  deleted: boolean
  status: number
}

export const deleteGroupMessage = async (
  accessToken: string,
  groupId: string,
  messageId: string,
  fetcher: Fetcher = fetch
): Promise<DeleteMessageResult> => {
  try {
    const response = await fetcher(
      `${GROUPME_API}/conversations/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "X-Access-Token": accessToken
        }
      }
    )

    return { deleted: response.ok, status: response.status }
  } catch {
    return { deleted: false, status: 0 }
  }
}

const encryptionKey = (secret: string): Buffer => createHash("sha256").update(secret).digest()

export const sealInstallation = (payload: InstallationPayload, secret: string): string => {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, encrypted, tag].map(part => part.toString("base64url")).join(".")
}

export const openInstallation = (token: string, secret: string): InstallationPayload => {
  const [ivPart, encryptedPart, tagPart] = token.split(".")
  if (!ivPart || !encryptedPart || !tagPart) throw new Error("Invalid installation token")

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(ivPart, "base64url"))
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final()
  ]).toString("utf8")
  return JSON.parse(decrypted) as InstallationPayload
}

export const analyzeCallback = (message: GroupMeCallback): AnalysisResult | null => {
  if (message.sender_type === "bot" || message.system || !message.text?.trim()) return null
  return analyzeMessage(message.text)
}

export const formatWarning = (message: GroupMeCallback, result: AnalysisResult): string => {
  const sender = message.name?.trim() || "A recent sender"
  const signals = result.reasons.slice(0, 3).join(", ")
  return `MTC Bot alert: ${sender}'s message matched ${result.score} risk points. Verify the sender before responding or paying.${signals ? ` Signals: ${signals}.` : ""}`
}

export const formatRemoval = (message: GroupMeCallback, result: AnalysisResult): string => {
  const sender = message.name?.trim() || "A recent sender"
  return `MTC Bot removed a suspicious message from ${sender} after it matched ${result.score} risk points.`
}
