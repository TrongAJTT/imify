
export type WorkerFactory = () => Worker;
let previewWorkerFactory: WorkerFactory | null = null;
export function setPreviewWorkerFactory(factory: WorkerFactory) {
  previewWorkerFactory = factory;
}

interface WorkerPreviewRequestMessage {
  id: number
  type: "preview"
  sourceBlob: Blob
  maxDimension: number
}

interface WorkerPreviewSuccessMessage {
  id: number
  type: "preview_result"
  ok: true
  outputBuffer: ArrayBuffer
  mimeType: string
  width: number
  height: number
  previewWidth: number
  previewHeight: number
}

interface WorkerPreviewErrorMessage {
  id: number
  type: "preview_result"
  ok: false
  error: string
}

type WorkerPreviewResponseMessage = WorkerPreviewSuccessMessage | WorkerPreviewErrorMessage

export interface WorkerImagePreviewResult {
  previewBlob: Blob
  width: number
  height: number
  previewWidth: number
  previewHeight: number
}

interface PendingPreviewTask {
  resolve: (value: WorkerImagePreviewResult) => void
  reject: (reason?: unknown) => void
}

class ImagePreviewWorkerClient {
  private worker: Worker | null = null
  private taskById = new Map<number, PendingPreviewTask>()
  private nextTaskId = 1

  execute(sourceBlob: Blob, maxDimension: number): Promise<WorkerImagePreviewResult> {
    const worker = this.getWorker()
    const taskId = this.nextTaskId++

    return new Promise<WorkerImagePreviewResult>((resolve, reject) => {
      this.taskById.set(taskId, { resolve, reject })

      const message: WorkerPreviewRequestMessage = {
        id: taskId,
        type: "preview",
        sourceBlob,
        maxDimension
      }

      worker.postMessage(message)
    })
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }

    for (const task of this.taskById.values()) {
      task.reject(new Error("Image preview worker terminated"))
    }

    this.taskById.clear()
  }

  private getWorker(): Worker {
    if (this.worker) {
      return this.worker
    }

    const worker = (previewWorkerFactory ? previewWorkerFactory() : (() => { throw new Error("previewWorkerFactory not set") })())

    worker.onmessage = (event: MessageEvent<WorkerPreviewResponseMessage>) => {
      const message = event.data

      if (!message || message.type !== "preview_result") {
        return
      }

      const task = this.taskById.get(message.id)
      if (!task) {
        return
      }

      this.taskById.delete(message.id)

      if (!message.ok) {
        task.reject(new Error(message.error || "Image preview worker failed"))
        return
      }

      task.resolve({
        previewBlob: new Blob([message.outputBuffer], { type: message.mimeType }),
        width: message.width,
        height: message.height,
        previewWidth: message.previewWidth,
        previewHeight: message.previewHeight
      })
    }

    worker.onerror = () => {
      for (const task of this.taskById.values()) {
        task.reject(new Error("Image preview worker crashed"))
      }

      this.taskById.clear()

      worker.terminate()
      this.worker = null
    }

    this.worker = worker
    return worker
  }
}

const previewWorkerClient = new ImagePreviewWorkerClient()

export function isImagePreviewWorkerSupported(): boolean {
  return typeof Worker === "function"
}

export function createImagePreviewInWorker(sourceBlob: Blob, maxDimension: number): Promise<WorkerImagePreviewResult> {
  if (!isImagePreviewWorkerSupported()) {
    return Promise.reject(new Error("Image preview worker is unavailable in this runtime"))
  }

  return previewWorkerClient.execute(sourceBlob, maxDimension)
}

export function terminateImagePreviewWorker(): void {
  previewWorkerClient.terminate()
}
