import { useEffect, useMemo, useRef, useState } from "react"
import { BookmarkX, Check, FolderOpen, Sparkles, Stamp, Trash2, X } from "lucide-react"

import { BaseDialog } from "@/options/components/ui/base-dialog"
import { Button } from "@/options/components/ui/button"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import type { BatchWatermarkConfig, BatchWatermarkPosition } from "@/options/components/batch/types"
import type { SavedWatermarkItem } from "@/options/stores/watermark-store"
import { watermarkStorage } from "@/core/indexed-db"

interface WatermarkOpenSavedDialogProps {
  isOpen: boolean
  onClose: () => void
  items: SavedWatermarkItem[]
  onConfirm: (item: SavedWatermarkItem) => void
  onDelete?: (id: string) => void
  allowDelete?: boolean
  title?: string
  confirmLabel?: string
  initialSelectedId?: string | null
}

function formatSavedDate(item: SavedWatermarkItem): string {
  const dateValue = item.updatedAt || item.createdAt

  return new Date(dateValue).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

interface ParsedGradientStop {
  color: string
  offset: number
}

interface ParsedLinearGradient {
  angleDeg: number
  stops: ParsedGradientStop[]
}

interface RgbColor {
  r: number
  g: number
  b: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function parseHexColor(value: string): RgbColor | null {
  const hex = value.trim().replace(/^#/, "")
  if (hex.length !== 3 && hex.length !== 6) {
    return null
  }

  if (hex.length === 3) {
    const expanded = hex
      .split("")
      .map((part) => `${part}${part}`)
      .join("")

    const parsed = Number.parseInt(expanded, 16)
    if (!Number.isFinite(parsed)) {
      return null
    }

    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255
    }
  }

  const parsed = Number.parseInt(hex, 16)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  }
}

function parseRgbColor(value: string): RgbColor | null {
  const match = value
    .trim()
    .match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[0-9.]+)?\s*\)$/i)

  if (!match) {
    return null
  }

  return {
    r: clamp(Number(match[1]), 0, 255),
    g: clamp(Number(match[2]), 0, 255),
    b: clamp(Number(match[3]), 0, 255)
  }
}

function parseLinearGradientColor(value: string): ParsedLinearGradient | null {
  const trimmed = value.trim()
  const match = trimmed.match(/^linear-gradient\(\s*([+-]?\d*\.?\d+)deg\s*,\s*(.+)\s*\)$/i)
  if (!match) {
    return null
  }

  const angleDeg = Number(match[1])
  if (!Number.isFinite(angleDeg)) {
    return null
  }

  const parts = match[2]
    .split(/,(?![^(]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) {
    return null
  }

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

function parseColorToRgb(value: string): RgbColor | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed)
  }

  if (/^rgba?\(/i.test(trimmed)) {
    return parseRgbColor(trimmed)
  }

  return null
}

function getRelativeLuminance(color: RgbColor): number {
  const normalize = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * normalize(color.r) + 0.7152 * normalize(color.g) + 0.0722 * normalize(color.b)
}

function extractPrimaryColor(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const gradient = parseLinearGradientColor(trimmed)
  if (gradient?.stops.length) {
    return gradient.stops[0].color
  }

  return trimmed
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

function drawPreviewBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string | null
): void {
  const parsed = accentColor ? parseColorToRgb(accentColor) : null
  const luminance = parsed ? getRelativeLuminance(parsed) : 0.25
  const useDarkBackground = luminance > 0.58

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  if (useDarkBackground) {
    gradient.addColorStop(0, "#0f172a")
    gradient.addColorStop(1, "#1e293b")
  } else {
    gradient.addColorStop(0, "#f8fafc")
    gradient.addColorStop(1, "#cbd5e1")
  }

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = useDarkBackground ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"
  ctx.beginPath()
  ctx.arc(width * 0.82, height * 0.28, width * 0.12, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(width * 0.18, height * 0.75, width * 0.14, 0, Math.PI * 2)
  ctx.fill()
}

function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BatchWatermarkConfig
): void {
  const text = config.text.trim() || "Text"
  const shortestEdge = Math.min(width, height)
  const fontSize = Math.max(12, Math.round(shortestEdge * (Math.max(1, config.textScalePercent) / 100)))
  const padding = Math.max(0, Math.round(config.paddingPx))
  const textRotationDeg = Number.isFinite(config.textRotationDeg) ? Number(config.textRotationDeg) : 0

  ctx.font = `700 ${fontSize}px Segoe UI, Arial, sans-serif`
  ctx.textBaseline = "top"
  const textMetrics = ctx.measureText(text)

  const drawWidth = Math.ceil(textMetrics.width)
  const drawHeight = fontSize
  const point = resolvePosition(config.position, width, height, drawWidth, drawHeight, padding)
  const centerX = point.x + drawWidth / 2
  const centerY = point.y + drawHeight / 2

  const primaryColor = extractPrimaryColor(config.textColor || "")
  const strokeRgb = primaryColor ? parseColorToRgb(primaryColor) : null
  const strokeLuminance = strokeRgb ? getRelativeLuminance(strokeRgb) : 1

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate((textRotationDeg * Math.PI) / 180)

  const gradient = parseLinearGradientColor(config.textColor || "")
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
    ctx.fillStyle = config.textColor || "#ffffff"
  }

  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.08))
  ctx.strokeStyle = strokeLuminance > 0.55 ? "rgba(15,23,42,0.35)" : "rgba(248,250,252,0.42)"
  ctx.strokeText(text, -drawWidth / 2, -drawHeight / 2)
  ctx.fillText(text, -drawWidth / 2, -drawHeight / 2)
  ctx.restore()
}

