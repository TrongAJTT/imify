import type { BatchWatermarkConfig, BatchWatermarkPosition } from "@imify/stores/stores/batch-types"
import { watermarkStorage } from "@imify/core/indexed-db"

const PREVIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="45%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <circle cx="980" cy="180" r="160" fill="white" fill-opacity="0.12"/>
  <circle cx="160" cy="640" r="180" fill="white" fill-opacity="0.08"/>
</svg>`

export const WATERMARK_PREVIEW_DATA_URL = `data:image/svg+xml;base64,${btoa(PREVIEW_SVG)}`

export const WATERMARK_POSITION_OPTIONS: Array<{ value: BatchWatermarkPosition; label: string }> = [
  { value: "top-left", label: "Top-Left" },
  { value: "top-center", label: "Top-Center" },
  { value: "top-right", label: "Top-Right" },
  { value: "middle-left", label: "Middle-Left" },
  { value: "center", label: "Center" },
  { value: "middle-right", label: "Middle-Right" },
  { value: "bottom-left", label: "Bottom-Left" },
  { value: "bottom-center", label: "Bottom-Center" },
  { value: "bottom-right", label: "Bottom-Right" }
]

export const DEFAULT_BATCH_WATERMARK: BatchWatermarkConfig = {
  type: "none",
  position: "bottom-right",
  opacity: 70,
  paddingPx: 24,
  text: "imify",
  textColor: "#FFFFFF",
  textScalePercent: 5,
  textRotationDeg: 0,
  logoScalePercent: 16,
  logoRotationDeg: 0
}

interface ParsedGradientStop {
  color: string
  offset: number
}

interface ParsedLinearGradient {
  angleDeg: number
  stops: ParsedGradientStop[]
}

function parseLinearGradientColor(value: string): ParsedLinearGradient | null {
  const trimmed = value.trim()
  const match = trimmed.match(/^linear-gradient\(\s*([+-]?\d*\.?\d+)deg\s*,\s*(.+)\s*\)$/i)
  if (!match) return null

  const angleDeg = Number(match[1])
  if (!Number.isFinite(angleDeg)) return null

  const parts = match[2]
    .split(/,(?![^(]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) return null

  const stops = parts.map((part, index) => {
    const stopMatch = part.match(/^(.*?)(?:\s+([+-]?\d*\.?\d+)%?)?$/)
    const color = stopMatch?.[1]?.trim() || part
    const parsedOffset = Number(stopMatch?.[2])
    const offsetFallback = (index / Math.max(1, parts.length - 1)) * 100

    return {
      color,
      offset:
        stopMatch?.[2] && Number.isFinite(parsedOffset)
          ? Math.max(0, Math.min(100, parsedOffset))
          : offsetFallback
    }
  })

  return {
    angleDeg,
    stops: stops.sort((a, b) => a.offset - b.offset)
  }
}

function resolvePosition(
  position: BatchWatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  drawWidth: number,
  drawHeight: number,
  padding: number
): { x: number; y: number } {
  const maxX = canvasWidth - drawWidth - padding
  const maxY = canvasHeight - drawHeight - padding

  const centerX = (canvasWidth - drawWidth) / 2
  const centerY = (canvasHeight - drawHeight) / 2

  switch (position) {
    case "top-left":
      return { x: padding, y: padding }
    case "top-center":
      return { x: centerX, y: padding }
    case "top-right":
      return { x: maxX, y: padding }
    case "middle-left":
      return { x: padding, y: centerY }
    case "center":
      return { x: centerX, y: centerY }
    case "middle-right":
      return { x: maxX, y: centerY }
    case "bottom-left":
      return { x: padding, y: maxY }
    case "bottom-center":
      return { x: centerX, y: maxY }
    case "bottom-right":
      return { x: maxX, y: maxY }
    default:
      return { x: maxX, y: maxY }
  }
}

function parseFontFamily(): string {
  return "Segoe UI, Arial, sans-serif"
}

export async function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Cannot read image file"))
    reader.onload = () => resolve(String(reader.result || ""))
    reader.readAsDataURL(file)
  })
}

export async function applyWatermarkToImageBlob(sourceBlob: Blob, watermark: BatchWatermarkConfig): Promise<Blob> {
  if (watermark.type === "none") {
    return sourceBlob
  }

  if (watermark.type === "text" && !watermark.text.trim()) {
    return sourceBlob
  }

  // Handle Logo retrieval logic
  let logoBlob: Blob | null = null
  if (watermark.type === "logo") {
    if (watermark.logoDataUrl) {
      // Direct DataURL (typical when just uploaded or from memory)
      try {
        logoBlob = await (await fetch(watermark.logoDataUrl)).blob()
      } catch (err) {
        console.warn("Failed to fetch logo from DataUrl", err)
      }
    }

    if (!logoBlob && watermark.logoBlobId) {
      // Fallback to IndexedDB (typical after refresh)
      try {
        logoBlob = await watermarkStorage.get(watermark.logoBlobId)
      } catch (err) {
        console.error("Failed to load logo from IndexedDB", err)
      }
    }

    if (!logoBlob) {
      return sourceBlob
    }
  }

  let sourceBitmap: ImageBitmap
  try {
    sourceBitmap = await createImageBitmap(sourceBlob)
  } catch (err) {
    console.warn("Failed to decode source image for watermark processing, returning original", err)
    return sourceBlob
  }

  try {
    const canvas = new OffscreenCanvas(sourceBitmap.width, sourceBitmap.height)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Cannot acquire 2D context from OffscreenCanvas")
    }

    ctx.drawImage(sourceBitmap, 0, 0)

    if (watermark.type === "text") {
      const shortestEdge = Math.min(sourceBitmap.width, sourceBitmap.height)
      const fontSize = Math.max(14, Math.round(shortestEdge * (watermark.textScalePercent / 100)))
      const text = watermark.text.trim()
      const textRotationDeg = Number.isFinite(watermark.textRotationDeg) ? Number(watermark.textRotationDeg) : 0

      ctx.font = `700 ${fontSize}px ${parseFontFamily()}`
      ctx.textBaseline = "top"

      const textMetrics = ctx.measureText(text)
      const drawWidth = Math.ceil(textMetrics.width)
      const drawHeight = fontSize
      const padding = Math.max(0, Math.round(watermark.paddingPx))
      const point = resolvePosition(
        watermark.position,
        sourceBitmap.width,
        sourceBitmap.height,
        drawWidth,
        drawHeight,
        padding
      )
      const centerX = point.x + drawWidth / 2
      const centerY = point.y + drawHeight / 2
      const gradient = parseLinearGradientColor(watermark.textColor || "")

      ctx.save()
      ctx.globalAlpha = 1
      ctx.translate(centerX, centerY)
      ctx.rotate((textRotationDeg * Math.PI) / 180)

      if (gradient) {
        const radians = ((gradient.angleDeg - 90) * Math.PI) / 180
        const halfLength = Math.max(1, Math.hypot(drawWidth, drawHeight) / 2)
        const dx = Math.cos(radians) * halfLength
        const dy = Math.sin(radians) * halfLength
        const canvasGradient = ctx.createLinearGradient(-dx, -dy, dx, dy)

        for (const stop of gradient.stops) {
          canvasGradient.addColorStop(stop.offset / 100, stop.color)
        }

        ctx.fillStyle = canvasGradient
      } else {
        ctx.fillStyle = watermark.textColor || "#FFFFFF"
      }

      ctx.fillText(text, -drawWidth / 2, -drawHeight / 2)
      ctx.restore()
    }

    if (watermark.type === "logo" && logoBlob) {
      const logoBitmap = await createImageBitmap(logoBlob)

      try {
        const targetWidth = Math.max(
          24,
          Math.round(sourceBitmap.width * (Math.max(2, watermark.logoScalePercent) / 100))
        )
        const ratio = logoBitmap.height / Math.max(1, logoBitmap.width)
        const targetHeight = Math.max(24, Math.round(targetWidth * ratio))
        const padding = Math.max(0, Math.round(watermark.paddingPx))
        const point = resolvePosition(
          watermark.position,
          sourceBitmap.width,
          sourceBitmap.height,
          targetWidth,
          targetHeight,
          padding
        )
        const logoRotationDeg = Number.isFinite(watermark.logoRotationDeg) ? Number(watermark.logoRotationDeg) : 0

        ctx.globalAlpha = Math.max(0.05, Math.min(1, watermark.opacity / 100))
        ctx.save()
        ctx.translate(point.x + targetWidth / 2, point.y + targetHeight / 2)
        ctx.rotate((logoRotationDeg * Math.PI) / 180)
        ctx.drawImage(logoBitmap, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight)
        ctx.restore()
      } finally {
        logoBitmap.close()
      }
    }

    const outputType = sourceBlob.type?.startsWith("image/") ? sourceBlob.type : "image/png"
    return await canvas.convertToBlob({ type: outputType })
  } finally {
    sourceBitmap.close()
  }
}
