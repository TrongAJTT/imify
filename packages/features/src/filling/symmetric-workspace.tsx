"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect, Transformer } from "react-konva"
import type Konva from "konva"
import { Save } from "lucide-react"
import { Button } from "@imify/ui/ui/button"
import { MutedText, Subheading } from "@imify/ui/ui/typography"
import { VisualHelpTooltip } from "@imify/ui/ui/visual-help-tooltip"
import { templateStorage } from "./template-storage"
import { SYMMETRIC_VISUAL_HELP_TOOLTIPS } from "./symmetric-tooltips"
import type { FillingTemplate, SymmetricParams } from "./types"
import { DEFAULT_SYMMETRIC_PARAMS } from "./types"
import { useTransformGuides, type RectBounds } from "./use-transform-guides"
import {
  buildSymmetricShapePolygon,
  deriveSymmetricLayoutMetrics,
  generateSymmetricLayers,
  type SymmetricLayoutMetrics,
} from "./symmetric-generator"
import { flattenPoints, getBoundingBox } from "./vector-math"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { FEATURE_MEDIA_ASSETS } from "../shared/media-assets"

const CANVAS_PADDING = 40
const FIRST_CONTROL_ID = "first_axis_first_shape"
const SECOND_CONTROL_ID = "first_axis_second_shape"
const THIRD_CONTROL_ID = "second_axis_first_shape"

type SymmetricControlId = typeof FIRST_CONTROL_ID | typeof SECOND_CONTROL_ID | typeof THIRD_CONTROL_ID

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

function buildControl(metrics: SymmetricLayoutMetrics, id: SymmetricControlId, axisIndex: number, shapeIndex: number): SymmetricControl {
  const polygon = buildSymmetricShapePolygon(metrics, axisIndex, shapeIndex)
  const bounds = getBoundingBox(polygon)

  return {
    id,
    axisIndex,
    shapeIndex,
    bounds,
  }
}

function toWorldRect(node: Konva.Rect, offsetX: number, offsetY: number, renderScale: number): WorldRect {
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.closest('input, textarea, select, [contenteditable="true"]') !== null
  )
}

interface SymmetricWorkspaceProps {
  template: FillingTemplate
  onRefresh: () => Promise<void>
  onSaved?: (template: FillingTemplate) => void | Promise<void>
}

