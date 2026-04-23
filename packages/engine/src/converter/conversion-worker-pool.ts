
export type WorkerFactory = () => Worker;
let conversionWorkerFactory: WorkerFactory | null = null;
export function setConversionWorkerFactory(factory: WorkerFactory) {
  conversionWorkerFactory = factory;
}

import type { ConvertImageResult } from "./"
import type { FormatConfig, ImageFormat } from "@imify/core/types"

type WorkerFormat = Exclude<ImageFormat, "pdf">

interface WorkerTask {
  id: number
  sourceBlob: Blob
  config: FormatConfig
  resolve: (value: ConvertImageResult) => void
  reject: (reason?: unknown) => void
}

interface WorkerConvertRequestMessage {
  id: number
  type: "convert"
  sourceBlob: Blob
  config: FormatConfig
}

interface WorkerConvertSuccessMessage {
  id: number
  type: "result"
  ok: true
  outputBuffer: ArrayBuffer
  mimeType: string
  format: ImageFormat
  outputExtension?: string
}

interface WorkerConvertErrorMessage {
  id: number
  type: "result"
  ok: false
  error: string
}

type WorkerConvertResponseMessage = WorkerConvertSuccessMessage | WorkerConvertErrorMessage

interface WorkerSlot {
  worker: Worker
  busy: boolean
  taskId: number | null
  bindHandlers: () => void
}

class ConversionWorkerPool {
  private slots: WorkerSlot[] = []
  private queue: WorkerTask[] = []
  private taskById = new Map<number, WorkerTask>()
  private nextTaskId = 1

  constructor(initialSize: number) {
    this.resize(initialSize)
  }

  resize(nextSize: number): void {
    const normalizedSize = normalizePoolSize(nextSize)

    if (normalizedSize > this.slots.length) {
      const growBy = normalizedSize - this.slots.length
      for (let i = 0; i < growBy; i += 1) {
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
            runningTask.reject(new Error("Conversion task cancelled while resizing worker pool"))
          }
        }

        slot.worker.terminate()
      }

      this.slots = retained
    }

    this.flushQueue()
  }

  execute(sourceBlob: Blob, config: FormatConfig): Promise<ConvertImageResult> {
    const taskId = this.nextTaskId++

    return new Promise<ConvertImageResult>((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        sourceBlob,
        config,
        resolve,
        reject
      }

      this.queue.push(task)
      this.flushQueue()
    })
  }

  terminate(): void {
    for (const task of this.queue) {
      task.reject(new Error("Conversion task cancelled"))
    }
    this.queue = []

    for (const task of this.taskById.values()) {
      task.reject(new Error("Conversion task cancelled"))
    }
    this.taskById.clear()

    for (const slot of this.slots) {
      slot.worker.terminate()
    }

    this.slots = []
  }

  private createSlot(): WorkerSlot {
    const slot: WorkerSlot = {
      worker: null as any, // null as any /* new Worker(new URL("./conversion.worker.ts", import.meta.url) */, { type: "module" }),
      busy: false,
      taskId: null,
      bindHandlers: () => {
        slot.worker.onmessage = (event: MessageEvent<WorkerConvertResponseMessage>) => {
          const message = event.data

          if (!message || message.type !== "result") {
            return
          }

          this.onTaskFinished(slot, message)
        }

        slot.worker.onerror = () => {
          if (slot.taskId !== null) {
            const task = this.taskById.get(slot.taskId)
            if (task) {
              this.taskById.delete(slot.taskId)
              task.reject(new Error("Conversion worker crashed during processing"))
            }
          }

          slot.worker.terminate()
          slot.worker = (conversionWorkerFactory ? conversionWorkerFactory() : (() => { throw new Error("conversionWorkerFactory not set") })())
          slot.busy = false
          slot.taskId = null
          slot.bindHandlers()
          this.flushQueue()
        }
      }
    }

    slot.bindHandlers()
    return slot
  }

  private onTaskFinished(slot: WorkerSlot, message: WorkerConvertResponseMessage): void {
    const task = this.taskById.get(message.id)

    slot.busy = false
    slot.taskId = null

    if (!task) {
      this.flushQueue()
      return
    }

    this.taskById.delete(message.id)

    if (!message.ok) {
      task.reject(new Error(message.error || "Conversion worker failed"))
      this.flushQueue()
      return
    }

    task.resolve({
      blob: new Blob([message.outputBuffer], { type: message.mimeType }),
      format: message.format,
      outputExtension: message.outputExtension
    })

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

      const message: WorkerConvertRequestMessage = {
        id: task.id,
        type: "convert",
        sourceBlob: task.sourceBlob,
        config: task.config
      }

      slot.worker.postMessage(message)
    }
  }
}

function normalizePoolSize(value: number): number {
  const raw = Number.isFinite(value) ? Math.floor(value) : 1
  const safeRequested = Math.max(1, raw)
  const logicalCores = Math.max(1, Math.floor(navigator.hardwareConcurrency || 2))
  return Math.min(safeRequested, logicalCores)
}

const pools = new Map<WorkerFormat, ConversionWorkerPool>()

export function isConversionWorkerSupported(): boolean {
  return typeof Worker === "function"
}

function getPool(format: WorkerFormat): ConversionWorkerPool {
  const existing = pools.get(format)
  if (existing) {
    return existing
  }

  const pool = new ConversionWorkerPool(1)
  pools.set(format, pool)
  return pool
}

export function setConversionWorkerPoolSize(format: ImageFormat, size: number): void {
  if (format === "pdf") {
    return
  }

  getPool(format).resize(size)
}

export function terminateConversionWorkerPool(format?: WorkerFormat): void {
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

export function convertImageWithWorker(sourceBlob: Blob, config: FormatConfig): Promise<ConvertImageResult> {
  if (config.format === "pdf") {
    return Promise.reject(new Error("PDF conversion is not supported in conversion worker"))
  }

  if (!isConversionWorkerSupported()) {
    return Promise.reject(new Error("Conversion worker is unavailable in this runtime"))
  }

  return getPool(config.format).execute(sourceBlob, config)
}