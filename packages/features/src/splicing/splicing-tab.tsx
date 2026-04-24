import { arrayMove } from "@dnd-kit/sortable"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Trash2 } from "lucide-react"

import { APP_CONFIG } from "@imify/core/config"
import { ToastContainer } from "@imify/ui"
import { useConversionToasts } from "@imify/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@imify/core/types"
import { setWasmWorkerPoolSize, terminateWasmWorkerPool } from "@imify/engine/converter/wasm-worker-pool"
import { useSplicingExport } from "./use-splicing-export"
import type {
  SplicingImageItem,
  LayoutResult,
  SplicingPreset,
  SplicingDirection
} from "./types"
import { SplicingHeavyPreviewQualityDialog } from "./splicing-heavy-preview-quality-dialog"
import { BatchDownloadConfirmDialog } from "../shared/download-confirm-dialog"
import { ExportSplitButton, type ExportSplitMode } from "../shared/export-split-button"
import { SplicingWorkspace } from "./splicing-workspace"
import { SplicingWorkspaceShell } from "./splicing-workspace-shell"
import { Button, PreviewInteractionModeToggle, type PreviewInteractionMode, Subheading, MutedText } from "@imify/ui"
import {
  useSplicingStore,
  normalizePreviewQualityPercent,
  resolveLayoutConfig,
  resolveCanvasStyle,
  resolveImageStyle
} from "@imify/stores/stores/splicing-store"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useShortcutActions } from "../filling/use-shortcut-actions"
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences"
import { useClipboardPaste } from "../shared/use-clipboard-paste"
import type { SplicingExportMode } from "./use-splicing-export"

const THUMB_MAX = 256

async function generateThumbnail(
  file: File
): Promise<{ url: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, THUMB_MAX / Math.max(width, height))
  const tw = Math.max(1, Math.round(width * scale))
  const th = Math.max(1, Math.round(height * scale))

  const canvas = new OffscreenCanvas(tw, th)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    throw new Error("Cannot create thumbnail canvas context")
  }

  ctx.drawImage(bitmap, 0, 0, tw, th)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: "image/png" })
  const url = URL.createObjectURL(blob)

  return { url, width, height }
}

function maxPlacementsPerGroup(layout: LayoutResult): number {
  if (layout.groups.length === 0) return 0
  return Math.max(...layout.groups.map((g) => g.placements.length))
}

function buildGridStatsLabel(
  preset: SplicingPreset,
  primary: SplicingDirection,
  secondary: SplicingDirection,
  layout: LayoutResult | null
): string | null {
  if (!layout || layout.groups.length === 0) return null

  const groupCount = layout.groups.length
  const perGroupMax = maxPlacementsPerGroup(layout)

  if (preset === "bento") {
    const isVerticalFlow = primary === "vertical" && secondary === "vertical"
    const isFixedVertical = primary === "horizontal" && secondary === "vertical"
    if (isVerticalFlow || isFixedVertical) {
      return `${groupCount} column${groupCount === 1 ? "" : "s"}`
    }
    return `${groupCount} row${groupCount === 1 ? "" : "s"} × ${perGroupMax} column${perGroupMax === 1 ? "" : "s"}`
  }

  if (preset === "stitch_vertical") {
    return `${perGroupMax} row${perGroupMax === 1 ? "" : "s"}`
  }

  if (preset === "stitch_horizontal") {
    return `${perGroupMax} column${perGroupMax === 1 ? "" : "s"}`
  }

  if (preset === "grid") {
    return `${groupCount} row${groupCount === 1 ? "" : "s"} × ${perGroupMax} column${perGroupMax === 1 ? "" : "s"}`
  }

  return null
}

function shouldWarnHeavySplicingPreviewQuality(
  nextPercent: number,
  imageList: SplicingImageItem[],
  skipPreference: boolean
): boolean {
  if (skipPreference || nextPercent < 50) return false
  const cfg = APP_CONFIG.SPLICING
  if (imageList.length >= cfg.HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT) return true
  const totalPixels = imageList.reduce((s, img) => s + img.originalWidth * img.originalHeight, 0)
  return totalPixels >= cfg.HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS
}

