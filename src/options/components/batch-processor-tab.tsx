import JSZip from "jszip"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable"

import { toUserFacingConversionError } from "@/core/error-utils"
import { ConversionProgressToastCard } from "@/core/components/conversion-progress-toast-card"
import type { ConversionProgressPayload, FormatConfig } from "@/core/types"
import { applyExifPolicy } from "@/features/converter/exif"
import { convertImage } from "@/features/converter"
import { convertImageToPdf, mergeImagesToPdf } from "@/features/converter/pdf-engine"
import { BatchActionBar } from "@/options/components/batch/action-bar"
import { BatchQueueGrid } from "@/options/components/batch/queue-grid"
import { BatchSummaryCard } from "@/options/components/batch/summary-card"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { BodyText, Subheading, MutedText } from "@/options/components/ui/typography"
import type {
  BatchExportAction,
  BatchQueueItem,
  BatchRunMode,
  BatchSummary
} from "@/options/components/batch/types"
import { BatchUploadDropzone } from "@/options/components/batch/upload-dropzone"
import {
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_QUEUE_BYTES,
  downloadWithFilename,
  formatBytes,
  notifyProgress,
  sleep,
  toMb,
  withBatchResize
} from "@/options/components/batch/utils"
import { buildSmartOutputFileName, readImageDimensions } from "@/options/components/batch/pipeline"
import { applyWatermarkToImageBlob } from "@/options/components/batch/watermark"
import { BatchDownloadConfirmDialog } from "@/options/components/batch/download-confirm-dialog"
import { useBatchStore } from "@/options/stores/batch-store"

