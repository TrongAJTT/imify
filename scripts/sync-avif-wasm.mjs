import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const projectRoot = process.cwd()
const sourceJs = resolve(projectRoot, "node_modules/@jsquash/avif/codec/enc/avif_enc.js")
const sourceWasm = resolve(projectRoot, "node_modules/@jsquash/avif/codec/enc/avif_enc.wasm")
const targetDir = resolve(projectRoot, "assets/wasm")
const targetJs = resolve(targetDir, "avif_enc.js")
const targetWasm = resolve(targetDir, "avif_enc.wasm")

mkdirSync(targetDir, { recursive: true })
copyFileSync(sourceJs, targetJs)
copyFileSync(sourceWasm, targetWasm)

// Parcel rewrites some `url`/`import.meta.url` assignments into invalid code for this glue file.
let js = readFileSync(targetJs, "utf8")
js = js.replace(
  "if(import.meta.url===undefined){import.meta.url=\"https://localhost\"}",
  "if(typeof globalThis.__avifRuntimeUrl===\"undefined\"){globalThis.__avifRuntimeUrl=\"https://localhost\"}"
)
js = js.replace(
  "wasmBinaryFile=new URL(\"avif_enc.wasm\",url).href",
  "wasmBinaryFile=new URL(\"avif_enc.wasm\",_scriptDir||globalThis.__avifRuntimeUrl||self.location.href).href"
)

writeFileSync(targetJs, js, "utf8")
console.log("Synced AVIF WASM assets and applied Parcel compatibility patch.")
