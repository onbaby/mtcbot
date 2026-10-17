import { json, type ApiRequest, type ApiResponse } from "../_lib/http.js"

export default function handler(_request: ApiRequest, response: ApiResponse): void {
  const clientId = process.env.GROUPME_CLIENT_ID?.trim()
  if (!clientId) {
    return json(response, 503, { error: "GroupMe OAuth is not configured yet" })
  }

  response.writeHead(302, {
    Location: `https://oauth.groupme.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}`,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer"
  }).end()
}
