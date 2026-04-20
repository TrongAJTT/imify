import {
  createTransparentTrimmedBlob,
  renderDrawingSurface,
  toBrushPreview,
  toLocalCanvasPoint,
  type BrushPreview,
  type DrawingTool,
  type Stroke,
  type StrokeSmoothingSettings
} from "@/features/pattern/pattern-drawing-utils"
import { Tooltip } from "@/options/components/tooltip"
import { BaseDialog } from "@/options/components/ui/base-dialog"
import { Button } from "@/options/components/ui/button"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { NumberInput } from "@/options/components/ui/number-input"
import { TextInput } from "@/options/components/ui/text-input"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import { Brush, Eraser, RotateCcw, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface PatternAssetDrawingDialogProps {
  isOpen: boolean
  mode?: "create" | "edit"
  sourceImageUrl?: string | null
  initialSuggestedName?: string
  onClose: () => void
  onSave: (payload: { blob: Blob; suggestedName: string }) => void
}

interface CanvasSize {
  width: number
  height: number
}

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 1024,
  height: 640
}

const DEFAULT_BRUSH_SIZE_BY_TOOL: Record<DrawingTool, number> = {
  brush: 10,
  eraser: 18
}

const MIN_BRUSH_SIZE = 1
const MAX_BRUSH_SIZE = 120
const BRUSH_SIZE_STEP = 1

const DEFAULT_STREAMLINE_PERCENT = 65
const DEFAULT_SMOOTHING_PERCENT = 55

function normalizeSuggestedName(input: string | null | undefined): string {
  const trimmed = input?.trim()
  if (!trimmed) {
    return "drawn-asset"
  }

  return trimmed
}

function sanitizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

