import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toUserFacingConversionError } from "@imify/core/error-utils"
import type { ConversionProgressPayload, FormatConfig } from "@imify/core/types"
import { applyExifPolicy } from "@imify/engine/converter/exif"
import { convertImage } from "@imify/engine/converter"
import { setConversionWorkerPoolSize, terminateConversionWorkerPool } from "@imify/engine/converter/conversion-worker-pool"
import type { BatchQueueItem, BatchRunMode, BatchSummary, BatchWatermarkConfig } from "../types"
import { buildSmartOutputFileName, readImageDimensions } from "../pipeline"
import { MAX_TOTAL_QUEUE_BYTES, notifyProgress, sleep, toMb } from "../utils"
import { applyWatermarkToImageBlob } from "../../watermark"

function toOutputFilenameWithExtension(nameOrBase: string, extension: string): string {
  const base = nameOrBase.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extension}`
}
function toWebKitZipFilename(nameOrBase: string): string { void nameOrBase; return "favicon_kit.zip" }
function isWorkerConvertibleFormat(format: FormatConfig["format"]): format is Exclude<FormatConfig["format"], "pdf"> { return format !== "pdf" }

export interface OomWarningState { isOpen: boolean; totalSize: string; recommendedSize: string; mode: BatchRunMode }

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
}: {
  queue: BatchQueueItem[]
  setQueue: Dispatch<SetStateAction<BatchQueueItem[]>>
  config: FormatConfig
  concurrency: number
  stripExif: boolean
  fileNamePattern: string
  watermark: BatchWatermarkConfig
  skipOomWarning: boolean
  onPersistSkipOomWarning: () => void
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [paused, setPaused] = useState(false)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [batchToastPayload, setBatchToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [oomWarning, setOomWarning] = useState<OomWarningState | null>(null)
  const cancelRef = useRef(false)
  const pauseRef = useRef(false)
  useEffect(() => { pauseRef.current = paused }, [paused])
  useEffect(() => () => { terminateConversionWorkerPool() }, [])

  const setItemState = (id: string, partial: Partial<Pick<BatchQueueItem, "status" | "percent" | "message" | "outputBlob" | "outputFileName">>) => {
    setQueue((current) => {
      let changed = false
      const next = current.map((item) => {
        if (item.id !== id) {
          return item
        }
        const merged = { ...item, ...partial }
        const isSame =
          merged.status === item.status &&
          merged.percent === item.percent &&
          merged.message === item.message &&
          merged.outputBlob === item.outputBlob &&
          merged.outputFileName === item.outputFileName
        if (isSame) {
          return item
        }
        changed = true
        return merged
      })
      return changed ? next : current
    })  
  }

  const processItem = async (item: BatchQueueItem, itemIndex: number, totalQueueCount: number): Promise<"success" | "error"> => {
    setItemState(item.id, { status: "processing", percent: 12, message: undefined, outputBlob: undefined, outputFileName: undefined })
    await notifyProgress(item.id, item.file.name, config, "processing", 12)
    try {
      const sourceBlob = await applyWatermarkToImageBlob(item.file, watermark)
      const converted = await convertImage({ sourceBlob, config })
      const normalizedBlob = await applyExifPolicy({ sourceBlob: item.file, outputBlob: converted.blob, stripExif })
      const dimensions = (await readImageDimensions(normalizedBlob)) || (await readImageDimensions(item.file))
      const outputExtension = converted.outputExtension ?? config.format
      const smartName = buildSmartOutputFileName({ pattern: fileNamePattern, originalFileName: item.file.name, outputExtension, index: itemIndex, totalFiles: totalQueueCount, dimensions, now: new Date() })
      setItemState(item.id, { status: "processing", percent: 84 })
      await notifyProgress(item.id, item.file.name, config, "processing", 84, "Finalizing output...")
      setItemState(item.id, { status: "success", percent: 100, outputBlob: normalizedBlob, outputFileName: outputExtension === "zip" ? smartName || toWebKitZipFilename(item.file.name) : smartName || toOutputFilenameWithExtension(item.file.name, outputExtension) })
      await notifyProgress(item.id, item.file.name, config, "success", 100, "Ready for download")
      return "success"
    } catch (error) {
      const message = toUserFacingConversionError(error, "Unknown batch conversion error")
      setItemState(item.id, { status: "error", percent: 100, message, outputBlob: undefined, outputFileName: undefined })
      await notifyProgress(item.id, item.file.name, config, "error", 100, message)
      return "error"
    }
  }

  const startBatchExecution = async (itemsToProcess: BatchQueueItem[], mode: BatchRunMode): Promise<void> => {
    if (!itemsToProcess.length) return
    cancelRef.current = false; pauseRef.current = false; setPaused(false); setCancelRequested(false); setSummary(null); setIsRunning(true)
    const startedAt = Date.now()
    const batchToastId = `batch_progress_${startedAt}`
    const workerPoolFormat = isWorkerConvertibleFormat(config.format) ? config.format : null
    const usesConversionWorkerPool = workerPoolFormat !== null
    if (usesConversionWorkerPool) setConversionWorkerPoolSize(workerPoolFormat, concurrency)
    let successCount = 0; let failedCount = 0
    try {
      const totalItems = itemsToProcess.length; const totalQueueCount = queue.length; let nextItemIndex = 0
      const pushBatchProgress = () => {
        const processed = successCount + failedCount
        const percent = Math.round((processed / totalItems) * 100)
        setBatchToastPayload({ id: batchToastId, fileName: `Processing batch (${totalItems} files)`, targetFormat: config.format, status: "processing", percent, message: `Converted ${processed}/${totalItems} files...` })
      }
      const runWorkerSlot = async () => {
        while (!cancelRef.current) {
          while (pauseRef.current && !cancelRef.current) await sleep(120)
          if (cancelRef.current || nextItemIndex >= totalItems) return
          const currentIndex = nextItemIndex; nextItemIndex += 1
          const status = await processItem(itemsToProcess[currentIndex], currentIndex + 1, totalQueueCount)
          if (status === "success") successCount += 1; else failedCount += 1
          pushBatchProgress()
        }
      }
      pushBatchProgress()
      await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, totalItems)) }, () => runWorkerSlot()))
    } finally {
      const total = itemsToProcess.length
      const durationMs = Date.now() - startedAt
      const canceled = cancelRef.current
      if (successCount + failedCount < total) failedCount += total - (successCount + failedCount)
      setBatchToastPayload({ id: batchToastId, fileName: canceled ? "Batch processing cancelled" : "Batch processing completed", targetFormat: config.format, status: canceled ? "error" : "success", percent: 100, message: canceled ? `Processed ${successCount} files before cancellation` : `Successfully processed ${successCount} files in ${(durationMs / 1000).toFixed(1)}s` })
      setTimeout(() => setBatchToastPayload((current) => (current?.id === batchToastId ? null : current)), 5000)
      setSummary({ mode, total, success: successCount, failed: failedCount, canceled, durationMs })
      setIsRunning(false); setCancelRequested(false); setPaused(false); pauseRef.current = false; cancelRef.current = false
      if (usesConversionWorkerPool) terminateConversionWorkerPool(workerPoolFormat)
    }
  }

  const runBatch = async (mode: BatchRunMode = "all") => {
    if (isRunning) return
    const itemsToProcess = mode === "failed" ? queue.filter((item) => item.status === "error") : queue.filter((item) => item.status === "queued" || item.status === "error")
    if (!itemsToProcess.length) return
    const selectedBytes = itemsToProcess.reduce((sum, item) => sum + item.file.size, 0)
    if (selectedBytes > MAX_TOTAL_QUEUE_BYTES && !skipOomWarning) {
      setOomWarning({ isOpen: true, totalSize: String(toMb(selectedBytes)), recommendedSize: String(toMb(MAX_TOTAL_QUEUE_BYTES)), mode })
      return
    }
    await startBatchExecution(itemsToProcess, mode)
  }

  const requestCancel = () => { setCancelRequested(true); cancelRef.current = true; if (isWorkerConvertibleFormat(config.format)) terminateConversionWorkerPool(config.format) }
  const togglePause = () => setPaused((current) => !current)
  const closeOomWarning = () => setOomWarning(null)
  const confirmOomWarning = async (dontShowAgain: boolean) => {
    if (!oomWarning) return
    if (dontShowAgain) onPersistSkipOomWarning()
    const mode = oomWarning.mode
    setOomWarning(null)
    const itemsToProcess = mode === "failed" ? queue.filter((item) => item.status === "error") : queue.filter((item) => item.status === "queued" || item.status === "error")
    await startBatchExecution(itemsToProcess, mode)
  }
  const clearSummary = () => setSummary(null)
  const clearBatchToast = (toastId?: string) => setBatchToastPayload((current) => (!current || (toastId && current.id !== toastId) ? current : null))
  return { isRunning, paused, cancelRequested, summary, batchToastPayload, clearBatchToast, oomWarning, runBatch, requestCancel, togglePause, closeOomWarning, confirmOomWarning, clearSummary }
}
