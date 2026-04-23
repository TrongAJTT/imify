"use client"

import { registerStorageAdapter } from "@imify/core/storage-adapter"
import { registerEngineRuntimeAdapter } from "@imify/engine/converter/runtime-adapter"
import { setPreviewWorkerFactory } from "@imify/engine/converter/preview-worker-client"
import { localStorageAdapter } from "../adapters/local-storage-adapter"

interface AppProvidersProps {
  children: React.ReactNode
}

let adaptersRegistered = false

function canAccessLocalStorage(): boolean {
  if (typeof window === "undefined") return false
  try {
    const probeKey = "__imify_web_storage_probe__"
    window.localStorage.setItem(probeKey, "1")
    window.localStorage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

function ensureWebAdaptersRegistered(): void {
  if (!canAccessLocalStorage() || adaptersRegistered) {
    return
  }

  try {
    registerStorageAdapter(localStorageAdapter)
    registerEngineRuntimeAdapter({
      resolveWasmUrl: (fileName) => `${window.location.origin}/assets/wasm/${fileName}`,
      createWasmWorker: () =>
        new Worker(new URL("@imify/engine/converter/wasm-encode.worker", import.meta.url), {
          type: "module"
        }),
      createConversionWorker: () =>
        new Worker(new URL("@imify/engine/converter/conversion.worker", import.meta.url), {
          type: "module"
        })
    })
    setPreviewWorkerFactory(
      () =>
        new Worker(new URL("@imify/engine/converter/preview.worker", import.meta.url), {
          type: "module"
        })
    )
    adaptersRegistered = true
  } catch {
    // Keep UI rendering even if storage/runtime adapters are unavailable.
  }
}

if (typeof window !== "undefined") {
  ensureWebAdaptersRegistered()
}

export function AppProviders({ children }: AppProvidersProps) {
  ensureWebAdaptersRegistered()
  return <>{children}</>
}
