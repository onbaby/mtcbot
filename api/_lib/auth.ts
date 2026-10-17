import { openGroupMeSession } from "../../src/groupme.js"
import { json, type ApiRequest, type ApiResponse } from "./http.js"

export interface AuthenticatedGroupMeSession {
  accessToken: string
  userId: string
}

export const requireGroupMeSession = (
  request: ApiRequest,
  response: ApiResponse
): AuthenticatedGroupMeSession | null => {
  const secret = process.env.INSTALLATION_SECRET
  if (!secret || secret.length < 32) {
    json(response, 503, { error: "GroupMe login is not configured on this deployment" })
    return null
  }

  const authorization = request.headers.authorization
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  if (!token) {
    json(response, 401, { error: "Sign in with GroupMe to continue" })
    return null
  }

  try {
    const session = openGroupMeSession(token, secret)
    return { accessToken: session.accessToken, userId: session.userId }
  } catch {
    json(response, 401, { error: "Your GroupMe login expired. Please sign in again." })
    return null
  }
}
