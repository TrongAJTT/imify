import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect, Transformer } from "react-konva"
import type Konva from "konva"

import type { FillingTemplate, SymmetricParams } from "@/features/filling/types"
import { DEFAULT_SYMMETRIC_PARAMS } from "@/features/filling/types"
import {
  buildSymmetricShapePolygon,
  deriveSymmetricLayoutMetrics,
  generateSymmetricLayers,
  type SymmetricLayoutMetrics,
} from "@/features/filling/symmetric-generator"
import { flattenPoints, getBoundingBox } from "@/features/filling/vector-math"
import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import { Button } from "@/options/components/ui/button"
import { VisualHelpTooltip } from "@/options/components/ui/visual-help-tooltip"
import symmetricVisualEditorVideo from "url:assets/features/symmetric_generator-visual_editor.mp4"
import { Save } from "lucide-react"

const CANVAS_PADDING = 40
const FIRST_CONTROL_ID = "first_axis_first_shape"
const SECOND_CONTROL_ID = "first_axis_second_shape"
const THIRD_CONTROL_ID = "second_axis_first_shape"

type SymmetricControlId =
  | typeof FIRST_CONTROL_ID
  | typeof SECOND_CONTROL_ID
  | typeof THIRD_CONTROL_ID

interface SymmetricControl {
  id: SymmetricControlId
  axisIndex: number
  shapeIndex: number
  bounds: { x: number; y: number; width: number; height: number }
}

interface WorldRect {
  x: number
  y: number
  width: number
  height: number
}

function buildControl(
  metrics: SymmetricLayoutMetrics,
  id: SymmetricControlId,
  axisIndex: number,
  shapeIndex: number
): SymmetricControl {
  const polygon = buildSymmetricShapePolygon(metrics, axisIndex, shapeIndex)
  const bounds = getBoundingBox(polygon)

  return {
    id,
    axisIndex,
    shapeIndex,
    bounds,
  }
}

function toWorldRect(
  node: Konva.Rect,
  offsetX: number,
  offsetY: number,
  renderScale: number
): WorldRect {
  const width = Math.max(1, node.width() * Math.abs(node.scaleX()))
  const height = Math.max(1, node.height() * Math.abs(node.scaleY()))

  return {
    x: (node.x() - offsetX) / renderScale,
    y: (node.y() - offsetY) / renderScale,
    width: width / renderScale,
    height: height / renderScale,
  }
}

function scaleLength(value: number, factor: number): number {
  if (value <= 0) {
    return 0
  }

  return Math.max(1, Math.round(value * factor))
}

interface SymmetricWorkspaceProps {
  template: FillingTemplate
  onRefresh: () => Promise<void>
}

