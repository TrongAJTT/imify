
export type WorkerFactory = () => Worker;
let wasmWorkerFactory: WorkerFactory | null = null;
export function setWasmWorkerFactory(factory: WorkerFactory) {
  wasmWorkerFactory = factory;
}

import type { ImageFormat } from "@imify/core/types"

type WasmWorkerFormat = Extract<ImageFormat, "avif" | "jxl">

interface WorkerTask {
  id: number
  format: WasmWorkerFormat
  width: number
  height: number
  rgbaBuffer: ArrayBuffer
  options: Record<string, unknown>
  resolve: (value: Uint8Array) => void
  reject: (reason?: unknown) => void
}

interface WorkerEncodeRequestMessage {
  id: number
  type: "encode"
  format: WasmWorkerFormat
  width: number
  height: number
  rgbaBuffer: ArrayBuffer
  options: Record<string, unknown>
}

interface WorkerEncodeSuccessMessage {
  id: number
  type: "result"
  ok: true
  encodedBuffer: ArrayBuffer
}

interface WorkerEncodeErrorMessage {
  id: number
  type: "result"
  ok: false
  error: string
}

type WorkerEncodeResponseMessage = WorkerEncodeSuccessMessage | WorkerEncodeErrorMessage

interface WorkerSlot {
  worker: Worker
  busy: boolean
  taskId: number | null
}

class WasmEncodeWorkerPool {
  private slots: WorkerSlot[] = []
  private queue: WorkerTask[] = []
  private taskById = new Map<number, WorkerTask>()
  private nextTaskId = 1
  private desiredSize = 1

  constructor(initialSize: number) {
    this.resize(initialSize)
  }

  resize(nextSize: number): void {
    const normalizedSize = normalizePoolSize(nextSize)
    this.desiredSize = normalizedSize

    if (normalizedSize > this.slots.length) {
      const growBy = normalizedSize - this.slots.length
      for (let index = 0; index < growBy; index += 1) {
        this.slots.push(this.createSlot())
      }
    }

    if (normalizedSize < this.slots.length) {
      const retained: WorkerSlot[] = []

      for (const slot of this.slots) {
        if (retained.length < normalizedSize) {
          retained.push(slot)
          continue
        }

        if (slot.busy && slot.taskId !== null) {
          const runningTask = this.taskById.get(slot.taskId)
          if (runningTask) {
            this.taskById.delete(slot.taskId)
            runningTask.reject(new Error("Encoding task cancelled while resizing worker pool"))
          }
        }

        slot.worker.terminate()
      }

      this.slots = retained
    }

    this.flushQueue()
  }

  execute(
    format: WasmWorkerFormat,
    width: number,
    height: number,
    rgbaBuffer: ArrayBuffer,
    options: Record<string, unknown>
  ): Promise<Uint8Array> {
    const taskId = this.nextTaskId++

    return new Promise<Uint8Array>((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        format,
        width,
        height,
        rgbaBuffer,
        options,
        resolve,
        reject
      }

      this.queue.push(task)
      this.flushQueue()
    })
  }

  terminate(): void {
    for (const task of this.queue) {
      task.reject(new Error("Encoding task cancelled"))
    }
    this.queue = []

    for (const task of this.taskById.values()) {
      task.reject(new Error("Encoding task cancelled"))
    }
    this.taskById.clear()

    for (const slot of this.slots) {
      slot.worker.terminate()
    }

    this.slots = []
  }

  private createSlot(): WorkerSlot {
    const worker = (wasmWorkerFactory ? wasmWorkerFactory() : (() => { throw new Error("wasmWorkerFactory not set") })())

    const slot: WorkerSlot = {
      worker,
      busy: false,
      taskId: null
    }

    worker.onmessage = (event: MessageEvent<WorkerEncodeResponseMessage>) => {
      const message = event.data

      if (!message || message.type !== "result") {
        return
      }

      this.onTaskFinished(slot, message)
    }

    worker.onerror = () => {
      if (slot.taskId !== null) {
        const task = this.taskById.get(slot.taskId)
        if (task) {
          this.taskById.delete(slot.taskId)
          task.reject(new Error("WASM worker crashed during image encoding"))
        }
      }

      slot.worker.terminate()
      slot.worker = (wasmWorkerFactory ? wasmWorkerFactory() : (() => { throw new Error("wasmWorkerFactory not set") })())
      slot.busy = false
      slot.taskId = null

      slot.worker.onmessage = worker.onmessage
      slot.worker.onerror = worker.onerror

      this.flushQueue()
    }

    return slot
  }

  private onTaskFinished(slot: WorkerSlot, message: WorkerEncodeResponseMessage): void {
    const { id } = message
    const task = this.taskById.get(id)

    slot.busy = false
    slot.taskId = null

    if (!task) {
      this.flushQueue()
      return
    }

    this.taskById.delete(id)

    if (message.ok) {
      task.resolve(new Uint8Array(message.encodedBuffer))
    } else {
      task.reject(new Error(message.error || "WASM worker encode failed"))
    }

    this.flushQueue()
  }

  private flushQueue(): void {
    if (!this.queue.length || !this.slots.length) {
      return
    }

    for (const slot of this.slots) {
      if (!this.queue.length) {
        break
      }

      if (slot.busy) {
        continue
      }

      const task = this.queue.shift()
      if (!task) {
        break
      }

      slot.busy = true
      slot.taskId = task.id
      this.taskById.set(task.id, task)

      const message: WorkerEncodeRequestMessage = {
        id: task.id,
        type: "encode",
        format: task.format,
        width: task.width,
        height: task.height,
        rgbaBuffer: task.rgbaBuffer,
        options: task.options
      }

      slot.worker.postMessage(message, [task.rgbaBuffer])
    }
  }
}

function normalizePoolSize(value: number): number {
  const raw = Number.isFinite(value) ? Math.floor(value) : 1
  const safeRequested = Math.max(1, raw)
  const logicalCores = Math.max(1, Math.floor(navigator.hardwareConcurrency || 2))
  return Math.min(safeRequested, logicalCores)
}

const pools = new Map<WasmWorkerFormat, WasmEncodeWorkerPool>()

function getPool(format: WasmWorkerFormat): WasmEncodeWorkerPool {
  const existing = pools.get(format)
  if (existing) {
    return existing
  }

  const pool = new WasmEncodeWorkerPool(1)
  pools.set(format, pool)
  return pool
}

export function setWasmWorkerPoolSize(format: ImageFormat, size: number): void {
  if (format !== "avif" && format !== "jxl") {
    return
  }

  const pool = getPool(format)
  pool.resize(size)
}

export function terminateWasmWorkerPool(format?: WasmWorkerFormat): void {
  if (format) {
    const pool = pools.get(format)
    if (!pool) {
      return
    }

    pool.terminate()
    pools.delete(format)
    return
  }

  for (const [poolFormat, pool] of pools.entries()) {
    pool.terminate()
    pools.delete(poolFormat)
  }
}

export async function encodeWithWasmWorker(
  format: WasmWorkerFormat,
  imageData: ImageData,
  options: Record<string, unknown>
): Promise<Uint8Array> {
  const rgbaBytes = imageData.data
  const rgbaBuffer = rgbaBytes.buffer.slice(rgbaBytes.byteOffset, rgbaBytes.byteOffset + rgbaBytes.byteLength)
  const pool = getPool(format)

  return pool.execute(
    format,
    imageData.width,
    imageData.height,
    rgbaBuffer,
    options
  )
}