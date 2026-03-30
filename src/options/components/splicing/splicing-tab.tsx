import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, ImagePlus, Trash2 } from "lucide-react"
import { zip } from "fflate"

import { APP_CONFIG } from "@/core/config"
import { ConversionProgressToastCard } from "@/core/components/conversion-progress-toast-card"
import type { ConversionProgressPayload } from "@/core/types"
import { setWasmWorkerPoolSize, terminateWasmWorkerPool } from "@/features/converter/wasm-worker-pool"
import { computeSplicingExportCanvasDimensions, exportSplicedImage } from "@/features/splicing/canvas-renderer"
import { calculateLayout, calculateProcessedSize } from "@/features/splicing/layout-engine"
import { buildSmartOutputFileName, reserveUniqueFileName } from "@/options/components/batch/pipeline"
import type {
  SplicingImageItem,
  LayoutResult,
  SplicingExportConfig,
  SplicingPreset,
  SplicingDirection
} from "@/features/splicing/types"
import { CanvasPreview } from "@/options/components/splicing/canvas-preview"
import { SplicingHeavyPreviewQualityDialog } from "@/options/components/splicing/splicing-heavy-preview-quality-dialog"
import { BatchDownloadConfirmDialog } from "@/options/components/batch/download-confirm-dialog"
import { ImageStrip } from "@/options/components/splicing/image-strip"
import { SplicingExportDialog, type SplicingExportMode } from "@/options/components/splicing/splicing-export-dialog"
import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { ScrollModeToggle } from "@/options/components/ui/scroll-mode-toggle"
import { Subheading, MutedText, LabelText } from "@/options/components/ui/typography"
import {
  useSplicingStore,
  PREVIEW_QUALITY_PERCENTS,
  normalizePreviewQualityPercent,
  resolveLayoutConfig,
  resolveCanvasStyle,
  resolveImageStyle
} from "@/options/stores/splicing-store"
import { useBatchStore } from "@/options/stores/batch-store"
import { getCanonicalExtension } from "@/core/download-utils"
import { useKeyPress } from "@/options/hooks/use-key-press"
import { PDFDocument } from "pdf-lib"

const THUMB_MAX = 256
const LARGE_IMPORT_THRESHOLD = 20

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 500)
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