interface SplicingTabProps {
  onRegisterPreviewQualityChangeHandler?: (handler: ((next: number) => void) | null) => void
}

export function SplicingTab({ onRegisterPreviewQualityChangeHandler }: SplicingTabProps) {
  const [images, setImages] = useState<SplicingImageItem[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)
  const setPreviewBentoFlowGroupCount = useSplicingStore((s) => s.setPreviewBentoFlowGroupCount)

  const handleLayoutComputed = useCallback(
    (layout: LayoutResult | null) => {
      setLayoutResult(layout)
      setPreviewBentoFlowGroupCount(
        layout && layout.groups.length > 0 ? layout.groups.length : null
      )
    },
    [setPreviewBentoFlowGroupCount]
  )

  useEffect(() => {
    if (images.length === 0) {
      setPreviewBentoFlowGroupCount(null)
    }
  }, [images.length, setPreviewBentoFlowGroupCount])

  const [previewInteractionMode, setPreviewInteractionMode] = useState<PreviewInteractionMode>("zoom")
  const [importToastPayload, setImportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [previewQualityToastPayload, setPreviewQualityToastPayload] = useState<ConversionProgressPayload | null>(null)
  const conversionToasts = useConversionToasts([importToastPayload, previewQualityToastPayload])
  const handleRemoveToast = useCallback((toastId: string) => {
    if (importToastHideTimerRef.current) {
      clearTimeout(importToastHideTimerRef.current)
      importToastHideTimerRef.current = null
    }
    if (previewQualityToastHideTimerRef.current) {
      clearTimeout(previewQualityToastHideTimerRef.current)
      previewQualityToastHideTimerRef.current = null
    }
    setImportToastPayload((current) => (current?.id === toastId ? null : current))
    setPreviewQualityToastPayload((current) => (current?.id === toastId ? null : current))
  }, [])
  const [heavyPreviewQualityDialogOpen, setHeavyPreviewQualityDialogOpen] = useState(false)
  const [pendingPreviewQualityPercent, setPendingPreviewQualityPercent] = useState<number | null>(null)
  const [pendingExportModeForConfirm, setPendingExportModeForConfirm] = useState<SplicingExportMode | null>(null)
  const { getShortcutLabel } = useShortcutPreferences()

  const splicingPreviewShortcutsEnabled =
    images.length > 0 && !showDownloadConfirm && !heavyPreviewQualityDialogOpen

  useShortcutActions([
    {
      actionId: "global.preview.pan_mode",
      enabled: splicingPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("pan"),
    },
    {
      actionId: "global.preview.zoom_mode",
      enabled: splicingPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("zoom"),
    },
    {
      actionId: "global.preview.idle_mode",
      enabled: splicingPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("idle"),
    },
  ])

  useClipboardPaste({ onFiles: (files) => void addFiles(files) })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imagesCountRef = useRef(0)
  const importToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewQualityToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRenderRef = useRef<{
    toastId: string
    expectedCount: number
    requiresNumbering: boolean
    previewDone: boolean
    numberingDone: boolean
  } | null>(null)
  const previewQualityRenderRef = useRef<{
    toastId: string
    expectedCount: number
    requiresNumbering: boolean
    previewDone: boolean
    numberingDone: boolean
    qualityPercent: number
  } | null>(null)

  const preset = useSplicingStore((s) => s.preset)
  const primaryDirection = useSplicingStore((s) => s.primaryDirection)
  const secondaryDirection = useSplicingStore((s) => s.secondaryDirection)
  const gridCount = useSplicingStore((s) => s.gridCount)
  const flowMaxSize = useSplicingStore((s) => s.flowMaxSize)
  const flowSplitOverflow = useSplicingStore((s) => s.flowSplitOverflow)
  const alignment = useSplicingStore((s) => s.alignment)
  const imageAppearanceDirection = useSplicingStore((s) => s.imageAppearanceDirection)

  const canvasPadding = useSplicingStore((s) => s.canvasPadding)
  const mainSpacing = useSplicingStore((s) => s.mainSpacing)
  const crossSpacing = useSplicingStore((s) => s.crossSpacing)
  const canvasBorderRadius = useSplicingStore((s) => s.canvasBorderRadius)
  const canvasBorderWidth = useSplicingStore((s) => s.canvasBorderWidth)
  const canvasBorderColor = useSplicingStore((s) => s.canvasBorderColor)
  const backgroundColor = useSplicingStore((s) => s.backgroundColor)

  const imageResize = useSplicingStore((s) => s.imageResize)
  const imageFitValue = useSplicingStore((s) => s.imageFitValue)
  const imagePadding = useSplicingStore((s) => s.imagePadding)
  const imagePaddingColor = useSplicingStore((s) => s.imagePaddingColor)
  const imageBorderRadius = useSplicingStore((s) => s.imageBorderRadius)
  const imageBorderWidth = useSplicingStore((s) => s.imageBorderWidth)
  const imageBorderColor = useSplicingStore((s) => s.imageBorderColor)

  const exportFormat = useSplicingStore((s) => s.exportFormat)
  const exportQuality = useSplicingStore((s) => s.exportQuality)
  const exportPngTinyMode = useSplicingStore((s) => s.exportPngTinyMode)
  const exportMode = useSplicingStore((s) => s.exportMode)
  const exportTrimBackground = useSplicingStore((s) => s.exportTrimBackground)
  const exportConcurrency = useSplicingStore((s) => s.exportConcurrency)
  const previewQualityPercent = useSplicingStore((s) => s.previewQualityPercent)
  const previewShowImageNumber = useSplicingStore((s) => s.previewShowImageNumber)
  const setPreviewQualityPercent = useSplicingStore((s) => s.setPreviewQualityPercent)
  const setPreviewShowImageNumber = useSplicingStore((s) => s.setPreviewShowImageNumber)
  const skipDownloadConfirm = useBatchStore((state) => state.skipDownloadConfirm)
  const skipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.skipSplicingHeavyPreviewQualityWarning
  )
  const canExportPdf =
    exportFormat === "jpg" || exportFormat === "mozjpeg" || exportFormat === "png" || exportFormat === "webp"

  const storeState = useSplicingStore.getState()
  const layoutConfig = useMemo(
    () => resolveLayoutConfig(storeState),
    [
      preset,
      primaryDirection,
      secondaryDirection,
      gridCount,
      flowMaxSize,
      flowSplitOverflow,
      alignment,
      imageAppearanceDirection
    ]
  )
  const canvasStyle = useMemo(
    () => resolveCanvasStyle(storeState),
    [canvasPadding, mainSpacing, crossSpacing, canvasBorderRadius, canvasBorderWidth, canvasBorderColor, backgroundColor]
  )
  const imageStyle = useMemo(
    () => resolveImageStyle(storeState),
    [imagePadding, imagePaddingColor, imageBorderRadius, imageBorderWidth, imageBorderColor]
  )

  const previewImagesTotalPixels = useMemo(
    () => images.reduce((s, img) => s + img.originalWidth * img.originalHeight, 0),
    [images]
  )

  const pushPreviewQualityToast = useCallback((payload: ConversionProgressPayload) => {
    if (previewQualityToastHideTimerRef.current) {
      clearTimeout(previewQualityToastHideTimerRef.current)
      previewQualityToastHideTimerRef.current = null
    }
    setPreviewQualityToastPayload(payload)
  }, [])

  const applyPreviewQualityChange = useCallback(
    (rawNext: number) => {
      const next = normalizePreviewQualityPercent(rawNext)
      const prev = useSplicingStore.getState().previewQualityPercent
      if (next === prev) {
        return
      }
      setPreviewQualityPercent(next)
      if (images.length === 0) {
        return
      }
      const toastId = `splicing_preview_quality_${Date.now()}`
      previewQualityRenderRef.current = {
        toastId,
        expectedCount: images.length,
        requiresNumbering: previewShowImageNumber,
        previewDone: false,
        numberingDone: !previewShowImageNumber,
        qualityPercent: next
      }
      pushPreviewQualityToast({
        id: toastId,
        fileName: `Preview quality ${next}%`,
        targetFormat: exportFormat,
        status: "processing",
        percent: 5,
        message: "Rebuilding preview images..."
      })
    },
    [images.length, previewShowImageNumber, exportFormat, setPreviewQualityPercent, pushPreviewQualityToast]
  )

  const handlePreviewQualitySelectChange = useCallback(
    (raw: number) => {
      const next = normalizePreviewQualityPercent(raw)
      if (!shouldWarnHeavySplicingPreviewQuality(next, images, skipSplicingHeavyPreviewQualityWarning)) {
        applyPreviewQualityChange(next)
        return
      }
      setPendingPreviewQualityPercent(next)
      setHeavyPreviewQualityDialogOpen(true)
    },
    [images, skipSplicingHeavyPreviewQualityWarning, applyPreviewQualityChange]
  )

  useEffect(() => {
    onRegisterPreviewQualityChangeHandler?.(handlePreviewQualitySelectChange)
    return () => {
      onRegisterPreviewQualityChangeHandler?.(null)
    }
  }, [onRegisterPreviewQualityChangeHandler, handlePreviewQualitySelectChange])

  const confirmHeavyPreviewQuality = useCallback(() => {
    if (pendingPreviewQualityPercent != null) {
      applyPreviewQualityChange(pendingPreviewQualityPercent)
    }
    setHeavyPreviewQualityDialogOpen(false)
    setPendingPreviewQualityPercent(null)
  }, [pendingPreviewQualityPercent, applyPreviewQualityChange])

  const cancelHeavyPreviewQuality = useCallback(() => {
    setHeavyPreviewQualityDialogOpen(false)
    setPendingPreviewQualityPercent(null)
  }, [])

  useEffect(() => {
    if (images.length === 0 && heavyPreviewQualityDialogOpen) {
      cancelHeavyPreviewQuality()
    }
  }, [images.length, heavyPreviewQualityDialogOpen, cancelHeavyPreviewQuality])

  useEffect(() => {
    if (images.length > 0) return
    previewQualityRenderRef.current = null
    if (previewQualityToastHideTimerRef.current) {
      clearTimeout(previewQualityToastHideTimerRef.current)
      previewQualityToastHideTimerRef.current = null
    }
    setPreviewQualityToastPayload(null)
  }, [images.length])

  useEffect(() => {
    imagesCountRef.current = images.length
  }, [images.length])

  useEffect(() => {
    return () => {
      if (importToastHideTimerRef.current) {
        clearTimeout(importToastHideTimerRef.current)
      }
      if (previewQualityToastHideTimerRef.current) {
        clearTimeout(previewQualityToastHideTimerRef.current)
      }
    }
  }, [])

  const pushImportToast = useCallback((payload: ConversionProgressPayload) => {
    if (importToastHideTimerRef.current) {
      clearTimeout(importToastHideTimerRef.current)
      importToastHideTimerRef.current = null
    }
    setImportToastPayload(payload)
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    const shouldShowProgress = true
    const toastId = `splicing_import_${Date.now()}`
    if (shouldShowProgress) {
      pushImportToast({
        id: toastId,
        fileName: `Importing ${imageFiles.length} images`,
        targetFormat: exportFormat,
        status: "processing",
        percent: 5,
        message: "Preparing image import..."
      })
    }

    const newItems: SplicingImageItem[] = []
    let processedCount = 0
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      try {
        const thumb = await generateThumbnail(file)
        newItems.push({
          id: `splice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          thumbnailUrl: thumb.url,
          originalWidth: thumb.width,
          originalHeight: thumb.height
        })
      } catch {
        // Skip invalid files
      }
      processedCount = i + 1

      if (shouldShowProgress) {
        const percent = Math.min(78, 5 + Math.round((processedCount / imageFiles.length) * 73))
        pushImportToast({
          id: toastId,
          fileName: `Importing ${imageFiles.length} images`,
          targetFormat: exportFormat,
          status: "processing",
          percent,
          message: `Creating thumbnails ${processedCount}/${imageFiles.length}...`
        })
      }
    }

    if (newItems.length === 0) {
      if (shouldShowProgress) {
        pushImportToast({
          id: toastId,
          fileName: "Image import failed",
          targetFormat: exportFormat,
          status: "error",
          percent: 100,
          message: "No valid images were imported."
        })
        importToastHideTimerRef.current = setTimeout(() => {
          setImportToastPayload((current) => (current?.id === toastId ? null : current))
          importToastHideTimerRef.current = null
        }, 3000)
      }
      return
    }

    if (shouldShowProgress) {
      pushImportToast({
        id: toastId,
        fileName: `Importing ${imageFiles.length} images`,
        targetFormat: exportFormat,
        status: "processing",
        percent: 85,
        message: "Rendering preview canvas..."
      })
    }

    const expectedCount = imagesCountRef.current + newItems.length
    if (shouldShowProgress) {
      pendingRenderRef.current = {
        toastId,
        expectedCount,
        requiresNumbering: previewShowImageNumber,
        previewDone: false,
        numberingDone: !previewShowImageNumber
      }
    }

    setImages((prev) => [...prev, ...newItems])

    if (!shouldShowProgress) {
      pendingRenderRef.current = null
    }
  }, [exportFormat, previewShowImageNumber, pushImportToast])

  const finalizeImportToast = useCallback((toastId: string, imageCount: number) => {
    pendingRenderRef.current = null
    pushImportToast({
      id: toastId,
      fileName: "Image import complete",
      targetFormat: exportFormat,
      status: "success",
      percent: 100,
      message: `Imported and rendered ${imageCount} images.`
    })

    importToastHideTimerRef.current = setTimeout(() => {
      setImportToastPayload((current) => (current?.id === toastId ? null : current))
      importToastHideTimerRef.current = null
    }, 2500)
  }, [exportFormat, pushImportToast])

  const finalizePreviewQualityToast = useCallback(
    (toastId: string, qualityPercent: number) => {
      previewQualityRenderRef.current = null
      pushPreviewQualityToast({
        id: toastId,
        fileName: `Preview quality ${qualityPercent}%`,
        targetFormat: exportFormat,
        status: "success",
        percent: 100,
        message: "Preview updated."
      })

      previewQualityToastHideTimerRef.current = setTimeout(() => {
        setPreviewQualityToastPayload((current) => (current?.id === toastId ? null : current))
        previewQualityToastHideTimerRef.current = null
      }, 2500)
    },
    [exportFormat, pushPreviewQualityToast]
  )

  const handlePreviewSourcesProgress = useCallback(
    (p: { completed: number; total: number }) => {
      const pending = previewQualityRenderRef.current
      if (!pending) {
        return
      }
      const ratio = p.total > 0 ? p.completed / p.total : 0
      const percent = Math.min(88, 5 + Math.round(ratio * 83))
      pushPreviewQualityToast({
        id: pending.toastId,
        fileName: `Preview quality ${pending.qualityPercent}%`,
        targetFormat: exportFormat,
        status: "processing",
        percent,
        message:
          p.total > 0 ? `Scaling images ${p.completed}/${p.total}...` : "Rebuilding preview images..."
      })
    },
    [exportFormat, pushPreviewQualityToast]
  )

  const handlePreviewRendered = useCallback(
    (imageCount: number) => {
      const importPending = pendingRenderRef.current
      if (importPending && imageCount >= importPending.expectedCount) {
        importPending.previewDone = true
        if (!importPending.requiresNumbering || importPending.numberingDone) {
          finalizeImportToast(importPending.toastId, imageCount)
        } else {
          pushImportToast({
            id: importPending.toastId,
            fileName: `Importing ${importPending.expectedCount} images`,
            targetFormat: exportFormat,
            status: "processing",
            percent: 90,
            message: "Preparing image numbers..."
          })
        }
      }

      const qualityPending = previewQualityRenderRef.current
      if (qualityPending && imageCount >= qualityPending.expectedCount) {
        qualityPending.previewDone = true
        if (!qualityPending.requiresNumbering || qualityPending.numberingDone) {
          finalizePreviewQualityToast(qualityPending.toastId, qualityPending.qualityPercent)
        } else {
          pushPreviewQualityToast({
            id: qualityPending.toastId,
            fileName: `Preview quality ${qualityPending.qualityPercent}%`,
            targetFormat: exportFormat,
            status: "processing",
            percent: 90,
            message: "Preparing image numbers..."
          })
        }
      }
    },
    [exportFormat, finalizeImportToast, finalizePreviewQualityToast, pushImportToast, pushPreviewQualityToast]
  )

  const handlePreviewNumberingProgress = useCallback(
    (payload: { status: "processing" | "done"; completed: number; total: number }) => {
 const importPending = pendingRenderRef.current
      if (importPending?.requiresNumbering) {
        if (payload.status === "processing") {
          const ratio = payload.total > 0 ? payload.completed / payload.total : 0
          const percent = Math.min(99, 90 + Math.round(ratio * 9))
          pushImportToast({
            id: importPending.toastId,
            fileName: `Importing ${importPending.expectedCount} images`,
            targetFormat: exportFormat,
            status: "processing",
            percent,
            message: `Preparing image numbers ${payload.completed}/${payload.total}...`
          })
        } else {
          importPending.numberingDone = true
          if (importPending.previewDone) {
            finalizeImportToast(importPending.toastId, importPending.expectedCount)
          }
        }
      }

      const qualityPending = previewQualityRenderRef.current
      if (qualityPending?.requiresNumbering) {
        if (payload.status === "processing") {
          const ratio = payload.total > 0 ? payload.completed / payload.total : 0
          const percent = Math.min(99, 90 + Math.round(ratio * 9))
          pushPreviewQualityToast({
            id: qualityPending.toastId,
            fileName: `Preview quality ${qualityPending.qualityPercent}%`,
            targetFormat: exportFormat,
            status: "processing",
            percent,
            message: `Preparing image numbers ${payload.completed}/${payload.total}...`
          })
        } else {
          qualityPending.numberingDone = true
          if (qualityPending.previewDone) {
            finalizePreviewQualityToast(qualityPending.toastId, qualityPending.qualityPercent)
          }
        }
      }
    },
    [exportFormat, finalizeImportToast, finalizePreviewQualityToast, pushImportToast, pushPreviewQualityToast]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      void addFiles(files)
    },
    [addFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      void addFiles(files)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [addFiles]
  )

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id)
      if (removed) URL.revokeObjectURL(removed.thumbnailUrl)
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setImages((prev) => arrayMove(prev, fromIndex, toIndex))
  }, [])

  const handleAddMore = useCallback(() => {
    openFilePicker()
  }, [openFilePicker])

  const handleClearAll = useCallback(() => {
    for (const img of images) {
      URL.revokeObjectURL(img.thumbnailUrl)
    }
    setImages([])
    setLayoutResult(null)
  }, [images])
  const exportTargetCount = exportMode === "single"
    ? 1
    : layoutResult?.groups.length ?? 0
  const { performExport } = useSplicingExport({
    images,
    exportTargetCount,
    isExporting,
    skipDownloadConfirm,
    pushToast: pushImportToast,
    setImportToastPayload,
    importToastHideTimerRef,
    setIsExporting,
    setShowDownloadConfirm,
    setPendingExportModeForConfirm
  })

  const primaryExportMode: "zip" | "one_by_one" = exportMode === "single" ? "one_by_one" : "zip"
  const handleExportAction = useCallback(
    async (mode: ExportSplitMode) => {
      await performExport(mode as SplicingExportMode)
    },
    [performExport]
  )

  const hasImages = images.length > 0
  const gridStatsLabel = useMemo(
    () => buildGridStatsLabel(preset, primaryDirection, secondaryDirection, layoutResult),
    [preset, primaryDirection, secondaryDirection, layoutResult]
  )
  const dimensionLabel = layoutResult
    ? `${layoutResult.canvasWidth} x ${layoutResult.canvasHeight} px${
        gridStatsLabel ? ` · ${gridStatsLabel}` : ""
      }`
    : null
  const workspaceContent = (
    <div className="p-6">
      {hasImages ? (
        <div className="flex items-center justify-between mb-4">
          <div>
            <Subheading>Image Splicing</Subheading>
            {dimensionLabel && (
              <MutedText className="text-xs mt-0.5">{dimensionLabel}</MutedText>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <PreviewInteractionModeToggle
              mode={previewInteractionMode}
              onChange={setPreviewInteractionMode}
              zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
              panKeyHint={getShortcutLabel("global.preview.pan_mode")}
              idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              disabled={isExporting}
            >
              <Trash2 size={14} />
              Clear
            </Button>
            <ExportSplitButton
              onExport={handleExportAction}
              isLoading={isExporting}
              primaryMode={primaryExportMode}
              oneByOneCount={exportTargetCount}
              showPdfOptions={canExportPdf}
            />
          </div>
        </div>
      ) : null}

      <SplicingWorkspace
        hasImages={hasImages}
        fileInputRef={fileInputRef}
        images={images}
        layoutConfig={layoutConfig}
        canvasStyle={canvasStyle}
        imageStyle={imageStyle}
        imageResize={imageResize}
        imageFitValue={imageFitValue}
        previewInteractionMode={previewInteractionMode}
        previewQualityPercent={previewQualityPercent}
        previewShowImageNumber={previewShowImageNumber}
        onLayoutComputed={handleLayoutComputed}
        onPreviewRendered={handlePreviewRendered}
        onPreviewSourcesProgress={handlePreviewSourcesProgress}
        onPreviewNumberingProgress={handlePreviewNumberingProgress}
        onOpenFilePicker={openFilePicker}
        onDropFiles={handleDrop}
        onFileInput={handleFileInput}
        onRemoveImage={handleRemove}
        onReorderImage={handleReorder}
        onAddMore={handleAddMore}
        onPreviewQualityChange={handlePreviewQualitySelectChange}
        onPreviewShowImageNumberChange={setPreviewShowImageNumber}
      />
      <ToastContainer toasts={conversionToasts} onRemove={handleRemoveToast} />
      <BatchDownloadConfirmDialog
        isOpen={showDownloadConfirm}
        count={exportTargetCount}
        onClose={() => {
          setShowDownloadConfirm(false)
          setPendingExportModeForConfirm(null)
        }}
        onConfirm={() => {
          const mode = pendingExportModeForConfirm ?? "one_by_one"
          void performExport(mode, true)
        }}
      />
      <SplicingHeavyPreviewQualityDialog
        isOpen={heavyPreviewQualityDialogOpen}
        nextQualityPercent={pendingPreviewQualityPercent ?? previewQualityPercent}
        imageCount={images.length}
        totalPixels={previewImagesTotalPixels}
        onClose={cancelHeavyPreviewQuality}
        onConfirm={confirmHeavyPreviewQuality}
      />
    </div>
  )

  return (
    <SplicingWorkspaceShell workspace={workspaceContent} />
  )
}



