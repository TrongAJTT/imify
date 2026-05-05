import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Download, ImagePlus, Loader2, Save } from "lucide-react"
import { useCanvasResizer } from "../shared/use-canvas-resizer"
import { usePanDrag } from "../shared/use-pan-drag"

import { ToastContainer } from "@imify/ui"
import { toUserFacingConversionError } from "@imify/core/error-utils"
import { useConversionToasts } from "@imify/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@imify/core/types"
import { renderPatternToContext } from "@imify/features/pattern/pattern-renderer"
import { buildActivePatternFormatOptions } from "@imify/stores/stores/pattern-format-options"
import { usePatternStore } from "@imify/stores/stores/pattern-store"
import { useShortcutActions } from "../filling/use-shortcut-actions"
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences"
import { Button } from "@imify/ui"
import { ZoomPanControl } from "@imify/ui"
import { exportPatternComposition } from "./pattern-export-utils"
import {
  PreviewInteractionModeToggle,
  type PreviewInteractionMode,
} from "@imify/ui"
import { preventWheelEvent } from "../shared/prevent-wheel-event"

const PatternBoundaryVisualOverlay = lazy(() =>
  import("./pattern-boundary-visual-overlay").then((module) => ({
    default: module.PatternBoundaryVisualOverlay,
  }))
)

const PREVIEW_PADDING = 16
const PREVIEW_MIN_ZOOM = 50
const PREVIEW_MAX_ZOOM = 2000
const PREVIEW_ZOOM_STEP = 10
// When using mouse wheel, zoom "step" should feel bigger at higher zoom levels.
const PREVIEW_ZOOM_FACTOR = 0.15

function closeBitmapMap(map: Map<string, ImageBitmap>): void {
  for (const bitmap of map.values()) {
    bitmap.close()
  }
}

async function loadBitmapFromUrl(url: string): Promise<ImageBitmap> {
  const response = await fetch(url)
  const blob = await response.blob()
  return createImageBitmap(blob)
}

