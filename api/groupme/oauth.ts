import { getCurrentUser, sealGroupMeSession } from "../../src/groupme.js"
import { json, type ApiRequest, type ApiResponse } from "../_lib/http.js"

const appUrl = (): string => {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "")
  return process.env.VERCEL_ENV ? "https://mtcbot.vercel.app" : "http://localhost:3000"
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  const secret = process.env.INSTALLATION_SECRET
  if (!secret || secret.length < 32) {
    return json(response, 503, { error: "GroupMe login is not configured on this deployment" })
  }

  try {
    const url = new URL(request.url ?? "/", `https://${request.headers.host ?? "localhost"}`)
    const accessToken = url.searchParams.get("access_token")?.trim()
    if (!accessToken) throw new Error("GroupMe did not return an access token")

    const user = await getCurrentUser(accessToken)
    const session = sealGroupMeSession({ accessToken, issuedAt: Date.now(), userId: user.id }, secret)
    response.writeHead(302, {
      Location: `${appUrl()}/#install&session=${encodeURIComponent(session)}`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer"
    }).end()
  } catch (error) {
    const message = error instanceof Error ? error.message : "GroupMe login failed"
    response.writeHead(302, {
      Location: `${appUrl()}/#install&error=${encodeURIComponent(message)}`,
      "Cache-Control": "no-store"
    }).end()
  }
}
