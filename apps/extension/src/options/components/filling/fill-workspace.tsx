import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect, Group, Text, Image as KonvaImage, Transformer } from "react-konva"
import type Konva from "konva"
import { Download, Loader2 } from "lucide-react"

import { ToastContainer } from "@/core/components/toast-container"
import { useConversionToasts } from "@/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@/core/types"
import {
  buildFillRuntimeItems,
  type FillRuntimeGroupItem,
  type FillRuntimeItem,
  type FillRuntimeLayerItem,
} from "@/features/filling/fill-runtime-items"
import {
  applyRuntimeTransformToPoint,
  applyRuntimeTransformToPolygons,
  computeConvexHull,
  getBoundsFromPoints,
  toWorldLayerPoints,
} from "@/features/filling/group-geometry"
import type { CanvasFillState, FillingTemplate, VectorLayer } from "@/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@/features/filling/types"
import { useFillingStore } from "@/options/stores/filling-store"
import { useFillUiStore } from "@/options/stores/fill-ui-store"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import { useTransformGuides, type RectBounds } from "@/options/hooks/use-transform-guides"
import { buildActiveFillingFormatOptions } from "@/options/stores/filling-format-options"
import {
  regenerateLayerShapePoints,
  resolveLayerShapePoints,
} from "@/features/filling/shape-generators"
import { flattenPoints, pointInPolygon, roundedPolygonPoints } from "@/features/filling/vector-math"
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
const IMAGE_HITBOX_PADDING = 50

function safeRevokeObjectUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("blob:")) {
    return
  }

  URL.revokeObjectURL(value)
}

function hasFileDragPayload(dataTransfer: DataTransfer): boolean {
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return true
  }

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    return Array.from(dataTransfer.items).some((item) => item.kind === "file")
  }

  return Array.from(dataTransfer.types ?? []).includes("Files")
}

function getFirstImageFileFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const directFile = dataTransfer.files?.[0]
  if (directFile?.type.startsWith("image/")) {
    return directFile
  }

  if (dataTransfer.items) {
    for (const item of Array.from(dataTransfer.items)) {
      if (item.kind !== "file") {
        continue
      }

      const file = item.getAsFile()
      if (file?.type.startsWith("image/")) {
        return file
      }
    }
  }

  return null
}

function resolveToastTargetFormat(
  exportFormat: ReturnType<typeof useFillingStore.getState>["exportFormat"]
): ConversionProgressPayload["targetFormat"] {
  if (exportFormat === "psd") {
    return "png"
  }

  return exportFormat
}

interface FillWorkspaceProps {
  template: FillingTemplate
}

