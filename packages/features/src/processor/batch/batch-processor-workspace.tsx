import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { ToastContainer, BodyText } from "@imify/ui"
import { useConversionToasts, useToast } from "@imify/core/hooks/use-toast"
import type { ConversionProgressPayload, FormatConfig } from "@imify/core/types"
import { fetchRemoteImagesFromUrls } from "@imify/engine/converter/remote-image-import"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useWatermarkStore } from "@imify/stores/stores/watermark-store"
import { useClipboardPaste } from "../../shared/use-clipboard-paste"
import { BatchDownloadConfirmDialog } from "../../shared/download-confirm-dialog"
import { ImageUrlImportControl } from "../image-url-import-control"
import { buildActiveCodecOptionsForTarget } from "../target-format-state"
import { BatchActionBar } from "./action-bar"
import { BatchQueueGrid } from "./queue-grid"
import { BatchSummaryCard } from "./summary-card"
import { BatchUploadDropzone } from "./upload-dropzone"
import { OOMWarningDialog } from "./oom-warning-dialog"
import type { BatchQueueItem } from "./types"
import { readImageDimensions } from "./pipeline"
import { MAX_FILE_SIZE_BYTES, MAX_TOTAL_QUEUE_BYTES, formatBytes, toMb, withBatchResize } from "./utils"
import { useBatchExecution } from "./hooks/use-batch-execution"
import { useBatchExportActions } from "./hooks/use-batch-export-actions"

