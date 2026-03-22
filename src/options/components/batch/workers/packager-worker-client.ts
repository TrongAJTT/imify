import type {
  PackagerRunParams,
  PackagerRunResult,
  PackagerWorkerResponseMessage,
  PackagerStartMessage,
  PackagerAddMessage,
  PackagerFinalizeMessage
} from "@/options/components/batch/workers/packager-worker-protocol"

interface PendingJob {
  resolve: (result: PackagerRunResult) => void
  reject: (reason?: unknown) => void
  onProgress?: (payload: { percent: number; message: string }) => void
}

export class PackagerWorkerClient {
  private worker: Worker
  private pending = new Map<number, PendingJob>()
  private nextId = 1

  constructor() {
    this.worker = new Worker(new URL("./packager.worker.ts", import.meta.url), { type: "module" })

    this.worker.onmessage = (event: MessageEvent<PackagerWorkerResponseMessage>) => {
      const message = event.data
      const pending = this.pending.get(message.id)

      if (!pending) {
        return
      }

      if (message.type === "progress") {
        pending.onProgress?.({
          percent: message.percent,
          message: message.message
        })
        return
      }

      this.pending.delete(message.id)

      if (!message.ok) {
        pending.reject(new Error(message.error || "Packager worker failed"))
        return
      }

      pending.resolve({
        outputBlob: new Blob([message.outputBuffer], { type: message.mimeType }),
        outputFileName: message.outputFileName
      })
    }

    this.worker.onerror = () => {
      for (const [id, pending] of this.pending.entries()) {
        pending.reject(new Error("Packager worker crashed during export"))
        this.pending.delete(id)
      }
    }
  }

  async run(params: PackagerRunParams): Promise<PackagerRunResult> {
    const id = this.nextId++

    return new Promise<PackagerRunResult>(async (resolve, reject) => {
      this.pending.set(id, {
        resolve,
        reject,
        onProgress: params.onProgress
      })

      try {
        const startMessage: PackagerStartMessage = {
          id,
          type: "start",
          mode: params.mode,
          totalFiles: params.entries.length,
          exportFileName: params.exportFileName,
          zipLevel: params.zipLevel
        }

        this.worker.postMessage(startMessage)

        for (const entry of params.entries) {
          const buffer = await entry.blob.arrayBuffer()
          const addMessage: PackagerAddMessage = {
            id,
            type: "add",
            name: entry.name,
            mimeType: entry.blob.type || "application/octet-stream",
            buffer
          }

          this.worker.postMessage(addMessage, [buffer])
        }

        const finalizeMessage: PackagerFinalizeMessage = {
          id,
          type: "finalize"
        }

        this.worker.postMessage(finalizeMessage)
      } catch (error) {
        this.pending.delete(id)
        reject(error)
      }
    })
  }

  terminate(): void {
    for (const [id, pending] of this.pending.entries()) {
      pending.reject(new Error("Packager worker terminated"))
      this.pending.delete(id)
    }

    this.worker.terminate()
  }
}
