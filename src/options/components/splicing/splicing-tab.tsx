import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, ImagePlus, Trash2 } from "lucide-react"
import { zip } from "fflate"

import { APP_CONFIG } from "@/core/config"
import { ConversionProgressToastCard } from "@/core/components/conversion-progress-toast-card"
import type { ConversionProgressPayload } from "@/core/types"
import { exportSplicedImage } from "@/features/splicing/canvas-renderer"
import type {
  SplicingImageItem,
  LayoutResult,
  SplicingExportConfig
} from "@/features/splicing/types"
import { CanvasPreview } from "@/options/components/splicing/canvas-preview"
import { BatchDownloadConfirmDialog } from "@/options/components/batch/download-confirm-dialog"
import { ImageStrip } from "@/options/components/splicing/image-strip"
import { SplicingExportDialog, type SplicingExportMode } from "@/options/components/splicing/splicing-export-dialog"
import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { ScrollModeToggle } from "@/options/components/ui/scroll-mode-toggle"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import {
  useSplicingStore,
  resolveLayoutConfig,
  resolveCanvasStyle,
  resolveImageStyle
} from "@/options/stores/splicing-store"
import { useBatchStore } from "@/options/stores/batch-store"
import { getCanonicalExtension } from "@/core/download-utils"
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

export function SplicingTab() {
  const [images, setImages] = useState<SplicingImageItem[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)
  const [isScrollPan, setIsScrollPan] = useState(false)
  const [importToastPayload, setImportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imagesCountRef = useRef(0)
  const importToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRenderRef = useRef<{ toastId: string; expectedCount: number } | null>(null)

  const preset = useSplicingStore((s) => s.preset)
  const primaryDirection = useSplicingStore((s) => s.primaryDirection)
  const secondaryDirection = useSplicingStore((s) => s.secondaryDirection)
  const gridCount = useSplicingStore((s) => s.gridCount)
  const flowMaxSize = useSplicingStore((s) => s.flowMaxSize)
  const alignment = useSplicingStore((s) => s.alignment)

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
  const skipDownloadConfirm = useBatchStore((state) => state.skipDownloadConfirm)
  const canExportPdf = exportFormat === "jpg" || exportFormat === "png" || exportFormat === "webp"

  const storeState = useSplicingStore.getState()
  const layoutConfig = useMemo(
    () => resolveLayoutConfig(storeState),
    [preset, primaryDirection, secondaryDirection, gridCount, flowMaxSize, alignment]
  )
  const canvasStyle = useMemo(
    () => resolveCanvasStyle(storeState),
    [canvasPadding, mainSpacing, crossSpacing, canvasBorderRadius, canvasBorderWidth, canvasBorderColor, backgroundColor]
  )
  const imageStyle = useMemo(
    () => resolveImageStyle(storeState),
    [imagePadding, imagePaddingColor, imageBorderRadius, imageBorderWidth, imageBorderColor]
  )

  useEffect(() => {
    imagesCountRef.current = images.length
  }, [images.length])

  useEffect(() => {
    return () => {
      if (importToastHideTimerRef.current) {
        clearTimeout(importToastHideTimerRef.current)
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
      pendingRenderRef.current = { toastId, expectedCount }
    }

    setImages((prev) => [...prev, ...newItems])

    if (!shouldShowProgress) {
      pendingRenderRef.current = null
    }
  }, [exportFormat, pushImportToast])

  const handlePreviewRendered = useCallback((imageCount: number) => {
    const pending = pendingRenderRef.current
    if (!pending) {
      return
    }

    if (imageCount < pending.expectedCount) {
      return
    }

    pendingRenderRef.current = null
    pushImportToast({
      id: pending.toastId,
      fileName: "Image import complete",
      targetFormat: exportFormat,
      status: "success",
      percent: 100,
      message: `Imported and rendered ${imageCount} images.`
    })

    importToastHideTimerRef.current = setTimeout(() => {
      setImportToastPayload((current) => (current?.id === pending.toastId ? null : current))
      importToastHideTimerRef.current = null
    }, 2500)
  }, [exportFormat, pushImportToast])

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

        const blobs = await exportSplicedImage(
          images,
          layout,
          canvas,
          imgStyle,
          store.imageResize,
          store.imageFitValue,
          config
        )

        const ext = getCanonicalExtension(store.exportFormat)

        if (downloadMode === "one_by_one") {
          for (let i = 0; i < blobs.length; i++) {
            const suffix = blobs.length > 1 ? `-${i + 1}` : ""
            downloadBlob(blobs[i], `spliced-image${suffix}.${ext}`)
            if (i < blobs.length - 1) {
              await new Promise((r) => setTimeout(r, 100))
            }
          }
        } else if (downloadMode === "zip") {
          const zipData: Record<string, Uint8Array> = {}
          for (let i = 0; i < blobs.length; i++) {
            const suffix = blobs.length > 1 ? `-${i + 1}` : ""
            const filename = `spliced-image${suffix}.${ext}`
            zipData[filename] = new Uint8Array(await blobs[i].arrayBuffer())
          }

          zip(zipData, (_err, data) => {
            if (data) {
              const zipBlob = new Blob([data as BlobPart], { type: "application/zip" })
              downloadBlob(zipBlob, "spliced-images.zip")
            }
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
              const suffix = blobs.length > 1 ? `-${i + 1}` : ""
              const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
              downloadBlob(pdfBlob, `spliced-image${suffix}.pdf`)
            }
            return
          }

          const pdfDoc = await PDFDocument.create()
          for (const blob of blobs) {
            await convertBlobToPdfPage(pdfDoc, blob)
          }

          const pdfBytes = await pdfDoc.save()
          const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
          downloadBlob(pdfBlob, "spliced-images.pdf")
        }
      } catch (err) {
        console.error("Export failed:", err)
      } finally {
        setIsExporting(false)
      }
    },
    [images, isExporting, exportTargetCount, skipDownloadConfirm]
  )

  const hasImages = images.length > 0
  const dimensionLabel = layoutResult
    ? `${layoutResult.canvasWidth} x ${layoutResult.canvasHeight} px`
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
            />
          </div>

          <ImageStrip
            images={images}
            onRemove={handleRemove}
            onReorder={handleReorder}
            onAddMore={handleAddMore}
          />
        </div>
      )}
      <ConversionProgressToastCard payload={importToastPayload} />
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
    </SurfaceCard>
  )
}
