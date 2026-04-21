import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect, Transformer } from "react-konva"
import type Konva from "konva"
import { Loader2, Save } from "lucide-react"

import type { LayerGroup, VectorLayer } from "@/features/filling/types"
import { resolveLayerShapePoints } from "@/features/filling/shape-generators"
import {
  buildGroupOverlayPolygons,
  getBoundsFromPoints,
  toWorldLayerPoints,
} from "@/features/filling/group-geometry"
import { flattenPoints } from "@/features/filling/vector-math"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import { useTransformGuides, type RectBounds } from "@/options/hooks/use-transform-guides"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import { Button } from "@/options/components/ui/button"
import { ZoomPanControl } from "@/options/components/ui/zoom-pan-control"
import { VisualHelpTooltip } from "@/options/components/ui/visual-help-tooltip"
import manualEditorMultiSelectVideo from "url:assets/features/image_filling_manual-visual_multi_select.webm"
import {
  PreviewInteractionModeToggle,
  type PreviewInteractionMode,
} from "@/options/components/ui/preview-interaction-mode-toggle"

interface ManualEditorWorkspaceProps {
  canvasWidth: number
  canvasHeight: number
  groups: LayerGroup[]
  layers: VectorLayer[]
  selectedLayerId: string | null
  selectedLayerIds: string[]
  onSelectLayer: (id: string | null) => void
  onToggleLayerSelection: (id: string) => void
  onSetSelectedLayers: (ids: string[]) => void
  onClearSelection: () => void
  onUpdateLayer: (id: string, partial: Partial<VectorLayer>) => void
  onSaveTemplate: () => Promise<void>
  isSavingTemplate: boolean
}

const CANVAS_PADDING = 40
const PREVIEW_MIN_ZOOM = 50
const PREVIEW_MAX_ZOOM = 800
const PREVIEW_ZOOM_STEP = 10