export function PatternTab() {
  const [canUseBoundaryOverlay, setCanUseBoundaryOverlay] = useState(false)
  const canvas = usePatternStore((state) => state.canvas)
  const settings = usePatternStore((state) => state.settings)
  const assets = usePatternStore((state) => state.assets)
  const visualBoundaryVisibility = usePatternStore((state) => state.visualBoundaryVisibility)
  const activeVisualBoundary = usePatternStore((state) => state.activeVisualBoundary)
  const setBoundary = usePatternStore((state) => state.setBoundary)
  const setActiveVisualBoundary = usePatternStore((state) => state.setActiveVisualBoundary)
  const hideVisualBoundary = usePatternStore((state) => state.hideVisualBoundary)
  const previewContainerHeight = usePatternStore((state) => state.previewContainerHeight)
  const setPreviewContainerHeight = usePatternStore((state) => state.setPreviewContainerHeight)

  const exportFormat = usePatternStore((state) => state.exportFormat)
  const exportQuality = usePatternStore((state) => state.exportQuality)
  const exportJxlEffort = usePatternStore((state) => state.exportJxlEffort)
  const exportJxlLossless = usePatternStore((state) => state.exportJxlLossless)
  const exportJxlProgressive = usePatternStore((state) => state.exportJxlProgressive)
  const exportJxlEpf = usePatternStore((state) => state.exportJxlEpf)
  const exportAvifSpeed = usePatternStore((state) => state.exportAvifSpeed)
  const exportAvifQualityAlpha = usePatternStore((state) => state.exportAvifQualityAlpha)
  const exportAvifLossless = usePatternStore((state) => state.exportAvifLossless)
  const exportAvifSubsample = usePatternStore((state) => state.exportAvifSubsample)
  const exportAvifTune = usePatternStore((state) => state.exportAvifTune)
  const exportAvifHighAlphaQuality = usePatternStore((state) => state.exportAvifHighAlphaQuality)
  const exportMozJpegProgressive = usePatternStore((state) => state.exportMozJpegProgressive)
  const exportMozJpegChromaSubsampling = usePatternStore((state) => state.exportMozJpegChromaSubsampling)
  const exportPngTinyMode = usePatternStore((state) => state.exportPngTinyMode)
  const exportPngCleanTransparentPixels = usePatternStore((state) => state.exportPngCleanTransparentPixels)
  const exportPngAutoGrayscale = usePatternStore((state) => state.exportPngAutoGrayscale)
  const exportPngDithering = usePatternStore((state) => state.exportPngDithering)
  const exportPngDitheringLevel = usePatternStore((state) => state.exportPngDitheringLevel)
  const exportPngProgressiveInterlaced = usePatternStore((state) => state.exportPngProgressiveInterlaced)
  const exportPngOxiPngCompression = usePatternStore((state) => state.exportPngOxiPngCompression)
  const exportWebpLossless = usePatternStore((state) => state.exportWebpLossless)
  const exportWebpNearLossless = usePatternStore((state) => state.exportWebpNearLossless)
  const exportWebpEffort = usePatternStore((state) => state.exportWebpEffort)
  const exportWebpSharpYuv = usePatternStore((state) => state.exportWebpSharpYuv)
  const exportWebpPreserveExactAlpha = usePatternStore((state) => state.exportWebpPreserveExactAlpha)
  const exportBmpColorDepth = usePatternStore((state) => state.exportBmpColorDepth)
  const exportBmpDithering = usePatternStore((state) => state.exportBmpDithering)
  const exportBmpDitheringLevel = usePatternStore((state) => state.exportBmpDitheringLevel)
  const exportTiffColorMode = usePatternStore((state) => state.exportTiffColorMode)
  const { getShortcutLabel } = useShortcutPreferences()

  const previewHostRef = useRef<HTMLDivElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const [previewHostSize, setPreviewHostSize] = useState({ width: 960, height: 560 })
  const [previewZoom, setPreviewZoom] = useState(100)
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 })
  const [previewInteractionMode, setPreviewInteractionMode] = useState<PreviewInteractionMode>("zoom")
  const [assetBitmapMap, setAssetBitmapMap] = useState<Map<string, ImageBitmap>>(new Map())
  const [backgroundBitmap, setBackgroundBitmap] = useState<ImageBitmap | null>(null)
  const [isRenderingPreview, setIsRenderingPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportToastPayload, setExportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const exportToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isResizing, handleResizeStart } = useCanvasResizer({
    containerRef: previewHostRef,
    onHeightChange: setPreviewContainerHeight,
    minHeight: 200
  })

  const { pan: previewPanInternal, setPan: setPreviewPanInternal, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = usePanDrag({
    onlyWhenZoomed: false,
    currentZoom: previewZoom,
    onZoomChange: setPreviewZoom,
    onPanChange: (x, y) => setPreviewPan({ x, y })
  })

  const assetBitmapsRef = useRef<Map<string, ImageBitmap>>(new Map())
  const backgroundBitmapRef = useRef<ImageBitmap | null>(null)

  const conversionToasts = useConversionToasts([exportToastPayload])

  const activeAssets = useMemo(() => assets.filter((asset) => asset.enabled), [assets])
  const clampPreviewZoom = useCallback((value: number) => {
    return Math.max(PREVIEW_MIN_ZOOM, Math.min(PREVIEW_MAX_ZOOM, Math.round(value)))
  }, [])

  const previewShortcutsEnabled = activeAssets.length > 0

  useShortcutActions([
    {
      actionId: "global.preview.zoom_mode",
      enabled: previewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("zoom"),
    },
    {
      actionId: "global.preview.pan_mode",
      enabled: previewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("pan"),
    },
    {
      actionId: "global.preview.idle_mode",
      enabled: previewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("idle"),
    },
  ])
  const hasVisualBoundaryOverlay = useMemo(() => {
    if (activeVisualBoundary === "inbound") {
      return visualBoundaryVisibility.inbound && settings.inboundBoundary.enabled
    }

    if (activeVisualBoundary === "outbound") {
      return visualBoundaryVisibility.outbound && settings.outboundBoundary.enabled
    }

    return false
  }, [
    activeVisualBoundary,
    settings.inboundBoundary.enabled,
    settings.outboundBoundary.enabled,
    visualBoundaryVisibility.inbound,
    visualBoundaryVisibility.outbound,
  ])

  useEffect(() => {
    if (typeof window === "undefined") {
      setCanUseBoundaryOverlay(false)
      return
    }

    const protocol = window.location.protocol
    setCanUseBoundaryOverlay(protocol === "chrome-extension:" || protocol === "moz-extension:")
  }, [])

  const shouldRenderBoundaryOverlay = hasVisualBoundaryOverlay && canUseBoundaryOverlay

  const formatOptions = useMemo(
    () =>
      buildActivePatternFormatOptions({
        exportFormat,
        exportBmpColorDepth,
        exportBmpDithering,
        exportBmpDitheringLevel,
        exportJxlEffort,
        exportJxlLossless,
        exportJxlProgressive,
        exportJxlEpf,
        exportWebpLossless,
        exportWebpNearLossless,
        exportWebpEffort,
        exportWebpSharpYuv,
        exportWebpPreserveExactAlpha,
        exportAvifSpeed,
        exportAvifQualityAlpha,
        exportAvifLossless,
        exportAvifSubsample,
        exportAvifTune,
        exportAvifHighAlphaQuality,
        exportMozJpegProgressive,
        exportMozJpegChromaSubsampling,
        exportPngTinyMode,
        exportPngCleanTransparentPixels,
        exportPngAutoGrayscale,
        exportPngDithering,
        exportPngDitheringLevel,
        exportPngProgressiveInterlaced,
        exportPngOxiPngCompression,
        exportTiffColorMode,
      }),
    [
      exportFormat,
      exportBmpColorDepth,
      exportBmpDithering,
      exportBmpDitheringLevel,
      exportJxlEffort,
      exportJxlLossless,
      exportJxlProgressive,
      exportJxlEpf,
      exportWebpLossless,
      exportWebpNearLossless,
      exportWebpEffort,
      exportWebpSharpYuv,
      exportWebpPreserveExactAlpha,
      exportAvifSpeed,
      exportAvifQualityAlpha,
      exportAvifLossless,
      exportAvifSubsample,
      exportAvifTune,
      exportAvifHighAlphaQuality,
      exportMozJpegProgressive,
      exportMozJpegChromaSubsampling,
      exportPngTinyMode,
      exportPngCleanTransparentPixels,
      exportPngAutoGrayscale,
      exportPngDithering,
      exportPngDitheringLevel,
      exportPngProgressiveInterlaced,
      exportPngOxiPngCompression,
      exportTiffColorMode,
    ]
  )

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

  const replaceAssetBitmaps = useCallback((nextMap: Map<string, ImageBitmap>) => {
    const previous = assetBitmapsRef.current
    assetBitmapsRef.current = nextMap
    setAssetBitmapMap(nextMap)
    closeBitmapMap(previous)
  }, [])

  const replaceBackgroundBitmap = useCallback((nextBitmap: ImageBitmap | null) => {
    const previous = backgroundBitmapRef.current
    backgroundBitmapRef.current = nextBitmap
    setBackgroundBitmap(nextBitmap)

    if (previous) {
      previous.close()
    }
  }, [])

  useEffect(() => {
    const element = previewHostRef.current

    if (!element) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]
      if (!next) {
        return
      }

      setPreviewHostSize({
        width: Math.max(320, Math.round(next.contentRect.width)),
        height: Math.max(320, Math.round(next.contentRect.height)),
      })
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const nextMap = new Map<string, ImageBitmap>()

      for (const asset of activeAssets) {
        try {
          const bitmap = await loadBitmapFromUrl(asset.imageUrl)
          if (cancelled) {
            bitmap.close()
            continue
          }

          nextMap.set(asset.id, bitmap)
        } catch {
          // Ignore failed asset decode and continue.
        }
      }

      if (cancelled) {
        closeBitmapMap(nextMap)
        return
      }

      replaceAssetBitmaps(nextMap)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [activeAssets, replaceAssetBitmaps])

  useEffect(() => {
    let cancelled = false

    const loadBackground = async () => {
      if (canvas.backgroundType !== "image" || !canvas.backgroundImageUrl) {
        replaceBackgroundBitmap(null)
        return
      }

      try {
        const bitmap = await loadBitmapFromUrl(canvas.backgroundImageUrl)

        if (cancelled) {
          bitmap.close()
          return
        }

        replaceBackgroundBitmap(bitmap)
      } catch {
        if (!cancelled) {
          replaceBackgroundBitmap(null)
        }
      }
    }

    void loadBackground()

    return () => {
      cancelled = true
    }
  }, [canvas.backgroundImageUrl, canvas.backgroundType, replaceBackgroundBitmap])

  useEffect(() => {
    return () => {
      clearExportToastHideTimer()
      closeBitmapMap(assetBitmapsRef.current)
      assetBitmapsRef.current = new Map()

      if (backgroundBitmapRef.current) {
        backgroundBitmapRef.current.close()
        backgroundBitmapRef.current = null
      }
    }
  }, [clearExportToastHideTimer])

  useEffect(() => {
    if (activeVisualBoundary === "inbound") {
      const inboundVisible = visualBoundaryVisibility.inbound && settings.inboundBoundary.enabled
      if (!inboundVisible) {
        hideVisualBoundary()
      }
      return
    }

    if (activeVisualBoundary === "outbound") {
      const outboundVisible = visualBoundaryVisibility.outbound && settings.outboundBoundary.enabled
      if (!outboundVisible) {
        hideVisualBoundary()
      }
    }
  }, [
    activeVisualBoundary,
    hideVisualBoundary,
    settings.inboundBoundary.enabled,
    settings.outboundBoundary.enabled,
    visualBoundaryVisibility.inbound,
    visualBoundaryVisibility.outbound,
  ])

  useEffect(() => {
    const canvasElement = previewCanvasRef.current

    if (!canvasElement) {
      return
    }

    const ctx = canvasElement.getContext("2d", { alpha: true })

    if (!ctx) {
      return
    }

    setIsRenderingPreview(true)

    try {
      renderPatternToContext({
        ctx,
        canvas,
        settings,
        assets,
        loadedAssetBitmaps: assetBitmapMap,
        backgroundBitmap,
        drawGuides: !shouldRenderBoundaryOverlay,
        maxPlacements: 30000,
      })
    } finally {
      setIsRenderingPreview(false)
    }
  }, [assetBitmapMap, assets, backgroundBitmap, canvas, settings, shouldRenderBoundaryOverlay])

  const renderScale = useMemo(() => {
    const availableWidth = Math.max(1, previewHostSize.width - PREVIEW_PADDING * 2)
    const availableHeight = Math.max(1, previewHostSize.height - PREVIEW_PADDING * 2)

    return Math.min(availableWidth / Math.max(1, canvas.width), availableHeight / Math.max(1, canvas.height), 1)
  }, [canvas.height, canvas.width, previewHostSize.height, previewHostSize.width])

  const displayWidth = Math.max(1, Math.round(canvas.width * renderScale))
  const displayHeight = Math.max(1, Math.round(canvas.height * renderScale))
  const previewBaseOffset = useMemo(
    () => ({
      x: (previewHostSize.width - displayWidth) / 2,
      y: (previewHostSize.height - displayHeight) / 2,
    }),
    [displayHeight, displayWidth, previewHostSize.height, previewHostSize.width]
  )

  const handlePreviewWheel = useCallback(
    (event: WheelEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[class*="pointer-events-auto"]')) {
        return
      }

      if (previewInteractionMode === "idle") {
        return
      }

      preventWheelEvent(event)

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
      const dir = event.deltaY > 0 ? -1 : 1
      const nextZoom = clampPreviewZoom(oldZoom * (1 + PREVIEW_ZOOM_FACTOR * dir))

      if (nextZoom === oldZoom) {
        return
      }

      const host = previewHostRef.current
      if (!host) {
        setPreviewZoom(nextZoom)
        return
      }

      const rect = host.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top

      const oldScale = oldZoom / 100
      const newScale = nextZoom / 100
      if (oldScale <= 0 || newScale <= 0) {
        setPreviewZoom(nextZoom)
        return
      }

      const worldX = (pointerX - previewBaseOffset.x - previewPan.x) / oldScale
      const worldY = (pointerY - previewBaseOffset.y - previewPan.y) / oldScale

      const nextPanX = pointerX - previewBaseOffset.x - worldX * newScale
      const nextPanY = pointerY - previewBaseOffset.y - worldY * newScale

      setPreviewZoom(nextZoom)
      setPreviewPan({
        x: Math.round(nextPanX * 100) / 100,
        y: Math.round(nextPanY * 100) / 100,
      })
    },
    [
      clampPreviewZoom,
      previewBaseOffset.x,
      previewBaseOffset.y,
      previewInteractionMode,
      previewPan.x,
      previewPan.y,
      previewZoom,
    ]
  )

  useEffect(() => {
    const host = previewHostRef.current
    if (!host) {
      return
    }

    const handleNativeWheel = (event: WheelEvent) => {
      handlePreviewWheel(event)
    }

    host.addEventListener("wheel", handleNativeWheel, { passive: false })

    return () => {
      host.removeEventListener("wheel", handleNativeWheel)
    }
  }, [handlePreviewWheel])

  const handleExportPattern = async () => {
    if (isExporting) {
      return
    }

    const toastId = `pattern_export_${Date.now()}`
    const outputBaseName = `pattern-${Date.now()}`

    setIsExporting(true)
    pushExportToast({
      id: toastId,
      fileName: outputBaseName,
      targetFormat: exportFormat,
      status: "processing",
      percent: 2,
      message: "Preparing pattern export...",
    })

    try {
      await exportPatternComposition({
        canvas,
        settings,
        assets,
        exportFormat,
        exportQuality,
        formatOptions,
        outputBaseName,
        onProgress: ({ percent, message }) => {
          pushExportToast({
            id: toastId,
            fileName: outputBaseName,
            targetFormat: exportFormat,
            status: "processing",
            percent,
            message,
          })
        },
      })

      pushExportToast({
        id: toastId,
        fileName: outputBaseName,
        targetFormat: exportFormat,
        status: "success",
        percent: 100,
        message: "Pattern export completed.",
      })
      scheduleExportToastHide(toastId, 2600)
    } catch (error) {
      pushExportToast({
        id: toastId,
        fileName: outputBaseName,
        targetFormat: exportFormat,
        status: "error",
        percent: 100,
        message: toUserFacingConversionError(error, "Pattern export failed"),
      })
      scheduleExportToastHide(toastId, 4800)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-0 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <PreviewInteractionModeToggle
            mode={previewInteractionMode}
            onChange={setPreviewInteractionMode}
            zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
            panKeyHint={getShortcutLabel("global.preview.pan_mode")}
            idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
          />
          <div className="flex items-center">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleExportPattern}
              disabled={isExporting}
              className="rounded-r-none px-2"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Export Pattern
                </>
              )}
            </Button>
            <div className="rounded-l-none border-l border-sky-400/60 bg-sky-500 p-0 dark:bg-sky-600">
              <Button
                variant="primary"
                size="sm"
                aria-label="Export options"
                disabled={isExporting}
                className="rounded-l-none px-2"
              >
                <ChevronDown size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={previewHostRef}
        className="relative mx-auto overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
        style={{
          width: "100%",
          height: `${previewContainerHeight}px`,
        }}
      >
        <div
          className="relative h-full w-full flex items-center justify-center overflow-hidden"
          style={{
            transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom / 100})`,
            transformOrigin: "center center",
            touchAction: "none",
            cursor:
              previewInteractionMode === "pan"
                ? "grab"
                : previewInteractionMode === "idle"
                  ? "default"
                  : "zoom-in",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div
            className="relative bg-white shadow-xl dark:bg-slate-950"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={displayWidth}
              height={displayHeight}
              className="h-full w-full object-contain"
            />

            {shouldRenderBoundaryOverlay && (
              <div className="absolute inset-0 z-10">
                <Suspense fallback={null}>
                  <PatternBoundaryVisualOverlay
                    renderScale={renderScale}
                    displayWidth={displayWidth}
                    displayHeight={displayHeight}
                    inboundBoundary={settings.inboundBoundary}
                    outboundBoundary={settings.outboundBoundary}
                    activeTarget={activeVisualBoundary}
                    onBoundaryChange={setBoundary}
                    onActiveTargetChange={setActiveVisualBoundary}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        {isRenderingPreview && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-600/90 dark:bg-slate-900/90 dark:text-slate-200">
              <Loader2 size={12} className="animate-spin" />
              <span className="truncate">Rendering pattern preview...</span>
            </div>
          </div>
        )}

        <ZoomPanControl
          zoom={previewZoom}
          panX={previewPan.x}
          panY={previewPan.y}
          onZoomChange={(value) => setPreviewZoom(Math.max(PREVIEW_MIN_ZOOM, Math.min(PREVIEW_MAX_ZOOM, value)))}
          onPanChange={(x, y) => setPreviewPan({ x, y })}
          minZoom={PREVIEW_MIN_ZOOM}
          maxZoom={PREVIEW_MAX_ZOOM}
        />

        <div
          ref={resizeHandleRef}
          onPointerDown={handleResizeStart}
          className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors z-20 ${isResizing ? "bg-sky-400 dark:bg-sky-500" : ""
            }`}
          style={{ cursor: "ns-resize", touchAction: "none" }}
        >
          <div className={`absolute inset-x-0 bottom-0 h-1 transition-colors ${isResizing ? "bg-sky-500" : ""
            }`} />
        </div>
      </div>

      <ToastContainer toasts={conversionToasts} onRemove={handleRemoveExportToast} />
    </div>
  )
}
