import { cp, copyFile, mkdir, rm } from "node:fs/promises"
import { resolve } from "node:path"

import { build } from "esbuild"

const projectRoot = resolve(import.meta.dirname, "..")
const outputDirectory = resolve(projectRoot, "dist")

await rm(outputDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })

await build({
  entryPoints: [resolve(projectRoot, "src/app.ts")],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: resolve(outputDirectory, "app.js"),
  minify: true,
  sourcemap: true
})

await Promise.all([
  copyFile(resolve(projectRoot, "index.html"), resolve(outputDirectory, "index.html")),
  copyFile(resolve(projectRoot, "style.css"), resolve(outputDirectory, "style.css")),
  cp(resolve(projectRoot, "assets"), resolve(outputDirectory, "assets"), { recursive: true })
])

console.log("Static site prepared in dist/")