export function SymmetricWorkspace({ template, onRefresh }: SymmetricWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [params, setParams] = useState<SymmetricParams>({ ...DEFAULT_SYMMETRIC_PARAMS })
  const [selectedControlId, setSelectedControlId] = useState<SymmetricControlId | null>(null)
  const [isFreeAspectRatio, setIsFreeAspectRatio] = useState(false)
  const [cursor, setCursor] = useState("default")
  const navigateToSelect = useFillingStore((s) => s.navigateToSelect)
  const updateTemplate = useFillingStore((s) => s.updateTemplate)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setStageSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.max(400, Math.floor(entry.contentRect.height)),
        })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        setIsFreeAspectRatio(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        setIsFreeAspectRatio(false)
      }
    }

    const handleBlur = () => {
      setIsFreeAspectRatio(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])

  const generatedLayers = useMemo(
    () => generateSymmetricLayers(params, template.canvasWidth, template.canvasHeight),
    [params, template.canvasWidth, template.canvasHeight]
  )

  const layoutMetrics = useMemo(
    () => deriveSymmetricLayoutMetrics(params),
    [params]
  )

  const controls = useMemo(() => {
    const nextControls: SymmetricControl[] = [
      buildControl(layoutMetrics, FIRST_CONTROL_ID, 0, 0),
      buildControl(layoutMetrics, SECOND_CONTROL_ID, 0, 1),
    ]

    if (layoutMetrics.axisCount >= 2) {
      nextControls.push(buildControl(layoutMetrics, THIRD_CONTROL_ID, 1, 0))
    }

    return nextControls
  }, [layoutMetrics])

  const controlMap = useMemo(
    () => new Map(controls.map((control) => [control.id, control])),
    [controls]
  )

  const selectedControl = selectedControlId ? controlMap.get(selectedControlId) ?? null : null

  useEffect(() => {
    if (selectedControlId && !controlMap.has(selectedControlId)) {
      setSelectedControlId(null)
    }
  }, [controlMap, selectedControlId])

  const scale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2
    const availH = stageSize.height - CANVAS_PADDING * 2
    return Math.min(1, availW / template.canvasWidth, availH / template.canvasHeight)
  }, [stageSize, template.canvasWidth, template.canvasHeight])

  const offsetX = (stageSize.width - template.canvasWidth * scale) / 2
  const offsetY = (stageSize.height - template.canvasHeight * scale) / 2

  useEffect(() => {
    const transformer = transformerRef.current
    const stage = stageRef.current
    if (!transformer || !stage) {
      return
    }

    if (selectedControlId === FIRST_CONTROL_ID) {
      const node = stage.findOne(`#sym-control-${FIRST_CONTROL_ID}`)
      if (node) {
        transformer.nodes([node])
        transformer.keepRatio(!isFreeAspectRatio)
        transformer.rotateEnabled(false)
        transformer.enabledAnchors(["top-left", "top-right", "bottom-left", "bottom-right"])
        transformer.getLayer()?.batchDraw()
        return
      }
    }

    transformer.nodes([])
    transformer.getLayer()?.batchDraw()
  }, [controls, isFreeAspectRatio, selectedControlId])

  const applyFirstControlRect = useCallback((worldRect: WorldRect, includeResize: boolean) => {
    setParams((prev) => {
      const metrics = deriveSymmetricLayoutMetrics(prev)
      const next: SymmetricParams = { ...prev }

      if (metrics.isHorizontal) {
        next.firstShapePosition = Math.round(worldRect.x - metrics.parallelMinAdjust)
        next.firstAxisPosition = Math.round(worldRect.y)
      } else {
        next.firstShapePosition = Math.round(worldRect.y - metrics.parallelMinAdjust)
        next.firstAxisPosition = Math.round(worldRect.x)
      }

      if (includeResize) {
        const newSideLength = metrics.isHorizontal ? worldRect.height : worldRect.width
        const newParallelSpan = metrics.isHorizontal ? worldRect.width : worldRect.height
        const parallelScale = newParallelSpan / Math.max(1, metrics.parallelSpan)

        next.sideLength = Math.max(1, Math.round(newSideLength))
        next.baseLength = scaleLength(metrics.baseLength, parallelScale)
        next.oppositeBaseLength = scaleLength(metrics.oppositeBaseLength, parallelScale)
      }

      return next
    })
  }, [])

  const applySecondControlRect = useCallback((worldRect: WorldRect) => {
    setParams((prev) => {
      const metrics = deriveSymmetricLayoutMetrics(prev)
      const draggedShapeStart =
        (metrics.isHorizontal ? worldRect.x : worldRect.y) - metrics.parallelMinAdjust
      const signedStride =
        metrics.shapeOrderSign * (draggedShapeStart - metrics.firstShapePosition)

      return {
        ...prev,
        shapeSpacing: Math.max(0, Math.round(signedStride - metrics.parallelSpan)),
      }
    })
  }, [])

  const applyThirdControlRect = useCallback((worldRect: WorldRect) => {
    setParams((prev) => {
      const metrics = deriveSymmetricLayoutMetrics(prev)
      const draggedShapeStart =
        (metrics.isHorizontal ? worldRect.x : worldRect.y) - metrics.parallelMinAdjust
      const draggedAxisOffset = metrics.isHorizontal ? worldRect.y : worldRect.x
      const signedAxisStride =
        metrics.axisOrderSign * (draggedAxisOffset - metrics.firstAxisPosition)

      return {
        ...prev,
        oddEvenOffset: Math.round(draggedShapeStart - metrics.firstShapePosition),
        axisSpacing: Math.max(0, Math.round(signedAxisStride - metrics.sideLength)),
      }
    })
  }, [])

  const handleStageClick = useCallback((event: Konva.KonvaEventObject<MouseEvent>) => {
    if (event.target === event.target.getStage()) {
      setSelectedControlId(null)
    }
  }, [])

  const handleSave = useCallback(async () => {
    const updated: FillingTemplate = {
      ...template,
      layers: generatedLayers,
      updatedAt: Date.now(),
    }
    await templateStorage.save(updated)
    updateTemplate(updated)
    await onRefresh()
    navigateToSelect()
  }, [template, generatedLayers, updateTemplate, onRefresh, navigateToSelect])

  // Expose params to sidebar via store (simple approach using window)
  useEffect(() => {
    (window as any).__symmetricParams = params;
    (window as any).__setSymmetricParams = setParams;
    (window as any).__symmetricLayerCount = generatedLayers.length
    return () => {
      delete (window as any).__symmetricParams
      delete (window as any).__setSymmetricParams
      delete (window as any).__symmetricLayerCount
    }
  }, [params, generatedLayers.length])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Subheading>Symmetric Generator</Subheading>
            <VisualHelpTooltip
              label="Visual editing tips"
              description="You can adjust size and spacing visually using the first two components on the first main axis, and the first component on the second main axis."
              mp4Src={symmetricVisualEditorVideo}
              buttonAriaLabel="Symmetric Generator visual editor help"
              mediaAlt="Symmetric Generator visual editor"
            />
          </div>
          <MutedText className="text-xs mt-0.5">
            {generatedLayers.length} shape{generatedLayers.length !== 1 ? "s" : ""} generated
            &middot; {template.canvasWidth} x {template.canvasHeight} px
          </MutedText>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave}>
          <Save size={14} />
          Save Template
        </Button>
      </div>

      <div
        ref={containerRef}
        className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        style={{ minHeight: 400, cursor }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            <Rect
              x={offsetX}
              y={offsetY}
              width={template.canvasWidth * scale}
              height={template.canvasHeight * scale}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={1}
              listening={false}
            />

            {generatedLayers.map((layer) => {
              const flat = flattenPoints(layer.points).map((v) => v * scale)
              return (
                <Line
                  key={layer.id}
                  points={flat}
                  x={offsetX + layer.x * scale}
                  y={offsetY + layer.y * scale}
                  closed
                  fill="rgba(59, 130, 246, 0.12)"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  listening={false}
                />
              )
            })}

            {controls.map((control) => {
              const stageX = offsetX + control.bounds.x * scale
              const stageY = offsetY + control.bounds.y * scale
              const stageWidth = Math.max(8, control.bounds.width * scale)
              const stageHeight = Math.max(8, control.bounds.height * scale)
              const isSelected = selectedControlId === control.id

              return (
                <Rect
                  key={control.id}
                  id={`sym-control-${control.id}`}
                  name="sym-control-node"
                  x={stageX}
                  y={stageY}
                  width={stageWidth}
                  height={stageHeight}
                  fill="rgba(14, 165, 233, 0.001)"
                  stroke={isSelected ? "#0ea5e9" : undefined}
                  strokeWidth={isSelected ? 2 : 0}
                  dash={isSelected ? [6, 4] : undefined}
                  draggable={isSelected}
                  dragBoundFunc={(position) => {
                    if (control.id !== SECOND_CONTROL_ID) {
                      return position
                    }

                    if (layoutMetrics.isHorizontal) {
                      return { x: position.x, y: stageY }
                    }

                    return { x: stageX, y: position.y }
                  }}
                  onClick={(event) => {
                    event.cancelBubble = true
                    setSelectedControlId(control.id)
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true
                    setSelectedControlId(control.id)
                  }}
                  onMouseEnter={() => {
                    setCursor(isSelected ? "grab" : "pointer")
                  }}
                  onMouseLeave={() => {
                    setCursor("default")
                  }}
                  onDragStart={() => {
                    setCursor("grabbing")
                  }}
                  onDragMove={(event) => {
                    const worldRect = toWorldRect(
                      event.target as Konva.Rect,
                      offsetX,
                      offsetY,
                      scale
                    )

                    if (control.id === FIRST_CONTROL_ID) {
                      applyFirstControlRect(worldRect, false)
                      return
                    }

                    if (control.id === SECOND_CONTROL_ID) {
                      applySecondControlRect(worldRect)
                      return
                    }

                    applyThirdControlRect(worldRect)
                  }}
                  onDragEnd={(event) => {
                    const worldRect = toWorldRect(
                      event.target as Konva.Rect,
                      offsetX,
                      offsetY,
                      scale
                    )

                    if (control.id === FIRST_CONTROL_ID) {
                      applyFirstControlRect(worldRect, false)
                    } else if (control.id === SECOND_CONTROL_ID) {
                      applySecondControlRect(worldRect)
                    } else {
                      applyThirdControlRect(worldRect)
                    }

                    setCursor("grab")
                  }}
                  onTransformStart={() => {
                    if (control.id === FIRST_CONTROL_ID) {
                      setCursor("nwse-resize")
                    }
                  }}
                  onTransformEnd={(event) => {
                    if (control.id !== FIRST_CONTROL_ID) {
                      return
                    }

                    const node = event.target as Konva.Rect
                    const worldRect = toWorldRect(node, offsetX, offsetY, scale)
                    applyFirstControlRect(worldRect, true)

                    node.scaleX(1)
                    node.scaleY(1)
                    setCursor("grab")
                  }}
                />
              )
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              keepRatio={!isFreeAspectRatio}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                  return oldBox
                }

                return newBox
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
