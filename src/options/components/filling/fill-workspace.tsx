import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect, Group, Image as KonvaImage, Transformer } from "react-konva"
import type Konva from "konva"
import { Download, Loader2 } from "lucide-react"

import type { CanvasFillState, FillingTemplate, VectorLayer } from "@/features/filling/types"
import { useFillingStore } from "@/options/stores/filling-store"
import { useFillUiStore } from "@/options/stores/fill-ui-store"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import { buildActiveFillingFormatOptions } from "@/options/stores/filling-format-options"
import { generateShapePoints } from "@/features/filling/shape-generators"
import { flattenPoints, roundedPolygonPoints } from "@/features/filling/vector-math"
import {
  resolveLayerContainerHighlightMode,
  type LayerContainerHighlightMode,
} from "@/options/components/filling/layer-visual-highlight"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import { Button } from "@/options/components/ui/button"
import { ZoomPanControl } from "@/options/components/ui/zoom-pan-control"
import {
  PreviewInteractionModeToggle,
  type PreviewInteractionMode,
} from "@/options/components/ui/preview-interaction-mode-toggle"
import { exportFilledTemplate } from "./filling-export-utils"

const CANVAS_PADDING = 40
const ROTATE_CURSOR = "crosshair"
const PREVIEW_MIN_ZOOM = 50
const PREVIEW_MAX_ZOOM = 800
const PREVIEW_ZOOM_STEP = 10

interface FillWorkspaceProps {
  template: FillingTemplate
}

