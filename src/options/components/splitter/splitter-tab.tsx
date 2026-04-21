import { arrayMove } from "@dnd-kit/sortable"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Download, ImagePlus, Trash2 } from "lucide-react"

import { ToastContainer } from "@/core/components/toast-container"
import { useConversionToasts } from "@/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@/core/types"
import { buildSmartOutputFileName, reserveUniqueFileName } from "@/options/components/batch/pipeline"
import { downloadWithFilename, sleep } from "@/options/components/batch/utils"
import { ImageStrip } from "@/options/components/splicing/image-strip"
import { SplitterPreview } from "@/options/components/splitter/splitter-preview"
import { Button } from "@/options/components/ui/button"
import { EmptyDropCard } from "@/options/components/ui/empty-drop-card"
import { MutedText, Subheading } from "@/options/components/ui/typography"
import { splitImageIntoRawSegments, convertSplitterSegments, createZipBlob } from "@/features/splitter/split-export"
import { buildSplitterSplitPlan } from "@/features/splitter/split-engine"
import { decodeFileToImageData } from "@/features/image-pipeline/decode-image-data"
import { buildActiveSplitterFormatOptions } from "@/options/stores/splitter-format-options"
import { useSplitterStore } from "@/options/stores/splitter-store"
import { SplitterWorkspaceShell } from "@/options/components/splitter/splitter-workspace-shell"

interface SplitterImageItem {
  id: string
  file: File
  previewUrl: string
  thumbnailUrl: string
  originalWidth: number
  originalHeight: number
}

const THUMB_MAX = 256

function isImageLikeFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true
  }

  return /\.(png|jpe?g|webp|avif|bmp|gif|tiff?|jxl|ico)$/i.test(file.name)
}

async function createThumbnail(file: File): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, THUMB_MAX / Math.max(width, height))
  const thumbnailWidth = Math.max(1, Math.round(width * scale))
  const thumbnailHeight = Math.max(1, Math.round(height * scale))

  const canvas = new OffscreenCanvas(thumbnailWidth, thumbnailHeight)
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("Unable to initialize thumbnail context.")
  }

  context.drawImage(bitmap, 0, 0, thumbnailWidth, thumbnailHeight)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: "image/png" })
  const thumbnailUrl = URL.createObjectURL(blob)

  return {
    thumbnailUrl,
    width,
    height
  }
}

function revokeImageItemUrls(item: SplitterImageItem): void {
  URL.revokeObjectURL(item.previewUrl)
  URL.revokeObjectURL(item.thumbnailUrl)
}

