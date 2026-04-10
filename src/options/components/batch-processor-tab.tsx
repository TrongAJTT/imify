import { useEffect, useMemo, useRef, useState } from "react"
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor,
  useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import { ConversionProgressToastCard } from "@/core/components/conversion-progress-toast-card"
import type { ConversionProgressPayload, FormatConfig } from "@/core/types"
import { fetchRemoteImagesFromUrls } from "@/features/converter/remote-image-import"
import { useClipboardPaste } from "@/options/hooks/use-clipboard-paste"
import { BatchActionBar } from "@/options/components/batch/action-bar"
import { BatchQueueGrid } from "@/options/components/batch/queue-grid"
import { BatchSummaryCard } from "@/options/components/batch/summary-card"
import { BodyText } from "@/options/components/ui/typography"
import type { BatchQueueItem } from "@/options/components/batch/types"
import { BatchUploadDropzone } from "@/options/components/batch/upload-dropzone"
import { MAX_FILE_SIZE_BYTES, MAX_TOTAL_QUEUE_BYTES,
  formatBytes, toMb, withBatchResize } from "@/options/components/batch/utils"
import { readImageDimensions } from "@/options/components/batch/pipeline"
import { BatchDownloadConfirmDialog } from "@/options/components/batch/download-confirm-dialog"
import { HeavyFormatToast } from "@/options/components/batch/heavy-format-toast"
import { OOMWarningDialog } from "@/options/components/batch/oom-warning-dialog"
import { useBatchExecution } from "@/options/components/batch/hooks/use-batch-execution"
import { useBatchExportActions } from "@/options/components/batch/hooks/use-batch-export-actions"
import { ImageUrlImportControl } from "@/options/components/image-url-import-control"
import { useBatchStore } from "@/options/stores/batch-store"

