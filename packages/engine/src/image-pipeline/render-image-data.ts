export interface RenderImageDataPreviewOptions {
  preferredMimeType?: string
  quality?: number
  maxDimension?: number
  fallbackMimeTypes?: string[]
}

export interface RenderImageDataPreviewResult {
  previewBlob: Blob
  objectUrl: string
  width: number
  height: number
  requestedMimeType: string
  outputMimeType: string
  fallbackUsed: boolean
}

const DEFAULT_MAX_DIMENSION = 3072
const DEFAULT_QUALITY = 0.82
const DEFAULT_FALLBACK_MIME_TYPES = ["image/webp", "image/png", "image/jpeg"]

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeMimeType(value: string | undefined): string {
  if (!value || !value.trim()) {
    return "image/webp"
  }

  return value.trim().toLowerCase()
}

function normalizeMaxDimension(value: number | undefined): number {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return DEFAULT_MAX_DIMENSION
  }

  return Math.max(256, Math.min(8192, Math.round(value)))
}

function buildMimeCandidates(
  requestedMimeType: string,
  fallbackMimeTypes: string[] | undefined
): string[] {
  const merged = [
    requestedMimeType,
    ...(fallbackMimeTypes ?? []),
    ...DEFAULT_FALLBACK_MIME_TYPES
  ]

  const seen = new Set<string>()
  const result: string[] = []

  for (const mime of merged) {
    const normalized = normalizeMimeType(mime)
    if (seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

function resolveRenderSize(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const longestSide = Math.max(safeWidth, safeHeight)

  if (longestSide <= maxDimension) {
    return {
      width: safeWidth,
      height: safeHeight
    }
  }

  const scale = maxDimension / longestSide

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale))
  }
}

function createContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true
  })

  if (!ctx) {
    throw new Error("Cannot acquire 2D context from OffscreenCanvas")
  }

  return ctx
}

function buildEncodeOptions(mimeType: string, quality: number): ImageEncodeOptions {
  if (mimeType === "image/png") {
    return { type: mimeType }
  }

  return {
    type: mimeType,
    quality
  }
}

export async function renderImageDataPreview(
  imageData: ImageData,
  options: RenderImageDataPreviewOptions = {}
): Promise<RenderImageDataPreviewResult> {
  const requestedMimeType = normalizeMimeType(options.preferredMimeType)
  const quality = clamp(
    Number.isFinite(options.quality) ? Number(options.quality) : DEFAULT_QUALITY,
    0.05,
    1
  )
  const maxDimension = normalizeMaxDimension(options.maxDimension)
  const candidates = buildMimeCandidates(requestedMimeType, options.fallbackMimeTypes)
  const targetSize = resolveRenderSize(imageData.width, imageData.height, maxDimension)

  const sourceCanvas = new OffscreenCanvas(imageData.width, imageData.height)
  const sourceCtx = createContext(sourceCanvas)
  sourceCtx.putImageData(imageData, 0, 0)

  const targetCanvas = new OffscreenCanvas(targetSize.width, targetSize.height)
  const targetCtx = createContext(targetCanvas)
  targetCtx.imageSmoothingEnabled = true
  targetCtx.imageSmoothingQuality = "high"
  targetCtx.clearRect(0, 0, targetSize.width, targetSize.height)
  targetCtx.drawImage(sourceCanvas, 0, 0, targetSize.width, targetSize.height)

  let lastError: unknown = null

  for (const mimeType of candidates) {
    try {
      const blob = await targetCanvas.convertToBlob(buildEncodeOptions(mimeType, quality))

      if (!blob || blob.size <= 0) {
        continue
      }

      const outputMimeType = normalizeMimeType(blob.type || mimeType)

      return {
        previewBlob: blob,
        objectUrl: URL.createObjectURL(blob),
        width: targetSize.width,
        height: targetSize.height,
        requestedMimeType,
        outputMimeType,
        fallbackUsed: outputMimeType !== requestedMimeType
      }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Preview rendering failed: ${lastError.message}`)
  }

  throw new Error("Preview rendering failed: browser could not encode any fallback format")
}
