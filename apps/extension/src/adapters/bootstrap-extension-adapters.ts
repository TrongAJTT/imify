import { registerStorageAdapter } from "@imify/core/storage-adapter"
import { registerCustomFormatStorageAccess } from "@imify/engine/custom-formats"
import { registerEngineRuntimeAdapter } from "@imify/engine/converter/runtime-adapter"
import { patchStorageState } from "@/adapters/chrome-storage-state"
import { plasmoStorageAdapter } from "@/adapters/plasmo-storage-adapter"

let adaptersBootstrapped = false

export function bootstrapExtensionAdapters(): void {
  if (adaptersBootstrapped) {
    return
  }

  registerStorageAdapter(plasmoStorageAdapter)
  registerCustomFormatStorageAccess({ patchStorageState })
  registerEngineRuntimeAdapter({
    resolveWasmUrl: (fileName) => chrome.runtime.getURL(`assets/wasm/${fileName}`),
    createWasmWorker: () =>
      new Worker(new URL("@imify/engine/converter/wasm-encode.worker", import.meta.url), {
        type: "module"
      }),
    createConversionWorker: () =>
      new Worker(new URL("@imify/engine/converter/conversion.worker", import.meta.url), {
        type: "module"
      })
  })

  adaptersBootstrapped = true
}
