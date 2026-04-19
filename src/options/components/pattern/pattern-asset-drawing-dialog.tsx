import { BaseDialog } from "@/options/components/ui/base-dialog"
import { Button } from "@/options/components/ui/button"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
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

interface BrushPreview {
  x: number
  y: number
  radius: number
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

export function PatternAssetDrawingDialog({
  isOpen,
  onClose,
  onSave
}: PatternAssetDrawingDialogProps) {
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
    () => strokes.length > 0 || activeStroke?.points.length,
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

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/png")
    })

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
            Sketch directly in-browser. Saved output is transparent PNG.
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
                min={1}
                max={120}
                step={1}
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
                Undo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClear}
                disabled={!hasContent}>
                <Trash2 size={14} />
                Clear
              </Button>
            </div>
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
