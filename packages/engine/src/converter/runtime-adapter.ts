export interface EngineRuntimeAdapter {
  resolveWasmUrl?: (fileName: string) => string
  createWasmWorker?: () => Worker
  createConversionWorker?: () => Worker
}

let activeEngineRuntimeAdapter: EngineRuntimeAdapter | null = null

export function registerEngineRuntimeAdapter(adapter: EngineRuntimeAdapter): void {
  activeEngineRuntimeAdapter = adapter
}

export function getEngineRuntimeAdapter(): EngineRuntimeAdapter | null {
  return activeEngineRuntimeAdapter
}

export function resolveEngineWasmUrl(fileName: string): string {
  const resolved = activeEngineRuntimeAdapter?.resolveWasmUrl?.(fileName)
  if (resolved) {
    return resolved
  }

  if (typeof location !== "undefined" && location.origin) {
    return `${location.origin}/assets/wasm/${fileName}`
  }

  return new URL(`../../assets/wasm/${fileName}`, import.meta.url).toString()
}

export function createEngineWasmWorker(): Worker {
  if (!activeEngineRuntimeAdapter?.createWasmWorker) {
    throw new Error("Engine runtime adapter is missing createWasmWorker")
  }
  return activeEngineRuntimeAdapter.createWasmWorker()
}

export function createEngineConversionWorker(): Worker {
  if (!activeEngineRuntimeAdapter?.createConversionWorker) {
    throw new Error("Engine runtime adapter is missing createConversionWorker")
  }
  return activeEngineRuntimeAdapter.createConversionWorker()
}