export function BatchProcessorTab() {
  const targetFormat = useBatchStore((state) => state.targetFormat)
  const concurrency = useBatchStore((state) => state.concurrency)
  const quality = useBatchStore((state) => state.quality)
  const formatOptions = useBatchStore((state) => state.formatOptions)
  const resizeMode = useBatchStore((state) => state.resizeMode)
  const resizeValue = useBatchStore((state) => state.resizeValue)
  const resizeWidth = useBatchStore((state) => state.resizeWidth)
  const resizeHeight = useBatchStore((state) => state.resizeHeight)
  const resizeAspectMode = useBatchStore((state) => state.resizeAspectMode)
  const resizeAspectRatio = useBatchStore((state) => state.resizeAspectRatio)
  const resizeAnchor = useBatchStore((state) => state.resizeAnchor)
  const resizeFitMode = useBatchStore((state) => state.resizeFitMode)
  const resizeContainBackground = useBatchStore((state) => state.resizeContainBackground)
  const paperSize = useBatchStore((state) => state.paperSize)
  const dpi = useBatchStore((state) => state.dpi)
  const stripExif = useBatchStore((state) => state.stripExif)
  const fileNamePattern = useBatchStore((state) => state.fileNamePattern)
  const watermark = useBatchStore((state) => state.watermark)
  const skipDownloadConfirm = useBatchStore((state) => state.skipDownloadConfirm)
  const skipOomWarning = useBatchStore((state) => state.skipOomWarning)
  const setSkipOomWarning = useBatchStore((state) => state.setSkipOomWarning)
  const heavyFormatToast = useBatchStore((state) => state.heavyFormatToast)
  const setHeavyFormatToast = useBatchStore((state) => state.setHeavyFormatToast)
  const setBatchIsRunning = useBatchStore((state) => state.setIsRunning)
  const syncResizeToSource = useBatchStore((state) => state.syncResizeToSource)

  const [queue, setQueue] = useState<BatchQueueItem[]>([])
  const [urlImportToast, setUrlImportToast] = useState<ConversionProgressPayload | null>(null)
  const [isImportingUrls, setIsImportingUrls] = useState(false)
  const [isPdfSplitOpen, setIsPdfSplitOpen] = useState(false)
  const pdfSplitRef = useRef<HTMLDivElement>(null)
  const firstQueueItem = queue[0]

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

  const effectiveConfig = useMemo(() => {
    const isMozJpegTarget = targetFormat === "mozjpeg"

    const baseConfig: FormatConfig = {
      id: `batch_${targetFormat}`,
      name: `Batch ${isMozJpegTarget ? "MOZJPEG" : targetFormat.toUpperCase()}`,
      format: isMozJpegTarget ? "jpg" : targetFormat,
      enabled: true,
      quality,
      formatOptions: {
        jxl: targetFormat === "jxl" ? { effort: formatOptions.jxl.effort } : undefined,
        avif: targetFormat === "avif" ? { ...formatOptions.avif } : undefined,
        mozjpeg:
          targetFormat === "mozjpeg"
            ? {
                enabled: true,
                progressive: formatOptions.mozjpeg.progressive,
                chromaSubsampling: formatOptions.mozjpeg.chromaSubsampling
              }
            : undefined,
        ico:
          targetFormat === "ico"
            ? {
                sizes: [...formatOptions.ico.sizes],
                generateWebIconKit: formatOptions.ico.generateWebIconKit
              }
            : undefined,
        png:
          targetFormat === "png"
            ? {
                tinyMode: formatOptions.png.tinyMode,
                cleanTransparentPixels: formatOptions.png.cleanTransparentPixels,
                autoGrayscale: formatOptions.png.autoGrayscale,
                dithering: formatOptions.png.dithering,
                ditheringLevel: formatOptions.png.ditheringLevel,
                progressiveInterlaced: formatOptions.png.progressiveInterlaced,
                oxipngCompression: formatOptions.png.oxipngCompression
              }
            : undefined
      },
      resize: { mode: "none" }
    }

    return withBatchResize(
      baseConfig,
      resizeMode,
      quality,
      formatOptions,
      resizeValue,
      resizeWidth,
      resizeHeight,
      resizeAspectMode,
      resizeAspectRatio,
      resizeAnchor,
      resizeFitMode,
      resizeContainBackground,
      paperSize,
      dpi
    )
  }, [
    targetFormat,
    resizeMode,
    quality,
    formatOptions,
    resizeValue,
    resizeWidth,
    resizeHeight,
    resizeAspectMode,
    resizeAspectRatio,
    resizeAnchor,
    resizeFitMode,
    resizeContainBackground,
    paperSize,
    dpi
  ])

  const {
    isRunning,
    paused,
    cancelRequested,
    summary,
    batchToastPayload,
    oomWarning,
    runBatch,
    requestCancel,
    togglePause,
    closeOomWarning,
    confirmOomWarning,
    clearSummary
  } = useBatchExecution({
    queue,
    setQueue,
    config: effectiveConfig,
    concurrency,
    stripExif,
    fileNamePattern,
    watermark,
    skipOomWarning,
    onPersistSkipOomWarning: () => {
      setSkipOomWarning(true)
    }
  })

  const {
    isExporting,
    activeExportAction,
    exportToastPayload,
    showDownloadConfirm,
    closeDownloadConfirm,
    confirmDownloadIndividually,
    downloadIndividually,
    downloadAsZip,
    mergeIntoPdf,
    downloadIndividualPdfs
  } = useBatchExportActions({
    queue,
    config: effectiveConfig,
    skipDownloadConfirm,
    onClosePdfSplit: () => {
      setIsPdfSplitOpen(false)
    }
  })

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

  useEffect(() => {
    if (!firstQueueItem) {
      return
    }

    let active = true

    void (async () => {
      const dimensions = await readImageDimensions(firstQueueItem.file)
      if (!dimensions || !active) {
        return
      }

      syncResizeToSource(dimensions.width, dimensions.height)
    })()

    return () => {
      active = false
    }
  }, [firstQueueItem?.file, firstQueueItem?.id, syncResizeToSource])

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

  const appendRemoteImportFailures = (failures: Array<{ url: string; reason: string }>) => {
    if (!failures.length) {
      return
    }

    const now = Date.now()
    const errorItems: BatchQueueItem[] = failures.map((failure, index) => ({
      id: `${now}_url_error_${index}_${Math.random().toString(36).slice(2, 7)}`,
      file: new File([failure.url], `url-error-${index + 1}.txt`, {
        type: "text/plain",
        lastModified: now + index
      }),
      status: "error",
      percent: 100,
      message: `${failure.reason} URL: ${failure.url}`
    }))

    setQueue((current) => [...current, ...errorItems])
  }

  const importFromImageUrls = async (urls: string[]) => {
    if (!urls.length) {
      return
    }

    setIsImportingUrls(true)
    setUrlImportToast(null)

    try {
      const { files, failures } = await fetchRemoteImagesFromUrls(urls)

      if (files.length) {
        appendImageFiles(files)
      }

      const toastId = `url_import_${Date.now()}`
      let message = ""
      let status: "success" | "error" = "success"

      if (files.length && !failures.length) {
        message = `Imported ${files.length} image URL${files.length > 1 ? "s" : ""}.`
      } else if (files.length && failures.length) {
        message = `Imported ${files.length} URL${files.length > 1 ? "s" : ""}, ${failures.length} failed.`
        status = "error"
      } else {
        message = "No valid image URLs were imported."
        status = "error"
      }

      setUrlImportToast({
        id: toastId,
        fileName: "URL Import Status",
        targetFormat: targetFormat,
        status,
        percent: 100,
        message
      })

      setTimeout(() => {
        setUrlImportToast((current) => (current?.id === toastId ? null : current))
      }, 2000)
    } finally {
      setIsImportingUrls(false)
    }
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

  useClipboardPaste({
    onFiles: appendImageFiles,
    onUrls: importFromImageUrls
  })

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
    <div className="p-6">
      <BatchActionBar
        canRetryFailed={canRetryFailed}
        canStartBatch={canStartBatch}
        cancelRequested={cancelRequested}
        isRunning={isRunning}
        onCancel={requestCancel}
        onClear={() => {
          setQueue([])
          clearSummary()
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
          targetFormat={effectiveConfig?.format || "jpg"}
        />
      ) : (!isRunning ? (
        <BatchUploadDropzone
          onAppendFiles={appendFiles}
          urlImportControl={
            <ImageUrlImportControl
              allowMultiple
              disabled={isImportingUrls}
              onProcessUrls={importFromImageUrls}
            />
          }
        />
      ) : null)}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <BatchQueueGrid isRunning={isRunning} onRemoveItem={removeItem} queue={queue} />
      </DndContext>

      <BatchDownloadConfirmDialog
        isOpen={showDownloadConfirm}
        count={successfulOutputs.length}
        onClose={closeDownloadConfirm}
        onConfirm={() => {
          void confirmDownloadIndividually()
        }}
      />

      <OOMWarningDialog
        isOpen={!!oomWarning?.isOpen}
        totalSize={oomWarning?.totalSize || "0"}
        recommendedSize={oomWarning?.recommendedSize || "350"}
        onClose={closeOomWarning}
        onConfirm={(dontShowAgain) => {
          void confirmOomWarning(dontShowAgain)
        }}
      />

      <ConversionProgressToastCard payload={urlImportToast} />
      <ConversionProgressToastCard payload={exportToastPayload} />
      <ConversionProgressToastCard payload={batchToastPayload} />
      {heavyFormatToast && (
        <HeavyFormatToast 
          format={heavyFormatToast.format}
          onClose={() => setHeavyFormatToast(null)}
        />
      )}
    </div>
  )
}