export function FillWorkspace({ template }: FillWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const emptyImageUploadInputRef = useRef<HTMLInputElement>(null)
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
  const groupRuntimeTransforms = useFillUiStore((s) => s.groupRuntimeTransforms)
  const updateGroupRuntimeTransform = useFillUiStore((s) => s.updateGroupRuntimeTransform)
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
  const [isDragOverSelectedEmptyTarget, setIsDragOverSelectedEmptyTarget] = useState(false)
  const [cursor, setCursor] = useState("default")
  const [rotationGuideLine, setRotationGuideLine] = useState<number[] | null>(null)
  const [positionGuideLines, setPositionGuideLines] = useState<number[][]>([])
  const [exportToastPayload, setExportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const exportToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
  const conversionToasts = useConversionToasts([exportToastPayload])

  const clearExportToastHideTimer = useCallback(() => {
    if (!exportToastHideTimerRef.current) {
      return
    }

    clearTimeout(exportToastHideTimerRef.current)
    exportToastHideTimerRef.current = null
  }, [])

  const pushExportToast = useCallback((payload: ConversionProgressPayload) => {
    clearExportToastHideTimer()
    setExportToastPayload(payload)
  }, [clearExportToastHideTimer])

  const scheduleExportToastHide = useCallback((toastId: string, delayMs: number) => {
    clearExportToastHideTimer()
    exportToastHideTimerRef.current = setTimeout(() => {
      setExportToastPayload((current) => (current?.id === toastId ? null : current))
      exportToastHideTimerRef.current = null
    }, delayMs)
  }, [clearExportToastHideTimer])

  const handleRemoveExportToast = useCallback((toastId: string) => {
    clearExportToastHideTimer()
    setExportToastPayload((current) => (current?.id === toastId ? null : current))
  }, [clearExportToastHideTimer])

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

  const fillRuntimeItems = useMemo(
    () => buildFillRuntimeItems(activeTemplate, hiddenLayerIdSet),
    [activeTemplate, hiddenLayerIdSet]
  )

  const selectedRuntimeItem = useMemo(
    () => fillRuntimeItems.find((item) => item.id === selectedLayerId),
    [fillRuntimeItems, selectedLayerId]
  )

  const selectedFillState = useMemo(
    () => layerFillStates.find((state) => state.layerId === selectedRuntimeItem?.id),
    [layerFillStates, selectedRuntimeItem?.id]
  )

  const selectedEmptyDropPolygons = useMemo(() => {
    if (!selectedRuntimeItem || selectedFillState?.imageUrl) {
      return []
    }

    if (selectedRuntimeItem.kind === "group") {
      return applyRuntimeTransformToPolygons(
        selectedRuntimeItem.polygons,
        groupRuntimeTransforms[selectedRuntimeItem.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
      )
    }

    return [toWorldLayerPoints(selectedRuntimeItem.layer)]
  }, [groupRuntimeTransforms, selectedFillState?.imageUrl, selectedRuntimeItem])

  const fillVisibleLayers = useMemo(
    () => fillRuntimeItems
      .filter((item) => item.kind === "layer")
      .map((item) => (item as FillRuntimeLayerItem).layer),
    [fillRuntimeItems]
  )

  const applyImageFileToSelectedRuntimeItem = useCallback(
    (file: File) => {
      if (!selectedRuntimeItem || selectedFillState?.imageUrl || !file.type.startsWith("image/")) {
        return
      }

      const nextUrl = URL.createObjectURL(file)
      const previousUrl = selectedFillState?.imageUrl ?? null

      const image = new window.Image()
      image.onload = () => {
        const scaleToFit = Math.max(
          Math.max(1, selectedRuntimeItem.bounds.width) / image.naturalWidth,
          Math.max(1, selectedRuntimeItem.bounds.height) / image.naturalHeight
        )

        updateLayerFillState(selectedRuntimeItem.id, {
          imageUrl: nextUrl,
          imageTransform: {
            x: 0,
            y: 0,
            scaleX: scaleToFit,
            scaleY: scaleToFit,
            rotation: 0,
          },
        })

        safeRevokeObjectUrl(previousUrl)
      }

      image.onerror = () => {
        safeRevokeObjectUrl(nextUrl)
      }

      image.src = nextUrl
    },
    [selectedFillState?.imageUrl, selectedRuntimeItem, updateLayerFillState]
  )

  const triggerEmptyLayerImageSelect = useCallback(() => {
    if (!selectedRuntimeItem || selectedFillState?.imageUrl) {
      return
    }

    emptyImageUploadInputRef.current?.click()
  }, [selectedFillState?.imageUrl, selectedRuntimeItem])

  const handleEmptyLayerImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        applyImageFileToSelectedRuntimeItem(file)
      }

      if (emptyImageUploadInputRef.current) {
        emptyImageUploadInputRef.current.value = ""
      }
    },
    [applyImageFileToSelectedRuntimeItem]
  )

  const offsetX = (stageSize.width - template.canvasWidth * renderScale) / 2 + previewPan.x
  const offsetY = (stageSize.height - template.canvasHeight * renderScale) / 2 + previewPan.y

  const toWorldPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current
      if (!container || renderScale <= 0) {
        return null
      }

      const rect = container.getBoundingClientRect()

      return {
        x: (clientX - rect.left - offsetX) / renderScale,
        y: (clientY - rect.top - offsetY) / renderScale,
      }
    },
    [offsetX, offsetY, renderScale]
  )

  const isWorldPointInsideSelectedEmptyTarget = useCallback(
    (worldPoint: { x: number; y: number } | null) => {
      if (!worldPoint || selectedEmptyDropPolygons.length === 0) {
        return false
      }

      return selectedEmptyDropPolygons.some((polygon) => pointInPolygon(worldPoint, polygon))
    },
    [selectedEmptyDropPolygons]
  )

  const handleStageContainerDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!selectedRuntimeItem || selectedFillState?.imageUrl) {
        return
      }

      if (!hasFileDragPayload(event.dataTransfer)) {
        return
      }

      event.preventDefault()

      const worldPoint = toWorldPointFromClient(event.clientX, event.clientY)
      const canDrop = isWorldPointInsideSelectedEmptyTarget(worldPoint)

      if (!canDrop) {
        setIsDragOverSelectedEmptyTarget(false)
        event.dataTransfer.dropEffect = "none"
        return
      }

      event.dataTransfer.dropEffect = "copy"
      setIsDragOverSelectedEmptyTarget(true)
    },
    [
      isWorldPointInsideSelectedEmptyTarget,
      selectedFillState?.imageUrl,
      selectedRuntimeItem,
      toWorldPointFromClient,
    ]
  )

  const handleStageContainerDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return
    }

    setIsDragOverSelectedEmptyTarget(false)
  }, [])

  const handleStageContainerDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!selectedRuntimeItem || selectedFillState?.imageUrl) {
        return
      }

      if (!hasFileDragPayload(event.dataTransfer)) {
        setIsDragOverSelectedEmptyTarget(false)
        return
      }

      event.preventDefault()

      const file = getFirstImageFileFromDataTransfer(event.dataTransfer)
      if (!file) {
        setIsDragOverSelectedEmptyTarget(false)
        return
      }

      const worldPoint = toWorldPointFromClient(event.clientX, event.clientY)
      if (!isWorldPointInsideSelectedEmptyTarget(worldPoint)) {
        setIsDragOverSelectedEmptyTarget(false)
        return
      }

      setIsDragOverSelectedEmptyTarget(false)
      applyImageFileToSelectedRuntimeItem(file)
    },
    [
      applyImageFileToSelectedRuntimeItem,
      isWorldPointInsideSelectedEmptyTarget,
      selectedFillState?.imageUrl,
      selectedRuntimeItem,
      toWorldPointFromClient,
    ]
  )

  useEffect(() => {
    setIsDragOverSelectedEmptyTarget(false)
  }, [selectedRuntimeItem?.id, selectedFillState?.imageUrl])

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
    const exists = fillRuntimeItems.some((item) => item.id === selectedLayerId)
    if (!exists) {
      setSelectedLayerId(fillRuntimeItems[0]?.id ?? null)
    }
  }, [fillRuntimeItems, selectedLayerId, setSelectedLayerId])

  useEffect(() => {
    return () => {
      clearExportToastHideTimer()
    }
  }, [clearExportToastHideTimer])

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
      if (!selectedLayerId || selectedRuntimeItem?.kind !== "layer") return
      const selectedLayer = selectedRuntimeItem.layer

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
        points: regenerateLayerShapePoints(nextLayer, nextLayer.width, nextLayer.height),
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
      offsetX,
      offsetY,
      renderScale,
      selectedLayerId,
      selectedRuntimeItem,
      updateSessionTemplate,
    ]
  )

  const canvasRect = useMemo<RectBounds>(
    () => ({ x: 0, y: 0, width: template.canvasWidth, height: template.canvasHeight }),
    [template.canvasHeight, template.canvasWidth]
  )

  const toStageGuideLines = useCallback(
    (guides: Array<{ orientation: "vertical" | "horizontal"; value: number }>) => {
      return guides.map((guide) => {
        if (guide.orientation === "vertical") {
          const x = offsetX + guide.value * renderScale
          return [x, offsetY, x, offsetY + template.canvasHeight * renderScale]
        }

        const y = offsetY + guide.value * renderScale
        return [offsetX, y, offsetX + template.canvasWidth * renderScale, y]
      })
    },
    [
      offsetX,
      offsetY,
      renderScale,
      template.canvasHeight,
      template.canvasWidth,
    ]
  )

  const getRuntimeItemBounds = useCallback(
    (item: FillRuntimeItem): RectBounds => {
      if (item.kind === "layer") {
        return getBoundsFromPoints(toWorldLayerPoints(item.layer))
      }

      const runtimeTransform = groupRuntimeTransforms[item.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
      const transformedPoints = applyRuntimeTransformToPolygons(item.polygons, runtimeTransform).flat()
      if (transformedPoints.length === 0) {
        return item.bounds
      }

      return getBoundsFromPoints(transformedPoints)
    },
    [groupRuntimeTransforms]
  )

  const getLayerSnapCandidateRects = useCallback(
    (excludedRuntimeItemId?: string) => {
      return fillRuntimeItems
        .filter((item) => item.id !== excludedRuntimeItemId)
        .map((item) => getRuntimeItemBounds(item))
    },
    [fillRuntimeItems, getRuntimeItemBounds]
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
    selectedRuntimeItem,
    selectedCanvasNode,
    layerFillStates,
    fillRuntimeItems,
    groupRuntimeTransforms,
    backgroundImage,
    loadedImages,
    activeCustomizationTab,
  ])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        setSelectedLayerId(null)
        setSelectedCanvasNode(null)
        setRotationGuideLine(null)
        setPositionGuideLines([])
      }
    },
    [setSelectedLayerId]
  )

  const handleTransformStart = useCallback(() => {
    setIsTransforming(true)
    setPositionGuideLines([])
    setRotationGuideLine(null)
  }, [])

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target
      const snappedRotation = getSnappedRotation(node.rotation())

      if (!snappedRotation.snapped) {
        setRotationGuideLine(null)
        return
      }

      node.rotation(snappedRotation.rotation)

      const rect = node.getClientRect()
      const centerX = rect.x + rect.width / 2
      const centerY = rect.y + rect.height / 2
      const guideLength = Math.max(template.canvasWidth, template.canvasHeight) * renderScale

      setRotationGuideLine(
        buildRotationGuideLine(
          centerX,
          centerY,
          snappedRotation.snapAngle ?? snappedRotation.rotation,
          guideLength
        )
      )
    },
    [
      buildRotationGuideLine,
      getSnappedRotation,
      renderScale,
      template.canvasHeight,
      template.canvasWidth,
    ]
  )

  const handleLayerTransformDragStart = useCallback(() => {
    setPositionGuideLines([])
    setCursor("grabbing")
  }, [])

  const handleLayerTransformDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!selectedLayerId || activeCustomizationTab !== "layer") {
        return
      }

      if (selectedRuntimeItem?.kind === "group") {
        const node = e.target
        const currentTransform = groupRuntimeTransforms[selectedRuntimeItem.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
        const groupPivot = {
          x: selectedRuntimeItem.bounds.x + selectedRuntimeItem.bounds.width / 2,
          y: selectedRuntimeItem.bounds.y + selectedRuntimeItem.bounds.height / 2,
        }
        const groupStageX = offsetX + (groupPivot.x + currentTransform.x) * renderScale
        const groupStageY = offsetY + (groupPivot.y + currentTransform.y) * renderScale
        const baseBounds = getRuntimeItemBounds(selectedRuntimeItem)

        const movingRect: RectBounds = {
          ...baseBounds,
          x: baseBounds.x + (node.x() - groupStageX) / renderScale,
          y: baseBounds.y + (node.y() - groupStageY) / renderScale,
        }

        const { snappedRect, guides } = snapRectPosition({
          movingRect,
          candidateRects: getLayerSnapCandidateRects(selectedRuntimeItem.id),
          canvasRect,
        })

        const snappedDeltaX = snappedRect.x - baseBounds.x
        const snappedDeltaY = snappedRect.y - baseBounds.y

        node.x(groupStageX + snappedDeltaX * renderScale)
        node.y(groupStageY + snappedDeltaY * renderScale)
        setPositionGuideLines(toStageGuideLines(guides))
        return
      }

      const layer = fillVisibleLayers.find((candidate) => candidate.id === selectedLayerId)
      if (!layer) {
        return
      }

      const node = e.target
      const draftLayer: VectorLayer = {
        ...layer,
        x: (node.x() - offsetX) / renderScale,
        y: (node.y() - offsetY) / renderScale,
      }

      const movingRect = getBoundsFromPoints(toWorldLayerPoints(draftLayer))
      const { snappedRect, guides } = snapRectPosition({
        movingRect,
        candidateRects: getLayerSnapCandidateRects(layer.id),
        canvasRect,
      })

      const deltaX = snappedRect.x - movingRect.x
      const deltaY = snappedRect.y - movingRect.y
      if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
        node.x(node.x() + deltaX * renderScale)
        node.y(node.y() + deltaY * renderScale)
      }

      setPositionGuideLines(toStageGuideLines(guides))
    },
    [
      activeCustomizationTab,
      canvasRect,
      fillVisibleLayers,
      getRuntimeItemBounds,
      getLayerSnapCandidateRects,
      groupRuntimeTransforms,
      offsetX,
      offsetY,
      renderScale,
      selectedLayerId,
      selectedRuntimeItem,
      snapRectPosition,
      toStageGuideLines,
    ]
  )

  const handleLayerTransformDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!selectedLayerId || activeCustomizationTab !== "layer") return

      if (selectedRuntimeItem?.kind === "group") {
        const currentTransform = groupRuntimeTransforms[selectedRuntimeItem.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
        const groupPivot = {
          x: selectedRuntimeItem.bounds.x + selectedRuntimeItem.bounds.width / 2,
          y: selectedRuntimeItem.bounds.y + selectedRuntimeItem.bounds.height / 2,
        }
        const groupStageX = offsetX + (groupPivot.x + currentTransform.x) * renderScale
        const groupStageY = offsetY + (groupPivot.y + currentTransform.y) * renderScale
        const deltaX = (e.target.x() - groupStageX) / renderScale
        const deltaY = (e.target.y() - groupStageY) / renderScale

        updateGroupRuntimeTransform(selectedRuntimeItem.id, {
          x: Math.round((currentTransform.x + deltaX) * 100) / 100,
          y: Math.round((currentTransform.y + deltaY) * 100) / 100,
        })

        e.target.x(groupStageX)
        e.target.y(groupStageY)
        setPositionGuideLines([])
        setCursor("grab")
        return
      }

      updateSelectedLayerFromNode(e.target)
      setPositionGuideLines([])
      setCursor("grab")
    },
    [
      activeCustomizationTab,
      groupRuntimeTransforms,
      offsetX,
      offsetY,
      renderScale,
      selectedLayerId,
      selectedRuntimeItem,
      updateGroupRuntimeTransform,
      updateSelectedLayerFromNode,
    ]
  )

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      setIsTransforming(false)
      setRotationGuideLine(null)
      setPositionGuideLines([])
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

      if (selectedLayerId && activeCustomizationTab === "layer" && selectedRuntimeItem?.kind === "group") {
        const groupPivot = {
          x: selectedRuntimeItem.bounds.x + selectedRuntimeItem.bounds.width / 2,
          y: selectedRuntimeItem.bounds.y + selectedRuntimeItem.bounds.height / 2,
        }

        const nextScaleX = Math.max(0.01, Math.abs(node.scaleX() / renderScale))
        const nextScaleY = Math.max(0.01, Math.abs(node.scaleY() / renderScale))
        const nextWorldX = (node.x() - offsetX) / renderScale
        const nextWorldY = (node.y() - offsetY) / renderScale

        updateGroupRuntimeTransform(selectedLayerId, {
          x: Math.round((nextWorldX - groupPivot.x) * 100) / 100,
          y: Math.round((nextWorldY - groupPivot.y) * 100) / 100,
          rotation: Math.round(node.rotation() * 100) / 100,
          scaleX: Math.round(nextScaleX * 100) / 100,
          scaleY: Math.round(nextScaleY * 100) / 100,
        })

        return
      }

      if (selectedLayerId && activeCustomizationTab === "layer") {
        updateSelectedLayerFromNode(node)
        return
      }

      if (selectedLayerId && activeCustomizationTab === "image" && selectedRuntimeItem?.kind === "group") {
        const fillState = layerFillStates.find((state) => state.layerId === selectedLayerId)
        if (!fillState) {
          return
        }

        const runtimeTransform = groupRuntimeTransforms[selectedLayerId] ?? { ...DEFAULT_IMAGE_TRANSFORM }
        const groupPivot = {
          x: selectedRuntimeItem.bounds.x + selectedRuntimeItem.bounds.width / 2,
          y: selectedRuntimeItem.bounds.y + selectedRuntimeItem.bounds.height / 2,
        }

        const nextWorldX = (node.x() - offsetX) / renderScale
        const nextWorldY = (node.y() - offsetY) / renderScale
        const nextWorldScaleX = Math.max(0.01, Math.abs(node.scaleX() / renderScale))
        const nextWorldScaleY = Math.max(0.01, Math.abs(node.scaleY() / renderScale))
        const nextWorldRotation = node.rotation()

        const baseAnchor = applyInverseRuntimeTransformToPoint(
          { x: nextWorldX, y: nextWorldY },
          groupPivot,
          runtimeTransform
        )

        updateLayerFillState(selectedLayerId, {
          imageTransform: {
            ...fillState.imageTransform,
            x: Math.round((baseAnchor.x - selectedRuntimeItem.bounds.x) * 100) / 100,
            y: Math.round((baseAnchor.y - selectedRuntimeItem.bounds.y) * 100) / 100,
            scaleX: Math.round((nextWorldScaleX / Math.max(0.0001, Math.abs(runtimeTransform.scaleX))) * 100) / 100,
            scaleY: Math.round((nextWorldScaleY / Math.max(0.0001, Math.abs(runtimeTransform.scaleY))) * 100) / 100,
            rotation: Math.round((nextWorldRotation - runtimeTransform.rotation) * 100) / 100,
          },
        })

        return
      }

      if (selectedLayerId && activeCustomizationTab === "image" && selectedRuntimeItem?.kind === "layer") {
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
      selectedRuntimeItem,
      selectedCanvasNode,
      offsetX,
      offsetY,
      renderScale,
      layerFillStates,
      updateLayerFillState,
      groupRuntimeTransforms,
      updateGroupRuntimeTransform,
      canvasFillState,
      setCanvasFillState,
      activeCustomizationTab,
      updateSelectedLayerFromNode,
    ]
  )

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return
    }

    setIsExporting(true)
    const toastId = `fill_export_${Date.now()}`
    const toastTargetFormat = resolveToastTargetFormat(exportFormat)

    pushExportToast({
      id: toastId,
      fileName: `Export ${exportFormat.toUpperCase()}`,
      targetFormat: toastTargetFormat,
      status: "processing",
      percent: 2,
      message: "Preparing export...",
    })

    try {
      const visibleRuntimeItemIdSet = new Set(fillRuntimeItems.map((runtimeItem) => runtimeItem.id))

      await exportFilledTemplate({
        template: activeTemplate,
        layerFillStates: layerFillStates.filter((state) => visibleRuntimeItemIdSet.has(state.layerId)),
        canvasFillState,
        runtimeItems: fillRuntimeItems,
        groupRuntimeTransforms,
        exportFormat,
        exportQuality,
        formatOptions: buildActiveFillingFormatOptions(useFillingStore.getState()),
        onProgress: ({ percent, message }) => {
          pushExportToast({
            id: toastId,
            fileName: `Export ${exportFormat.toUpperCase()}`,
            targetFormat: toastTargetFormat,
            status: "processing",
            percent,
            message,
          })
        },
      })

      pushExportToast({
        id: toastId,
        fileName: `Export ${exportFormat.toUpperCase()}`,
        targetFormat: toastTargetFormat,
        status: "success",
        percent: 100,
        message: "Export completed",
      })
      scheduleExportToastHide(toastId, 2500)
    } catch (err) {
      console.error("Export failed:", err)

      pushExportToast({
        id: toastId,
        fileName: `Export ${exportFormat.toUpperCase()}`,
        targetFormat: toastTargetFormat,
        status: "error",
        percent: 100,
        message: "Unable to export filled template",
      })
      scheduleExportToastHide(toastId, 6000)
    } finally {
      setIsExporting(false)
    }
  }, [
    activeTemplate,
    canvasFillState,
    exportFormat,
    exportQuality,
    fillRuntimeItems,
    groupRuntimeTransforms,
    isExporting,
    layerFillStates,
    pushExportToast,
    scheduleExportToastHide,
  ])

  const selectedEmptyImageOverlay = useMemo(() => {
    if (!selectedRuntimeItem || selectedFillState?.imageUrl) {
      return null
    }

    const clipPolygons = selectedRuntimeItem.kind === "group"
      ? applyRuntimeTransformToPolygons(
          selectedRuntimeItem.polygons,
          groupRuntimeTransforms[selectedRuntimeItem.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
        )
      : [toWorldLayerPoints(selectedRuntimeItem.layer)]

    const clipPoints = clipPolygons.flat()
    if (clipPoints.length === 0) {
      return null
    }

    const bounds = getBoundsFromPoints(clipPoints)
    const stageBoundsX = offsetX + bounds.x * renderScale
    const stageBoundsY = offsetY + bounds.y * renderScale
    const stageBoundsWidth = Math.max(0, bounds.width * renderScale)
    const stageBoundsHeight = Math.max(0, bounds.height * renderScale)

    const inset = Math.min(8, Math.max(3, Math.min(stageBoundsWidth, stageBoundsHeight) * 0.12))
    const availableWidth = Math.max(0, stageBoundsWidth - inset * 2)
    const availableHeight = Math.max(0, stageBoundsHeight - inset * 2)

    if (availableWidth <= 0 || availableHeight <= 0) {
      return null
    }

    const width = Math.min(120, availableWidth)
    const height = Math.min(30, availableHeight)
    const compact = width < 112 || height < 30
    const fontSize = compact ? Math.max(10, Math.min(14, height * 0.58)) : 12

    return {
      x: stageBoundsX + (stageBoundsWidth - width) / 2,
      y: stageBoundsY + (stageBoundsHeight - height) / 2,
      width,
      height,
      compact,
      fontSize,
      text: isDragOverSelectedEmptyTarget
        ? compact
          ? "Drop"
          : "Drop image"
        : compact
          ? "+"
          : "+ Select image",
      isDragOver: isDragOverSelectedEmptyTarget,
      clipPolygons: clipPolygons.map((polygon) =>
        flattenPoints(polygon).map((value, index) =>
          value * renderScale + (index % 2 === 0 ? offsetX : offsetY)
        )
      ),
    }
  }, [
    groupRuntimeTransforms,
    offsetX,
    offsetY,
    renderScale,
    isDragOverSelectedEmptyTarget,
    selectedFillState?.imageUrl,
    selectedRuntimeItem,
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
            zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
            panKeyHint={getShortcutLabel("global.preview.pan_mode")}
            idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
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
        onDragOver={handleStageContainerDragOver}
        onDragLeave={handleStageContainerDragLeave}
        onDrop={handleStageContainerDrop}
      >
        <input
          ref={emptyImageUploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleEmptyLayerImageUpload}
        />

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

            if (targetName.includes("fill-empty-upload-overlay")) {
              setCursor("pointer")
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
                  onDragStart={() => {
                    setPositionGuideLines([])
                    setRotationGuideLine(null)
                    setCursor("grabbing")
                  }}
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

                    setPositionGuideLines([])
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

            {positionGuideLines.map((points, index) => (
              <Line
                key={`fill-position-guide-${index}`}
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
                key="fill-rotation-guide"
                points={rotationGuideLine}
                stroke="rgba(14, 165, 233, 0.9)"
                strokeWidth={1.5}
                dash={[10, 6]}
                listening={false}
                perfectDrawEnabled={false}
              />
            )}

            {selectedRuntimeItem && activeCustomizationTab === "image" && (() => {
              const fillState = layerFillStates.find((state) => state.layerId === selectedRuntimeItem.id)
              if (!fillState?.imageUrl) {
                return null
              }

              if (selectedRuntimeItem.kind === "layer") {
                const layer = selectedRuntimeItem.layer
                const layerX = offsetX + layer.x * renderScale
                const layerY = offsetY + layer.y * renderScale
                const imgX = layerX + fillState.imageTransform.x * renderScale
                const imgY = layerY + fillState.imageTransform.y * renderScale
                const imageWidth = (loadedImages.get(layer.id)?.width ?? 100) * fillState.imageTransform.scaleX
                const imageHeight = (loadedImages.get(layer.id)?.height ?? 100) * fillState.imageTransform.scaleY

                return (
                  <Rect
                    key={`hitbox-${layer.id}`}
                    name="fill-drag-hitbox"
                    x={imgX - IMAGE_HITBOX_PADDING}
                    y={imgY - IMAGE_HITBOX_PADDING}
                    width={imageWidth * renderScale + IMAGE_HITBOX_PADDING * 2}
                    height={imageHeight * renderScale + IMAGE_HITBOX_PADDING * 2}
                    fill="transparent"
                    draggable
                    onMouseEnter={() => setCursor("grab")}
                    onMouseLeave={() => setCursor("default")}
                    onDragStart={() => {
                      setPositionGuideLines([])
                      setRotationGuideLine(null)
                      setCursor("grabbing")
                    }}
                    onDragMove={(e) => {
                      const node = e.target
                      const nextTransformX = (node.x() - layerX + IMAGE_HITBOX_PADDING) / renderScale
                      const nextTransformY = (node.y() - layerY + IMAGE_HITBOX_PADDING) / renderScale

                      const movingRect: RectBounds = {
                        x: layer.x + nextTransformX,
                        y: layer.y + nextTransformY,
                        width: imageWidth,
                        height: imageHeight,
                      }

                      const { snappedRect, guides } = snapRectPosition({
                        movingRect,
                        candidateRects: getLayerSnapCandidateRects(layer.id),
                        canvasRect,
                      })

                      const snappedTransformX = snappedRect.x - layer.x
                      const snappedTransformY = snappedRect.y - layer.y

                      if (
                        Math.abs(snappedTransformX - nextTransformX) > 0.001 ||
                        Math.abs(snappedTransformY - nextTransformY) > 0.001
                      ) {
                        node.x(layerX + snappedTransformX * renderScale - IMAGE_HITBOX_PADDING)
                        node.y(layerY + snappedTransformY * renderScale - IMAGE_HITBOX_PADDING)
                      }

                      updateLayerFillState(layer.id, {
                        imageTransform: {
                          ...fillState.imageTransform,
                          x: snappedTransformX,
                          y: snappedTransformY,
                        },
                      })

                      setPositionGuideLines(toStageGuideLines(guides))
                    }}
                    onDragEnd={(e) => {
                      const node = e.target
                      const nextTransformX = (node.x() - layerX + IMAGE_HITBOX_PADDING) / renderScale
                      const nextTransformY = (node.y() - layerY + IMAGE_HITBOX_PADDING) / renderScale

                      const movingRect: RectBounds = {
                        x: layer.x + nextTransformX,
                        y: layer.y + nextTransformY,
                        width: imageWidth,
                        height: imageHeight,
                      }

                      const { snappedRect } = snapRectPosition({
                        movingRect,
                        candidateRects: getLayerSnapCandidateRects(layer.id),
                        canvasRect,
                      })

                      const snappedTransformX = snappedRect.x - layer.x
                      const snappedTransformY = snappedRect.y - layer.y

                      node.x(layerX + snappedTransformX * renderScale - IMAGE_HITBOX_PADDING)
                      node.y(layerY + snappedTransformY * renderScale - IMAGE_HITBOX_PADDING)

                      updateLayerFillState(layer.id, {
                        imageTransform: {
                          ...fillState.imageTransform,
                          x: Math.round(snappedTransformX * 100) / 100,
                          y: Math.round(snappedTransformY * 100) / 100,
                        },
                      })
                      setPositionGuideLines([])
                      setCursor("grab")
                    }}
                    listening
                    perfectDrawEnabled={false}
                  />
                )
              }

              const groupRuntimeTransform =
                groupRuntimeTransforms[selectedRuntimeItem.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
              const groupPivot = {
                x: selectedRuntimeItem.bounds.x + selectedRuntimeItem.bounds.width / 2,
                y: selectedRuntimeItem.bounds.y + selectedRuntimeItem.bounds.height / 2,
              }
              const imageAnchor = {
                x: selectedRuntimeItem.bounds.x + fillState.imageTransform.x,
                y: selectedRuntimeItem.bounds.y + fillState.imageTransform.y,
              }
              const transformedAnchor = applyRuntimeTransformToPoint(
                imageAnchor,
                groupPivot,
                groupRuntimeTransform
              )
              const effectiveScaleX = fillState.imageTransform.scaleX * groupRuntimeTransform.scaleX
              const effectiveScaleY = fillState.imageTransform.scaleY * groupRuntimeTransform.scaleY
              const imageWidth = (loadedImages.get(selectedRuntimeItem.id)?.width ?? 100) * Math.max(0.01, Math.abs(effectiveScaleX))
              const imageHeight = (loadedImages.get(selectedRuntimeItem.id)?.height ?? 100) * Math.max(0.01, Math.abs(effectiveScaleY))
              const imageStageX = offsetX + transformedAnchor.x * renderScale
              const imageStageY = offsetY + transformedAnchor.y * renderScale

              return (
                <Rect
                  key={`hitbox-${selectedRuntimeItem.id}`}
                  name="fill-drag-hitbox"
                  x={imageStageX - IMAGE_HITBOX_PADDING}
                  y={imageStageY - IMAGE_HITBOX_PADDING}
                  width={imageWidth * renderScale + IMAGE_HITBOX_PADDING * 2}
                  height={imageHeight * renderScale + IMAGE_HITBOX_PADDING * 2}
                  fill="transparent"
                  draggable
                  onMouseEnter={() => setCursor("grab")}
                  onMouseLeave={() => setCursor("default")}
                  onDragStart={() => {
                    setPositionGuideLines([])
                    setRotationGuideLine(null)
                    setCursor("grabbing")
                  }}
                  onDragMove={(e) => {
                    const node = e.target
                    const nextWorldX = (node.x() + IMAGE_HITBOX_PADDING - offsetX) / renderScale
                    const nextWorldY = (node.y() + IMAGE_HITBOX_PADDING - offsetY) / renderScale

                    const movingRect: RectBounds = {
                      x: nextWorldX,
                      y: nextWorldY,
                      width: imageWidth,
                      height: imageHeight,
                    }

                    const { snappedRect, guides } = snapRectPosition({
                      movingRect,
                      candidateRects: getLayerSnapCandidateRects(selectedRuntimeItem.id),
                      canvasRect,
                    })

                    if (
                      Math.abs(snappedRect.x - nextWorldX) > 0.001 ||
                      Math.abs(snappedRect.y - nextWorldY) > 0.001
                    ) {
                      node.x(offsetX + snappedRect.x * renderScale - IMAGE_HITBOX_PADDING)
                      node.y(offsetY + snappedRect.y * renderScale - IMAGE_HITBOX_PADDING)
                    }

                    const baseAnchor = applyInverseRuntimeTransformToPoint(
                      { x: snappedRect.x, y: snappedRect.y },
                      groupPivot,
                      groupRuntimeTransform
                    )

                    updateLayerFillState(selectedRuntimeItem.id, {
                      imageTransform: {
                        ...fillState.imageTransform,
                        x: baseAnchor.x - selectedRuntimeItem.bounds.x,
                        y: baseAnchor.y - selectedRuntimeItem.bounds.y,
                      },
                    })

                    setPositionGuideLines(toStageGuideLines(guides))
                  }}
                  onDragEnd={(e) => {
                    const node = e.target
                    const nextWorldX = (node.x() + IMAGE_HITBOX_PADDING - offsetX) / renderScale
                    const nextWorldY = (node.y() + IMAGE_HITBOX_PADDING - offsetY) / renderScale

                    const movingRect: RectBounds = {
                      x: nextWorldX,
                      y: nextWorldY,
                      width: imageWidth,
                      height: imageHeight,
                    }

                    const { snappedRect } = snapRectPosition({
                      movingRect,
                      candidateRects: getLayerSnapCandidateRects(selectedRuntimeItem.id),
                      canvasRect,
                    })

                    node.x(offsetX + snappedRect.x * renderScale - IMAGE_HITBOX_PADDING)
                    node.y(offsetY + snappedRect.y * renderScale - IMAGE_HITBOX_PADDING)

                    const baseAnchor = applyInverseRuntimeTransformToPoint(
                      { x: snappedRect.x, y: snappedRect.y },
                      groupPivot,
                      groupRuntimeTransform
                    )

                    updateLayerFillState(selectedRuntimeItem.id, {
                      imageTransform: {
                        ...fillState.imageTransform,
                        x: Math.round((baseAnchor.x - selectedRuntimeItem.bounds.x) * 100) / 100,
                        y: Math.round((baseAnchor.y - selectedRuntimeItem.bounds.y) * 100) / 100,
                      },
                    })

                    setPositionGuideLines([])
                    setCursor("grab")
                  }}
                  listening
                  perfectDrawEnabled={false}
                />
              )
            })()}

            {fillRuntimeItems.map((item) => {
              const fillState = layerFillStates.find((state) => state.layerId === item.id)
              const loadedImg = loadedImages.get(item.id)
              const containerHighlightMode = resolveLayerContainerHighlightMode(
                selectedLayerId === item.id,
                Boolean(fillState?.imageUrl),
                activeCustomizationTab
              )

              if (item.kind === "group") {
                return (
                  <FilledGroupShape
                    key={item.id}
                    item={item}
                    fillState={fillState}
                    canvasFillState={canvasFillState}
                  canvasWidth={template.canvasWidth}
                  canvasHeight={template.canvasHeight}
                    loadedImg={loadedImg?.complete ? loadedImg : undefined}
                    runtimeTransform={groupRuntimeTransforms[item.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }}
                    scale={renderScale}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    isSelected={selectedLayerId === item.id}
                    containerHighlightMode={containerHighlightMode}
                    isLayerTransformInteractive={selectedLayerId === item.id && activeCustomizationTab === "layer"}
                    onLayerTransformDragStart={handleLayerTransformDragStart}
                    onLayerTransformDragMove={handleLayerTransformDragMove}
                    onLayerTransformDragEnd={handleLayerTransformDragEnd}
                    onSelect={() => {
                      setSelectedCanvasNode(null)
                      setSelectedLayerId(item.id)
                    }}
                  />
                )
              }

              return (
                <FilledLayerShape
                  key={item.layer.id}
                  layer={item.layer}
                  fillState={fillState}
                  canvasFillState={canvasFillState}
                  canvasWidth={template.canvasWidth}
                  canvasHeight={template.canvasHeight}
                  loadedImg={loadedImg?.complete ? loadedImg : undefined}
                  scale={renderScale}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  isSelected={selectedLayerId === item.layer.id}
                  containerHighlightMode={containerHighlightMode}
                  isLayerTransformInteractive={
                    selectedLayerId === item.layer.id && activeCustomizationTab === "layer"
                  }
                  onLayerTransformDragStart={handleLayerTransformDragStart}
                  onLayerTransformDragMove={handleLayerTransformDragMove}
                  onLayerTransformDragEnd={handleLayerTransformDragEnd}
                  onSelect={() => {
                    setSelectedCanvasNode(null)
                    setSelectedLayerId(item.layer.id)
                  }}
                />
              )
            })}

            {selectedEmptyImageOverlay && (
              <Group
                clipFunc={(ctx: any) => {
                  ctx.beginPath()

                  for (const polygon of selectedEmptyImageOverlay.clipPolygons) {
                    for (let pointIndex = 0; pointIndex < polygon.length; pointIndex += 2) {
                      const pointX = polygon[pointIndex]
                      const pointY = polygon[pointIndex + 1]

                      if (pointIndex === 0) {
                        ctx.moveTo(pointX, pointY)
                      } else {
                        ctx.lineTo(pointX, pointY)
                      }
                    }

                    ctx.closePath()
                  }
                }}
              >
                <Group
                  name="fill-empty-upload-overlay"
                  onClick={(event) => {
                    event.cancelBubble = true
                    triggerEmptyLayerImageSelect()
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true
                    triggerEmptyLayerImageSelect()
                  }}
                >
                  <Rect
                    name="fill-empty-upload-overlay"
                    x={selectedEmptyImageOverlay.x}
                    y={selectedEmptyImageOverlay.y}
                    width={selectedEmptyImageOverlay.width}
                    height={selectedEmptyImageOverlay.height}
                    fill={
                      selectedEmptyImageOverlay.isDragOver
                        ? "rgba(14, 165, 233, 0.92)"
                        : "rgba(15, 23, 42, 0.84)"
                    }
                    stroke={
                      selectedEmptyImageOverlay.isDragOver
                        ? "rgba(186, 230, 253, 0.95)"
                        : "rgba(255, 255, 255, 0.45)"
                    }
                    strokeWidth={1}
                    cornerRadius={Math.min(10, Math.max(5, selectedEmptyImageOverlay.height / 2 - 2))}
                    shadowBlur={7}
                    shadowColor="rgba(15, 23, 42, 0.38)"
                    shadowOpacity={0.7}
                  />
                  <Text
                    x={selectedEmptyImageOverlay.x}
                    y={selectedEmptyImageOverlay.y}
                    width={selectedEmptyImageOverlay.width}
                    height={selectedEmptyImageOverlay.height}
                    text={selectedEmptyImageOverlay.text}
                    align="center"
                    verticalAlign="middle"
                    fill="#f8fafc"
                    fontSize={selectedEmptyImageOverlay.fontSize}
                    fontStyle="bold"
                    listening={false}
                  />
                </Group>
              </Group>
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio={!isFreeAspectRatio}
              rotationSnaps={rotationSnapAngles}
              rotationSnapTolerance={4}
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              onTransformStart={handleTransformStart}
              onTransform={handleTransform}
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

      <ToastContainer toasts={conversionToasts} onRemove={handleRemoveExportToast} />
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
  onLayerTransformDragMove,
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
  onLayerTransformDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void
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

  const rawPoints = resolveLayerShapePoints(layer)
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
          onDragMove={onLayerTransformDragMove}
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

function FilledGroupShape({
  item,
  fillState,
  canvasFillState,
  canvasWidth,
  canvasHeight,
  loadedImg,
  runtimeTransform,
  scale,
  offsetX,
  offsetY,
  isSelected,
  containerHighlightMode,
  isLayerTransformInteractive,
  onLayerTransformDragStart,
  onLayerTransformDragMove,
  onLayerTransformDragEnd,
  onSelect,
}: {
  item: FillRuntimeGroupItem
  fillState: ReturnType<typeof useFillingStore.getState>["layerFillStates"][number] | undefined
  canvasFillState: CanvasFillState
  canvasWidth: number
  canvasHeight: number
  loadedImg: HTMLImageElement | undefined
  runtimeTransform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
  scale: number
  offsetX: number
  offsetY: number
  isSelected: boolean
  containerHighlightMode: LayerContainerHighlightMode
  isLayerTransformInteractive: boolean
  onLayerTransformDragStart: () => void
  onLayerTransformDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void
  onLayerTransformDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onSelect: () => void
}) {
  const effectiveBorderWidth = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideWidth
    : (fillState?.borderWidth ?? 0)
  const effectiveBorderColor = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideColor
    : (fillState?.borderColor ?? "#000000")
  const effectiveCornerRadius = canvasFillState.cornerRadiusOverrideEnabled
    ? canvasFillState.cornerRadiusOverride
    : (fillState?.cornerRadius ?? 0)
  const parsedBorderGradient = parseLinearGradient(effectiveBorderColor)
  const borderGradientScope = canvasFillState.borderGradientScope ?? "per-layer"

  const transformedPolygons = useMemo(
    () => applyRuntimeTransformToPolygons(item.polygons, runtimeTransform),
    [item.polygons, runtimeTransform]
  )

  const displayPolygons = useMemo(
    () => transformedPolygons.map((polygon) =>
      effectiveCornerRadius > 0 ? roundedPolygonPoints(polygon, effectiveCornerRadius) : polygon
    ),
    [effectiveCornerRadius, transformedPolygons]
  )

  const stagePolygons = useMemo(
    () => displayPolygons.map((polygon) =>
      flattenPoints(polygon).map((value, index) =>
        value * scale + (index % 2 === 0 ? offsetX : offsetY)
      )
    ),
    [displayPolygons, offsetX, offsetY, scale]
  )

  const combinedHull = useMemo(
    () => computeConvexHull(transformedPolygons.flat()),
    [transformedPolygons]
  )

  const baseHull = useMemo(
    () => computeConvexHull(item.polygons.flat()),
    [item.polygons]
  )

  const groupPivot = useMemo(
    () => ({
      x: item.bounds.x + item.bounds.width / 2,
      y: item.bounds.y + item.bounds.height / 2,
    }),
    [item.bounds]
  )

  const localHull = useMemo(
    () => baseHull.map((point) => ({ x: point.x - groupPivot.x, y: point.y - groupPivot.y })),
    [baseHull, groupPivot.x, groupPivot.y]
  )

  const localHullFlat = useMemo(
    () => flattenPoints(localHull),
    [localHull]
  )

  const transformNodeX = offsetX + (groupPivot.x + runtimeTransform.x) * scale
  const transformNodeY = offsetY + (groupPivot.y + runtimeTransform.y) * scale
  const transformNodeScaleX = runtimeTransform.scaleX * scale
  const transformNodeScaleY = runtimeTransform.scaleY * scale

  const stageHull = useMemo(
    () => flattenPoints(combinedHull).map((value, index) =>
      value * scale + (index % 2 === 0 ? offsetX : offsetY)
    ),
    [combinedHull, offsetX, offsetY, scale]
  )

  const groupGradientGeometry = useMemo(() => {
    if (!parsedBorderGradient) return null

    const angleRad = (parsedBorderGradient.angle * Math.PI) / 180
    if (borderGradientScope === "unified") {
      const width = canvasWidth * scale
      const height = canvasHeight * scale
      const cx = offsetX + width / 2
      const cy = offsetY + height / 2
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
    }

    const points = displayPolygons.flat()
    if (points.length === 0) return null
    const bounds = getBoundsFromPoints(points)
    const width = bounds.width * scale
    const height = bounds.height * scale
    const cx = offsetX + bounds.x * scale + width / 2
    const cy = offsetY + bounds.y * scale + height / 2
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
    displayPolygons,
    offsetX,
    offsetY,
    parsedBorderGradient,
    scale,
  ])

  const imageRenderState = useMemo(() => {
    if (!fillState) {
      return null
    }

    const imageAnchor = {
      x: item.bounds.x + fillState.imageTransform.x,
      y: item.bounds.y + fillState.imageTransform.y,
    }
    const transformedAnchor = applyRuntimeTransformToPoint(imageAnchor, groupPivot, runtimeTransform)

    return {
      x: transformedAnchor.x,
      y: transformedAnchor.y,
      scaleX: fillState.imageTransform.scaleX * runtimeTransform.scaleX,
      scaleY: fillState.imageTransform.scaleY * runtimeTransform.scaleY,
      rotation: fillState.imageTransform.rotation + runtimeTransform.rotation,
    }
  }, [fillState, groupPivot, item.bounds, runtimeTransform])

  return (
    <>
      {stagePolygons.map((stagePolygon, index) => (
        <Line
          key={`fill-group-shape-${item.id}-${index}`}
          points={stagePolygon}
          closed
          fill={loadedImg && fillState?.imageUrl ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.18)"}
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth={1}
          onClick={onSelect}
          onTap={onSelect}
          perfectDrawEnabled={false}
        />
      ))}

      {loadedImg && fillState?.imageUrl && imageRenderState && stagePolygons.map((stagePolygon, index) => (
        <Group
          key={`fill-group-clip-${item.id}-${index}`}
          clipFunc={(ctx: any) => {
            ctx.beginPath()
            for (let pointIndex = 0; pointIndex < stagePolygon.length; pointIndex += 2) {
              const x = stagePolygon[pointIndex]
              const y = stagePolygon[pointIndex + 1]
              if (pointIndex === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            }
            ctx.closePath()
          }}
        >
          <KonvaImage
            id={index === 0 ? `fill-img-${item.id}` : undefined}
            image={loadedImg}
            x={offsetX + imageRenderState.x * scale}
            y={offsetY + imageRenderState.y * scale}
            scaleX={imageRenderState.scaleX * scale}
            scaleY={imageRenderState.scaleY * scale}
            rotation={imageRenderState.rotation}
            stroke={index === 0 && isSelected ? "#3b82f6" : undefined}
            strokeWidth={index === 0 && isSelected ? 2 / scale : 0}
            onClick={onSelect}
            onTap={onSelect}
          />
        </Group>
      ))}

      {containerHighlightMode !== "none" && stageHull.length >= 6 && (
        <Line
          points={stageHull}
          closed
          stroke={containerHighlightMode === "missing" ? "#f59e0b" : "#3b82f6"}
          strokeWidth={2}
          dash={containerHighlightMode === "missing" ? [6, 4] : undefined}
          lineJoin="round"
          listening={false}
        />
      )}

      {isLayerTransformInteractive && localHullFlat.length >= 6 && (
        <Line
          id={`fill-layer-transform-${item.id}`}
          name="fill-layer-transform-node"
          x={transformNodeX}
          y={transformNodeY}
          rotation={runtimeTransform.rotation}
          scaleX={transformNodeScaleX}
          scaleY={transformNodeScaleY}
          points={localHullFlat}
          closed
          fill="rgba(59, 130, 246, 0.001)"
          stroke="rgba(59, 130, 246, 0.001)"
          strokeWidth={8}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragStart={onLayerTransformDragStart}
          onDragMove={onLayerTransformDragMove}
          onDragEnd={onLayerTransformDragEnd}
        />
      )}

      {effectiveBorderWidth > 0 && stagePolygons.map((stagePolygon, index) => (
        <Line
          key={`fill-group-border-${item.id}-${index}`}
          points={stagePolygon}
          closed
          stroke={parsedBorderGradient ? undefined : effectiveBorderColor}
          strokeWidth={effectiveBorderWidth * scale}
          strokeLinearGradientStartPoint={parsedBorderGradient ? groupGradientGeometry?.start : undefined}
          strokeLinearGradientEndPoint={parsedBorderGradient ? groupGradientGeometry?.end : undefined}
          strokeLinearGradientColorStops={
            parsedBorderGradient
              ? parsedBorderGradient.stops.flatMap((stop) => [stop.offset, stop.color])
              : undefined
          }
          lineJoin="round"
          onClick={onSelect}
          onTap={onSelect}
        />
      ))}
    </>
  )
}

function applyInverseRuntimeTransformToPoint(
  point: { x: number; y: number },
  pivot: { x: number; y: number },
  transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
): { x: number; y: number } {
  const safeScaleX = Math.max(0.0001, Math.abs(transform.scaleX))
  const safeScaleY = Math.max(0.0001, Math.abs(transform.scaleY))
  const radian = (transform.rotation * Math.PI) / 180
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)

  const dx = point.x - pivot.x - transform.x
  const dy = point.y - pivot.y - transform.y

  const unrotatedX = dx * cos + dy * sin
  const unrotatedY = -dx * sin + dy * cos

  return {
    x: pivot.x + unrotatedX / safeScaleX,
    y: pivot.y + unrotatedY / safeScaleY,
  }
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
