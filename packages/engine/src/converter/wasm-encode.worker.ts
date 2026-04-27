import { resolveEngineWasmUrl } from "./runtime-adapter"

interface WasmModule {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    options: Record<string, unknown>
  ) => Uint8Array | null
}

type WorkerFormat = "avif" | "jxl"

interface EncodeRequestMessage {
  id: number
  type: "encode"
  format: WorkerFormat
  width: number
  height: number
  rgbaBuffer: ArrayBuffer
  options: Record<string, unknown>
}

interface EncodeSuccessMessage {
  id: number
  type: "result"
  ok: true
  encodedBuffer: ArrayBuffer
}

interface EncodeErrorMessage {
  id: number
  type: "result"
  ok: false
  error: string
}

type EncodeResponseMessage = EncodeSuccessMessage | EncodeErrorMessage

const workerPostMessage = globalThis as unknown as {
  postMessage: (message: EncodeResponseMessage, transfer?: Transferable[]) => void
}

let avifModulePromise: Promise<WasmModule> | null = null
let jxlModulePromise: Promise<WasmModule> | null = null

function resolveWasmUrl(fileName: string): string {
  return resolveEngineWasmUrl(fileName)
}

async function loadWasmFactory(fileName: string): Promise<(options: Record<string, unknown>) => Promise<WasmModule>> {
  const module = await import(/* webpackIgnore: true */ /* @vite-ignore */ resolveWasmUrl(fileName))
  return (module.default ?? module) as (options: Record<string, unknown>) => Promise<WasmModule>
}

async function getAvifModule(): Promise<WasmModule> {
  if (!avifModulePromise) {
    const wasmUrl = resolveWasmUrl("avif_enc.wasm")
    const initAvifFactory = await loadWasmFactory("avif_enc.js")

    avifModulePromise = initAvifFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<WasmModule>
  }

  return avifModulePromise
}

async function getJxlModule(): Promise<WasmModule> {
  if (!jxlModulePromise) {
    const wasmUrl = resolveWasmUrl("jxl_enc.wasm")
    const initJxlFactory = await loadWasmFactory("jxl_enc.js")

    jxlModulePromise = initJxlFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<WasmModule>
  }

  return jxlModulePromise
}

async function getModuleByFormat(format: WorkerFormat): Promise<WasmModule> {
  if (format === "avif") {
    return getAvifModule()
  }

  return getJxlModule()
}

self.onmessage = async (event: MessageEvent<EncodeRequestMessage>) => {
  const message = event.data

  if (!message || message.type !== "encode") {
    return
  }

  try {
    const encoderModule = await getModuleByFormat(message.format)
    const rgbaBytes = new Uint8Array(message.rgbaBuffer)

    const encoded = encoderModule.encode(
      rgbaBytes,
      message.width,
      message.height,
      message.options
    )

    if (!encoded || encoded.byteLength === 0) {
      throw new Error(`${message.format.toUpperCase()} encoding failed in WASM worker`)
    }

    const encodedBuffer = encoded.buffer.slice(
      encoded.byteOffset,
      encoded.byteOffset + encoded.byteLength
    )

    const response: EncodeSuccessMessage = {
      id: message.id,
      type: "result",
      ok: true,
      encodedBuffer
    }

    workerPostMessage.postMessage(response, [encodedBuffer])
  } catch (error) {
    const response: EncodeErrorMessage = {
      id: message.id,
      type: "result",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown WASM worker error"
    }

    workerPostMessage.postMessage(response)
  }
}

export {}