export function SymmetricWorkspace({ template, onRefresh, onSaved }: SymmetricWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const params = useFillingStore((state) => state.symmetricParams)
  const [selectedControlId, setSelectedControlId] = useState<SymmetricControlId | null>(null)
  const [isFreeAspectRatio, setIsFreeAspectRatio] = useState(false)
  const [cursor, setCursor] = useState("default")
  const [positionGuideLines, setPositionGuideLines] = useState<number[][]>([])
  const updateTemplate = useFillingStore((state) => state.updateTemplate)
  const setSymmetricParams = useFillingStore((state) => state.setSymmetricParams)
  const setSymmetricLayerCount = useFillingStore((state) => state.setSymmetricLayerCount)
  const { snapRectPosition } = useTransformGuides({
    positionTolerance: 8,
  })

  useEffect(() => {
    setSymmetricParams(template.symmetricParams ?? { ...DEFAULT_SYMMETRIC_PARAMS })
  }, [setSymmetricParams, template.id, template.symmetricParams])

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
        return
      }

      const isArrowKey =
        event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight"
      if (!isArrowKey || !selectedControlId || isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()

      const step = event.shiftKey ? 10 : 1
      const deltaX = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0
      const deltaY = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0

      if (deltaX === 0 && deltaY === 0) {
        return
      }

      setSymmetricParams((previous) => {
        const metrics = deriveSymmetricLayoutMetrics(previous)

        if (selectedControlId === FIRST_CONTROL_ID) {
          if (metrics.isHorizontal) {
            return {
              ...previous,
              firstShapePosition: previous.firstShapePosition + deltaX,
              firstAxisPosition: previous.firstAxisPosition + deltaY,
            }
          }

          return {
            ...previous,
            firstShapePosition: previous.firstShapePosition + deltaY,
            firstAxisPosition: previous.firstAxisPosition + deltaX,
          }
        }

        if (selectedControlId === SECOND_CONTROL_ID) {
          const appearanceDelta = metrics.isHorizontal ? deltaX : deltaY
          return {
            ...previous,
            shapeSpacing: Math.max(0, previous.shapeSpacing + metrics.shapeOrderSign * appearanceDelta),
          }
        }

        const appearanceDelta = metrics.isHorizontal ? deltaX : deltaY
        const axisDelta = metrics.isHorizontal ? deltaY : deltaX
        return {
          ...previous,
          oddEvenOffset: previous.oddEvenOffset + appearanceDelta,
          axisSpacing: Math.max(0, previous.axisSpacing + metrics.axisOrderSign * axisDelta),
        }
      })
      setPositionGuideLines([])
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
  }, [selectedControlId, setSymmetricParams])

  const generatedLayers = useMemo(
    () => generateSymmetricLayers(params, template.canvasWidth, template.canvasHeight),
    [params, template.canvasHeight, template.canvasWidth]
  )

  useEffect(() => {
    setSymmetricParams(params)
    setSymmetricLayerCount(generatedLayers.length)
  }, [generatedLayers.length, params, setSymmetricLayerCount, setSymmetricParams])

  const layoutMetrics = useMemo(() => deriveSymmetricLayoutMetrics(params), [params])

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

  const controlMap = useMemo(() => new Map(controls.map((control) => [control.id, control])), [controls])

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
  }, [stageSize, template.canvasHeight, template.canvasWidth])

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
    setSymmetricParams((previous) => {
      const metrics = deriveSymmetricLayoutMetrics(previous)
      const next: SymmetricParams = { ...previous }

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
  }, [setSymmetricParams])

  const applySecondControlRect = useCallback((worldRect: WorldRect) => {
    setSymmetricParams((previous) => {
      const metrics = deriveSymmetricLayoutMetrics(previous)
      const draggedShapeStart = (metrics.isHorizontal ? worldRect.x : worldRect.y) - metrics.parallelMinAdjust
      const signedStride = metrics.shapeOrderSign * (draggedShapeStart - metrics.firstShapePosition)

      return {
        ...previous,
        shapeSpacing: Math.max(0, Math.round(signedStride - metrics.parallelSpan)),
      }
    })
  }, [setSymmetricParams])

  const applyThirdControlRect = useCallback((worldRect: WorldRect) => {
    setSymmetricParams((previous) => {
      const metrics = deriveSymmetricLayoutMetrics(previous)
      const draggedShapeStart = (metrics.isHorizontal ? worldRect.x : worldRect.y) - metrics.parallelMinAdjust
      const draggedAxisOffset = metrics.isHorizontal ? worldRect.y : worldRect.x
      const signedAxisStride = metrics.axisOrderSign * (draggedAxisOffset - metrics.firstAxisPosition)

      return {
        ...previous,
        oddEvenOffset: Math.round(draggedShapeStart - metrics.firstShapePosition),
        axisSpacing: Math.max(0, Math.round(signedAxisStride - metrics.sideLength)),
      }
    })
  }, [setSymmetricParams])

  const handleStageClick = useCallback((event: Konva.KonvaEventObject<MouseEvent>) => {
    if (event.target === event.target.getStage()) {
      setSelectedControlId(null)
      setPositionGuideLines([])
    }
  }, [])

  const handleSave = useCallback(async () => {
    const updated: FillingTemplate = {
      ...template,
      layers: generatedLayers,
      symmetricParams: params,
      updatedAt: Date.now(),
    }
    await templateStorage.save(updated)
    updateTemplate(updated)
    await onRefresh()
    if (onSaved) {
      await onSaved(updated)
    }
  }, [generatedLayers, onRefresh, onSaved, params, template, updateTemplate])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const synced: FillingTemplate = {
        ...template,
        layers: generatedLayers,
        symmetricParams: params,
        updatedAt: Date.now(),
      }
      updateTemplate(synced)
      void templateStorage.save(synced)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [generatedLayers, params, template, updateTemplate])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Subheading>Symmetric Generator</Subheading>
            <VisualHelpTooltip
              label={SYMMETRIC_VISUAL_HELP_TOOLTIPS.label}
              description={SYMMETRIC_VISUAL_HELP_TOOLTIPS.description}
              webmSrc={FEATURE_MEDIA_ASSETS.filling.symmetricVisualEditorWebm}
              buttonAriaLabel={SYMMETRIC_VISUAL_HELP_TOOLTIPS.buttonAriaLabel}
              mediaAlt={SYMMETRIC_VISUAL_HELP_TOOLTIPS.mediaAlt}
            />
          </div>
          <MutedText className="mt-0.5 text-xs">
            {generatedLayers.length} shape{generatedLayers.length !== 1 ? "s" : ""} generated &middot; {template.canvasWidth} x{" "}
            {template.canvasHeight} px
          </MutedText>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave}>
          <Save size={14} />
          Save Template
        </Button>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50"
        style={{ minHeight: 400, cursor }}
      >
        <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} onClick={handleStageClick} onTap={handleStageClick}>
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
              const flat = flattenPoints(layer.points).map((value) => value * scale)
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
                    setPositionGuideLines([])
                  }}
                  onDragMove={(event) => {
                    const movingWorldRect = toWorldRect(event.target as Konva.Rect, offsetX, offsetY, scale)
                    const candidateRects = controls
                      .filter((candidate) => candidate.id !== control.id)
                      .map((candidate) => candidate.bounds as RectBounds)
                    const { snappedRect, guides } = snapRectPosition({
                      movingRect: movingWorldRect,
                      candidateRects,
                      canvasRect: { x: 0, y: 0, width: template.canvasWidth, height: template.canvasHeight } as RectBounds,
                    })

                    const constrainedRect =
                      control.id === SECOND_CONTROL_ID
                        ? layoutMetrics.isHorizontal
                          ? { ...snappedRect, y: movingWorldRect.y }
                          : { ...snappedRect, x: movingWorldRect.x }
                        : snappedRect

                    const deltaX = constrainedRect.x - movingWorldRect.x
                    const deltaY = constrainedRect.y - movingWorldRect.y

                    if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
                      event.target.x(event.target.x() + deltaX * scale)
                      event.target.y(event.target.y() + deltaY * scale)
                    }

                    const stageGuides = guides.map((guide) => {
                      if (guide.orientation === "vertical") {
                        const x = offsetX + guide.value * scale
                        return [x, offsetY, x, offsetY + template.canvasHeight * scale]
                      }
                      const y = offsetY + guide.value * scale
                      return [offsetX, y, offsetX + template.canvasWidth * scale, y]
                    })
                    setPositionGuideLines(stageGuides)

                    if (control.id === FIRST_CONTROL_ID) {
                      applyFirstControlRect(constrainedRect, false)
                      return
                    }

                    if (control.id === SECOND_CONTROL_ID) {
                      applySecondControlRect(constrainedRect)
                      return
                    }

                    applyThirdControlRect(constrainedRect)
                  }}
                  onDragEnd={(event) => {
                    const worldRect = toWorldRect(event.target as Konva.Rect, offsetX, offsetY, scale)

                    if (control.id === FIRST_CONTROL_ID) {
                      applyFirstControlRect(worldRect, false)
                    } else if (control.id === SECOND_CONTROL_ID) {
                      applySecondControlRect(worldRect)
                    } else {
                      applyThirdControlRect(worldRect)
                    }

                    setCursor("grab")
                    setPositionGuideLines([])
                  }}
                  onTransformStart={() => {
                    if (control.id === FIRST_CONTROL_ID) {
                      setCursor("nwse-resize")
                    }
                    setPositionGuideLines([])
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
                    setPositionGuideLines([])
                  }}
                />
              )
            })}

            {positionGuideLines.map((points, index) => (
              <Line
                key={`symmetric-position-guide-${index}`}
                points={points}
                stroke="rgba(14, 165, 233, 0.9)"
                strokeWidth={1.2}
                dash={[6, 6]}
                listening={false}
                perfectDrawEnabled={false}
              />
            ))}

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
