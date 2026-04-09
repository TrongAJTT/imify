import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const projectRoot = process.cwd()
const sourceJs = resolve(projectRoot, "node_modules/@jsquash/oxipng/codec/pkg/squoosh_oxipng.js")
const sourceWasm = resolve(projectRoot, "node_modules/@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm")
const targetDir = resolve(projectRoot, "assets/wasm")
const targetJs = resolve(targetDir, "oxipng.js")
const targetWasm = resolve(targetDir, "squoosh_oxipng_bg.wasm")

mkdirSync(targetDir, { recursive: true })
copyFileSync(sourceJs, targetJs)
copyFileSync(sourceWasm, targetWasm)

// Parcel may rewrite `import.meta.url` assignment into invalid code.
let js = readFileSync(targetJs, "utf8")
js = js.replace(
  /if \(import\.meta\.url === undefined\) \{\s*import\.meta\.url = 'https:\/\/localhost';\s*\}/,
  `if (typeof globalThis.__oxipngRuntimeUrl === 'undefined') {
    globalThis.__oxipngRuntimeUrl = 'https://localhost';
  }`
)

writeFileSync(targetJs, js, "utf8")
console.log("Synced OxiPNG WASM assets and applied Parcel compatibility patch.")