export function SplitterTab() {
  const splitSettings = useSplitterStore((state) => state.splitSettings)
  const exportSettings = useSplitterStore((state) => state.exportSettings)

  const [images, setImages] = useState<SplitterImageItem[]>([])
  const [activeImageId, setActiveImageId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isComputingPreview, setIsComputingPreview] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [previewPlanWarningText, setPreviewPlanWarningText] = useState<string | null>(null)
  const [previewPlan, setPreviewPlan] = useState<ReturnType<typeof buildSplitterSplitPlan> | null>(null)
  const [importToastPayload, setImportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const conversionToasts = useConversionToasts([importToastPayload])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef<SplitterImageItem[]>([])
  const previewComputeSequenceRef = useRef(0)
  const importToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeImage = useMemo(
    () => images.find((image) => image.id === activeImageId) ?? images[0] ?? null,
    [activeImageId, images]
  )

  const mismatchWarningText = useMemo(() => {
    if (images.length <= 1) {
      return null
    }

    const first = images[0]
    if (!first) {
      return null
    }

    const mismatchCount = images.filter(
      (image) => image.originalWidth !== first.originalWidth || image.originalHeight !== first.originalHeight
    ).length

    if (mismatchCount === 0) {
      return null
    }

    return `${mismatchCount} image(s) have dimensions different from the first image (${first.originalWidth}x${first.originalHeight}). Split results may vary across the batch.`
  }, [images])

  useEffect(() => {
    if (images.length === 0) {
      setActiveImageId(null)
      return
    }

    if (!activeImageId || !images.some((entry) => entry.id === activeImageId)) {
      setActiveImageId(images[0].id)
    }
  }, [activeImageId, images])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(revokeImageItemUrls)
      if (importToastHideTimerRef.current) {
        clearTimeout(importToastHideTimerRef.current)
      }
    }
  }, [])

  const handleRemoveToast = useCallback((toastId: string) => {
    if (importToastHideTimerRef.current) {
      clearTimeout(importToastHideTimerRef.current)
      importToastHideTimerRef.current = null
    }
    setImportToastPayload((current) => (current?.id === toastId ? null : current))
  }, [])

  const pushImportToast = useCallback((payload: ConversionProgressPayload) => {
    if (importToastHideTimerRef.current) {
      clearTimeout(importToastHideTimerRef.current)
      importToastHideTimerRef.current = null
    }
    setImportToastPayload(payload)
  }, [])

  useEffect(() => {
    if (!activeImage) {
      setPreviewPlan(null)
      setPreviewPlanWarningText(null)
      return
    }

    const requestId = ++previewComputeSequenceRef.current
    let cancelled = false

    const computePreview = async () => {
      setIsComputingPreview(true)

      try {
        let imageData: ImageData | undefined
        if (splitSettings.mode === "advanced" && splitSettings.advancedMethod === "color_match") {
          const decoded = await decodeFileToImageData(activeImage.file)
          imageData = decoded.imageData
        }

        if (cancelled || previewComputeSequenceRef.current !== requestId) {
          return
        }

        const nextPlan = buildSplitterSplitPlan({
          width: activeImage.originalWidth,
          height: activeImage.originalHeight,
          settings: splitSettings,
          imageData
        })

        if (cancelled || previewComputeSequenceRef.current !== requestId) {
          return
        }

        setPreviewPlan(nextPlan)
        setPreviewPlanWarningText(nextPlan.warnings.length > 0 ? nextPlan.warnings.join(" ") : null)
      } catch (error) {
        if (cancelled || previewComputeSequenceRef.current !== requestId) {
          return
        }

        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Unable to compute splitter preview."

        setPreviewPlanWarningText(message)
      } finally {
        if (!cancelled && previewComputeSequenceRef.current === requestId) {
          setIsComputingPreview(false)
        }
      }
    }

    void computePreview()

    return () => {
      cancelled = true
    }
  }, [activeImage, splitSettings])

  const appendFiles = useCallback(async (incomingFiles: File[]) => {
    const imageFiles = incomingFiles.filter(isImageLikeFile)
    if (imageFiles.length === 0) {
      return
    }

    const toastId = `splitter_import_${Date.now()}`
    pushImportToast({
      id: toastId,
      fileName: `Importing ${imageFiles.length} images`,
      targetFormat: exportSettings.targetFormat,
      status: "processing",
      percent: 5,
      message: "Preparing image import..."
    })

    const preparedItems: SplitterImageItem[] = []

    for (let index = 0; index < imageFiles.length; index += 1) {
      const file = imageFiles[index]
      try {
        const thumbnail = await createThumbnail(file)
        preparedItems.push({
          id: `splitter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          thumbnailUrl: thumbnail.thumbnailUrl,
          originalWidth: thumbnail.width,
          originalHeight: thumbnail.height
        })
      } catch {
        // Skip files that cannot be decoded into a preview.
      }

      const percent = Math.min(88, 5 + Math.round(((index + 1) / imageFiles.length) * 83))
      pushImportToast({
        id: toastId,
        fileName: `Importing ${imageFiles.length} images`,
        targetFormat: exportSettings.targetFormat,
        status: "processing",
        percent,
        message: `Creating thumbnails ${index + 1}/${imageFiles.length}...`
      })
    }

    if (preparedItems.length === 0) {
      pushImportToast({
        id: toastId,
        fileName: "Image import failed",
        targetFormat: exportSettings.targetFormat,
        status: "error",
        percent: 100,
        message: "No valid images were imported."
      })
      importToastHideTimerRef.current = setTimeout(() => {
        setImportToastPayload((current) => (current?.id === toastId ? null : current))
        importToastHideTimerRef.current = null
      }, 3000)
      return
    }

    setImages((current) => [...current, ...preparedItems])
    if (!activeImageId && preparedItems[0]) {
      setActiveImageId(preparedItems[0].id)
    }
    setErrorText(null)

    pushImportToast({
      id: toastId,
      fileName: "Image import complete",
      targetFormat: exportSettings.targetFormat,
      status: "success",
      percent: 100,
      message: `Imported ${preparedItems.length} image${preparedItems.length === 1 ? "" : "s"}.`
    })
    importToastHideTimerRef.current = setTimeout(() => {
      setImportToastPayload((current) => (current?.id === toastId ? null : current))
      importToastHideTimerRef.current = null
    }, 2500)
  }, [activeImageId, exportSettings.targetFormat, pushImportToast])

  const handleDropFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    void appendFiles(Array.from(files))
  }, [appendFiles])

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    void appendFiles(Array.from(files))
    event.currentTarget.value = ""
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = (imageId: string) => {
    setImages((current) => {
      const next = current.filter((image) => image.id !== imageId)
      const removed = current.find((image) => image.id === imageId)
      if (removed) {
        revokeImageItemUrls(removed)
      }
      return next
    })
  }

  const handleClearAll = () => {
    setImages((current) => {
      current.forEach(revokeImageItemUrls)
      return []
    })
    setPreviewPlan(null)
    setPreviewPlanWarningText(null)
  }

  const handleReorderImage = (fromIndex: number, toIndex: number) => {
    setImages((current) => arrayMove(current, fromIndex, toIndex))
  }

  const handleExport = async () => {
    if (images.length === 0 || isExporting) {
      return
    }

    setIsExporting(true)
    setStatusText("Preparing split export...")
    setErrorText(null)

    const usedNames = new Set<string>()
    const exportFiles: Array<{ name: string; blob: Blob }> = []
    const formatOptions = buildActiveSplitterFormatOptions(exportSettings)
    let globalIndex = 1

    try {
      for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
        const image = images[imageIndex]
        setStatusText(`Splitting ${image.file.name} (${imageIndex + 1}/${images.length})...`)

        const { segments, warnings } = await splitImageIntoRawSegments({
          file: image.file,
          splitSettings
        })

        if (warnings.length > 0) {
          setPreviewPlanWarningText(warnings.join(" "))
        }

        const convertedSegments = await convertSplitterSegments({
          segments,
          targetFormat: exportSettings.targetFormat,
          quality: exportSettings.quality,
          formatOptions,
          onProgress: ({ completed, total }) => {
            setStatusText(`Encoding ${image.file.name}: ${completed}/${total}`)
          }
        })

        for (const segment of convertedSegments) {
          const rawFileName = buildSmartOutputFileName({
            pattern: exportSettings.fileNamePattern,
            originalFileName: image.file.name,
            outputExtension: segment.extension,
            index: globalIndex,
            dimensions: {
              width: segment.rect.width,
              height: segment.rect.height
            },
            now: new Date()
          })

          const uniqueName = reserveUniqueFileName(rawFileName, usedNames)
          exportFiles.push({
            name: uniqueName,
            blob: segment.blob
          })
          globalIndex += 1
        }
      }

      if (exportSettings.downloadMode === "zip") {
        setStatusText("Packaging ZIP...")
        const zipBlob = await createZipBlob(exportFiles)
        await downloadWithFilename(zipBlob, `splitter-${Date.now()}.zip`)
      } else {
        for (let index = 0; index < exportFiles.length; index += 1) {
          const file = exportFiles[index]
          setStatusText(`Downloading ${index + 1}/${exportFiles.length}...`)
          await downloadWithFilename(file.blob, file.name)
          await sleep(80)
        }
      }

      setStatusText(`Export finished: ${exportFiles.length} files.`)
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Unable to export split images."

      setErrorText(message)
      setStatusText(null)
    } finally {
      setIsExporting(false)
    }
  }

  const workspaceContent = (
    <div className="p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {images.length === 0 ? (
        <EmptyDropCard
          icon={<ImagePlus size={28} className="text-cyan-500" />}
          iconWrapperClassName="bg-cyan-100 dark:bg-cyan-900/30 border-transparent shadow-none"
          title="Drop images to start splitting"
          subtitle="Supports batch splitting with preset-based settings"
          onClick={openFilePicker}
          onDropFiles={handleDropFiles}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <Subheading className="truncate">Image Splitter Workspace</Subheading>
              <MutedText className="text-xs">
                {images.length} image{images.length === 1 ? "" : "s"} in queue
              </MutedText>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={openFilePicker} disabled={isExporting}>
                <ImagePlus size={14} />
                Add
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClearAll} disabled={isExporting}>
                <Trash2 size={14} />
                Clear
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleExport()} disabled={isExporting}>
                <Download size={14} />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>

          {mismatchWarningText ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{mismatchWarningText}</span>
              </div>
            </div>
          ) : null}

          {statusText ? (
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-900/20 dark:text-cyan-300">
              {statusText}
            </div>
          ) : null}

          {errorText ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
              {errorText}
            </div>
          ) : null}

          {isComputingPreview ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              Computing split preview...
            </div>
          ) : null}

          <SplitterPreview
            image={
              activeImage
                ? {
                    name: activeImage.file.name,
                    previewUrl: activeImage.previewUrl,
                    width: activeImage.originalWidth,
                    height: activeImage.originalHeight
                  }
                : null
            }
            plan={previewPlan}
            warningText={previewPlanWarningText}
            onDropFiles={handleDropFiles}
          />

          <ImageStrip
            images={images.map((image) => ({
              id: image.id,
              file: image.file,
              thumbnailUrl: image.thumbnailUrl,
              originalWidth: image.originalWidth,
              originalHeight: image.originalHeight
            }))}
            onRemove={handleRemoveImage}
            onReorder={handleReorderImage}
            onAddMore={openFilePicker}
            selectedImageId={activeImage?.id ?? null}
            onSelectImage={setActiveImageId}
          />
        </div>
      )}
    </div>
  )

  return (
    <SplitterWorkspaceShell
      workspace={
        <>
          {workspaceContent}
          <ToastContainer toasts={conversionToasts} onRemove={handleRemoveToast} />
        </>
      }
    />
  )
}
