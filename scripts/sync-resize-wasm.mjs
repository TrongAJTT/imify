import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const projectRoot = process.cwd()
const targetDir = resolve(projectRoot, "assets/wasm")

const RESIZE_ASSETS = [
  {
    sourceJs: resolve(
      projectRoot,
      "node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize.js"
    ),
    sourceWasm: resolve(
      projectRoot,
      "node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm"
    ),
    targetJs: resolve(targetDir, "squoosh_resize.js"),
    targetWasm: resolve(targetDir, "squoosh_resize_bg.wasm"),
    runtimeToken: "__resizeRuntimeUrl",
    wasmFileName: "squoosh_resize_bg.wasm"
  },
  {
    sourceJs: resolve(
      projectRoot,
      "node_modules/@jsquash/resize/lib/hqx/pkg/squooshhqx.js"
    ),
    sourceWasm: resolve(
      projectRoot,
      "node_modules/@jsquash/resize/lib/hqx/pkg/squooshhqx_bg.wasm"
    ),
    targetJs: resolve(targetDir, "squooshhqx.js"),
    targetWasm: resolve(targetDir, "squooshhqx_bg.wasm"),
    runtimeToken: "__hqxRuntimeUrl",
    wasmFileName: "squooshhqx_bg.wasm"
  },
  {
    sourceJs: resolve(
      projectRoot,
      "node_modules/@jsquash/resize/lib/magic-kernel/pkg/jsquash_magic_kernel.js"
    ),
    sourceWasm: resolve(
      projectRoot,
      "node_modules/@jsquash/resize/lib/magic-kernel/pkg/jsquash_magic_kernel_bg.wasm"
    ),
    targetJs: resolve(targetDir, "jsquash_magic_kernel.js"),
    targetWasm: resolve(targetDir, "jsquash_magic_kernel_bg.wasm"),
    runtimeToken: "__magicKernelRuntimeUrl",
    wasmFileName: "jsquash_magic_kernel_bg.wasm"
  }
]

mkdirSync(targetDir, { recursive: true })

for (const asset of RESIZE_ASSETS) {
  copyFileSync(asset.sourceJs, asset.targetJs)
  copyFileSync(asset.sourceWasm, asset.targetWasm)

  let js = readFileSync(asset.targetJs, "utf8")

  js = js.replace(
    /if \(import\.meta\.url === undefined\) \{\s+import\.meta\.url = 'https:\/\/localhost';\s+\}/g,
    `if (typeof globalThis.${asset.runtimeToken} === 'undefined') {\n    globalThis.${asset.runtimeToken} = 'https://localhost';\n  }`
  )

  js = js.replace(
    `new URL('${asset.wasmFileName}', import.meta.url)`,
    `new URL('${asset.wasmFileName}', globalThis.${asset.runtimeToken} || self.location.href)`
  )

  writeFileSync(asset.targetJs, js, "utf8")
}

console.log("Synced Resize WASM assets and patched runtime glue (Resize, HQX, Magic Kernel).")