export function FillWorkspace({ template }: FillWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [previewContainerHeight, setPreviewContainerHeight] = useState(520)
  const [previewZoom, setPreviewZoom] = useState(100)
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 })
  const [previewInteractionMode, setPreviewInteractionMode] =
    useState<PreviewInteractionMode>("zoom")
  const [isResizingPreview, setIsResizingPreview] = useState(false)

  const canvasFillState = useFillingStore((s) => s.canvasFillState)
  const layerFillStates = useFillingStore((s) => s.layerFillStates)
  const selectedLayerId = useFillingStore((s) => s.selectedLayerId)
  const activeCustomizationTab = useFillUiStore((s) => s.activeCustomizationTab)
  const initializeFillSession = useFillUiStore((s) => s.initializeFillSession)
  const sessionTemplate = useFillUiStore((s) => s.sessionTemplate)
  const updateSessionTemplate = useFillUiStore((s) => s.updateSessionTemplate)
  const hiddenLayerIds = useFillUiStore((s) => s.hiddenLayerIds)
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId)
  const setCanvasFillState = useFillingStore((s) => s.setCanvasFillState)
  const updateLayerFillState = useFillingStore((s) => s.updateLayerFillState)
  const exportFormat = useFillingStore((s) => s.exportFormat)
  const exportQuality = useFillingStore((s) => s.exportQuality)
  const { getShortcutLabel } = useShortcutPreferences()

  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [selectedCanvasNode, setSelectedCanvasNode] = useState<"background" | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isTransforming, setIsTransforming] = useState(false)
  const [isFreeAspectRatio, setIsFreeAspectRatio] = useState(false)
  const [cursor, setCursor] = useState("default")

  const activeTemplate = useMemo(() => {
    if (sessionTemplate && sessionTemplate.id === template.id) {
      return sessionTemplate
    }

    return template
  }, [sessionTemplate, template])

  useEffect(() => {
    if (!sessionTemplate || sessionTemplate.id !== template.id) {
      initializeFillSession(template)
    }
  }, [initializeFillSession, sessionTemplate, template])

  const fitScale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2
    const availH = stageSize.height - CANVAS_PADDING * 2
    return Math.min(1, availW / template.canvasWidth, availH / template.canvasHeight)
  }, [stageSize, template.canvasWidth, template.canvasHeight])

  const renderScale = fitScale * (previewZoom / 100)

  const hiddenLayerIdSet = useMemo(() => new Set(hiddenLayerIds), [hiddenLayerIds])
  const fillVisibleLayers = useMemo(
    () => activeTemplate.layers.filter((layer) => layer.visible && !hiddenLayerIdSet.has(layer.id)),
    [activeTemplate.layers, hiddenLayerIdSet]
  )

  const offsetX = (stageSize.width - template.canvasWidth * renderScale) / 2 + previewPan.x
  const offsetY = (stageSize.height - template.canvasHeight * renderScale) / 2 + previewPan.y

  const clampPreviewZoom = useCallback((value: number) => {
    return Math.max(PREVIEW_MIN_ZOOM, Math.min(PREVIEW_MAX_ZOOM, Math.round(value)))
  }, [])

  useShortcutActions([
    {
      actionId: "fill.preview.zoom_mode",
      handler: () => setPreviewInteractionMode("zoom"),
    },
    {
      actionId: "fill.preview.pan_mode",
      handler: () => setPreviewInteractionMode("pan"),
    },
    {
      actionId: "fill.preview.idle_mode",
      handler: () => setPreviewInteractionMode("idle"),
    },
  ])

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
      if (e.ctrlKey || e.shiftKey) {
        setIsFreeAspectRatio(true)
        if (transformerRef.current) {
          transformerRef.current.keepRatio(false)
        }
      }
    }

    const handleKeyUp = () => {
      setIsFreeAspectRatio(false)
      if (transformerRef.current) {
        transformerRef.current.keepRatio(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const newMap = new Map<string, HTMLImageElement>()
    for (const fillState of layerFillStates) {
      if (!fillState.imageUrl) continue

      const existing = loadedImages.get(fillState.layerId)
      if (existing && existing.src === fillState.imageUrl) {
        newMap.set(fillState.layerId, existing)
        continue
      }

      const img = new window.Image()
      img.src = fillState.imageUrl
      img.onload = () => {
        setLoadedImages((prev) => new Map(prev).set(fillState.layerId, img))
      }
      newMap.set(fillState.layerId, img)
    }

    setLoadedImages(newMap)
  }, [layerFillStates.map((layerState) => layerState.imageUrl).join(",")])

  useEffect(() => {
    if (!canvasFillState.backgroundImageUrl) {
      setBackgroundImage(null)
      return
    }

    const img = new window.Image()
    img.src = canvasFillState.backgroundImageUrl
    img.onload = () => {
      setBackgroundImage(img)
    }
  }, [canvasFillState.backgroundImageUrl])

  useEffect(() => {
    if (selectedLayerId) {
      setSelectedCanvasNode(null)
    }
  }, [selectedLayerId])

  useEffect(() => {
    if (!selectedLayerId) return
    if (hiddenLayerIdSet.has(selectedLayerId)) {
      setSelectedLayerId(fillVisibleLayers[0]?.id ?? null)
    }
  }, [fillVisibleLayers, hiddenLayerIdSet, selectedLayerId, setSelectedLayerId])

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

      const baseOffsetOldX = (stageSize.width - template.canvasWidth * oldRenderScale) / 2
      const baseOffsetOldY = (stageSize.height - template.canvasHeight * oldRenderScale) / 2
      const worldX = (pointerX - baseOffsetOldX - previewPan.x) / oldRenderScale
      const worldY = (pointerY - baseOffsetOldY - previewPan.y) / oldRenderScale

      const baseOffsetNewX = (stageSize.width - template.canvasWidth * newRenderScale) / 2
      const baseOffsetNewY = (stageSize.height - template.canvasHeight * newRenderScale) / 2
      const nextPanX = pointerX - baseOffsetNewX - worldX * newRenderScale
      const nextPanY = pointerY - baseOffsetNewY - worldY * newRenderScale

      setPreviewZoom(nextZoom)
      setPreviewPan({
        x: Math.round(nextPanX * 100) / 100,
        y: Math.round(nextPanY * 100) / 100,
      })
    },
    [
      clampPreviewZoom,
      fitScale,
      previewInteractionMode,
      previewPan.x,
      previewPan.y,
      previewZoom,
      stageSize.height,
      stageSize.width,
      template.canvasHeight,
      template.canvasWidth,
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

  const updateSelectedLayerFromNode = useCallback(
    (node: Konva.Node) => {
      if (!selectedLayerId) return
      const selectedLayer = activeTemplate.layers.find((layer) => layer.id === selectedLayerId)
      if (!selectedLayer || hiddenLayerIdSet.has(selectedLayer.id)) return

      const nextScaleX = Math.max(0.01, Math.abs(node.scaleX()))
      const nextScaleY = Math.max(0.01, Math.abs(node.scaleY()))
      const nextLayer: VectorLayer = {
        ...selectedLayer,
        x: Math.round(((node.x() - offsetX) / renderScale) * 100) / 100,
        y: Math.round(((node.y() - offsetY) / renderScale) * 100) / 100,
        rotation: Math.round(node.rotation() * 100) / 100,
        width: Math.max(1, Math.round(selectedLayer.width * nextScaleX)),
        height: Math.max(1, Math.round(selectedLayer.height * nextScaleY)),
      }

      node.scaleX(1)
      node.scaleY(1)

      const nextLayerWithPoints: VectorLayer = {
        ...nextLayer,
        points: generateShapePoints(nextLayer.shapeType, nextLayer.width, nextLayer.height),
      }

      const nextTemplate: FillingTemplate = {
        ...activeTemplate,
        layers: activeTemplate.layers.map((layer) =>
          layer.id === nextLayerWithPoints.id ? nextLayerWithPoints : layer
        ),
        updatedAt: Date.now(),
      }

      updateSessionTemplate(() => nextTemplate)
    },
    [
      activeTemplate,
      hiddenLayerIdSet,
      offsetX,
      offsetY,
      renderScale,
      selectedLayerId,
      updateSessionTemplate,
    ]
  )

  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return

    const timeoutId = setTimeout(() => {
      if (selectedLayerId && activeCustomizationTab === "image") {
        const layerNode = stage.findOne(`#fill-img-${selectedLayerId}`)
        if (layerNode) {
          tr.nodes([layerNode])
          tr.getLayer()?.batchDraw()
          return
        }
      }

      if (selectedLayerId && activeCustomizationTab === "layer") {
        const layerNode = stage.findOne(`#fill-layer-transform-${selectedLayerId}`)
        if (layerNode) {
          tr.nodes([layerNode])
          tr.getLayer()?.batchDraw()
          return
        }
      }

      if (selectedCanvasNode === "background" && backgroundImage) {
        const backgroundNode = stage.findOne("#fill-bg-image")
        if (backgroundNode) {
          tr.nodes([backgroundNode])
          tr.getLayer()?.batchDraw()
          return
        }
      }

      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [
    selectedLayerId,
    selectedCanvasNode,
    layerFillStates,
    fillVisibleLayers,
    backgroundImage,
    loadedImages,
    activeCustomizationTab,
  ])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        setSelectedLayerId(null)
        setSelectedCanvasNode(null)
      }
    },
    [setSelectedLayerId]
  )

  const handleTransformStart = useCallback(() => {
    setIsTransforming(true)
  }, [])

  const handleLayerTransformDragStart = useCallback(() => {
    setCursor("grabbing")
  }, [])

  const handleLayerTransformDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!selectedLayerId || activeCustomizationTab !== "layer") return
      updateSelectedLayerFromNode(e.target)
      setCursor("grab")
    },
    [activeCustomizationTab, selectedLayerId, updateSelectedLayerFromNode]
  )

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      setIsTransforming(false)
      const node = e.target
      if (!node) return

      if (selectedCanvasNode === "background") {
        const renderedScaleX = node.scaleX()
        const renderedScaleY = node.scaleY()
        const renderedX = node.x()
        const renderedY = node.y()
        const rotation = node.rotation()

        const unscaledScaleX = renderedScaleX / renderScale
        const unscaledScaleY = renderedScaleY / renderScale
        const unscaledX = renderedX / renderScale
        const unscaledY = renderedY / renderScale

        setCanvasFillState({
          ...canvasFillState,
          backgroundImageTransform: {
            ...canvasFillState.backgroundImageTransform,
            x: Math.round(unscaledX * 100) / 100,
            y: Math.round(unscaledY * 100) / 100,
            scaleX: Math.round(unscaledScaleX * 100) / 100,
            scaleY: Math.round(unscaledScaleY * 100) / 100,
            rotation: Math.round(rotation * 100) / 100,
          },
        })

        const stage = stageRef.current
        if (stage) {
          setTimeout(() => {
            const updatedNode = stage.findOne("#fill-bg-image")
            if (updatedNode) {
              updatedNode.scaleX(unscaledScaleX * renderScale)
              updatedNode.scaleY(unscaledScaleY * renderScale)
              updatedNode.x(unscaledX * renderScale)
              updatedNode.y(unscaledY * renderScale)
              updatedNode.rotation(rotation)
            }
          }, 0)
        }

        return
      }

      if (selectedLayerId && activeCustomizationTab === "layer") {
        updateSelectedLayerFromNode(node)
        return
      }

      if (selectedLayerId && activeCustomizationTab === "image") {
        const renderedScaleX = node.scaleX()
        const renderedScaleY = node.scaleY()
        const renderedX = node.x()
        const renderedY = node.y()
        const rotation = node.rotation()

        const unscaledScaleX = renderedScaleX / renderScale
        const unscaledScaleY = renderedScaleY / renderScale
        const unscaledX = renderedX / renderScale
        const unscaledY = renderedY / renderScale

        updateLayerFillState(selectedLayerId, {
          imageTransform: {
            x: Math.round(unscaledX * 100) / 100,
            y: Math.round(unscaledY * 100) / 100,
            scaleX: Math.round(unscaledScaleX * 100) / 100,
            scaleY: Math.round(unscaledScaleY * 100) / 100,
            rotation: Math.round(rotation * 100) / 100,
          },
        })

        const stage = stageRef.current
        if (stage) {
          setTimeout(() => {
            const updatedNode = stage.findOne(`#fill-img-${selectedLayerId}`)
            if (updatedNode) {
              updatedNode.scaleX(unscaledScaleX * renderScale)
              updatedNode.scaleY(unscaledScaleY * renderScale)
              updatedNode.x(unscaledX * renderScale)
              updatedNode.y(unscaledY * renderScale)
              updatedNode.rotation(rotation)
            }
          }, 0)
        }
      }
    },
    [
      selectedLayerId,
      selectedCanvasNode,
      renderScale,
      updateLayerFillState,
      canvasFillState,
      setCanvasFillState,
      activeCustomizationTab,
      updateSelectedLayerFromNode,
    ]
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const fillVisibleLayerIdSet = new Set(fillVisibleLayers.map((layer) => layer.id))
      const exportTemplate: FillingTemplate = {
        ...activeTemplate,
        layers: fillVisibleLayers,
        groups: (activeTemplate.groups ?? [])
          .map((group) => ({
            ...group,
            layerIds: group.layerIds.filter((layerId) => fillVisibleLayerIdSet.has(layerId)),
          }))
          .filter((group) => group.layerIds.length > 0),
      }

      await exportFilledTemplate({
        template: exportTemplate,
        layerFillStates: layerFillStates.filter((state) => fillVisibleLayerIdSet.has(state.layerId)),
        canvasFillState,
        exportFormat,
        exportQuality,
        formatOptions: buildActiveFillingFormatOptions(useFillingStore.getState()),
      })
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }, [
    canvasFillState,
    exportFormat,
    exportQuality,
    activeTemplate,
    fillVisibleLayers,
    layerFillStates,
  ])

  const backgroundMode = canvasFillState.backgroundType === "gradient"
    ? "solid"
    : canvasFillState.backgroundType
  const parsedBackgroundGradient = parseLinearGradient(canvasFillState.backgroundColor)
  const backgroundGradientGeometry = useMemo(() => {
    if (!parsedBackgroundGradient) return null
    const angleRad = (parsedBackgroundGradient.angle * Math.PI) / 180
    const width = template.canvasWidth * renderScale
    const height = template.canvasHeight * renderScale
    const cx = width / 2
    const cy = height / 2
    const len = Math.max(width, height)
    return {
      start: {
        x: cx - (Math.cos(angleRad) * len) / 2,
        y: cy - (Math.sin(angleRad) * len) / 2,
      },
      end: {
        x: cx + (Math.cos(angleRad) * len) / 2,
        y: cy + (Math.sin(angleRad) * len) / 2,
      },
    }
  }, [parsedBackgroundGradient, renderScale, template.canvasHeight, template.canvasWidth])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Subheading>Fill Images</Subheading>
          <MutedText className="text-xs mt-0.5">
            {template.canvasWidth} x {template.canvasHeight} px &middot; {template.layers.length} layer{template.layers.length !== 1 ? "s" : ""}
          </MutedText>
        </div>
        <div className="flex items-center gap-3">
          <PreviewInteractionModeToggle
            mode={previewInteractionMode}
            onChange={setPreviewInteractionMode}
            zoomKeyHint={getShortcutLabel("fill.preview.zoom_mode")}
            panKeyHint={getShortcutLabel("fill.preview.pan_mode")}
            idleKeyHint={getShortcutLabel("fill.preview.idle_mode")}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-[150px]"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={14} />
                Export {exportFormat.toUpperCase()}
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
          onMouseMove={(e) => {
            const targetName = e.target.name()
            if (targetName.includes("rotater")) {
              setCursor(ROTATE_CURSOR)
              return
            }

            if (targetName.includes("fill-bg-image")) {
              const isPointerDown = (e.evt as MouseEvent).buttons === 1
              if (selectedCanvasNode === "background") {
                setCursor(isPointerDown ? "grabbing" : "grab")
              } else {
                setCursor("pointer")
              }
              return
            }

            if (targetName.includes("fill-drag-hitbox")) {
              if (!isTransforming) {
                const isPointerDown = (e.evt as MouseEvent).buttons === 1
                setCursor(isPointerDown ? "grabbing" : "grab")
              }
              return
            }

            if (targetName.includes("fill-layer-transform-node")) {
              const isPointerDown = (e.evt as MouseEvent).buttons === 1
              setCursor(isPointerDown ? "grabbing" : "grab")
              return
            }

            setCursor("default")
          }}
          onMouseLeave={() => setCursor("default")}
        >
          <Layer>
            {backgroundMode === "transparent" && (
              <CheckerboardPattern
                x={offsetX}
                y={offsetY}
                width={template.canvasWidth * renderScale}
                height={template.canvasHeight * renderScale}
              />
            )}

            <Group
              x={offsetX}
              y={offsetY}
              clipX={0}
              clipY={0}
              clipWidth={template.canvasWidth * renderScale}
              clipHeight={template.canvasHeight * renderScale}
            >
              {backgroundMode !== "transparent" && (
                <Rect
                  x={0}
                  y={0}
                  width={template.canvasWidth * renderScale}
                  height={template.canvasHeight * renderScale}
                  fill={parsedBackgroundGradient ? undefined : canvasFillState.backgroundColor}
                  fillLinearGradientStartPoint={parsedBackgroundGradient ? backgroundGradientGeometry?.start : undefined}
                  fillLinearGradientEndPoint={parsedBackgroundGradient ? backgroundGradientGeometry?.end : undefined}
                  fillLinearGradientColorStops={
                    parsedBackgroundGradient
                      ? parsedBackgroundGradient.stops.flatMap((stop) => [stop.offset, stop.color])
                      : undefined
                  }
                  listening={false}
                />
              )}

              {backgroundMode === "image" && backgroundImage && (
                <KonvaImage
                  id="fill-bg-image"
                  name="fill-bg-image"
                  image={backgroundImage}
                  x={canvasFillState.backgroundImageTransform.x * renderScale}
                  y={canvasFillState.backgroundImageTransform.y * renderScale}
                  scaleX={canvasFillState.backgroundImageTransform.scaleX * renderScale}
                  scaleY={canvasFillState.backgroundImageTransform.scaleY * renderScale}
                  rotation={canvasFillState.backgroundImageTransform.rotation}
                  draggable={selectedCanvasNode === "background"}
                  onClick={(e) => {
                    e.cancelBubble = true
                    setSelectedLayerId(null)
                    setSelectedCanvasNode("background")
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    setSelectedLayerId(null)
                    setSelectedCanvasNode("background")
                  }}
                  onDragStart={() => setCursor("grabbing")}
                  onDragEnd={(e) => {
                    const node = e.target
                    const unscaledX = node.x() / renderScale
                    const unscaledY = node.y() / renderScale

                    setCanvasFillState({
                      ...canvasFillState,
                      backgroundImageTransform: {
                        ...canvasFillState.backgroundImageTransform,
                        x: Math.round(unscaledX * 100) / 100,
                        y: Math.round(unscaledY * 100) / 100,
                      },
                    })

                    setCursor("grab")
                  }}
                  stroke={selectedCanvasNode === "background" ? "#22c55e" : undefined}
                  strokeWidth={selectedCanvasNode === "background" ? 2 / renderScale : 0}
                />
              )}
            </Group>

            <Rect
              x={offsetX}
              y={offsetY}
              width={template.canvasWidth * renderScale}
              height={template.canvasHeight * renderScale}
              fill={undefined}
              stroke="#cbd5e1"
              strokeWidth={1}
              listening={false}
            />

            {selectedLayerId && !hiddenLayerIdSet.has(selectedLayerId) && activeCustomizationTab === "image" && (
              <>
                {layerFillStates
                  .filter((fillState) => fillState.layerId === selectedLayerId)
                  .map((fillState) => {
                    const layer = fillVisibleLayers.find((candidate) => candidate.id === fillState.layerId)
                    if (!layer || !layerFillStates.find((state) => state.layerId === layer.id)?.imageUrl) {
                      return null
                    }

                    const layerX = offsetX + layer.x * renderScale
                    const layerY = offsetY + layer.y * renderScale
                    const imgX = layerX + fillState.imageTransform.x * renderScale
                    const imgY = layerY + fillState.imageTransform.y * renderScale

                    return (
                      <Rect
                        key={`hitbox-${layer.id}`}
                        name="fill-drag-hitbox"
                        x={imgX - 50}
                        y={imgY - 50}
                        width={(loadedImages.get(layer.id)?.width ?? 100) * fillState.imageTransform.scaleX * renderScale + 100}
                        height={(loadedImages.get(layer.id)?.height ?? 100) * fillState.imageTransform.scaleY * renderScale + 100}
                        fill="transparent"
                        draggable
                        onMouseEnter={() => setCursor("grab")}
                        onMouseLeave={() => setCursor("default")}
                        onDragStart={() => setCursor("grabbing")}
                        onDragMove={(e) => {
                          const node = e.target
                          updateLayerFillState(layer.id, {
                            imageTransform: {
                              ...fillState.imageTransform,
                              x: (node.x() - layerX + 50) / renderScale,
                              y: (node.y() - layerY + 50) / renderScale,
                            },
                          })
                        }}
                        onDragEnd={(e) => {
                          const node = e.target
                          updateLayerFillState(layer.id, {
                            imageTransform: {
                              ...fillState.imageTransform,
                              x: Math.round(((node.x() - layerX + 50) / renderScale) * 100) / 100,
                              y: Math.round(((node.y() - layerY + 50) / renderScale) * 100) / 100,
                            },
                          })
                          setCursor("grab")
                        }}
                        listening
                        perfectDrawEnabled={false}
                      />
                    )
                  })}
              </>
            )}

            {fillVisibleLayers.map((layer) => {
              const fillState = layerFillStates.find((lf) => lf.layerId === layer.id)
              const loadedImg = loadedImages.get(layer.id)
              const containerHighlightMode = resolveLayerContainerHighlightMode(
                selectedLayerId === layer.id,
                Boolean(fillState?.imageUrl),
                activeCustomizationTab
              )

              return (
                <FilledLayerShape
                  key={layer.id}
                  layer={layer}
                  fillState={fillState}
                  canvasFillState={canvasFillState}
                  canvasWidth={template.canvasWidth}
                  canvasHeight={template.canvasHeight}
                  loadedImg={loadedImg?.complete ? loadedImg : undefined}
                  scale={renderScale}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  isSelected={selectedLayerId === layer.id}
                  containerHighlightMode={containerHighlightMode}
                  isLayerTransformInteractive={
                    selectedLayerId === layer.id && activeCustomizationTab === "layer"
                  }
                  onLayerTransformDragStart={handleLayerTransformDragStart}
                  onLayerTransformDragEnd={handleLayerTransformDragEnd}
                  onSelect={() => {
                    setSelectedCanvasNode(null)
                    setSelectedLayerId(layer.id)
                  }}
                />
              )
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio={!isFreeAspectRatio}
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 20) {
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
          aria-label="Resize fill preview height"
        />
      </div>
    </div>
  )
}

function FilledLayerShape({
  layer,
  fillState,
  canvasFillState,
  canvasWidth,
  canvasHeight,
  loadedImg,
  scale,
  offsetX,
  offsetY,
  isSelected,
  containerHighlightMode,
  isLayerTransformInteractive,
  onLayerTransformDragStart,
  onLayerTransformDragEnd,
  onSelect,
}: {
  layer: VectorLayer
  fillState: ReturnType<typeof useFillingStore.getState>["layerFillStates"][number] | undefined
  canvasFillState: CanvasFillState
  canvasWidth: number
  canvasHeight: number
  loadedImg: HTMLImageElement | undefined
  scale: number
  offsetX: number
  offsetY: number
  isSelected: boolean
  containerHighlightMode: LayerContainerHighlightMode
  isLayerTransformInteractive: boolean
  onLayerTransformDragStart: () => void
  onLayerTransformDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onSelect: () => void
}) {
  const effectiveCornerRadius = canvasFillState.cornerRadiusOverrideEnabled
    ? canvasFillState.cornerRadiusOverride
    : (fillState?.cornerRadius ?? 0)
  const effectiveBorderWidth = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideWidth
    : (fillState?.borderWidth ?? 0)
  const effectiveBorderColor = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideColor
    : (fillState?.borderColor ?? "#000000")

  const rawPoints = generateShapePoints(layer.shapeType, layer.width, layer.height)
  const displayPoints = effectiveCornerRadius > 0
    ? roundedPolygonPoints(rawPoints, effectiveCornerRadius)
    : rawPoints
  const flat = flattenPoints(displayPoints).map((value) => value * scale)
  const parsedBorderGradient = parseLinearGradient(effectiveBorderColor)
  const borderGradientScope = canvasFillState.borderGradientScope ?? "per-layer"

  const x = offsetX + layer.x * scale
  const y = offsetY + layer.y * scale

  const gradientGeometry = useMemo(() => {
    if (!parsedBorderGradient) return null
    const angleRad = (parsedBorderGradient.angle * Math.PI) / 180

    if (borderGradientScope === "unified") {
      const globalWidth = canvasWidth * scale
      const globalHeight = canvasHeight * scale
      const globalCenterX = offsetX + globalWidth / 2
      const globalCenterY = offsetY + globalHeight / 2
      const globalLength = Math.max(globalWidth, globalHeight)

      const globalStart = {
        x: globalCenterX - (Math.cos(angleRad) * globalLength) / 2,
        y: globalCenterY - (Math.sin(angleRad) * globalLength) / 2,
      }
      const globalEnd = {
        x: globalCenterX + (Math.cos(angleRad) * globalLength) / 2,
        y: globalCenterY + (Math.sin(angleRad) * globalLength) / 2,
      }

      const rotationRad = (layer.rotation * Math.PI) / 180
      const invCos = Math.cos(-rotationRad)
      const invSin = Math.sin(-rotationRad)
      const toLocal = (point: { x: number; y: number }) => {
        const dx = point.x - x
        const dy = point.y - y
        return {
          x: dx * invCos - dy * invSin,
          y: dx * invSin + dy * invCos,
        }
      }

      return {
        start: toLocal(globalStart),
        end: toLocal(globalEnd),
      }
    }

    const width = layer.width * scale
    const height = layer.height * scale
    const cx = width / 2
    const cy = height / 2
    const len = Math.max(width, height)

    return {
      start: {
        x: cx - (Math.cos(angleRad) * len) / 2,
        y: cy - (Math.sin(angleRad) * len) / 2,
      },
      end: {
        x: cx + (Math.cos(angleRad) * len) / 2,
        y: cy + (Math.sin(angleRad) * len) / 2,
      },
    }
  }, [
    borderGradientScope,
    canvasHeight,
    canvasWidth,
    layer.height,
    layer.rotation,
    layer.width,
    offsetX,
    offsetY,
    parsedBorderGradient,
    scale,
    x,
    y,
  ])

  return (
    <>
      <Group
        x={x}
        y={y}
        rotation={layer.rotation}
        onClick={onSelect}
        onTap={onSelect}
        clipFunc={(ctx: any) => {
          ctx.beginPath()
          for (let i = 0; i < flat.length; i += 2) {
            if (i === 0) ctx.moveTo(flat[i], flat[i + 1])
            else ctx.lineTo(flat[i], flat[i + 1])
          }
          ctx.closePath()
        }}
      >
        <Line
          points={flat}
          closed
          fill="rgba(15, 23, 42, 0.001)"
          strokeEnabled={false}
          onClick={onSelect}
          onTap={onSelect}
          perfectDrawEnabled={false}
        />

        {!loadedImg && (
          <Line
            points={flat}
            closed
            fill="rgba(148, 163, 184, 0.15)"
            listening={false}
          />
        )}

        {loadedImg && fillState && (
          <KonvaImage
            id={`fill-img-${layer.id}`}
            image={loadedImg}
            x={fillState.imageTransform.x * scale}
            y={fillState.imageTransform.y * scale}
            scaleX={fillState.imageTransform.scaleX * scale}
            scaleY={fillState.imageTransform.scaleY * scale}
            rotation={fillState.imageTransform.rotation}
            stroke={isSelected ? "#3b82f6" : undefined}
            strokeWidth={isSelected ? 2 / scale : 0}
          />
        )}
      </Group>

      {containerHighlightMode !== "none" && (
        <Line
          x={x}
          y={y}
          rotation={layer.rotation}
          points={flat}
          closed
          stroke={containerHighlightMode === "missing" ? "#f59e0b" : "#3b82f6"}
          strokeWidth={2}
          dash={containerHighlightMode === "missing" ? [6, 4] : undefined}
          lineJoin="round"
          listening={false}
        />
      )}

      {isLayerTransformInteractive && (
        <Line
          id={`fill-layer-transform-${layer.id}`}
          name="fill-layer-transform-node"
          x={x}
          y={y}
          rotation={layer.rotation}
          points={flat}
          closed
          fill="rgba(59, 130, 246, 0.001)"
          stroke="rgba(59, 130, 246, 0.001)"
          strokeWidth={8}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragStart={onLayerTransformDragStart}
          onDragEnd={onLayerTransformDragEnd}
        />
      )}

      {effectiveBorderWidth > 0 && (
        <Line
          x={x}
          y={y}
          rotation={layer.rotation}
          points={flat}
          closed
          stroke={parsedBorderGradient ? undefined : effectiveBorderColor}
          strokeWidth={effectiveBorderWidth * scale}
          strokeLinearGradientStartPoint={parsedBorderGradient ? gradientGeometry?.start : undefined}
          strokeLinearGradientEndPoint={parsedBorderGradient ? gradientGeometry?.end : undefined}
          strokeLinearGradientColorStops={
            parsedBorderGradient
              ? parsedBorderGradient.stops.flatMap((stop) => [stop.offset, stop.color])
              : undefined
          }
          lineJoin="round"
          onClick={onSelect}
          onTap={onSelect}
        />
      )}
    </>
  )
}

interface ParsedLinearGradient {
  angle: number
  stops: Array<{ offset: number; color: string }>
}

function parseLinearGradient(value: string): ParsedLinearGradient | null {
  const trimmed = value.trim()
  const match = trimmed.match(/^linear-gradient\(\s*([+-]?\d*\.?\d+)deg\s*,\s*(.+)\)$/i)
  if (!match) return null

  const angle = Number(match[1])
  if (!Number.isFinite(angle)) return null

  const rawStops = match[2]
    .split(/,(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (rawStops.length < 2) return null

  const stops = rawStops
    .map((entry, index) => {
      const stopMatch = entry.match(/^(.*?)(?:\s+([+-]?\d*\.?\d+)%?)?$/)
      const color = stopMatch?.[1]?.trim() || entry
      const parsedOffset = Number(stopMatch?.[2])
      const fallbackOffset = index / Math.max(1, rawStops.length - 1)
      const offset = stopMatch?.[2] && Number.isFinite(parsedOffset)
        ? Math.max(0, Math.min(1, parsedOffset / 100))
        : fallbackOffset
      return { offset, color }
    })
    .sort((a, b) => a.offset - b.offset)

  return { angle, stops }
}

function CheckerboardPattern({
  x,
  y,
  width,
  height,
}: {
  x: number
  y: number
  width: number
  height: number
}) {
  const size = 10
  const rects: JSX.Element[] = []
  for (let row = 0; row < Math.ceil(height / size); row++) {
    for (let col = 0; col < Math.ceil(width / size); col++) {
      if ((row + col) % 2 === 0) continue
      rects.push(
        <Rect
          key={`cb-${row}-${col}`}
          x={x + col * size}
          y={y + row * size}
          width={Math.min(size, width - col * size)}
          height={Math.min(size, height - row * size)}
          fill="#e2e8f0"
          listening={false}
        />
      )
    }
  }
  return <>{rects}</>
}
