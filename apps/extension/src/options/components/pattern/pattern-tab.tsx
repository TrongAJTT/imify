import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, Loader2 } from "lucide-react"

import { ToastContainer } from "@imify/ui/components/toast-container"
import { toUserFacingConversionError } from "@imify/core/error-utils"
import { useConversionToasts } from "@imify/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@imify/core/types"
import { renderPatternToContext } from "@imify/features/pattern/pattern-renderer"
import { buildActivePatternFormatOptions } from "@imify/stores/stores/pattern-format-options"
import { usePatternStore } from "@imify/stores/stores/pattern-store"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences"
import { Button } from "@imify/ui/ui/button"
import { ZoomPanControl } from "@imify/ui/ui/zoom-pan-control"
import { exportPatternComposition } from "@/options/components/pattern/pattern-export-utils"
import { PatternBoundaryVisualOverlay } from "@/options/components/pattern/pattern-boundary-visual-overlay"
import {
  PreviewInteractionModeToggle,
  type PreviewInteractionMode,
} from "@imify/ui/ui/preview-interaction-mode-toggle"

const PREVIEW_PADDING = 16
const PREVIEW_MIN_ZOOM = 50
const PREVIEW_MAX_ZOOM = 2000
const PREVIEW_ZOOM_STEP = 10

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
  const [isResizing, setIsResizing] = useState(false)
  const [assetBitmapMap, setAssetBitmapMap] = useState<Map<string, ImageBitmap>>(new Map())
  const [backgroundBitmap, setBackgroundBitmap] = useState<ImageBitmap | null>(null)
  const [isRenderingPreview, setIsRenderingPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportToastPayload, setExportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const exportToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        drawGuides: !hasVisualBoundaryOverlay,
        maxPlacements: 30000,
      })
    } finally {
      setIsRenderingPreview(false)
    }
  }, [assetBitmapMap, assets, backgroundBitmap, canvas, hasVisualBoundaryOverlay, settings])

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

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = previewHostRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const newHeight = e.clientY - rect.top

      setPreviewContainerHeight(Math.max(200, newHeight))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, setPreviewContainerHeight])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Pattern Preview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeAssets.length} active asset{activeAssets.length === 1 ? "" : "s"} •
            {` ${canvas.width} x ${canvas.height}px`}
          </p>
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
            onClick={() => void handleExportPattern()}
            disabled={isExporting || activeAssets.length === 0}
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isExporting ? "Exporting..." : "Export Pattern"}
          </Button>
        </div>
      </div>

      <div
        ref={previewHostRef}
        className="relative min-h-[460px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 overflow-hidden"
        style={{ height: `${previewContainerHeight}px` }}
      >
        {activeAssets.length === 0 ? (
          <div className="h-full rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center px-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Add at least one asset in the Pattern sidebar to generate preview and start export.
            </p>
          </div>
        ) : (
          <div className="relative h-full overflow-hidden">
            <div
              className="absolute left-0 top-0 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0),linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0)] dark:bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a),linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]"
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                transform: `translate(${previewBaseOffset.x + previewPan.x}px, ${previewBaseOffset.y + previewPan.y}px) scale(${previewZoom / 100})`,
                transformOrigin: "top left",
              }}
            >
              <canvas
                ref={previewCanvasRef}
                width={Math.max(1, Math.round(canvas.width))}
                height={Math.max(1, Math.round(canvas.height))}
                style={{ width: "100%", height: "100%", display: "block" }}
              />

              {hasVisualBoundaryOverlay && (
                <div className="absolute inset-0" data-pattern-boundary-overlay-root="true">
                  <PatternBoundaryVisualOverlay
                    renderScale={renderScale}
                    displayWidth={displayWidth}
                    displayHeight={displayHeight}
                    inboundBoundary={settings.inboundBoundary}
                    outboundBoundary={settings.outboundBoundary}
                    activeTarget={activeVisualBoundary}
                    onBoundaryChange={setBoundary}
                    onActiveTargetChange={(target) => {
                      if (!target) {
                        hideVisualBoundary()
                        return
                      }

                      setActiveVisualBoundary(target)
                    }}
                  />
                </div>
              )}

              {isRenderingPreview && (
                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Loader2 size={14} className="animate-spin" />
                    Rendering preview...
                  </div>
                </div>
              )}
            </div>

            <ZoomPanControl
              zoom={previewZoom}
              panX={previewPan.x}
              panY={previewPan.y}
              onZoomChange={(value) => setPreviewZoom(clampPreviewZoom(value))}
              onPanChange={(x, y) => setPreviewPan({ x, y })}
              minZoom={PREVIEW_MIN_ZOOM}
              maxZoom={PREVIEW_MAX_ZOOM}
            />
          </div>
        )}

        <div
          ref={resizeHandleRef}
          onMouseDown={handleResizeStart}
          className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors ${
            isResizing ? "bg-sky-400 dark:bg-sky-500" : ""
          }`}
          style={{ cursor: "ns-resize" }}
        />
      </div>

      <ToastContainer toasts={conversionToasts} onRemove={handleRemoveExportToast} />
    </div>
  )
}
