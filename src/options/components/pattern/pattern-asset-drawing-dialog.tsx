import { BaseDialog } from "@/options/components/ui/base-dialog"
import { Button } from "@/options/components/ui/button"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import { NumberInput } from "@/options/components/ui/number-input"
import { TextInput } from "@/options/components/ui/text-input"
import { Eraser, Pencil, RotateCcw, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface PatternAssetDrawingDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: { blob: Blob; suggestedName: string }) => void
}

type DrawingTool = "pen" | "eraser"

interface Point {
  x: number
  y: number
}

interface Stroke {
  tool: DrawingTool
  color: string
  size: number
  points: Point[]
}

const DRAWING_WIDTH = 1024
const DRAWING_HEIGHT = 640
const MIN_BRUSH_SIZE = 1
const MAX_BRUSH_SIZE = 120
const BRUSH_SIZE_STEP = 1

interface BrushPreview {
  x: number
  y: number
  radius: number
}

interface PixelBounds {
  x: number
  y: number
  width: number
  height: number
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.points.length < 2) {
    return
  }

  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = stroke.size

  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out"
    ctx.strokeStyle = "rgba(0,0,0,1)"
  } else {
    ctx.globalCompositeOperation = "source-over"
    ctx.strokeStyle = stroke.color
  }

  ctx.beginPath()
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

  for (let index = 1; index < stroke.points.length; index += 1) {
    const point = stroke.points[index]
    ctx.lineTo(point.x, point.y)
  }

  ctx.stroke()
  ctx.restore()
}

function toLocalCanvasPoint(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>
): Point {
  const rect = canvas.getBoundingClientRect()
  const x =
    ((event.clientX - rect.left) / Math.max(rect.width, 1)) * canvas.width
  const y =
    ((event.clientY - rect.top) / Math.max(rect.height, 1)) * canvas.height

  return {
    x: Math.max(0, Math.min(canvas.width, x)),
    y: Math.max(0, Math.min(canvas.height, y))
  }
}

function toBrushPreview(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>,
  brushSize: number
): BrushPreview {
  const rect = canvas.getBoundingClientRect()
  const scale = Math.max(rect.width / Math.max(canvas.width, 1), 0.0001)

  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    radius: Math.max(1, (brushSize * scale) / 2)
  }
}

function findOpaqueBounds(ctx: CanvasRenderingContext2D, width: number, height: number): PixelBounds | null {
  const { data } = ctx.getImageData(0, 0, width, height)

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha === 0) {
        continue
      }

      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < minX || maxY < minY) {
    return null
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

async function createOpaqueTrimmedBlob(strokes: Stroke[]): Promise<Blob | null> {
  if (strokes.length === 0) {
    return null
  }

  const sourceCanvas = document.createElement("canvas")
  sourceCanvas.width = DRAWING_WIDTH
  sourceCanvas.height = DRAWING_HEIGHT

  const sourceCtx = sourceCanvas.getContext("2d")
  if (!sourceCtx) {
    return null
  }

  sourceCtx.clearRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT)
  for (const stroke of strokes) {
    drawStroke(sourceCtx, stroke)
  }

  const bounds = findOpaqueBounds(sourceCtx, DRAWING_WIDTH, DRAWING_HEIGHT)
  if (!bounds) {
    return null
  }

  const exportCanvas = document.createElement("canvas")
  exportCanvas.width = bounds.width
  exportCanvas.height = bounds.height

  const exportCtx = exportCanvas.getContext("2d")
  if (!exportCtx) {
    return null
  }

  // Output should be opaque and contain only drawn content bounds.
  exportCtx.fillStyle = "#ffffff"
  exportCtx.fillRect(0, 0, bounds.width, bounds.height)
  exportCtx.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  )

  return new Promise<Blob | null>((resolve) => {
    exportCanvas.toBlob((value) => resolve(value), "image/png")
  })
}

