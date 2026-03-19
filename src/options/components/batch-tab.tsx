import { useEffect, useMemo, useRef, useState } from "react"

import {
  blobToDownloadDataUrl,
  toOutputFilename
} from "../../core/download-utils"
import { toUserFacingConversionError } from "../../core/error-utils"
import type {
  ConversionProgressPayload,
  FormatConfig,
  ImageFormat
} from "../../core/types"
import { convertImage } from "../../features/converter"

type BatchItemStatus = "queued" | "processing" | "success" | "error"
type BatchRunMode = "all" | "failed"

interface BatchQueueItem {
  id: string
  file: File
  status: BatchItemStatus
  percent: number
  message?: string
}

interface BatchSummary {
  mode: BatchRunMode
  total: number
  success: number
  failed: number
  canceled: boolean
  durationMs: number
}

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024
const MAX_TOTAL_QUEUE_BYTES = 150 * 1024 * 1024

function toMb(sizeInBytes: number): number {
  return Math.round(sizeInBytes / 1024 / 1024)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function publishProgressToActiveTab(payload: ConversionProgressPayload): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const activeTabId = tabs[0]?.id
    if (!activeTabId) {
      return
    }

    await chrome.tabs.sendMessage(activeTabId, {
      type: "CONVERT_PROGRESS",
      payload
    })
  } catch {
    // Content script may not be available on current page.
  }
}