function isActiveElementEditable(): boolean {
  const el = document.activeElement
  if (!el || !(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return el.isContentEditable
}

async function createZipBlob(files: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const zipData: Record<string, Uint8Array> = {}
  for (const file of files) {
    zipData[file.name] = new Uint8Array(await file.blob.arrayBuffer())
  }

  return new Promise((resolve, reject) => {
    zip(zipData, (err, data) => {
      if (err || !data) {
        reject(err ?? new Error("Unable to create ZIP"))
        return
      }
      resolve(new Blob([data as unknown as BlobPart], { type: "application/zip" }))
    })
  })
}

function shouldWarnHeavySplicingPreviewQuality(
  nextPercent: number,
  imageList: SplicingImageItem[],
  skipPreference: boolean
): boolean {
  if (skipPreference || nextPercent < 50) return false
  const cfg = APP_CONFIG.SPLICING
  if (imageList.length > cfg.HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT) return true
  const totalPixels = imageList.reduce((s, img) => s + img.originalWidth * img.originalHeight, 0)
  return totalPixels > cfg.HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS
}

export function SplicingTab() {
  const [images, setImages] = useState<SplicingImageItem[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)
  const [isScrollPan, setIsScrollPan] = useState(false)
  const [importToastPayload, setImportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [previewQualityToastPayload, setPreviewQualityToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [heavyPreviewQualityDialogOpen, setHeavyPreviewQualityDialogOpen] = useState(false)
  const [pendingPreviewQualityPercent, setPendingPreviewQualityPercent] = useState<number | null>(null)

  const onSplicingPanModeShortcut = useCallback(() => {
    if (isActiveElementEditable()) return
    setIsScrollPan(true)
  }, [])

  const onSplicingZoomModeShortcut = useCallback(() => {
    if (isActiveElementEditable()) return
    setIsScrollPan(false)
  }, [])

  const splicingPreviewShortcutsEnabled =
    images.length > 0 && !exportDialogOpen && !showDownloadConfirm && !heavyPreviewQualityDialogOpen
  useKeyPress("v", onSplicingPanModeShortcut, splicingPreviewShortcutsEnabled)
  useKeyPress("V", onSplicingPanModeShortcut, splicingPreviewShortcutsEnabled)
  useKeyPress("z", onSplicingZoomModeShortcut, splicingPreviewShortcutsEnabled)
  useKeyPress("Z", onSplicingZoomModeShortcut, splicingPreviewShortcutsEnabled)
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
  const canExportPdf = exportFormat === "jpg" || exportFormat === "png" || exportFormat === "webp"

  const storeState = useSplicingStore.getState()
  const layoutConfig = useMemo(
    () => resolveLayoutConfig(storeState),
    [preset, primaryDirection, secondaryDirection, gridCount, flowMaxSize, alignment, imageAppearanceDirection]
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

    const shouldShowProgress = imageFiles.length >= LARGE_IMPORT_THRESHOLD
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

  const handleReorder = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    
    setImages((prev) => {
      const draggedIndex = prev.findIndex((img) => img.id === draggedId)
      const targetIndex = prev.findIndex((img) => img.id === targetId)

      if (draggedIndex < 0 || targetIndex < 0) return prev

      const next = [...prev]
      const [moved] = next.splice(draggedIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
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

  const handleExport = useCallback(async () => {
    if (images.length === 0 || isExporting) return
    if (exportMode !== "single") {
      setExportDialogOpen(true)
    } else {
      void performExport("one_by_one")
    }
  }, [images.length, isExporting, exportMode])

  const performExport = useCallback(
    async (downloadMode: SplicingExportMode, forceDownloadConfirm: boolean = false) => {
      if (images.length === 0 || isExporting) return
      if (
        downloadMode === "one_by_one" &&
        !forceDownloadConfirm &&
        exportTargetCount > APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD &&
        !skipDownloadConfirm
      ) {
        setExportDialogOpen(false)
        setShowDownloadConfirm(true)
        return
      }
      setIsExporting(true)
      setExportDialogOpen(false)

      try {
        const store = useSplicingStore.getState()
        const usesWasmEncoder = store.exportFormat === "avif" || store.exportFormat === "jxl"
        if (usesWasmEncoder) {
          setWasmWorkerPoolSize(store.exportFormat, store.exportConcurrency)
        }
        const layout = resolveLayoutConfig(store)
        const canvas = resolveCanvasStyle(store)
        const imgStyle = resolveImageStyle(store)

        const config: SplicingExportConfig = {
          format: store.exportFormat,
          quality: store.exportQuality,
          pngTinyMode: store.exportPngTinyMode,
          exportMode: store.exportMode,
          trimBackground: store.exportTrimBackground
        }
        const exportTsMs = Date.now()
        const toastId = `splicing_export_${exportTsMs}`
        pushImportToast({
          id: toastId,
          fileName: `Exporting ${exportTargetCount} images`,
          targetFormat: store.exportFormat,
          status: "processing",
          percent: 2,
          message: "Preparing export..."
        })

        const blobs = await exportSplicedImage(
          images,
          layout,
          canvas,
          imgStyle,
          store.imageResize,
          store.imageFitValue,
          config,
          {
            concurrency: store.exportConcurrency,
            onProgress: ({ phase, completed, total, active, message }) => {
              const safeTotal = Math.max(1, total)
              const ratio =
                phase === "render"
                  ? Math.min(1, (completed + active * 0.55) / safeTotal)
                  : Math.min(1, completed / safeTotal)
              const percent = phase === "decode"
                ? Math.min(30, Math.round(4 + ratio * 26))
                : Math.min(78, Math.round(30 + ratio * 48))
              pushImportToast({
                id: toastId,
                fileName: `Exporting ${exportTargetCount} images`,
                targetFormat: store.exportFormat,
                status: "processing",
                percent,
                message: message
                  // phase === "render"
                  //   ? `${message} (${active}/${store.exportConcurrency} workers active)`
                  //   : message
              })
            }
          }
        )

        const ext = getCanonicalExtension(store.exportFormat)

        const imageSizes = images.map((img) => {
          const processed = calculateProcessedSize(
            img.originalWidth,
            img.originalHeight,
            store.imageResize,
            store.imageFitValue
          )
          return { width: processed.width, height: processed.height }
        })
        const exportLayout = calculateLayout(
          imageSizes,
          layout,
          canvas,
          imgStyle,
          store.imageResize,
          store.imageFitValue
        )

        const pattern = store.exportFileNamePattern.trim() || "spliced-[Index]"
        const now = new Date(exportTsMs)
        const usedExportNames = new Set<string>()

        const buildImageFileName = (i: number) => {
          const dims = computeSplicingExportCanvasDimensions(exportLayout, canvas, config, i)
          const raw = buildSmartOutputFileName({
            pattern,
            originalFileName: "image",
            dimensions: dims,
            index: i + 1,
            totalFiles: blobs.length,
            outputExtension: ext,
            now
          })
          return reserveUniqueFileName(raw, usedExportNames)
        }

        const buildPdfFileName = (i: number) => {
          const dims = computeSplicingExportCanvasDimensions(exportLayout, canvas, config, i)
          const raw = buildSmartOutputFileName({
            pattern,
            originalFileName: "image",
            dimensions: dims,
            index: i + 1,
            totalFiles: blobs.length,
            outputExtension: "pdf",
            now
          })
          return reserveUniqueFileName(raw, usedExportNames)
        }

        const buildCombinedPdfFileName = () => {
          const raw = buildSmartOutputFileName({
            pattern,
            originalFileName: "image",
            dimensions: {
              width: exportLayout.canvasWidth,
              height: exportLayout.canvasHeight
            },
            index: 1,
            totalFiles: 1,
            outputExtension: "pdf",
            now
          })
          return reserveUniqueFileName(raw, usedExportNames)
        }

        if (downloadMode === "one_by_one") {
          for (let i = 0; i < blobs.length; i++) {
            downloadBlob(blobs[i], buildImageFileName(i))
            const percent = 78 + Math.round(((i + 1) / Math.max(1, blobs.length)) * 20)
            pushImportToast({
              id: toastId,
              fileName: `Exporting ${blobs.length} images`,
              targetFormat: store.exportFormat,
              status: "processing",
              percent: Math.min(98, percent),
              message: `Downloaded ${i + 1}/${blobs.length} files...`
            })
            await new Promise((r) => setTimeout(r, 120))
          }
          pushImportToast({
            id: toastId,
            fileName: `Export complete`,
            targetFormat: store.exportFormat,
            status: "success",
            percent: 100,
            message: `Successfully exported ${blobs.length} images.`
          })
        } else if (downloadMode === "zip") {
          const zipFileName = `spliced-image-${exportTsMs}.zip`
          pushImportToast({
            id: toastId,
            fileName: zipFileName,
            targetFormat: store.exportFormat,
            status: "processing",
            percent: 85,
            message: "Packaging ZIP..."
          })
          const files: Array<{ name: string; blob: Blob }> = []
          for (let i = 0; i < blobs.length; i++) {
            files.push({ name: buildImageFileName(i), blob: blobs[i] })
          }
          const zipBlob = await createZipBlob(files)
          pushImportToast({
            id: toastId,
            fileName: zipFileName,
            targetFormat: store.exportFormat,
            status: "processing",
            percent: 96,
            message: "Starting ZIP download..."
          })
          downloadBlob(zipBlob, zipFileName)
          pushImportToast({
            id: toastId,
            fileName: zipFileName,
            targetFormat: store.exportFormat,
            status: "success",
            percent: 100,
            message: "ZIP download started"
          })
        } else if (downloadMode === "pdf" || downloadMode === "individual_pdf") {
          const convertBlobToPdfPage = async (pdfDoc: PDFDocument, blob: Blob) => {
            let image: Awaited<ReturnType<typeof pdfDoc.embedPng | typeof pdfDoc.embedJpg>>
            if (ext === "png") {
              image = await pdfDoc.embedPng(await blob.arrayBuffer())
            } else if (ext === "jpg" || ext === "jpeg") {
              image = await pdfDoc.embedJpg(await blob.arrayBuffer())
            } else {
              const canvas = new OffscreenCanvas(100, 100)
              const ctx = canvas.getContext("2d")
              if (!ctx) return

              const bitmap = await createImageBitmap(blob)
              canvas.width = bitmap.width
              canvas.height = bitmap.height
              ctx.drawImage(bitmap, 0, 0)
              bitmap.close()

              const pngBlob = await canvas.convertToBlob({ type: "image/png" })
              image = await pdfDoc.embedPng(await pngBlob.arrayBuffer())
            }

            const width = image.width as number
            const height = image.height as number
            const page = pdfDoc.addPage([width, height])
            page.drawImage(image, { x: 0, y: 0, width, height })
          }

          if (downloadMode === "individual_pdf") {
            for (let i = 0; i < blobs.length; i++) {
              const pdfDoc = await PDFDocument.create()
              await convertBlobToPdfPage(pdfDoc, blobs[i])
              const pdfBytes = await pdfDoc.save()
              const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
              downloadBlob(pdfBlob, buildPdfFileName(i))
              const percent = 78 + Math.round(((i + 1) / Math.max(1, blobs.length)) * 20)
              pushImportToast({
                id: toastId,
                fileName: `Exporting ${blobs.length} PDFs`,
                targetFormat: "pdf",
                status: "processing",
                percent: Math.min(98, percent),
                message: `Downloaded ${i + 1}/${blobs.length} PDFs...`
              })
            }
            pushImportToast({
              id: toastId,
              fileName: "Export complete",
              targetFormat: "pdf",
              status: "success",
              percent: 100,
              message: `Successfully exported ${blobs.length} PDFs.`
            })
            importToastHideTimerRef.current = setTimeout(() => {
              setImportToastPayload((current) => (current?.id === toastId ? null : current))
              importToastHideTimerRef.current = null
            }, 2500)
            return
          }

          const pdfDoc = await PDFDocument.create()
          for (const blob of blobs) {
            await convertBlobToPdfPage(pdfDoc, blob)
          }

          const pdfBytes = await pdfDoc.save()
          const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
          const singlePdfFileName = `spliced-image-${exportTsMs}.pdf`
          downloadBlob(pdfBlob, singlePdfFileName)
          pushImportToast({
            id: toastId,
            fileName: singlePdfFileName,
            targetFormat: "pdf",
            status: "success",
            percent: 100,
            message: "PDF download started"
          })
        }
        importToastHideTimerRef.current = setTimeout(() => {
          setImportToastPayload((current) => (current?.id === toastId ? null : current))
          importToastHideTimerRef.current = null
        }, 2500)
      } catch (err) {
        console.error("Export failed:", err)
        pushImportToast({
          id: `splicing_export_err_${Date.now()}`,
          fileName: "Export failed",
          targetFormat: exportFormat,
          status: "error",
          percent: 100,
          message: "Unable to export images"
        })
      } finally {
        const store = useSplicingStore.getState()
        if (store.exportFormat === "avif" || store.exportFormat === "jxl") {
          terminateWasmWorkerPool(store.exportFormat)
        }
        setIsExporting(false)
      }
    },
    [images, isExporting, exportTargetCount, skipDownloadConfirm]
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
  return (
    <SurfaceCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Subheading>Image Splicing</Subheading>
          {dimensionLabel && hasImages && (
            <MutedText className="text-xs mt-0.5">{dimensionLabel}</MutedText>
          )}
        </div>
        {hasImages && (
          <div className="flex gap-3 items-center">
            <ScrollModeToggle isScrollPan={isScrollPan} onToggle={setIsScrollPan} />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              disabled={isExporting}
            >
              <Trash2 size={14} />
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download size={14} />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {!hasImages ? (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-16 cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-all"
          onClick={openFilePicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500">
            <ImagePlus size={28} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports JPG, PNG, WebP, AVIF, and more
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <CanvasPreview
              images={images}
              layoutConfig={layoutConfig}
              canvasStyle={canvasStyle}
              imageStyle={imageStyle}
              imageResize={imageResize}
              fitValue={imageFitValue}
              isScrollPan={isScrollPan}
              onLayoutComputed={setLayoutResult}
              onPreviewRendered={handlePreviewRendered}
              onPreviewSourcesProgress={handlePreviewSourcesProgress}
              onNumberingProgress={handlePreviewNumberingProgress}
            />
          </div>

          <ImageStrip
            images={images}
            onRemove={handleRemove}
            onReorder={handleReorder}
            onAddMore={handleAddMore}
          />
          <div>
            <div className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2">
              Preview Settings
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="space-y-1">
                <LabelText className="text-xs">Preview Image Quality (%)</LabelText>
                <select
                  value={previewQualityPercent}
                  onChange={(e) => handlePreviewQualitySelectChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                >
                  {PREVIEW_QUALITY_PERCENTS.map((pct) => (
                    <option key={pct} value={pct}>
                      {pct}%
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The higher the quality, the longer the preview will take to load.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={previewShowImageNumber}
                    onChange={(e) => setPreviewShowImageNumber(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500/30"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Show image numbers on preview
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Match image order with the strip.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConversionProgressToastCard payload={importToastPayload} />
      <ConversionProgressToastCard payload={previewQualityToastPayload} />
      <SplicingExportDialog
        isOpen={exportDialogOpen}
        totalImages={exportTargetCount}
        showPdfOptions={canExportPdf}
        onExport={performExport}
        onCancel={() => setExportDialogOpen(false)}
        isLoading={isExporting}
      />
      <BatchDownloadConfirmDialog
        isOpen={showDownloadConfirm}
        count={exportTargetCount}
        onClose={() => setShowDownloadConfirm(false)}
        onConfirm={() => {
          void performExport("one_by_one", true)
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
    </SurfaceCard>
  )
}
