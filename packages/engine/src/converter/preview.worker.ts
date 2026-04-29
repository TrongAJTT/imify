import { decodeImageBitmapForEncoding } from "./color-managed-pipeline"

interface PreviewRequestMessage {
  id: number
  type: "preview"
  sourceBlob: Blob
  maxDimension: number
}

interface PreviewSuccessMessage {
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

interface PreviewErrorMessage {
  id: number
  type: "preview_result"
  ok: false
  error: string
}

type PreviewResponseMessage = PreviewSuccessMessage | PreviewErrorMessage

const workerPostMessage = globalThis as unknown as {
  postMessage: (message: PreviewResponseMessage, transfer?: Transferable[]) => void
}

function clampPreviewDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 2048
  }

  return Math.max(512, Math.min(4096, Math.round(value)))
}

self.onmessage = (event: MessageEvent<PreviewRequestMessage>) => {
  const message = event.data

  if (!message || message.type !== "preview") {
    return
  }

  void (async () => {
    const maxDimension = clampPreviewDimension(message.maxDimension)
    let imageBitmap: ImageBitmap | null = null

    try {
      imageBitmap = await decodeImageBitmapForEncoding(message.sourceBlob)

      const width = Math.max(1, imageBitmap.width)
      const height = Math.max(1, imageBitmap.height)
      const longestSide = Math.max(width, height)
      const scale = longestSide > maxDimension ? maxDimension / longestSide : 1

      const previewWidth = Math.max(1, Math.round(width * scale))
      const previewHeight = Math.max(1, Math.round(height * scale))

      const canvas = new OffscreenCanvas(previewWidth, previewHeight)
      const ctx = canvas.getContext("2d", { alpha: true })

      if (!ctx) {
        throw new Error("Cannot acquire 2D context for preview rendering")
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.clearRect(0, 0, previewWidth, previewHeight)
      ctx.drawImage(imageBitmap, 0, 0, previewWidth, previewHeight)

      let previewBlob: Blob
      try {
        previewBlob = await canvas.convertToBlob({
          type: "image/webp",
          quality: 0.86
        })
      } catch {
        previewBlob = await canvas.convertToBlob({ type: "image/png" })
      }

      const outputBuffer = await previewBlob.arrayBuffer()

      workerPostMessage.postMessage(
        {
          id: message.id,
          type: "preview_result",
          ok: true,
          outputBuffer,
          mimeType: previewBlob.type || "image/png",
          width,
          height,
          previewWidth,
          previewHeight
        },
        [outputBuffer]
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Preview rendering failed"
      workerPostMessage.postMessage({
        id: message.id,
        type: "preview_result",
        ok: false,
        error: errorMessage
      })
    } finally {
      imageBitmap?.close()
    }
  })()
}