export function PatternAssetDrawingDialog({
  isOpen,
  onClose,
  onSave
}: PatternAssetDrawingDialogProps) {
  const { getShortcutLabel } = useShortcutPreferences()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<DrawingTool>("pen")
  const [brushSize, setBrushSize] = useState(10)
  const [color, setColor] = useState("#0f172a")
  const [suggestedName, setSuggestedName] = useState("drawn-asset")
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushPreview, setBrushPreview] = useState<BrushPreview | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  const hasContent = useMemo(
    () => strokes.length > 0 || (activeStroke?.points.length ?? 0) >= 2,
    [strokes.length, activeStroke?.points.length]
  )
  const hasUndoHistory = strokes.length > 0

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of strokes) {
      drawStroke(ctx, stroke)
    }

    if (activeStroke) {
      drawStroke(ctx, activeStroke)
    }
  }, [activeStroke, strokes])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setTool("pen")
    setBrushSize(10)
    setColor("#0f172a")
    setStrokes([])
    setActiveStroke(null)
    setIsDrawing(false)
    setBrushPreview(null)
    setSuggestedName("drawn-asset")
  }, [isOpen])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  const beginStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    setIsHovering(true)
    setBrushPreview(toBrushPreview(canvas, event, brushSize))

    const point = toLocalCanvasPoint(canvas, event)
    const stroke: Stroke = {
      tool,
      color,
      size: brushSize,
      points: [point]
    }

    setActiveStroke(stroke)
    setIsDrawing(true)
    canvas.setPointerCapture(event.pointerId)
  }

  const continueStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    setBrushPreview(toBrushPreview(canvas, event, brushSize))

    if (!isDrawing) {
      return
    }

    const point = toLocalCanvasPoint(canvas, event)
    setActiveStroke((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        points: [...current.points, point]
      }
    })
  }

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    canvas.releasePointerCapture(event.pointerId)
    setBrushPreview(toBrushPreview(canvas, event, brushSize))
    setIsDrawing(false)

    // keep hover state as-is; pointer may still be over canvas

    setActiveStroke((current) => {
      if (!current || current.points.length < 2) {
        return null
      }

      setStrokes((previous) => [...previous, current])
      return null
    })
  }

  const handleUndo = () => {
    setActiveStroke(null)
    setStrokes((previous) => previous.slice(0, -1))
  }

  const handleClear = () => {
    setActiveStroke(null)
    setStrokes([])
  }

  const increaseBrushSize = useCallback(() => {
    setBrushSize((current) => Math.min(MAX_BRUSH_SIZE, current + BRUSH_SIZE_STEP))
  }, [])

  const decreaseBrushSize = useCallback(() => {
    setBrushSize((current) => Math.max(MIN_BRUSH_SIZE, current - BRUSH_SIZE_STEP))
  }, [])

  useShortcutActions(
    [
      {
        actionId: "pattern.draw.decrease_brush_size",
        enabled: isOpen,
        handler: () => decreaseBrushSize(),
      },
      {
        actionId: "pattern.draw.increase_brush_size",
        enabled: isOpen,
        handler: () => increaseBrushSize(),
      },
      {
        actionId: "pattern.draw.undo",
        enabled: isOpen,
        handler: () => handleUndo(),
      },
      {
        actionId: "pattern.draw.clear",
        enabled: isOpen,
        handler: () => handleClear(),
      },
    ],
    isOpen
  )

  const handleSave = async () => {
    const strokesForExport = activeStroke && activeStroke.points.length >= 2
      ? [...strokes, activeStroke]
      : [...strokes]

    const blob = await createOpaqueTrimmedBlob(strokesForExport)

    if (!blob) {
      return
    }

    const normalizedName =
      suggestedName.trim().length > 0 ? suggestedName.trim() : "drawn-asset"
    onSave({ blob, suggestedName: normalizedName })
  }

  const handleManualClose = () => {
    if (hasUndoHistory) {
      const confirmed = window.confirm(
        "You have unsaved drawing progress. Close without saving?"
      )
      if (!confirmed) {
        return
      }
    }

    onClose()
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      isDirty={hasUndoHistory}
      contentClassName="w-[980px] max-w-[96vw] rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Draw Asset
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sketch directly in-browser. Saved output is auto-trimmed and exported as opaque PNG.
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualClose}
          className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close drawing dialog">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/20 p-3">
            <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc),linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc)] dark:bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a),linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
              <canvas
                ref={canvasRef}
                width={DRAWING_WIDTH}
                height={DRAWING_HEIGHT}
                className={`w-full h-auto rounded-lg touch-none cursor-none`}
                onPointerDown={beginStroke}
                onPointerMove={continueStroke}
                onPointerUp={finishStroke}
                onPointerCancel={finishStroke}
                onPointerEnter={(event) => {
                  const canvas = canvasRef.current
                  if (!canvas) {
                    return
                  }

                  setIsHovering(true)
                  setBrushPreview(toBrushPreview(canvas, event, brushSize))
                }}
                onPointerLeave={() => {
                  setIsHovering(false)
                  if (!isDrawing) {
                    setBrushPreview(null)
                  }
                }}
              />

              {brushPreview && (
                <div
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                    tool === "eraser"
                      ? "border-rose-400/90 bg-rose-300/10"
                      : "border-sky-500/90 bg-sky-300/10"
                  }`}
                  style={{
                    left: `${brushPreview.x}px`,
                    top: `${brushPreview.y}px`,
                    width: `${brushPreview.radius * 2}px`,
                    height: `${brushPreview.radius * 2}px`
                  }}
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tool === "pen" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTool("pen")}
                className="w-full">
                <Pencil size={14} />
                Pen
              </Button>
              <Button
                variant={tool === "eraser" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTool("eraser")}
                className="w-full">
                <Eraser size={14} />
                Eraser
              </Button>
            </div>

            <div
              className={
                tool === "eraser" ? "opacity-60 pointer-events-none" : ""
              }>
              <ColorPickerPopover
                label="Brush Color"
                value={color}
                onChange={setColor}
                enableGradient={false}
                enableAlpha={false}
                outputMode="hex"
              />
            </div>

            <div className="flex gap-3">
              <NumberInput
                label="Brush Size"
                value={brushSize}
                min={MIN_BRUSH_SIZE}
                max={MAX_BRUSH_SIZE}
                step={BRUSH_SIZE_STEP}
                onChangeValue={setBrushSize}
                className="flex-1"
              />

              <TextInput
                label="Asset Name"
                value={suggestedName}
                onChange={setSuggestedName}
                placeholder="drawn-asset"
                maxLength={80}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUndo}
                disabled={strokes.length === 0}>
                <RotateCcw size={14} />
                Undo ({getShortcutLabel("pattern.draw.undo")})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClear}
                disabled={!hasContent}>
                <Trash2 size={14} />
                Clear ({getShortcutLabel("pattern.draw.clear")})
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Brush: {getShortcutLabel("pattern.draw.decrease_brush_size")} / {getShortcutLabel("pattern.draw.increase_brush_size")}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={handleManualClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSave()}
            disabled={!hasContent}>
            Save As Asset
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}
