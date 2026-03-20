import JSZip from "jszip"
import { useEffect, useMemo, useRef, useState } from "react"

import { toOutputFilename } from "../../core/download-utils"
import { toUserFacingConversionError } from "../../core/error-utils"
import type { FormatConfig } from "../../core/types"
import { convertImage } from "../../features/converter"
import { BatchActionBar } from "./batch/action-bar"
import { QueueItemCard } from "./batch/queue-item-card"
import type {
  BatchQueueItem,
  BatchRunMode,
  BatchSetupState,
  BatchSummary
} from "./batch/types"
import {
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_QUEUE_BYTES,
  downloadWithFilename,
  formatBytes,
  notifyProgress,
  sleep,
  toMb,
  withBatchResize
} from "./batch/utils"

interface BatchConverterTabProps {
  setup: BatchSetupState
  onRunningStateChange?: (running: boolean) => void
}

export function BatchConverterTab({ setup, onRunningStateChange }: BatchConverterTabProps) {
  const [queue, setQueue] = useState<BatchQueueItem[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [paused, setPaused] = useState(false)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const cancelRef = useRef(false)
  const pauseRef = useRef(false)

  useEffect(() => {
    pauseRef.current = paused
  }, [paused])

  useEffect(() => {
    onRunningStateChange?.(isRunning)
  }, [isRunning, onRunningStateChange])

  const effectiveConfig = useMemo(() => {
    const baseConfig: FormatConfig = {
      id: `batch_${setup.targetFormat}`,
      name: `Batch ${setup.targetFormat.toUpperCase()}`,
      format: setup.targetFormat,
      enabled: true,
      quality: setup.quality,
      resize: { mode: "none" }
    }

    return withBatchResize(
      baseConfig,
      setup.resizeMode,
      setup.quality,
      setup.resizeValue,
      setup.paperSize,
      setup.dpi
    )
  }, [setup.targetFormat, setup.resizeMode, setup.quality, setup.resizeValue, setup.paperSize, setup.dpi])

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

  const appendFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const nextItems: BatchQueueItem[] = Array.from(files)
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

  const processItem = async (item: BatchQueueItem, config: FormatConfig): Promise<"success" | "error"> => {
    setItemState(item.id, {
      status: "processing",
      percent: 10,
      message: undefined,
      outputBlob: undefined,
      outputFileName: undefined
    })
    await notifyProgress(item.id, item.file.name, config, "processing", 10)

    try {
      const converted = await convertImage({
        sourceBlob: item.file,
        config
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
        outputBlob: converted.blob,
        outputFileName: toOutputFilename(item.file.name, config.format)
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
    let successCount = 0
    let failedCount = 0

    try {
      for (let start = 0; start < itemsToProcess.length; start += setup.concurrency) {
        if (cancelRef.current) {
          break
        }

        while (pauseRef.current && !cancelRef.current) {
          await sleep(120)
        }

        if (cancelRef.current) {
          break
        }

        const batchSlice = itemsToProcess.slice(start, start + setup.concurrency)
        const results = await Promise.all(batchSlice.map((item) => processItem(item, effectiveConfig)))

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

  const downloadIndividually = async () => {
    const successful = queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName)

    if (!successful.length || isExporting) {
      return
    }

    setIsExporting(true)

    try {
      for (const item of successful) {
        await downloadWithFilename(item.outputBlob as Blob, item.outputFileName as string)
        await sleep(120)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const downloadAsZip = async () => {
    const successful = queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName)

    if (!successful.length || isExporting) {
      return
    }

    setIsExporting(true)

    try {
      const zip = new JSZip()
      for (const item of successful) {
        zip.file(item.outputFileName as string, item.outputBlob as Blob)
      }

      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } })
      await downloadWithFilename(zipBlob, `imify_batch_${Date.now()}.zip`)
    } finally {
      setIsExporting(false)
    }
  }

  const requestCancel = () => {
    cancelRef.current = true
    setCancelRequested(true)
  }

  const togglePause = () => {
    setPaused((current) => !current)
  }

  const totalQueueBytes = useMemo(() => queue.reduce((sum, item) => sum + item.file.size, 0), [queue])
  const queueTooLarge = totalQueueBytes > MAX_TOTAL_QUEUE_BYTES

  const queueStats = useMemo(
    () => ({
      queued: queue.filter((item) => item.status === "queued").length,
      processing: queue.filter((item) => item.status === "processing").length,
      success: queue.filter((item) => item.status === "success").length,
      error: queue.filter((item) => item.status === "error").length
    }),
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
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
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
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
          Cancel requested. Current in-flight items will finish before stopping.
        </p>
      ) : null}

      {paused ? (
        <p className="mt-3 text-sm text-indigo-700 dark:text-indigo-400">Batch is paused. Click Resume to continue.</p>
      ) : null}

      {queueTooLarge ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
          Warning: queue size is {toMb(totalQueueBytes)} MB. You may hit memory pressure on AVIF/PDF.
        </p>
      ) : null}

      {summary && !isRunning && queue.length > 0 ? (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500 text-white rounded-full shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <p className="font-semibold text-lg text-slate-900 dark:text-white leading-tight">Batch Completed</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Successfully processed {summary.success} files in {(summary.durationMs / 1000).toFixed(1)}s.</p>
            </div>
          </div>

          {successfulOutputs.length > 0 ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Size reduction</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatBytes(sourceTotalAfterRun)}</span>
                    <span className="text-slate-400 text-lg">→</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(outputTotalAfterRun)}</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-1 bg-emerald-100 dark:bg-emerald-900/30 inline-block px-2 py-0.5 rounded">
                    Saved {reductionPercent >= 0 ? "-" : "+"}{Math.abs(reductionPercent).toFixed(1)}% space
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 transition-all flex items-center gap-2"
                    onClick={() => {
                      void downloadAsZip()
                    }}
                    type="button">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    {isExporting ? "Preparing ZIP..." : `Download ZIP (${successfulOutputs.length})`}
                  </button>

                  {!isExporting ? (
                    <button
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        void downloadIndividually()
                      }}
                      type="button">
                      One by one
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (!isRunning ? (
        <label
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 px-4 py-10 text-center transition-colors group"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            appendFiles(event.dataTransfer.files)
          }}>
          <input
            className="hidden"
            multiple
            onChange={(event) => appendFiles(event.target.files)}
            type="file"
          />
          <div className="bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4 group-hover:-translate-y-1 transition-transform border border-slate-100 dark:border-slate-700/50">
            <svg className="w-8 h-8 text-indigo-500/80 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Drop images here or click to browse</p>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Supports JPG, PNG, WebP, AVIF, BMP</p>
        </label>
      ) : null)}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 grid-flow-row">
        {queue.map((item) => (
          <QueueItemCard key={item.id} item={item} isRunning={isRunning} onRemove={removeItem} />
        ))}

        {queue.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10 text-slate-500 dark:text-slate-400">
            <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <p className="font-medium text-sm">No files in queue</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
