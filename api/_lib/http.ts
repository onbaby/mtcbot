import type { IncomingMessage, ServerResponse } from "node:http"

export type ApiRequest = IncomingMessage
export type ApiResponse = ServerResponse

export const json = (response: ApiResponse, status: number, payload: unknown): void => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  })
  response.end(JSON.stringify(payload))
}

export const readJson = async <T>(request: ApiRequest): Promise<T> => {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 32_768) throw new Error("Request body is too large")
    chunks.push(buffer)
  }
  if (!chunks.length) throw new Error("A JSON request body is required")
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T
}

export const requirePost = (request: ApiRequest, response: ApiResponse): boolean => {
  if (request.method === "POST") return true
  response.setHeader("Allow", "POST")
  json(response, 405, { error: "Method not allowed" })
  return false
}

export const publicBaseUrl = (request: ApiRequest): string => {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "")
  const forwardedProto = request.headers["x-forwarded-proto"]
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0] : "http"
  const host = request.headers.host ?? "localhost:3000"
  return `${protocol}://${host}`
}