function toOutputFilenameWithExtension(nameOrBase: string, extension: string): string {
  const base = nameOrBase.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extension}`
}

function toWebKitZipFilename(nameOrBase: string): string {
  void nameOrBase
  return "favicon_kit.zip"
}

function getBatchZipTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

function extensionFromMimeType(type: string): string {
  if (type === "image/jpeg") {
    return "jpg"
  }
  if (type === "image/svg+xml") {
    return "svg"
  }

  const matched = /^image\/([a-z0-9.+-]+)$/i.exec(type)
  return matched?.[1]?.toLowerCase() || "png"
}

export function BatchProcessorTab() {
  const targetFormat = useBatchStore((state) => state.targetFormat)
  const concurrency = useBatchStore((state) => state.concurrency)
  const quality = useBatchStore((state) => state.quality)
  const icoSizes = useBatchStore((state) => state.icoSizes)
  const icoGenerateWebIconKit = useBatchStore((state) => state.icoGenerateWebIconKit)
  const resizeMode = useBatchStore((state) => state.resizeMode)
  const resizeValue = useBatchStore((state) => state.resizeValue)
  const paperSize = useBatchStore((state) => state.paperSize)
  const dpi = useBatchStore((state) => state.dpi)
  const stripExif = useBatchStore((state) => state.stripExif)
  const fileNamePattern = useBatchStore((state) => state.fileNamePattern)
  const watermark = useBatchStore((state) => state.watermark)
  const skipDownloadConfirm = useBatchStore((state) => state.skipDownloadConfirm)
  const setBatchIsRunning = useBatchStore((state) => state.setIsRunning)

  const [queue, setQueue] = useState<BatchQueueItem[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [paused, setPaused] = useState(false)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [activeExportAction, setActiveExportAction] = useState<BatchExportAction | null>(null)
  const [exportToastPayload, setExportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [batchToastPayload, setBatchToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [isPdfSplitOpen, setIsPdfSplitOpen] = useState(false)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const cancelRef = useRef(false)
  const pauseRef = useRef(false)
  const pdfSplitRef = useRef<HTMLDivElement>(null)
  const exportToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const clearExportToastHideTimer = () => {
    if (!exportToastHideTimerRef.current) {
      return
    }

    clearTimeout(exportToastHideTimerRef.current)
    exportToastHideTimerRef.current = null
  }

  const pushExportToast = (payload: ConversionProgressPayload) => {
    clearExportToastHideTimer()
    setExportToastPayload(payload)

    if (payload.status === "success" || payload.status === "error") {
      exportToastHideTimerRef.current = setTimeout(() => {
        setExportToastPayload(null)
        exportToastHideTimerRef.current = null
      }, 3000)
    }
  }

  const requestCancel = () => {
    setCancelRequested(true)
    cancelRef.current = true
  }

  const togglePause = () => {
    setPaused((current) => !current)
  }

  useEffect(() => {
    pauseRef.current = paused
  }, [paused])

  useEffect(() => {
    return () => {
      clearExportToastHideTimer()
    }
  }, [])

  useEffect(() => {
    setBatchIsRunning(isRunning)
  }, [isRunning, setBatchIsRunning])

  useEffect(() => {
    if (!isPdfSplitOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!pdfSplitRef.current) {
        return
      }

      if (!pdfSplitRef.current.contains(event.target as Node)) {
        setIsPdfSplitOpen(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isPdfSplitOpen])

  const effectiveConfig = useMemo(() => {
    const baseConfig: FormatConfig = {
      id: `batch_${targetFormat}`,
      name: `Batch ${targetFormat.toUpperCase()}`,
      format: targetFormat,
      enabled: true,
      quality,
      resize: { mode: "none" }
    }

    return withBatchResize(
      baseConfig,
      resizeMode,
      quality,
      icoSizes,
      icoGenerateWebIconKit,
      resizeValue,
      paperSize,
      dpi
    )
  }, [
    targetFormat,
    resizeMode,
    quality,
    icoSizes,
    icoGenerateWebIconKit,
    resizeValue,
    paperSize,
    dpi
  ])

  const setItemState = (
    id: string,
    partial: Partial<Pick<BatchQueueItem, "status" | "percent" | "message" | "outputBlob" | "outputFileName">>
  ) => {
    setQueue((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...partial
            }
          : item
      )
    )
  }

  const removeItem = (id: string) => {
    setQueue((current) => current.filter((item) => item.id !== id))
  }

  const appendImageFiles = (inputFiles: File[]) => {
    if (!inputFiles.length) {
      return
    }

    const nextItems: BatchQueueItem[] = inputFiles
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => {
        const tooLarge = file.size > MAX_FILE_SIZE_BYTES

        return {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          status: tooLarge ? "error" : "queued",
          percent: tooLarge ? 100 : 0,
          message: tooLarge
            ? `Skipped: file is larger than ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB limit`
            : undefined
        }
      })

    if (!nextItems.length) {
      return
    }

    setQueue((current) => [...current, ...nextItems])
  }

  const appendFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    appendImageFiles(Array.from(files))
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && !isRunning) {
      setQueue((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items
      if (!clipboardItems?.length) {
        return
      }

      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName.toLowerCase()
        const isEditableTarget =
          tagName === "input" ||
          tagName === "textarea" ||
          target.isContentEditable ||
          Boolean(target.closest("[contenteditable='true']"))

        if (isEditableTarget) {
          return
        }
      }

      const clipboardImages = Array.from(clipboardItems)
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item, index) => {
          const blob = item.getAsFile()
          if (!blob) {
            return null
          }

          const timestamp = Date.now() + index
          const extension = extensionFromMimeType(blob.type)
          const generatedName = `cb-${timestamp}.${extension}`

          return new File([blob], generatedName, {
            type: blob.type || `image/${extension}`,
            lastModified: timestamp
          })
        })
        .filter((file): file is File => Boolean(file))

      if (!clipboardImages.length) {
        return
      }

      event.preventDefault()
      appendImageFiles(clipboardImages)
    }

    window.addEventListener("paste", onPaste)

    return () => {
      window.removeEventListener("paste", onPaste)
    }
  }, [])

  const processItem = async (
    item: BatchQueueItem,
    config: FormatConfig,
    itemIndex: number
  ): Promise<"success" | "error"> => {
    setItemState(item.id, {
      status: "processing",
      percent: 10,
      message: undefined,
      outputBlob: undefined,
      outputFileName: undefined
    })
    await notifyProgress(item.id, item.file.name, config, "processing", 10)

    try {
      const sourceBlob = await applyWatermarkToImageBlob(item.file, watermark)

      const converted = await convertImage({
        sourceBlob,
        config
      })

      const normalizedBlob = await applyExifPolicy({
        sourceBlob: item.file,
        outputBlob: converted.blob,
        stripExif
      })

      const dimensions =
        (await readImageDimensions(normalizedBlob)) ||
        (await readImageDimensions(item.file))

      const outputExtension = converted.outputExtension ?? config.format
      const smartName = buildSmartOutputFileName({
        pattern: fileNamePattern,
        originalFileName: item.file.name,
        outputExtension,
        index: itemIndex,
        totalFiles: queue.length,
        dimensions,
        now: new Date()
      })

      setItemState(item.id, {
        status: "processing",
        percent: 72
      })
      await notifyProgress(item.id, item.file.name, config, "processing", 72, "Converting image...")

      setItemState(item.id, {
        status: "processing",
        percent: 92
      })
      await notifyProgress(item.id, item.file.name, config, "processing", 92, "Preparing output preview...")

      setItemState(item.id, {
        status: "success",
        percent: 100,
        outputBlob: normalizedBlob,
        outputFileName:
          outputExtension === "zip"
            ? smartName || toWebKitZipFilename(item.file.name)
            : smartName || toOutputFilenameWithExtension(item.file.name, outputExtension)
      })
      await notifyProgress(item.id, item.file.name, config, "success", 100, "Ready for download")
      return "success"
    } catch (error) {
      const message = toUserFacingConversionError(error, "Unknown batch conversion error")

      setItemState(item.id, {
        status: "error",
        percent: 100,
        message,
        outputBlob: undefined,
        outputFileName: undefined
      })
      await notifyProgress(item.id, item.file.name, config, "error", 100, message)
      return "error"
    }
  }

  const runBatch = async (mode: BatchRunMode = "all") => {
    if (isRunning) {
      return
    }

    const itemsToProcess =
      mode === "failed"
        ? queue.filter((item) => item.status === "error")
        : queue.filter((item) => item.status === "queued" || item.status === "error")

    if (!itemsToProcess.length) {
      return
    }

    const selectedBytes = itemsToProcess.reduce((sum, item) => sum + item.file.size, 0)
    const selectedTooLarge = selectedBytes > MAX_TOTAL_QUEUE_BYTES

    if (selectedTooLarge) {
      const shouldContinue = window.confirm(
        [
          `Selected batch is ${toMb(selectedBytes)} MB.`,
          `Recommended limit is ${toMb(MAX_TOTAL_QUEUE_BYTES)} MB to reduce OOM risk.`,
          "Continue anyway?"
        ].join("\n")
      )

      if (!shouldContinue) {
        return
      }
    }

    cancelRef.current = false
    pauseRef.current = false
    setPaused(false)
    setCancelRequested(false)
    setSummary(null)
    setIsRunning(true)
    const startedAt = Date.now()
    const batchToastId = `batch_progress_${startedAt}`

    let successCount = 0
    let failedCount = 0

    try {
      for (let start = 0; start < itemsToProcess.length; start += concurrency) {
        if (cancelRef.current) {
          break
        }

        while (pauseRef.current && !cancelRef.current) {
          await sleep(120)
        }

        if (cancelRef.current) {
          break
        }

        const currentTotalProcessed = successCount + failedCount
        const overallPercent = Math.round((currentTotalProcessed / itemsToProcess.length) * 100)

        setBatchToastPayload({
          id: batchToastId,
          fileName: `Processing batch (${itemsToProcess.length} files)`,
          targetFormat: effectiveConfig.format,
          status: "processing",
          percent: overallPercent,
          message: `Converted ${currentTotalProcessed}/${itemsToProcess.length} files...`
        })

        const batchSlice = itemsToProcess.slice(start, start + concurrency)
        const results = await Promise.all(
          batchSlice.map((item, sliceIndex) => processItem(item, effectiveConfig, start + sliceIndex + 1))
        )

        for (const status of results) {
          if (status === "success") {
            successCount += 1
          }
          if (status === "error") {
            failedCount += 1
          }
        }
      }
    } finally {
      const total = itemsToProcess.length
      const durationMs = Date.now() - startedAt
      const canceled = cancelRef.current

      if (successCount + failedCount < total) {
        failedCount += total - (successCount + failedCount)
      }

      setBatchToastPayload({
        id: batchToastId,
        fileName: canceled ? "Batch processing cancelled" : "Batch processing completed",
        targetFormat: effectiveConfig.format,
        status: canceled ? "error" : "success",
        percent: 100,
        message: canceled 
          ? `Processed ${successCount} files before cancellation`
          : `Successfully processed ${successCount} files in ${(durationMs / 1000).toFixed(1)}s`
      })

      // Hide batch toast after 4 seconds
      setTimeout(() => {
        setBatchToastPayload((current) => {
          if (current?.id === batchToastId) return null
          return current
        })
      }, 4000)

      setSummary({
        mode,
        total,
        success: successCount,
        failed: failedCount,
        canceled,
        durationMs
      })

      setIsRunning(false)
      setCancelRequested(false)
      setPaused(false)
      pauseRef.current = false
      cancelRef.current = false
    }
  }

  const downloadIndividually = async (force: boolean = false) => {
    const successful = queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName)

    if (!successful.length || isExporting) {
      return
    }

    // Check for confirmation if > 4 files
    if (!force && successful.length > 4 && !skipDownloadConfirm) {
      setShowDownloadConfirm(true)
      return
    }

    setIsExporting(true)
    setActiveExportAction("one_by_one")

    try {
      for (const item of successful) {
        await downloadWithFilename(item.outputBlob as Blob, item.outputFileName as string)
        await sleep(120)
      }
    } finally {
      setIsExporting(false)
      setActiveExportAction(null)
    }
  }

  const downloadAsZip = async () => {
    const successful = queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName)

    if (!successful.length || isExporting) {
      return
    }

    setIsExporting(true)
    setActiveExportAction("zip")
    const toastId = `batch_export_zip_${Date.now()}`
    const exportFileName = `imify_batch_${getBatchZipTimestamp()}.zip`

    try {
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: effectiveConfig.format,
        status: "processing",
        percent: 8,
        message: "Collecting converted files..."
      })

      const zip = new JSZip()
      for (let index = 0; index < successful.length; index += 1) {
        const item = successful[index]
        zip.file(item.outputFileName as string, item.outputBlob as Blob)

        const percent = Math.min(70, 10 + Math.round(((index + 1) / successful.length) * 60))
        pushExportToast({
          id: toastId,
          fileName: exportFileName,
          targetFormat: effectiveConfig.format,
          status: "processing",
          percent,
          message: `Added ${index + 1}/${successful.length} files to ZIP...`
        })
      }

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: effectiveConfig.format,
        status: "processing",
        percent: 82,
        message: "Compressing ZIP archive..."
      })

      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } })
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: effectiveConfig.format,
        status: "processing",
        percent: 96,
        message: "Opening download dialog..."
      })

      await downloadWithFilename(zipBlob, exportFileName)

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: effectiveConfig.format,
        status: "success",
        percent: 100,
        message: "ZIP download started"
      })
    } catch (error) {
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: effectiveConfig.format,
        status: "error",
        percent: 100,
        message: toUserFacingConversionError(error, "Unable to export ZIP")
      })
    } finally {
      setIsExporting(false)
      setActiveExportAction(null)
    }
  }

  const mergeIntoPdf = async () => {
    const successful = queue.filter((item) => item.status === "success" && item.outputBlob)

    if (!successful.length || isExporting) {
      return
    }

    setIsExporting(true)
    setActiveExportAction("merge_pdf")
    setIsPdfSplitOpen(false)
    const toastId = `batch_export_merge_pdf_${Date.now()}`
    const exportFileName = `imify_batch_${getBatchZipTimestamp()}.pdf`

    try {
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "processing",
        percent: 12,
        message: "Preparing pages for merged PDF..."
      })

      const mergedPdfBlob = await mergeImagesToPdf(successful.map((item) => item.outputBlob as Blob))
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "processing",
        percent: 92,
        message: "Opening download dialog..."
      })

      await downloadWithFilename(mergedPdfBlob, exportFileName)

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "success",
        percent: 100,
        message: "PDF download started"
      })
    } catch (error) {
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "error",
        percent: 100,
        message: toUserFacingConversionError(error, "Unable to merge PDF")
      })
    } finally {
      setIsExporting(false)
      setActiveExportAction(null)
    }
  }

  const downloadIndividualPdfs = async () => {
    const successful = queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName)

    if (!successful.length || isExporting) {
      return
    }

    setIsExporting(true)
    setActiveExportAction("individual_pdf")
    setIsPdfSplitOpen(false)
    const toastId = `batch_export_individual_pdf_${Date.now()}`
    const exportFileName = `imify_batch_pdf_${getBatchZipTimestamp()}.zip`

    try {
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "processing",
        percent: 8,
        message: "Preparing individual PDFs..."
      })

      const zip = new JSZip()

      for (let index = 0; index < successful.length; index += 1) {
        const item = successful[index]
        const pdfBlob = await convertImageToPdf({
          sourceBlob: item.outputBlob as Blob,
          resize: { mode: "none" }
        })
        const baseName = (item.outputFileName as string).replace(/\.[^.]+$/, "")
        zip.file(`${baseName}.pdf`, pdfBlob)

        const percent = Math.min(76, 10 + Math.round(((index + 1) / successful.length) * 66))
        pushExportToast({
          id: toastId,
          fileName: exportFileName,
          targetFormat: "pdf",
          status: "processing",
          percent,
          message: `Created ${index + 1}/${successful.length} PDF files...`
        })
      }

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "processing",
        percent: 88,
        message: "Compressing PDF ZIP archive..."
      })

      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } })
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "processing",
        percent: 96,
        message: "Opening download dialog..."
      })

      await downloadWithFilename(zipBlob, exportFileName)

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "success",
        percent: 100,
        message: "PDF ZIP download started"
      })
    } catch (error) {
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: "pdf",
        status: "error",
        percent: 100,
        message: toUserFacingConversionError(error, "Unable to export individual PDFs")
      })
    } finally {
      setIsExporting(false)
      setActiveExportAction(null)
    }
  }

  const totalQueueBytes = useMemo(() => queue.reduce((sum, item) => sum + item.file.size, 0), [queue])
  const queueTooLarge = totalQueueBytes > MAX_TOTAL_QUEUE_BYTES

  const queueStats = useMemo(
    () =>
      queue.reduce(
        (acc, item) => {
          acc[item.status] += 1
          return acc
        },
        {
          queued: 0,
          processing: 0,
          success: 0,
          error: 0
        }
      ),
    [queue]
  )

  const successfulOutputs = useMemo(
    () => queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName),
    [queue]
  )

  const sourceTotalAfterRun = useMemo(
    () => successfulOutputs.reduce((sum, item) => sum + item.file.size, 0),
    [successfulOutputs]
  )

  const outputTotalAfterRun = useMemo(
    () => successfulOutputs.reduce((sum, item) => sum + (item.outputBlob as Blob).size, 0),
    [successfulOutputs]
  )

  const reductionPercent = useMemo(() => {
    if (!sourceTotalAfterRun) {
      return 0
    }

    const ratio = ((sourceTotalAfterRun - outputTotalAfterRun) / sourceTotalAfterRun) * 100
    return Number.isFinite(ratio) ? ratio : 0
  }, [sourceTotalAfterRun, outputTotalAfterRun])

  const canRetryFailed = queueStats.error > 0 && !isRunning
  const canStartBatch = Boolean(effectiveConfig) && !isRunning && queue.length > 0

  return (
    <SurfaceCard>
      <BatchActionBar
        canRetryFailed={canRetryFailed}
        canStartBatch={canStartBatch}
        cancelRequested={cancelRequested}
        isRunning={isRunning}
        onCancel={requestCancel}
        onClear={() => {
          setQueue([])
          setSummary(null)
        }}
        onRunAll={() => {
          void runBatch("all")
        }}
        onRunFailed={() => {
          void runBatch("failed")
        }}
        onTogglePause={togglePause}
        paused={paused}
        queueHasItems={queue.length > 0}
        queueStats={queueStats}
      />

      {cancelRequested ? (
          <BodyText className="mt-3 text-amber-700 dark:text-amber-400">
            Cancel requested. Current in-flight items will finish before stopping.
          </BodyText>
        ) : null}

        {paused ? (
          <BodyText className="mt-3 text-indigo-700 dark:text-indigo-400">Batch is paused. Click Resume to continue.</BodyText>
        ) : null}

        {queueTooLarge ? (
          <BodyText className="mt-3 text-amber-700 dark:text-amber-400">
            Warning: queue size is {toMb(totalQueueBytes)} MB. You may hit memory pressure on AVIF/PDF.
          </BodyText>
        ) : null}

      {summary && !isRunning && queue.length > 0 ? (
        <BatchSummaryCard
          activeExportAction={activeExportAction}
          formatBytes={formatBytes}
          isExporting={isExporting}
          isPdfSplitOpen={isPdfSplitOpen}
          onDownloadAsZip={() => {
            void downloadAsZip()
          }}
          onDownloadIndividualPdfs={() => {
            void downloadIndividualPdfs()
          }}
          onDownloadIndividually={() => {
            void downloadIndividually()
          }}
          onMergeIntoPdf={() => {
            void mergeIntoPdf()
          }}
          onTogglePdfSplit={() => {
            setIsPdfSplitOpen((current) => !current)
          }}
          outputTotalAfterRun={outputTotalAfterRun}
          pdfSplitRef={pdfSplitRef}
          reductionPercent={reductionPercent}
          sourceTotalAfterRun={sourceTotalAfterRun}
          successfulCount={successfulOutputs.length}
          summary={summary}
        />
      ) : (!isRunning ? (
        <BatchUploadDropzone onAppendFiles={appendFiles} />
      ) : null)}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <BatchQueueGrid isRunning={isRunning} onRemoveItem={removeItem} queue={queue} />
      </DndContext>

      <BatchDownloadConfirmDialog
        isOpen={showDownloadConfirm}
        count={successfulOutputs.length}
        onClose={() => setShowDownloadConfirm(false)}
        onConfirm={() => {
          setShowDownloadConfirm(false)
          void downloadIndividually(true)
        }}
      />

      <ConversionProgressToastCard payload={exportToastPayload} />
      <ConversionProgressToastCard payload={batchToastPayload} />
    </SurfaceCard>
  )
}
