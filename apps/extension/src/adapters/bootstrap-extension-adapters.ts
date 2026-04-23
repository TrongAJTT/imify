import { registerStorageAdapter } from "@imify/core/storage-adapter"
import { registerCustomFormatStorageAccess } from "@imify/engine/custom-formats"
import { patchStorageState } from "@/adapters/chrome-storage-state"
import { plasmoStorageAdapter } from "@/adapters/plasmo-storage-adapter"

let adaptersBootstrapped = false

export function bootstrapExtensionAdapters(): void {
  if (adaptersBootstrapped) {
    return
  }

  registerStorageAdapter(plasmoStorageAdapter)
  registerCustomFormatStorageAccess({ patchStorageState })

  adaptersBootstrapped = true
}
