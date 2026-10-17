import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, normalize, resolve, sep } from "node:path"
import { loadEnvFile } from "node:process"

import callbackHandler from "../api/groupme/callback.js"
import groupsHandler from "../api/groupme/groups.js"
import installHandler from "../api/groupme/install.js"

try {
  loadEnvFile()
} catch {
  // Environment variables may be supplied by the host instead of a local .env file.
}

const root = process.cwd()
const port = Number.parseInt(process.env.PORT ?? "3000", 10)

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8"
}

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname)

  const apiHandler = {
    "/api/groupme/callback": callbackHandler,
    "/api/groupme/groups": groupsHandler,
    "/api/groupme/install": installHandler
  }[pathname]
  if (apiHandler) {
    await apiHandler(request, response)
    return
  }

  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1)
  const builtAsset = requestedPath === "app.js" || requestedPath === "app.css"
    ? `dist/${requestedPath}`
    : requestedPath
  const filePath = resolve(root, normalize(builtAsset))

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden")
    return
  }

  try {
    const file = await stat(filePath)
    if (!file.isFile()) throw new Error("Not a file")

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    })
    createReadStream(filePath).pipe(response)
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found")
  }
})

server.listen(port, "127.0.0.1", () => {
  console.log(`MTC Bot is running at http://localhost:${port}`)
})
