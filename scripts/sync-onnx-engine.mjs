import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const workspaceRoot = resolve(__dirname, "..")
const sourceDir = resolve(workspaceRoot, "node_modules/onnxruntime-web/dist")
const targetDir = resolve(workspaceRoot, "assets/onnx-engines")

// Cần cả bản threaded (nhanh) và asyncify (dự phòng cho Service Worker/Non-SAB)
const filesToSync = [
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm",
  "ort-wasm-simd-threaded.asyncify.mjs"
]

try {
  mkdirSync(targetDir, { recursive: true })

  for (const fileName of filesToSync) {
    const sourcePath = resolve(sourceDir, fileName)
    const targetPath = resolve(targetDir, fileName)
    copyFileSync(sourcePath, targetPath)
  }

  console.log(`[sync-onnx-engine] Successfully synced ${filesToSync.length} files to ${targetDir}`)
} catch (error) {
  console.error("[sync-onnx-engine] Failed to sync ONNX assets:", error.message)
  process.exit(1)
}
