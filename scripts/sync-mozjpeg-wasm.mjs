import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const projectRoot = process.cwd()
const sourceJs = resolve(projectRoot, "node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.js")
const sourceWasm = resolve(projectRoot, "node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm")
const targetDir = resolve(projectRoot, "../../assets/wasm")
const targetJs = resolve(targetDir, "mozjpeg_enc.js")
const targetWasm = resolve(targetDir, "mozjpeg_enc.wasm")

mkdirSync(targetDir, { recursive: true })
copyFileSync(sourceJs, targetJs)
copyFileSync(sourceWasm, targetWasm)

// Parcel may rewrite import.meta.url in a way that breaks runtime URL resolution.
let js = readFileSync(targetJs, "utf8")
js = js.replace(
  "if(import.meta.url===undefined){import.meta.url=\"https://localhost\"}",
  "if(typeof globalThis.__mozjpegRuntimeUrl===\"undefined\"){globalThis.__mozjpegRuntimeUrl=\"https://localhost\"}"
)
js = js.replace(
  "wasmBinaryFile=new URL(\"mozjpeg_enc.wasm\",import.meta.url).href",
  "wasmBinaryFile=new URL(\"mozjpeg_enc.wasm\",_scriptDir||globalThis.__mozjpegRuntimeUrl||self.location.href).href"
)

writeFileSync(targetJs, js, "utf8")
console.log("Synced MozJPEG WASM assets and applied Parcel compatibility patch.")