export function BatchConverterTab({ configs }: { configs: FormatConfig[] }) {
  const [selectedConfigId, setSelectedConfigId] = useState<string>(configs[0]?.id ?? "")
  const [queue, setQueue] = useState<BatchQueueItem[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [concurrency, setConcurrency] = useState(2)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [paused, setPaused] = useState(false)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const cancelRef = useRef(false)
  const pauseRef = useRef(false)

  useEffect(() => {
    pauseRef.current = paused
  }, [paused])

  const selectedConfig = useMemo(
    () => configs.find((entry) => entry.id === selectedConfigId) ?? null,
    [configs, selectedConfigId]
  )

  useEffect(() => {
    if (!configs.length) {
      setSelectedConfigId("")
      return
    }

    const exists = configs.some((entry) => entry.id === selectedConfigId)
    if (!exists) {
      setSelectedConfigId(configs[0].id)
    }
  }, [configs, selectedConfigId])

  const setItemState = (
    id: string,
    partial: Partial<Pick<BatchQueueItem, "status" | "percent" | "message">>
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

  const notifyProgress = async (
    item: BatchQueueItem,
    status: ConversionProgressPayload["status"],
    percent: number,
    message?: string
  ) => {
    if (!selectedConfig) {
      return
    }

    await publishProgressToActiveTab({
      id: item.id,
      fileName: item.file.name,
      targetFormat: selectedConfig.format,
      status,
      percent,
      message
    })
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

  const downloadBlob = async (
    blob: Blob,
    fileName: string,
    format: ImageFormat
  ): Promise<void> => {
    const dataUrl = await blobToDownloadDataUrl(blob, format)

    await chrome.downloads.download({
      url: dataUrl,
      filename: fileName,
      saveAs: false
    })
  }

  const processItem = async (
    item: BatchQueueItem,
    config: FormatConfig
  ): Promise<"success" | "error"> => {
    setItemState(item.id, {
      status: "processing",
      percent: 10,
      message: undefined
    })
    await notifyProgress(item, "processing", 10)

    try {
      const converted = await convertImage({
        sourceBlob: item.file,
        config
      })

      setItemState(item.id, {
        status: "processing",
        percent: 80
      })
      await notifyProgress(item, "processing", 80)

      await downloadBlob(
        converted.blob,
        toOutputFilename(item.file.name, config.format),
        config.format
      )

      setItemState(item.id, {
        status: "success",
        percent: 100
      })
      await notifyProgress(item, "success", 100)
      return "success"
    } catch (error) {
      const message = toUserFacingConversionError(error, "Unknown batch conversion error")

      setItemState(item.id, {
        status: "error",
        percent: 100,
        message
      })
      await notifyProgress(item, "error", 100, message)
      return "error"
    }
  }

  const runBatch = async (mode: BatchRunMode = "all") => {
    if (!selectedConfig || isRunning) {
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

        const batchSlice = itemsToProcess.slice(start, start + concurrency)
        const results = await Promise.all(batchSlice.map((item) => processItem(item, selectedConfig)))

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
        const missing = total - (successCount + failedCount)
        failedCount += missing
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

  const requestCancel = () => {
    cancelRef.current = true
    setCancelRequested(true)
  }

  const togglePause = () => {
    setPaused((current) => !current)
  }

  const totalQueueBytes = useMemo(
    () => queue.reduce((sum, item) => sum + item.file.size, 0),
    [queue]
  )

  const queueTooLarge = totalQueueBytes > MAX_TOTAL_QUEUE_BYTES

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Batch Converter</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Convert many images at once with one selected preset. Processing runs locally in this page.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="text-sm text-slate-700 dark:text-slate-200">
          Target preset
          <select
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-sm"
            disabled={!configs.length || isRunning}
            onChange={(event) => setSelectedConfigId(event.target.value)}
            value={selectedConfigId}>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name} (.{config.format})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700 dark:text-slate-200">
          Concurrency
          <select
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-sm"
            disabled={isRunning}
            onChange={(event) => setConcurrency(Number(event.target.value))}
            value={concurrency}>
            <option value={1}>1 (safe)</option>
            <option value={2}>2 (balanced)</option>
            <option value={3}>3 (faster)</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            className="rounded bg-slate-900 dark:bg-slate-100 px-3 py-2 text-sm font-medium text-white dark:text-slate-900 disabled:opacity-50"
            disabled={!selectedConfig || isRunning || queue.length === 0}
            onClick={() => {
              void runBatch("all")
            }}
            type="button">
            {isRunning ? "Running..." : "Start Batch"}
          </button>
          <button
            className="rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 disabled:opacity-50"
            disabled={isRunning || !queue.some((item) => item.status === "error")}
            onClick={() => {
              void runBatch("failed")
            }}
            type="button">
            Retry Failed
          </button>
          <button
            className="rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 disabled:opacity-50"
            disabled={!isRunning}
            onClick={requestCancel}
            type="button">
            {cancelRequested ? "Canceling..." : "Cancel"}
          </button>
          <button
            className="rounded border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-400 disabled:opacity-50"
            disabled={!isRunning}
            onClick={togglePause}
            type="button">
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
            disabled={isRunning || queue.length === 0}
            onClick={() => setQueue([])}
            type="button">
            Clear
          </button>
        </div>
      </div>

      <label
        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-4 py-8 text-center hover:border-slate-400 dark:border-slate-500"
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
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drop image files here or click to browse</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Only image files are accepted.</p>
      </label>

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

      <div className="mt-4 space-y-2">
        {queue.map((item) => {
          const color =
            item.status === "success"
              ? "bg-emerald-500"
              : item.status === "error"
                ? "bg-red-500"
                : "bg-blue-500"

          return (
            <div key={item.id} className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-slate-800 dark:text-slate-200">{item.file.name}</span>
                <span className="shrink-0 text-xs uppercase text-slate-500 dark:text-slate-400">{item.status}</span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full ${color} transition-all`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>

              {item.message ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{item.message}</p> : null}
            </div>
          )
        })}

        {queue.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No files in queue.</p>
        ) : null}
      </div>

      {summary ? (
        <div className="mt-4 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-200">
          <p className="font-semibold text-slate-900 dark:text-white">Last run summary</p>
          <p>
            Mode: {summary.mode === "all" ? "All queued" : "Retry failed"} | Total: {summary.total}
          </p>
          <p>
            Success: {summary.success} | Failed: {summary.failed} | Duration: {Math.round(summary.durationMs / 1000)}s
          </p>
          <p>{summary.canceled ? "Run ended by cancel request." : "Run completed."}</p>
        </div>
      ) : null}
    </section>
  )
}