export function PatternAssetDrawingDialog({
  isOpen,
  mode = "create",
  sourceImageUrl,
  initialSuggestedName,
  onClose,
  onSave
}: PatternAssetDrawingDialogProps) {
  const { getShortcutLabel } = useShortcutPreferences()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [tool, setTool] = useState<DrawingTool>("brush")
  const [brushSizeByTool, setBrushSizeByTool] = useState<
    Record<DrawingTool, number>
  >({
    ...DEFAULT_BRUSH_SIZE_BY_TOOL
  })
  const [color, setColor] = useState("#0f172a")
  const [suggestedName, setSuggestedName] = useState("drawn-asset")
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushPreview, setBrushPreview] = useState<BrushPreview | null>(null)
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [hasClearedSource, setHasClearedSource] = useState(false)
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    ...DEFAULT_CANVAS_SIZE
  })
  const [smoothBrushStroke, setSmoothBrushStroke] = useState(true)
  const [streamlinePercent, setStreamlinePercent] = useState(
    DEFAULT_STREAMLINE_PERCENT
  )
  const [smoothingPercent, setSmoothingPercent] = useState(
    DEFAULT_SMOOTHING_PERCENT
  )

  const activeBrushSize = brushSizeByTool[tool]
  const combinedStrokes = useMemo(() => {
    if (activeStroke && activeStroke.points.length >= 2) {
      return [...strokes, activeStroke]
    }

    return strokes
  }, [activeStroke, strokes])
  const hasContent = useMemo(() => {
    if (sourceImage) {
      return true
    }

    return combinedStrokes.length > 0
  }, [combinedStrokes.length, sourceImage])
  const hasUndoHistory = strokes.length > 0 || hasClearedSource
  const decreaseBrushShortcut = getShortcutLabel(
    "pattern.draw.decrease_brush_size"
  )
  const increaseBrushShortcut = getShortcutLabel(
    "pattern.draw.increase_brush_size"
  )
  const brushSizeTooltipContent = `Decrease: ${decreaseBrushShortcut}\nIncrease: ${increaseBrushShortcut}`

  const brushSmoothingSettings = useMemo<StrokeSmoothingSettings>(() => {
    return {
      enabled: smoothBrushStroke,
      streamline: sanitizePercent(streamlinePercent) / 100,
      smoothing: sanitizePercent(smoothingPercent) / 100
    }
  }, [smoothBrushStroke, streamlinePercent, smoothingPercent])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }

    renderDrawingSurface(ctx, {
      width: canvas.width,
      height: canvas.height,
      sourceImage,
      strokes: combinedStrokes
    })
  }, [combinedStrokes, sourceImage])

  const syncBrushPreviewRadius = useCallback((nextBrushSize: number) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const scale = Math.max(rect.width / Math.max(canvas.width, 1), 0.0001)
    const nextRadius = Math.max(1, (nextBrushSize * scale) / 2)

    setBrushPreview((previous) => {
      if (!previous) {
        return previous
      }

      if (Math.abs(previous.radius - nextRadius) < 0.01) {
        return previous
      }

      return {
        ...previous,
        radius: nextRadius
      }
    })
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setTool("brush")
    setBrushSizeByTool({ ...DEFAULT_BRUSH_SIZE_BY_TOOL })
    setColor("#0f172a")
    setStrokes([])
    setActiveStroke(null)
    setIsDrawing(false)
    setBrushPreview(null)
    setSourceImage(null)
    setHasClearedSource(false)
    setCanvasSize({ ...DEFAULT_CANVAS_SIZE })
    setSmoothBrushStroke(true)
    setStreamlinePercent(DEFAULT_STREAMLINE_PERCENT)
    setSmoothingPercent(DEFAULT_SMOOTHING_PERCENT)
    setSuggestedName(normalizeSuggestedName(initialSuggestedName))
  }, [initialSuggestedName, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!sourceImageUrl) {
      setSourceImage(null)
      setHasClearedSource(false)
      setCanvasSize({ ...DEFAULT_CANVAS_SIZE })
      return
    }

    let cancelled = false
    const image = new window.Image()

    image.onload = () => {
      if (cancelled) {
        return
      }

      setSourceImage(image)
      setHasClearedSource(false)
      setCanvasSize({
        width: Math.max(1, image.naturalWidth),
        height: Math.max(1, image.naturalHeight)
      })
    }

    image.onerror = () => {
      if (cancelled) {
        return
      }

      setSourceImage(null)
      setCanvasSize({ ...DEFAULT_CANVAS_SIZE })
    }

    image.src = sourceImageUrl

    return () => {
      cancelled = true
    }
  }, [isOpen, sourceImageUrl])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  const updateBrushSizeForActiveTool = useCallback(
    (next: number) => {
      const clamped = Math.max(
        MIN_BRUSH_SIZE,
        Math.min(MAX_BRUSH_SIZE, Math.round(next))
      )

      setBrushSizeByTool((current) => ({
        ...current,
        [tool]: clamped
      }))

      syncBrushPreviewRadius(clamped)
    },
    [syncBrushPreviewRadius, tool]
  )

  const beginStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      setBrushPreview(toBrushPreview(canvas, event, activeBrushSize))

      const point = toLocalCanvasPoint(canvas, event)
      const stroke: Stroke = {
        tool,
        color,
        size: activeBrushSize,
        points: [point],
        smoothing: tool === "brush" ? brushSmoothingSettings : undefined
      }

      setActiveStroke(stroke)
      setIsDrawing(true)
      canvas.setPointerCapture(event.pointerId)
    },
    [activeBrushSize, brushSmoothingSettings, color, tool]
  )

  const continueStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      setBrushPreview(toBrushPreview(canvas, event, activeBrushSize))

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
    },
    [activeBrushSize, isDrawing]
  )

  const finishStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) {
        return
      }

      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      canvas.releasePointerCapture(event.pointerId)
      setBrushPreview(toBrushPreview(canvas, event, activeBrushSize))
      setIsDrawing(false)

      setActiveStroke((current) => {
        if (!current || current.points.length < 2) {
          return null
        }

        setStrokes((previous) => [...previous, current])
        return null
      })
    },
    [activeBrushSize, isDrawing]
  )

  const handleUndo = useCallback(() => {
    setActiveStroke(null)
    setStrokes((previous) => previous.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setActiveStroke(null)
    setStrokes([])

    if (sourceImage) {
      setSourceImage(null)
      setHasClearedSource(true)
    }
  }, [sourceImage])

  const increaseBrushSize = useCallback(() => {
    updateBrushSizeForActiveTool(activeBrushSize + BRUSH_SIZE_STEP)
  }, [activeBrushSize, updateBrushSizeForActiveTool])

  const decreaseBrushSize = useCallback(() => {
    updateBrushSizeForActiveTool(activeBrushSize - BRUSH_SIZE_STEP)
  }, [activeBrushSize, updateBrushSizeForActiveTool])

  useEffect(() => {
    syncBrushPreviewRadius(activeBrushSize)
  }, [activeBrushSize, syncBrushPreviewRadius])

  useShortcutActions(
    [
      {
        actionId: "pattern.draw.decrease_brush_size",
        enabled: isOpen,
        handler: () => decreaseBrushSize()
      },
      {
        actionId: "pattern.draw.increase_brush_size",
        enabled: isOpen,
        handler: () => increaseBrushSize()
      },
      {
        actionId: "pattern.draw.undo",
        enabled: isOpen,
        handler: () => handleUndo()
      },
      {
        actionId: "pattern.draw.clear",
        enabled: isOpen,
        handler: () => handleClear()
      }
    ],
    isOpen
  )

  const handleSave = useCallback(async () => {
    const blob = await createTransparentTrimmedBlob({
      width: canvasSize.width,
      height: canvasSize.height,
      sourceImage,
      strokes: combinedStrokes
    })

    if (!blob) {
      return
    }

    onSave({
      blob,
      suggestedName: normalizeSuggestedName(suggestedName)
    })
  }, [
    canvasSize.height,
    canvasSize.width,
    combinedStrokes,
    onSave,
    sourceImage,
    suggestedName
  ])

  const handleManualClose = useCallback(() => {
    if (hasUndoHistory) {
      const confirmed = window.confirm(
        "You have unsaved drawing progress. Close without saving?"
      )
      if (!confirmed) {
        return
      }
    }

    onClose()
  }, [hasUndoHistory, onClose])

  const saveButtonLabel = mode === "edit" ? "Update Asset" : "Save As Asset"

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
            Sketch directly in-browser. Saved output is auto-trimmed transparent
            PNG.
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/20 p-3">
            <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc),linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc)] dark:bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a),linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="w-full h-auto rounded-lg touch-none cursor-none"
                onPointerDown={beginStroke}
                onPointerMove={continueStroke}
                onPointerUp={finishStroke}
                onPointerCancel={finishStroke}
                onPointerEnter={(event) => {
                  const canvas = canvasRef.current
                  if (!canvas) {
                    return
                  }

                  setBrushPreview(
                    toBrushPreview(canvas, event, activeBrushSize)
                  )
                }}
                onPointerLeave={() => {
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
            <TextInput
              label="Asset Name"
              value={suggestedName}
              onChange={setSuggestedName}
              placeholder="drawn-asset"
              maxLength={80}
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tool === "brush" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTool("brush")}
                className="w-full">
                <Brush size={14} />
                Brush
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

            {tool === "brush" && (
              <div className="space-y-2">
                <CheckboxCard
                  title="Smooth Brush Stroke"
                  subtitle={smoothBrushStroke ? "Enabled" : "Disabled"}
                  checked={smoothBrushStroke}
                  onChange={setSmoothBrushStroke}
                  tooltipLabel="Curve Smoothing"
                  tooltipContent="Enable perfect-freehand smoothing for cleaner curves and less jitter."
                  className="px-2 py-1.5"
                />

                {smoothBrushStroke && (
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label="Streamline"
                      value={sanitizePercent(streamlinePercent)}
                      min={0}
                      max={100}
                      step={1}
                      onChangeValue={(value) =>
                        setStreamlinePercent(sanitizePercent(value))
                      }
                    />
                    <NumberInput
                      label="Smoothing"
                      value={sanitizePercent(smoothingPercent)}
                      min={0}
                      max={100}
                      step={1}
                      onChangeValue={(value) =>
                        setSmoothingPercent(sanitizePercent(value))
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {tool === "brush" && (
              <ColorPickerPopover
                label="Brush Color"
                value={color}
                onChange={setColor}
                enableGradient={false}
                enableAlpha={false}
                outputMode="hex"
              />
            )}

            <div className="space-y-3">
              <NumberInput
                label="Brush Size"
                tooltipLabel="Brush Size Shortcuts"
                tooltipContent={brushSizeTooltipContent}
                value={activeBrushSize}
                min={MIN_BRUSH_SIZE}
                max={MAX_BRUSH_SIZE}
                step={BRUSH_SIZE_STEP}
                onChangeValue={updateBrushSizeForActiveTool}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Tooltip
                label={`Undo (${getShortcutLabel("pattern.draw.undo")})`}
                content="Revert the most recent stroke."
                variant="nowrap">
                <span className="block">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUndo}
                    disabled={strokes.length === 0}
                    className="w-full">
                    <RotateCcw size={14} />
                    Undo
                  </Button>
                </span>
              </Tooltip>

              <Tooltip
                label={`Clear (${getShortcutLabel("pattern.draw.clear")})`}
                content="Clear the source layer and all drawn strokes."
                variant="nowrap">
                <span className="block">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClear}
                    disabled={!hasContent}
                    className="w-full">
                    <Trash2 size={14} />
                    Clear
                  </Button>
                </span>
              </Tooltip>
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
            {saveButtonLabel}
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}