export function BatchProcessorWorkspace() {
  const targetFormat = useBatchStore((s) => s.targetFormat)
  const concurrency = useBatchStore((s) => s.concurrency)
  const quality = useBatchStore((s) => s.quality)
  const formatOptions = useBatchStore((s) => s.formatOptions)
  const resizeMode = useBatchStore((s) => s.resizeMode)
  const resizeValue = useBatchStore((s) => s.resizeValue)
  const resizeWidth = useBatchStore((s) => s.resizeWidth)
  const resizeHeight = useBatchStore((s) => s.resizeHeight)
  const resizeAspectMode = useBatchStore((s) => s.resizeAspectMode)
  const resizeAspectRatio = useBatchStore((s) => s.resizeAspectRatio)
  const resizeAnchor = useBatchStore((s) => s.resizeAnchor)
  const resizeFitMode = useBatchStore((s) => s.resizeFitMode)
  const resizeContainBackground = useBatchStore((s) => s.resizeContainBackground)
  const resizeResamplingAlgorithm = useBatchStore((s) => s.resizeResamplingAlgorithm)
  const paperSize = useBatchStore((s) => s.paperSize)
  const dpi = useBatchStore((s) => s.dpi)
  const stripExif = useBatchStore((s) => s.stripExif)
  const fileNamePattern = useBatchStore((s) => s.fileNamePattern)
  const watermark = useWatermarkStore((s) => s.contextWatermarks.batch)
  const skipDownloadConfirm = useBatchStore((s) => s.skipDownloadConfirm)
  const skipOomWarning = useBatchStore((s) => s.skipOomWarning)
  const setSkipOomWarning = useBatchStore((s) => s.setSkipOomWarning)
  const heavyFormatToast = useBatchStore((s) => s.heavyFormatToast)
  const setHeavyFormatToast = useBatchStore((s) => s.setHeavyFormatToast)
  const setBatchIsRunning = useBatchStore((s) => s.setIsRunning)
  const syncResizeToSource = useBatchStore((s) => s.syncResizeToSource)
  const [queue, setQueue] = useState<BatchQueueItem[]>([])
  const [urlImportToast, setUrlImportToast] = useState<ConversionProgressPayload | null>(null)
  const [isImportingUrls, setIsImportingUrls] = useState(false)
  const [isPdfSplitOpen, setIsPdfSplitOpen] = useState(false)
  const pdfSplitRef = useRef<HTMLDivElement>(null)
  const firstQueueItem = queue[0]
  const { toasts: systemToasts, hide, warning } = useToast()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const effectiveConfig = useMemo(() => {
    const isMozJpegTarget = targetFormat === "mozjpeg"
    const baseConfig: FormatConfig = { id: `batch_${targetFormat}`, name: `Batch ${isMozJpegTarget ? "MOZJPEG" : targetFormat.toUpperCase()}`, format: isMozJpegTarget ? "jpg" : targetFormat, enabled: true, quality, formatOptions: buildActiveCodecOptionsForTarget(targetFormat, formatOptions), resize: { mode: "none" } }
    return withBatchResize(baseConfig, resizeMode, quality, formatOptions, resizeValue, resizeWidth, resizeHeight, resizeAspectMode, resizeAspectRatio, resizeAnchor, resizeFitMode, resizeContainBackground, resizeResamplingAlgorithm, paperSize, dpi)
  }, [targetFormat, resizeMode, quality, formatOptions, resizeValue, resizeWidth, resizeHeight, resizeAspectMode, resizeAspectRatio, resizeAnchor, resizeFitMode, resizeContainBackground, resizeResamplingAlgorithm, paperSize, dpi])
  const { isRunning, paused, cancelRequested, summary, batchToastPayload, clearBatchToast, oomWarning, runBatch, requestCancel, togglePause, closeOomWarning, confirmOomWarning, clearSummary } = useBatchExecution({ queue, setQueue, config: effectiveConfig, concurrency, stripExif, fileNamePattern, watermark, skipOomWarning, onPersistSkipOomWarning: () => setSkipOomWarning(true) })
  const { isExporting, activeExportAction, exportToastPayload, clearExportToast, showDownloadConfirm, closeDownloadConfirm, confirmDownloadIndividually, downloadIndividually, downloadAsZip, mergeIntoPdf, downloadIndividualPdfs } = useBatchExportActions({ queue, config: effectiveConfig, skipDownloadConfirm, onClosePdfSplit: () => setIsPdfSplitOpen(false) })
  const conversionToasts = useConversionToasts([urlImportToast, exportToastPayload, batchToastPayload])
  const mergedToasts = useMemo(() => [...conversionToasts, ...systemToasts], [conversionToasts, systemToasts])
  const handleRemoveToast = useCallback((toastId: string) => { hide(toastId); setUrlImportToast((current) => (current?.id === toastId ? null : current)); clearExportToast(toastId); clearBatchToast(toastId) }, [clearBatchToast, clearExportToast, hide])
  useEffect(() => { setBatchIsRunning(isRunning) }, [isRunning, setBatchIsRunning])
  useEffect(() => { if (!heavyFormatToast) return; warning(`${heavyFormatToast.format} encoding is heavy`, "If your PC is low-spec, consider lowering Concurrency to 1 or 2 to avoid lags.", 6000); setHeavyFormatToast(null) }, [heavyFormatToast, setHeavyFormatToast, warning])
  useEffect(() => {
    if (!isPdfSplitOpen) return
    const handlePointerDown = (event: PointerEvent) => { if (pdfSplitRef.current && !pdfSplitRef.current.contains(event.target as Node)) setIsPdfSplitOpen(false) }
    window.addEventListener("pointerdown", handlePointerDown)
    return () => window.removeEventListener("pointerdown", handlePointerDown)
  }, [isPdfSplitOpen])
  useEffect(() => {
    if (!firstQueueItem) return
    let active = true
    void (async () => { const dimensions = await readImageDimensions(firstQueueItem.file); if (!dimensions || !active) return; syncResizeToSource(dimensions.width, dimensions.height) })()
    return () => { active = false }
  }, [firstQueueItem?.file, firstQueueItem?.id, syncResizeToSource])
  const removeItem = (id: string) => setQueue((current) => current.filter((item) => item.id !== id))
  const appendImageFiles = (inputFiles: File[]) => {
    if (!inputFiles.length) return
    const nextItems: BatchQueueItem[] = inputFiles.filter((file) => file.type.startsWith("image/")).map((file) => ({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, file, status: file.size > MAX_FILE_SIZE_BYTES ? "error" : "queued", percent: file.size > MAX_FILE_SIZE_BYTES ? 100 : 0, message: file.size > MAX_FILE_SIZE_BYTES ? `Skipped: file is larger than ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB limit` : undefined }))
    if (!nextItems.length) return
    setQueue((current) => [...current, ...nextItems])
  }
  const importFromImageUrls = async (urls: string[]) => {
    if (!urls.length) return
    setIsImportingUrls(true); setUrlImportToast(null)
    try {
      const { files, failures } = await fetchRemoteImagesFromUrls(urls)
      if (files.length) appendImageFiles(files)
      const toastId = `url_import_${Date.now()}`
      const status: "success" | "error" = files.length && !failures.length ? "success" : "error"
      const message = files.length && !failures.length ? `Imported ${files.length} image URL${files.length > 1 ? "s" : ""}.` : files.length && failures.length ? `Imported ${files.length} URL${files.length > 1 ? "s" : ""}, ${failures.length} failed.` : "No valid image URLs were imported."
      setUrlImportToast({ id: toastId, fileName: "URL Import Status", targetFormat: targetFormat, status, percent: 100, message })
      setTimeout(() => setUrlImportToast((current) => (current?.id === toastId ? null : current)), 2000)
    } finally { setIsImportingUrls(false) }
  }
  const appendFiles = (files: FileList | null) => { if (files && files.length > 0) appendImageFiles(Array.from(files)) }
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id && !isRunning) {
      setQueue((items) => arrayMove(items, items.findIndex((item) => item.id === active.id), items.findIndex((item) => item.id === over.id)))
    }
  }
  useClipboardPaste({ onFiles: appendImageFiles, onUrls: importFromImageUrls })
  const totalQueueBytes = useMemo(() => queue.reduce((sum, item) => sum + item.file.size, 0), [queue])
  const queueTooLarge = totalQueueBytes > MAX_TOTAL_QUEUE_BYTES
  const queueStats = useMemo(() => queue.reduce((acc, item) => { acc[item.status] += 1; return acc }, { queued: 0, processing: 0, success: 0, error: 0 }), [queue])
  const successfulOutputs = useMemo(() => queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName), [queue])
  const sourceTotalAfterRun = useMemo(() => successfulOutputs.reduce((sum, item) => sum + item.file.size, 0), [successfulOutputs])
  const outputTotalAfterRun = useMemo(() => successfulOutputs.reduce((sum, item) => sum + (item.outputBlob as Blob).size, 0), [successfulOutputs])
  const reductionPercent = useMemo(() => { if (!sourceTotalAfterRun) return 0; const ratio = ((sourceTotalAfterRun - outputTotalAfterRun) / sourceTotalAfterRun) * 100; return Number.isFinite(ratio) ? ratio : 0 }, [sourceTotalAfterRun, outputTotalAfterRun])
  const canRetryFailed = queueStats.error > 0 && !isRunning
  const canRunAll = Boolean(effectiveConfig) && !isRunning && queueStats.queued > 0
  const runAllLabel: "Start Batch" | "Continue Batch" = queueStats.processing > 0 || queueStats.success > 0 || queueStats.error > 0 ? "Continue Batch" : "Start Batch"
  return (
    <div className="p-6">
      <BatchActionBar canRetryFailed={canRetryFailed} canRunAll={canRunAll} cancelRequested={cancelRequested} isRunning={isRunning} onCancel={requestCancel} onClear={() => { setQueue([]); clearSummary() }} onRunAll={() => { void runBatch("all") }} onRunFailed={() => { void runBatch("failed") }} onTogglePause={togglePause} paused={paused} queueHasItems={queue.length > 0} queueStats={queueStats} runAllLabel={runAllLabel} />
      {cancelRequested ? <BodyText className="mt-3 text-amber-700 dark:text-amber-400">Cancel requested. Current in-flight items will finish before stopping.</BodyText> : null}
      {paused ? <BodyText className="mt-3 text-indigo-700 dark:text-indigo-400">Batch is paused. Click Resume to continue.</BodyText> : null}
      {queueTooLarge ? <BodyText className="mt-3 text-amber-700 dark:text-amber-400">Warning: queue size is {toMb(totalQueueBytes)} MB. You may hit memory pressure on AVIF/PDF.</BodyText> : null}
      {summary && !isRunning && queue.length > 0 ? <BatchSummaryCard activeExportAction={activeExportAction} formatBytes={formatBytes} isExporting={isExporting} isPdfSplitOpen={isPdfSplitOpen} onDownloadAsZip={() => { void downloadAsZip() }} onDownloadIndividualPdfs={() => { void downloadIndividualPdfs() }} onDownloadIndividually={() => { void downloadIndividually() }} onMergeIntoPdf={() => { void mergeIntoPdf() }} onTogglePdfSplit={() => setIsPdfSplitOpen((current) => !current)} outputTotalAfterRun={outputTotalAfterRun} pdfSplitRef={pdfSplitRef} reductionPercent={reductionPercent} sourceTotalAfterRun={sourceTotalAfterRun} successfulCount={successfulOutputs.length} summary={summary} targetFormat={effectiveConfig?.format || "jpg"} /> : (!isRunning ? <BatchUploadDropzone onAppendFiles={appendFiles} urlImportControl={<ImageUrlImportControl allowMultiple disabled={isImportingUrls} onProcessUrls={importFromImageUrls} />} /> : null)}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><BatchQueueGrid isRunning={isRunning} onRemoveItem={removeItem} queue={queue} /></DndContext>
      <BatchDownloadConfirmDialog isOpen={showDownloadConfirm} count={successfulOutputs.length} onClose={closeDownloadConfirm} onConfirm={() => { void confirmDownloadIndividually() }} />
      <OOMWarningDialog isOpen={!!oomWarning?.isOpen} totalSize={oomWarning?.totalSize || "0"} recommendedSize={oomWarning?.recommendedSize || "350"} onClose={closeOomWarning} onConfirm={(dontShowAgain) => { void confirmOomWarning(dontShowAgain) }} />
      <ToastContainer toasts={mergedToasts} onRemove={handleRemoveToast} />
    </div>
  )
}