export function ManualEditorWorkspace({
  canvasWidth,
  canvasHeight,
  groups,
  layers,
  selectedLayerId,
  selectedLayerIds,
  onSelectLayer,
  onToggleLayerSelection,
  onSetSelectedLayers,
  onClearSelection,
  onUpdateLayer,
  onSaveTemplate,
  isSavingTemplate,
}: ManualEditorWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const ignoreNextStageClickRef = useRef(false)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [previewContainerHeight, setPreviewContainerHeight] = useState(520)
  const [previewZoom, setPreviewZoom] = useState(100)
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 })
  const [previewInteractionMode, setPreviewInteractionMode] =
    useState<PreviewInteractionMode>("zoom")
  const [isResizingPreview, setIsResizingPreview] = useState(false)
  const [isFreeAspectRatio, setIsFreeAspectRatio] = useState(false)
  const [cursor, setCursor] = useState("default")
  const [rotationGuideLine, setRotationGuideLine] = useState<number[] | null>(null)
  const [positionGuideLines, setPositionGuideLines] = useState<number[][]>([])
  const [selectionBoxStart, setSelectionBoxStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionBoxRect, setSelectionBoxRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const { getShortcutLabel } = useShortcutPreferences()
  const {
    rotationSnapAngles,
    getSnappedRotation,
    buildRotationGuideLine,
    snapRectPosition,
  } = useTransformGuides({
    rotationStep: 45,
    rotationTolerance: 4,
    positionTolerance: 8,
  })

  const clampPreviewZoom = useCallback((value: number) => {
    return Math.max(PREVIEW_MIN_ZOOM, Math.min(PREVIEW_MAX_ZOOM, Math.round(value)))
  }, [])

  useShortcutActions([
    {
      actionId: "global.preview.zoom_mode",
      handler: () => setPreviewInteractionMode("zoom"),
    },
    {
      actionId: "global.preview.pan_mode",
      handler: () => setPreviewInteractionMode("pan"),
    },
    {
      actionId: "global.preview.idle_mode",
      handler: () => setPreviewInteractionMode("idle"),
    },
  ])

  const fitScale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2
    const availH = stageSize.height - CANVAS_PADDING * 2
    return Math.min(1, availW / canvasWidth, availH / canvasHeight)
  }, [canvasHeight, canvasWidth, stageSize])

  const renderScale = fitScale * (previewZoom / 100)

  const offsetX = (stageSize.width - canvasWidth * renderScale) / 2 + previewPan.x
  const offsetY = (stageSize.height - canvasHeight * renderScale) / 2 + previewPan.y

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setStageSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.max(320, Math.floor(entry.contentRect.height)),
        })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const handlePreviewResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingPreview(true)
  }, [])

  useEffect(() => {
    if (!isResizingPreview) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const nextHeight = e.clientY - rect.top
      setPreviewContainerHeight(Math.max(320, Math.round(nextHeight)))
    }

    const handleMouseUp = () => {
      setIsResizingPreview(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingPreview])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        setIsFreeAspectRatio(true)
        if (transformerRef.current) {
          transformerRef.current.keepRatio(false)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey) {
        setIsFreeAspectRatio(false)
        if (transformerRef.current) {
          transformerRef.current.keepRatio(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const handlePreviewWheel = useCallback(
    (event: WheelEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[class*="pointer-events-auto"]')) {
        return
      }

      if (previewInteractionMode === "idle") {
        return
      }

      if (event.cancelable) {
        event.preventDefault()
      }

      if (previewInteractionMode === "pan") {
        const delta = event.deltaY > 0 ? 50 : -50
        if (event.shiftKey) {
          setPreviewPan((current) => ({ ...current, x: current.x - delta }))
        } else {
          setPreviewPan((current) => ({ ...current, y: current.y - delta }))
        }
        return
      }

      const oldZoom = previewZoom
      const nextZoom = clampPreviewZoom(oldZoom + (event.deltaY > 0 ? -PREVIEW_ZOOM_STEP : PREVIEW_ZOOM_STEP))
      if (nextZoom === oldZoom) return

      const oldRenderScale = fitScale * (oldZoom / 100)
      const newRenderScale = fitScale * (nextZoom / 100)
      if (oldRenderScale <= 0 || newRenderScale <= 0) {
        setPreviewZoom(nextZoom)
        return
      }

      const container = containerRef.current
      if (!container) {
        return
      }

      const rect = container.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top

      const baseOffsetOldX = (stageSize.width - canvasWidth * oldRenderScale) / 2
      const baseOffsetOldY = (stageSize.height - canvasHeight * oldRenderScale) / 2
      const worldX = (pointerX - baseOffsetOldX - previewPan.x) / oldRenderScale
      const worldY = (pointerY - baseOffsetOldY - previewPan.y) / oldRenderScale

      const baseOffsetNewX = (stageSize.width - canvasWidth * newRenderScale) / 2
      const baseOffsetNewY = (stageSize.height - canvasHeight * newRenderScale) / 2
      const nextPanX = pointerX - baseOffsetNewX - worldX * newRenderScale
      const nextPanY = pointerY - baseOffsetNewY - worldY * newRenderScale

      setPreviewZoom(nextZoom)
      setPreviewPan({
        x: Math.round(nextPanX * 100) / 100,
        y: Math.round(nextPanY * 100) / 100,
      })
    },
    [
      canvasHeight,
      canvasWidth,
      clampPreviewZoom,
      fitScale,
      previewInteractionMode,
      previewPan.x,
      previewPan.y,
      previewZoom,
      stageSize.height,
      stageSize.width,
    ]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const handleNativeWheel = (event: WheelEvent) => {
      handlePreviewWheel(event)
    }

    container.addEventListener("wheel", handleNativeWheel, { passive: false })

    return () => {
      container.removeEventListener("wheel", handleNativeWheel)
    }
  }, [handlePreviewWheel])

  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return

    if (selectedLayerId) {
      const node = stage.findOne(`#layer-${selectedLayerId}`)
      if (node) {
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
        return
      }
    }
    tr.nodes([])
    tr.getLayer()?.batchDraw()
  }, [selectedLayerId, layers])

  const toWorldPoint = useCallback((pointer: { x: number; y: number }) => ({
    x: (pointer.x - offsetX) / renderScale,
    y: (pointer.y - offsetY) / renderScale,
  }), [offsetX, renderScale])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (ignoreNextStageClickRef.current) {
        ignoreNextStageClickRef.current = false
        return
      }

      if (e.target === e.target.getStage()) {
        onClearSelection()
        setRotationGuideLine(null)
        setPositionGuideLines([])
      }
    },
    [onClearSelection]
  )

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage()) {
      return
    }

    if (selectedLayerIds.length > 0) {
      return
    }

    const pointer = e.target.getStage()?.getPointerPosition()
    if (!pointer) {
      return
    }

    const start = toWorldPoint(pointer)
    setSelectionBoxStart(start)
    setSelectionBoxRect({ x: start.x, y: start.y, width: 0, height: 0 })
  }, [selectedLayerIds.length, toWorldPoint])

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionBoxStart) {
      return
    }

    const pointer = e.target.getStage()?.getPointerPosition()
    if (!pointer) {
      return
    }

    const current = toWorldPoint(pointer)
    setSelectionBoxRect({
      x: Math.min(selectionBoxStart.x, current.x),
      y: Math.min(selectionBoxStart.y, current.y),
      width: Math.abs(current.x - selectionBoxStart.x),
      height: Math.abs(current.y - selectionBoxStart.y),
    })
  }, [selectionBoxStart, toWorldPoint])

  const handleStageMouseUp = useCallback(() => {
    if (!selectionBoxStart || !selectionBoxRect) {
      return
    }

    const hasDraggedSelectionBox = selectionBoxRect.width > 2 || selectionBoxRect.height > 2
    if (hasDraggedSelectionBox) {
      const rectRight = selectionBoxRect.x + selectionBoxRect.width
      const rectBottom = selectionBoxRect.y + selectionBoxRect.height
      const selectedIds = layers
        .filter((layer) => layer.visible)
        .filter((layer) => {
          const bounds = getBoundsFromPoints(toWorldLayerPoints(layer))
          return (
            bounds.x >= selectionBoxRect.x &&
            bounds.y >= selectionBoxRect.y &&
            bounds.x + bounds.width <= rectRight &&
            bounds.y + bounds.height <= rectBottom
          )
        })
        .map((layer) => layer.id)

      onSetSelectedLayers(selectedIds)
    }

    ignoreNextStageClickRef.current = hasDraggedSelectionBox

    setSelectionBoxStart(null)
    setSelectionBoxRect(null)
  }, [layers, onSetSelectedLayers, selectionBoxRect, selectionBoxStart])

  const handleDragEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target
      onUpdateLayer(layerId, {
        x: Math.round(((node.x() - offsetX) / renderScale) * 100) / 100,
        y: Math.round(((node.y() - offsetY) / renderScale) * 100) / 100,
      })
      setPositionGuideLines([])
      setCursor("grab")
    },
    [offsetX, offsetY, onUpdateLayer, renderScale]
  )

  const handleDragMove = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target
      const layer = layers.find((candidate) => candidate.id === layerId)
      if (!layer) {
        return
      }

      const draftLayer: VectorLayer = {
        ...layer,
        x: (node.x() - offsetX) / renderScale,
        y: (node.y() - offsetY) / renderScale,
      }

      const movingBounds = getBoundsFromPoints(toWorldLayerPoints(draftLayer))
      const candidateBounds = layers
        .filter((candidate) => candidate.id !== layerId && candidate.visible)
        .map((candidate) => getBoundsFromPoints(toWorldLayerPoints(candidate)))

      const { snappedRect, guides } = snapRectPosition({
        movingRect: movingBounds,
        candidateRects: candidateBounds,
        canvasRect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
      })

      const deltaX = snappedRect.x - movingBounds.x
      const deltaY = snappedRect.y - movingBounds.y
      if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
        node.x(node.x() + deltaX * renderScale)
        node.y(node.y() + deltaY * renderScale)
      }

      const stageGuides = guides.map((guide) => {
        if (guide.orientation === "vertical") {
          const x = offsetX + guide.value * renderScale
          return [
            x,
            offsetY,
            x,
            offsetY + canvasHeight * renderScale,
          ]
        }

        const y = offsetY + guide.value * renderScale
        return [
          offsetX,
          y,
          offsetX + canvasWidth * renderScale,
          y,
        ]
      })

      setPositionGuideLines(stageGuides)
    },
    [
      canvasHeight,
      canvasWidth,
      layers,
      offsetX,
      offsetY,
      renderScale,
      snapRectPosition,
    ]
  )

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target
      const snappedRotation = getSnappedRotation(node.rotation())

      if (!snappedRotation.snapped) {
        setRotationGuideLine(null)
        return
      }

      node.rotation(snappedRotation.rotation)

      const clientRect = node.getClientRect()
      const centerX = clientRect.x + clientRect.width / 2
      const centerY = clientRect.y + clientRect.height / 2
      const guideLength = Math.max(canvasWidth, canvasHeight) * renderScale

      setRotationGuideLine(
        buildRotationGuideLine(
          centerX,
          centerY,
          snappedRotation.snapAngle ?? snappedRotation.rotation,
          guideLength
        )
      )
    },
    [buildRotationGuideLine, canvasHeight, canvasWidth, getSnappedRotation, renderScale]
  )

  const handleTransformEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target
      const scaleXNode = node.scaleX()
      const scaleYNode = node.scaleY()

      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      onUpdateLayer(layerId, {
        x: Math.round(((node.x() - offsetX) / renderScale) * 100) / 100,
        y: Math.round(((node.y() - offsetY) / renderScale) * 100) / 100,
        width: Math.round(Math.abs(layer.width * scaleXNode)),
        height: Math.round(Math.abs(layer.height * scaleYNode)),
        rotation: Math.round(node.rotation() * 100) / 100,
      })

      node.scaleX(1)
      node.scaleY(1)
      setRotationGuideLine(null)
      setPositionGuideLines([])
      setCursor("default")
    },
    [layers, offsetX, offsetY, onUpdateLayer, renderScale]
  )

  const groupConnectionOverlays = useMemo(
    () => groups.flatMap((group) => buildGroupOverlayPolygons(group, layers)),
    [groups, layers]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Subheading>Manual Editor</Subheading>
            <VisualHelpTooltip
              label="Selection and drag tips"
              description="Drag layers from the canvas or Layers list to reorder. Hold Ctrl (or Cmd on Mac) and click layers to toggle multi-select. When nothing is selected, drag on empty canvas to box-select layers fully inside the selection area."
              webmSrc={manualEditorMultiSelectVideo}
              buttonAriaLabel="Manual Editor interaction help"
              mediaAlt="Manual Editor interaction guide"
            />
          </div>
          <MutedText className="text-xs mt-0.5">
            {canvasWidth} x {canvasHeight} px &middot; {layers.length} layer{layers.length !== 1 ? "s" : ""}
          </MutedText>
        </div>

        <div className="flex items-center gap-3">
          <PreviewInteractionModeToggle
            mode={previewInteractionMode}
            onChange={setPreviewInteractionMode}
            zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
            panKeyHint={getShortcutLabel("global.preview.pan_mode")}
            idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
          />

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              void onSaveTemplate()
            }}
            disabled={isSavingTemplate}
            className="min-w-[150px]"
          >
            {isSavingTemplate ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        style={{ height: `${previewContainerHeight}px`, cursor }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseUp={handleStageMouseUp}
          onMouseMove={(e) => {
            handleStageMouseMove(e)
            const targetName = e.target.name()
            if (targetName.includes("rotater")) {
              setCursor("crosshair")
              return
            }

            if (targetName.includes("manual-layer-shape")) {
              const isPointerDown = (e.evt as MouseEvent).buttons === 1
              setCursor(isPointerDown ? "grabbing" : "grab")
              return
            }

            setCursor("default")
          }}
          onMouseLeave={() => setCursor("default")}
        >
          <Layer>
            <Rect
              x={offsetX}
              y={offsetY}
              width={canvasWidth * renderScale}
              height={canvasHeight * renderScale}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={1}
              listening={false}
            />

            {positionGuideLines.map((points, index) => (
              <Line
                key={`manual-position-guide-${index}`}
                points={points}
                stroke="rgba(14, 165, 233, 0.9)"
                strokeWidth={1.2}
                dash={[6, 6]}
                listening={false}
                perfectDrawEnabled={false}
              />
            ))}

            {rotationGuideLine && (
              <Line
                key="manual-rotation-guide"
                points={rotationGuideLine}
                stroke="rgba(14, 165, 233, 0.9)"
                strokeWidth={1.5}
                dash={[10, 6]}
                listening={false}
                perfectDrawEnabled={false}
              />
            )}

            {groupConnectionOverlays.map((overlay) => {
              const scaledPoints = flattenPoints(overlay.points).map((value, index) =>
                value * renderScale + (index % 2 === 0 ? offsetX : offsetY)
              )

              const isInterior = overlay.type === "interior"
              const isCombinedHull = overlay.type === "combined-hull"

              return (
                <Line
                  key={overlay.id}
                  name="manual-group-overlay"
                  points={scaledPoints}
                  closed
                  fill={
                    isCombinedHull
                      ? "rgba(245, 158, 11, 0.18)"
                      : isInterior
                        ? "rgba(250, 204, 21, 0.28)"
                        : "rgba(250, 204, 21, 0.06)"
                  }
                  stroke={
                    isCombinedHull
                      ? "rgba(194, 65, 12, 0.95)"
                      : isInterior
                        ? "rgba(217, 119, 6, 0.95)"
                        : "rgba(217, 119, 6, 0.82)"
                  }
                  strokeWidth={isCombinedHull ? 2 : isInterior ? 1.8 : 1.4}
                  dash={isInterior || isCombinedHull ? undefined : [6, 4]}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )
            })}

            {layers.map((layer) => {
              if (!layer.visible) return null

              const shapePoints = resolveLayerShapePoints(layer)
              const flat = flattenPoints(shapePoints)
              const scaledFlat = flat.map((value) => value * renderScale)

              return (
                <Line
                  key={layer.id}
                  id={`layer-${layer.id}`}
                  name="manual-layer-shape"
                  points={scaledFlat}
                  x={offsetX + layer.x * renderScale}
                  y={offsetY + layer.y * renderScale}
                  rotation={layer.rotation}
                  closed
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke={selectedLayerIds.includes(layer.id) ? "#3b82f6" : "#94a3b8"}
                  strokeWidth={selectedLayerIds.includes(layer.id) ? 2 : 1}
                  draggable={!layer.locked}
                  onClick={(event) => {
                    if (event.evt.ctrlKey || event.evt.metaKey) {
                      onToggleLayerSelection(layer.id)
                      return
                    }
                    onSelectLayer(layer.id)
                  }}
                  onTap={() => onSelectLayer(layer.id)}
                  onMouseEnter={() => setCursor(layer.locked ? "not-allowed" : "grab")}
                  onMouseLeave={() => setCursor("default")}
                  onDragStart={() => {
                    setPositionGuideLines([])
                    setRotationGuideLine(null)
                    setCursor("grabbing")
                  }}
                  onDragMove={(e) => handleDragMove(layer.id, e)}
                  onDragEnd={(e) => handleDragEnd(layer.id, e)}
                  onTransformStart={() => {
                    setPositionGuideLines([])
                    setRotationGuideLine(null)
                    setCursor("grabbing")
                  }}
                  onTransform={handleTransform}
                  onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
                />
              )
            })}

            {selectionBoxRect && (
              <Rect
                x={offsetX + selectionBoxRect.x * renderScale}
                y={offsetY + selectionBoxRect.y * renderScale}
                width={selectionBoxRect.width * renderScale}
                height={selectionBoxRect.height * renderScale}
                fill="rgba(14, 165, 233, 0.12)"
                stroke="rgba(14, 165, 233, 0.85)"
                strokeWidth={1}
                dash={[6, 4]}
                listening={false}
              />
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio={!isFreeAspectRatio}
              rotationSnaps={rotationSnapAngles}
              rotationSnapTolerance={4}
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                  return oldBox
                }
                return newBox
              }}
            />
          </Layer>
        </Stage>

        <ZoomPanControl
          zoom={previewZoom}
          panX={previewPan.x}
          panY={previewPan.y}
          onZoomChange={setPreviewZoom}
          onPanChange={(x, y) => setPreviewPan({ x, y })}
          minZoom={PREVIEW_MIN_ZOOM}
          maxZoom={PREVIEW_MAX_ZOOM}
        />

        <div
          onMouseDown={handlePreviewResizeStart}
          className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors ${
            isResizingPreview ? "bg-sky-400 dark:bg-sky-500" : ""
          }`}
          style={{ cursor: "ns-resize" }}
          role="separator"
          aria-label="Resize manual preview height"
        />
      </div>
    </div>
  )
}
