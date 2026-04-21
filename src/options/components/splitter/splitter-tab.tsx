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
import { PreviewInteractionModeToggle, type PreviewInteractionMode } from "@/options/components/ui/preview-interaction-mode-toggle"
import { VisualHelpTooltip } from "@/options/components/ui/visual-help-tooltip"
import { Tooltip } from "@/options/components/tooltip"
import { MutedText, Subheading } from "@/options/components/ui/typography"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import { splitImageIntoRawSegments, convertSplitterSegments, createZipBlob } from "@/features/splitter/split-export"
import { buildSplitterSplitPlan } from "@/features/splitter/split-engine"
import { decodeFileToImageData } from "@/features/image-pipeline/decode-image-data"
import { buildActiveSplitterFormatOptions } from "@/options/stores/splitter-format-options"
import { useSplitterStore } from "@/options/stores/splitter-store"
import { SplitterWorkspaceShell } from "@/options/components/splitter/splitter-workspace-shell"
import splitterGuideHelpVideo from "url:assets/features/image-splitter_visual-guides-control.webm"

interface SplitterImageItem {
  id: string
  file: File
  previewUrl: string
  thumbnailUrl: string
  originalWidth: number
  originalHeight: number
}

const THUMB_MAX = 256
const COLOR_MATCH_GRID_FALLBACK_WARNING =
  "Color Match supports vertical or horizontal direction only. Grid was mapped to vertical."

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function SplitterTab() {
  const splitSettings = useSplitterStore((state) => state.splitSettings)
  const setSplitSettings = useSplitterStore((state) => state.setSplitSettings)
  const exportSettings = useSplitterStore((state) => state.exportSettings)

  const [images, setImages] = useState<SplitterImageItem[]>([])
  const [activeImageId, setActiveImageId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isComputingPreview, setIsComputingPreview] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [previewInteractionMode, setPreviewInteractionMode] = useState<PreviewInteractionMode>("idle")
  const [previewPlanWarningText, setPreviewPlanWarningText] = useState<string | null>(null)
  const [previewPlan, setPreviewPlan] = useState<ReturnType<typeof buildSplitterSplitPlan> | null>(null)
  const [importToastPayload, setImportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const conversionToasts = useConversionToasts([importToastPayload])
  const { getShortcutLabel } = useShortcutPreferences()

  const splitterPreviewShortcutsEnabled = images.length > 0
  useShortcutActions([
    {
      actionId: "global.preview.pan_mode",
      enabled: splitterPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("pan")
    },
    {
      actionId: "global.preview.zoom_mode",
      enabled: splitterPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("zoom")
    },
    {
      actionId: "global.preview.idle_mode",
      enabled: splitterPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("idle")
    }
  ])

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
      setPreviewPlan(null)
      setPreviewPlanWarningText(null)

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
        const visibleWarnings = nextPlan.warnings.filter(
          (warning) => warning !== COLOR_MATCH_GRID_FALLBACK_WARNING
        )
        setPreviewPlanWarningText(visibleWarnings.length > 0 ? visibleWarnings.join(" ") : null)
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

  const handleBasicGuideChange = useCallback(
    (axis: "x" | "y", sourceValue: number) => {
      if (!activeImage || splitSettings.mode !== "basic") {
        return
      }

      const axisSize = axis === "x" ? activeImage.originalWidth : activeImage.originalHeight
      if (axisSize <= 1) {
        return
      }

      const safeSourceValue = clamp(sourceValue, 1, axisSize - 1)
      if (splitSettings.basicMethod === "count") {
        const nextCount = clamp(Math.round(axisSize / safeSourceValue), 1, 4096)
        setSplitSettings(axis === "x" ? { countX: nextCount } : { countY: nextCount })
        return
      }

      if (splitSettings.basicMethod === "percent") {
        const nextPercent = clamp(Math.round((safeSourceValue / axisSize) * 100), 1, 100)
        setSplitSettings(axis === "x" ? { percentX: nextPercent } : { percentY: nextPercent })
        return
      }

      const nextPixels = clamp(Math.round(safeSourceValue), 1, 100000)
      setSplitSettings(axis === "x" ? { pixelX: nextPixels } : { pixelY: nextPixels })
    },
    [activeImage, setSplitSettings, splitSettings.basicMethod, splitSettings.mode]
  )

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
              <div className="flex items-center gap-2">
                <Subheading className="truncate">Image Splitter Workspace</Subheading>
                {splitSettings.mode === "basic" ? (
                  <VisualHelpTooltip
                    label="Visual guide controls"
                    description="In Basic mode, drag the first vertical and/or horizontal guide directly on the preview. The matching split values update automatically in Split Options."
                    webmSrc={splitterGuideHelpVideo}
                    buttonAriaLabel="Image Splitter visual guide controls help"
                    mediaAlt="Image Splitter visual guide controls"
                  />
                ) : null}
                {mismatchWarningText ? (
                  <Tooltip label="Dimension mismatch warning" content={mismatchWarningText} variant="wide2">
                    <span className="inline-flex items-center">
                      <AlertTriangle size={16} className="shrink-0 text-rose-500 dark:text-rose-400" />
                    </span>
                  </Tooltip>
                ) : null}
              </div>
              <MutedText className="text-xs">
                {images.length} image{images.length === 1 ? "" : "s"} in queue
              </MutedText>
            </div>
            <div className="flex items-center gap-2">
              <PreviewInteractionModeToggle
                mode={previewInteractionMode}
                onChange={setPreviewInteractionMode}
                zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
                panKeyHint={getShortcutLabel("global.preview.pan_mode")}
                idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
              />
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

          <SplitterPreview
            key={activeImage?.id ?? "splitter_preview_empty"}
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
            isComputing={isComputingPreview}
            previewInteractionMode={previewInteractionMode}
            splitSettings={splitSettings}
            onBasicGuideChange={handleBasicGuideChange}
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
            pinAddButtonRight
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
