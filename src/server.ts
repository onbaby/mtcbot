import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import { dirname, extname, normalize, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
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
