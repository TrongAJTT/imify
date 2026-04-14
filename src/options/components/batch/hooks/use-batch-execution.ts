import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"

import { toUserFacingConversionError } from "@/core/error-utils"
import type { ConversionProgressPayload, FormatConfig } from "@/core/types"
import { applyExifPolicy } from "@/features/converter/exif"
import { convertImage } from "@/features/converter"
import { setConversionWorkerPoolSize, terminateConversionWorkerPool } from "@/features/converter/conversion-worker-pool"
import type {
  BatchQueueItem,
  BatchRunMode,
  BatchSummary,
  BatchWatermarkConfig
} from "@/options/components/batch/types"
import { buildSmartOutputFileName, readImageDimensions } from "@/options/components/batch/pipeline"
import {
  MAX_TOTAL_QUEUE_BYTES,
  notifyProgress,
  sleep,
  toMb
} from "@/options/components/batch/utils"
import { applyWatermarkToImageBlob } from "@/options/components/batch/watermark"

function toOutputFilenameWithExtension(nameOrBase: string, extension: string): string {
  const base = nameOrBase.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extension}`
}

function toWebKitZipFilename(nameOrBase: string): string {
  void nameOrBase
  return "favicon_kit.zip"
}

function isWorkerConvertibleFormat(
  format: FormatConfig["format"]
): format is Exclude<FormatConfig["format"], "pdf"> {
  return format !== "pdf"
}

export interface OomWarningState {
  isOpen: boolean
  totalSize: string
  recommendedSize: string
  mode: BatchRunMode
}

interface UseBatchExecutionParams {
  queue: BatchQueueItem[]
  setQueue: Dispatch<SetStateAction<BatchQueueItem[]>>
  config: FormatConfig
  concurrency: number
  stripExif: boolean
  fileNamePattern: string
  watermark: BatchWatermarkConfig
  skipOomWarning: boolean
  onPersistSkipOomWarning: () => void
}

interface UseBatchExecutionResult {
  isRunning: boolean
  paused: boolean
  cancelRequested: boolean
  summary: BatchSummary | null
  batchToastPayload: ConversionProgressPayload | null
  clearBatchToast: (toastId?: string) => void
  oomWarning: OomWarningState | null
  runBatch: (mode?: BatchRunMode) => Promise<void>
  requestCancel: () => void
  togglePause: () => void
  closeOomWarning: () => void
  confirmOomWarning: (dontShowAgain: boolean) => Promise<void>
  clearSummary: () => void
}

export function useBatchExecution({
  queue,
  setQueue,
  config,
  concurrency,
  stripExif,
  fileNamePattern,
  watermark,
  skipOomWarning,
  onPersistSkipOomWarning
}: UseBatchExecutionParams): UseBatchExecutionResult {
  const [isRunning, setIsRunning] = useState(false)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [paused, setPaused] = useState(false)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [batchToastPayload, setBatchToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [oomWarning, setOomWarning] = useState<OomWarningState | null>(null)

  const cancelRef = useRef(false)
  const pauseRef = useRef(false)

  useEffect(() => {
    pauseRef.current = paused
  }, [paused])

  useEffect(() => {
    return () => {
      terminateConversionWorkerPool()
    }
  }, [])

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

  const processItem = async (
    item: BatchQueueItem,
    itemIndex: number,
    totalQueueCount: number
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
        totalFiles: totalQueueCount,
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

  const startBatchExecution = async (
    itemsToProcess: BatchQueueItem[],
    mode: BatchRunMode
  ): Promise<void> => {
    if (!itemsToProcess.length) {
      return
    }

    cancelRef.current = false
    pauseRef.current = false
    setPaused(false)
    setCancelRequested(false)
    setSummary(null)
    setIsRunning(true)

    const startedAt = Date.now()
    const batchToastId = `batch_progress_${startedAt}`
    const workerPoolFormat = isWorkerConvertibleFormat(config.format) ? config.format : null
    const usesConversionWorkerPool = workerPoolFormat !== null

    if (usesConversionWorkerPool) {
      setConversionWorkerPoolSize(workerPoolFormat, concurrency)
    }

    let successCount = 0
    let failedCount = 0

    try {
      const totalItems = itemsToProcess.length
      const totalQueueCount = queue.length
      let nextItemIndex = 0

      const pushBatchProgress = () => {
        const processed = successCount + failedCount
        const percent = Math.round((processed / totalItems) * 100)

        setBatchToastPayload({
          id: batchToastId,
          fileName: `Processing batch (${totalItems} files)`,
          targetFormat: config.format,
          status: "processing",
          percent,
          message: `Converted ${processed}/${totalItems} files...`
        })
      }

      const runWorkerSlot = async () => {
        while (!cancelRef.current) {
          while (pauseRef.current && !cancelRef.current) {
            await sleep(120)
          }

          if (cancelRef.current) {
            return
          }

          if (nextItemIndex >= totalItems) {
            return
          }

          const currentIndex = nextItemIndex
          nextItemIndex += 1
          const item = itemsToProcess[currentIndex]

          const status = await processItem(item, currentIndex + 1, totalQueueCount)

          if (status === "success") {
            successCount += 1
          } else {
            failedCount += 1
          }

          pushBatchProgress()
        }
      }

      pushBatchProgress()

      const activeSlots = Math.max(1, Math.min(concurrency, totalItems))
      await Promise.all(Array.from({ length: activeSlots }, () => runWorkerSlot()))
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
        targetFormat: config.format,
        status: canceled ? "error" : "success",
        percent: 100,
        message: canceled
          ? `Processed ${successCount} files before cancellation`
          : `Successfully processed ${successCount} files in ${(durationMs / 1000).toFixed(1)}s`
      })

      setTimeout(() => {
        setBatchToastPayload((current) => {
          if (current?.id === batchToastId) return null
          return current
        })
      }, 5000)

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

      if (usesConversionWorkerPool) {
        terminateConversionWorkerPool(workerPoolFormat)
      }
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

    if (selectedTooLarge && !skipOomWarning) {
      setOomWarning({
        isOpen: true,
        totalSize: String(toMb(selectedBytes)),
        recommendedSize: String(toMb(MAX_TOTAL_QUEUE_BYTES)),
        mode
      })
      return
    }

    await startBatchExecution(itemsToProcess, mode)
  }

  const requestCancel = () => {
    setCancelRequested(true)
    cancelRef.current = true

    if (isWorkerConvertibleFormat(config.format)) {
      terminateConversionWorkerPool(config.format)
    }
  }

  const togglePause = () => {
    setPaused((current) => !current)
  }

  const closeOomWarning = () => {
    setOomWarning(null)
  }

  const confirmOomWarning = async (dontShowAgain: boolean) => {
    if (!oomWarning) {
      return
    }

    if (dontShowAgain) {
      onPersistSkipOomWarning()
    }

    const mode = oomWarning.mode
    setOomWarning(null)
    const itemsToProcess =
      mode === "failed"
        ? queue.filter((item) => item.status === "error")
        : queue.filter((item) => item.status === "queued" || item.status === "error")

    await startBatchExecution(itemsToProcess, mode)
  }

  const clearSummary = () => {
    setSummary(null)
  }

  const clearBatchToast = (toastId?: string) => {
    setBatchToastPayload((current) => {
      if (!current) return current
      if (toastId && current.id !== toastId) return current
      return null
    })
  }

  return {
    isRunning,
    paused,
    cancelRequested,
    summary,
    batchToastPayload,
    clearBatchToast,
    oomWarning,
    runBatch,
    requestCancel,
    togglePause,
    closeOomWarning,
    confirmOomWarning,
    clearSummary
  }
}