async function loadLogoBlob(config: BatchWatermarkConfig): Promise<Blob | null> {
  if (config.logoDataUrl) {
    try {
      return await (await fetch(config.logoDataUrl)).blob()
    } catch (error) {
      console.warn("Failed to read saved logo from DataUrl", error)
    }
  }

  if (config.logoBlobId) {
    try {
      return await watermarkStorage.get(config.logoBlobId)
    } catch (error) {
      console.warn("Failed to read saved logo from IndexedDB", error)
    }
  }

  return null
}

function extractDominantColor(bitmap: ImageBitmap): string | null {
  const sampleCanvas = document.createElement("canvas")
  sampleCanvas.width = 24
  sampleCanvas.height = 24

  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true })
  if (!sampleCtx) {
    return null
  }

  sampleCtx.clearRect(0, 0, 24, 24)
  sampleCtx.drawImage(bitmap, 0, 0, 24, 24)

  const imageData = sampleCtx.getImageData(0, 0, 24, 24)
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3]
    if (alpha < 20) {
      continue
    }

    r += imageData.data[index]
    g += imageData.data[index + 1]
    b += imageData.data[index + 2]
    count += 1
  }

  if (count === 0) {
    return null
  }

  return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`
}

function drawLogoPlaceholder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BatchWatermarkConfig
): void {
  const targetWidth = Math.max(32, Math.round(width * (Math.max(2, config.logoScalePercent) / 100)))
  const targetHeight = targetWidth
  const padding = Math.max(0, Math.round(config.paddingPx))
  const point = resolvePosition(config.position, width, height, targetWidth, targetHeight, padding)

  ctx.save()
  ctx.globalAlpha = Math.max(0.08, Math.min(1, config.opacity / 100))
  ctx.fillStyle = "rgba(15,23,42,0.78)"
  ctx.fillRect(point.x, point.y, targetWidth, targetHeight)

  ctx.lineWidth = 2
  ctx.strokeStyle = "rgba(248,250,252,0.85)"
  ctx.strokeRect(point.x + 1, point.y + 1, targetWidth - 2, targetHeight - 2)

  ctx.fillStyle = "rgba(248,250,252,0.9)"
  ctx.font = `700 ${Math.max(9, Math.round(targetWidth * 0.2))}px Segoe UI, Arial, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("LOGO", point.x + targetWidth / 2, point.y + targetHeight / 2)
  ctx.restore()
}

function drawLogoBitmap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BatchWatermarkConfig,
  logoBitmap: ImageBitmap
): void {
  const targetWidth = Math.max(24, Math.round(width * (Math.max(2, config.logoScalePercent) / 100)))
  const ratio = logoBitmap.height / Math.max(1, logoBitmap.width)
  const targetHeight = Math.max(24, Math.round(targetWidth * ratio))
  const padding = Math.max(0, Math.round(config.paddingPx))
  const point = resolvePosition(config.position, width, height, targetWidth, targetHeight, padding)
  const logoRotationDeg = Number.isFinite(config.logoRotationDeg) ? Number(config.logoRotationDeg) : 0

  ctx.save()
  ctx.globalAlpha = Math.max(0.08, Math.min(1, config.opacity / 100))
  ctx.translate(point.x + targetWidth / 2, point.y + targetHeight / 2)
  ctx.rotate((logoRotationDeg * Math.PI) / 180)
  ctx.drawImage(logoBitmap, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight)
  ctx.restore()
}

function drawUnavailableMessage(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "rgba(15,23,42,0.72)"
  ctx.fillRect(0, height - 28, width, 28)
  ctx.fillStyle = "rgba(248,250,252,0.92)"
  ctx.font = "600 11px Segoe UI, Arial, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("Preview unavailable", width / 2, height - 14)
}

function buildWatermarkMetadata(item: SavedWatermarkItem): string {
  const config = item.config
  if (config.type === "none") {
    return "No watermark"
  }

  const parts: string[] = []
  
  // Position
  const positionLabel = {
    "top-left": "↖ Top-Left",
    "top-center": "↑ Top-Center",
    "top-right": "↗ Top-Right",
    "middle-left": "← Middle-Left",
    "center": "⦿ Center",
    "middle-right": "→ Middle-Right",
    "bottom-left": "↙ Bottom-Left",
    "bottom-center": "↓ Bottom-Center",
    "bottom-right": "↘ Bottom-Right"
  }
  parts.push(positionLabel[config.position] || config.position)

  // Size & Padding
  if (config.type === "text") {
    parts.push(`${config.textScalePercent}% size`)
  } else if (config.type === "logo") {
    parts.push(`${config.logoScalePercent}% scale`)
  }

  parts.push(`${config.paddingPx}px padding`)

  // Opacity (for logo)
  if (config.type === "logo") {
    parts.push(`${config.opacity}% opacity`)
  }

  return parts.join(" · ")
}

function WatermarkPreviewCard({
  item,
  selected,
  onSelect
}: {
  item: SavedWatermarkItem
  selected: boolean
  onSelect: (id: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let active = true

    const renderPreview = async () => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return
      }

      const width = canvas.width
      const height = canvas.height

      try {
        if (item.config.type === "none") {
          drawPreviewBackground(ctx, width, height, null)
          return
        }

        if (item.config.type === "text") {
          drawPreviewBackground(ctx, width, height, extractPrimaryColor(item.config.textColor || ""))
          drawTextWatermark(ctx, width, height, item.config)
          return
        }

        const logoBlob = await loadLogoBlob(item.config)
        if (!active) {
          return
        }

        if (!logoBlob) {
          drawPreviewBackground(ctx, width, height, null)
          drawLogoPlaceholder(ctx, width, height, item.config)
          return
        }

        let logoBitmap: ImageBitmap | null = null
        try {
          logoBitmap = await createImageBitmap(logoBlob)
        } catch (error) {
          console.warn("Failed to decode logo for saved watermark preview", error)
        }

        if (!active) {
          logoBitmap?.close()
          return
        }

        if (!logoBitmap) {
          drawPreviewBackground(ctx, width, height, null)
          drawLogoPlaceholder(ctx, width, height, item.config)
          return
        }

        try {
          drawPreviewBackground(ctx, width, height, extractDominantColor(logoBitmap))
          drawLogoBitmap(ctx, width, height, item.config, logoBitmap)
        } finally {
          logoBitmap.close()
        }
      } catch (error) {
        console.error("Failed to render saved watermark preview", error)
        if (!active) {
          return
        }

        drawPreviewBackground(ctx, width, height, null)
        drawUnavailableMessage(ctx, width, height)
      }
    }

    void renderPreview()

    return () => {
      active = false
    }
  }, [item.id, item.updatedAt, item.config])

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`group overflow-hidden rounded-xl border text-left transition-all ${
        selected
          ? "border-sky-500 bg-sky-50/60 shadow-sm shadow-sky-500/20 ring-1 ring-sky-300 dark:bg-sky-500/10 dark:ring-sky-600"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
      }`}
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden border-b border-slate-200/70 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          className="h-full w-full"
        />
        {selected ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2 py-1 text-[10px] font-semibold text-white">
            <Check size={12} />
            Selected
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5 px-3 py-3">
        <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          {buildWatermarkMetadata(item)}
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500">
          Saved on {formatSavedDate(item)}
        </div>
      </div>
    </button>
  )
}

function EmptySavedWatermarkState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/40 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
        <Stamp size={20} />
        <span className="absolute -right-1 -top-1 rounded-full bg-white p-1 text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
          <BookmarkX size={12} />
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No saved watermarks yet</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
        Save your current watermark pattern first, then reopen it anytime from this library.
      </p>
      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Sparkles size={11} />
        Client-side only
      </div>
    </div>
  )
}

export function WatermarkOpenSavedDialog({
  isOpen,
  onClose,
  items,
  onConfirm,
  onDelete,
  allowDelete = true,
  title = "Open Saved Watermark",
  confirmLabel = "Open",
  initialSelectedId = null
}: WatermarkOpenSavedDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (initialSelectedId && items.some((item) => item.id === initialSelectedId)) {
      setSelectedId(initialSelectedId)
      return
    }

    setSelectedId(items[0]?.id ?? null)
  }, [isOpen, initialSelectedId, items])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null)
    }
  }, [items, selectedId])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  )

  const handleDelete = () => {
    if (!allowDelete || !onDelete || !selectedItem) {
      return
    }

    const shouldDelete = window.confirm(`Delete saved watermark \"${selectedItem.name}\"?`)
    if (!shouldDelete) {
      return
    }

    onDelete(selectedItem.id)
  }

  if (!isOpen) {
    return null
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full max-w-4xl rounded-xl overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <FolderOpen size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose a saved watermark card to continue.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Close saved watermark dialog"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-[58vh] overflow-y-auto p-5">
        {items.length === 0 ? (
          <EmptySavedWatermarkState />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WatermarkPreviewCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
        <div>
          {selectedItem ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selected: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedItem.name}</span>
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <SecondaryButton onClick={onClose} className="px-4">
            Cancel
          </SecondaryButton>

          {allowDelete && onDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!selectedItem}
              className="px-4"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          ) : null}

          <Button
            size="sm"
            onClick={() => {
              if (selectedItem) {
                onConfirm(selectedItem)
              }
            }}
            disabled={!selectedItem}
            className="px-5"
          >
            <FolderOpen size={14} />
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}
