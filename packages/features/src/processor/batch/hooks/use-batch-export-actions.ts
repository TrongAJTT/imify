import { useEffect, useRef, useState } from "react"
import { APP_CONFIG } from "@imify/core/config"
import { toUserFacingConversionError } from "@imify/core/error-utils"
import type { ConversionProgressPayload, FormatConfig } from "@imify/core/types"
import type { BatchExportAction, BatchQueueItem } from "../types"
import { downloadWithFilename, sleep } from "../utils"
import { PackagerWorkerClient } from "../workers"
import type { PackagerInputEntry, PackagerJobMode } from "../workers"

function getBatchZipTimestamp(): number { return Math.floor(Date.now() / 1000) }

export function useBatchExportActions({ queue, config, skipDownloadConfirm, onClosePdfSplit }: { queue: BatchQueueItem[]; config: FormatConfig; skipDownloadConfirm: boolean; onClosePdfSplit: () => void }) {
  const [isExporting, setIsExporting] = useState(false)
  const [activeExportAction, setActiveExportAction] = useState<BatchExportAction | null>(null)
  const [exportToastPayload, setExportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const exportToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const packagerWorkerRef = useRef<PackagerWorkerClient | null>(null)
  const clearExportToastHideTimer = () => { if (!exportToastHideTimerRef.current) return; clearTimeout(exportToastHideTimerRef.current); exportToastHideTimerRef.current = null }
  const pushExportToast = (payload: ConversionProgressPayload) => {
    clearExportToastHideTimer()
    setExportToastPayload(payload)
    if (payload.status === "success" || payload.status === "error") {
      exportToastHideTimerRef.current = setTimeout(() => { setExportToastPayload(null); exportToastHideTimerRef.current = null }, 3000)
    }
  }
  useEffect(() => () => { clearExportToastHideTimer(); packagerWorkerRef.current?.terminate(); packagerWorkerRef.current = null }, [])
  const getPackagerWorker = () => (packagerWorkerRef.current ??= new PackagerWorkerClient())
  const getSuccessfulOutputs = () => queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName)
  const closeDownloadConfirm = () => setShowDownloadConfirm(false)
  const clearExportToast = (toastId?: string) => { clearExportToastHideTimer(); setExportToastPayload((current) => (!current || (toastId && current.id !== toastId) ? current : null)) }

  const downloadIndividually = async (force = false) => {
    const successful = getSuccessfulOutputs()
    if (!successful.length || isExporting) return
    if (!force && successful.length > APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD && !skipDownloadConfirm) { setShowDownloadConfirm(true); return }
    setIsExporting(true); setActiveExportAction("one_by_one")
    try { for (const item of successful) { await downloadWithFilename(item.outputBlob as Blob, item.outputFileName as string); await sleep(120) } } finally { setIsExporting(false); setActiveExportAction(null) }
  }
  const confirmDownloadIndividually = async () => { setShowDownloadConfirm(false); await downloadIndividually(true) }

  const runPackagerExport = async (params: { toastId: string; exportFileName: string; targetFormat: FormatConfig["format"]; mode: PackagerJobMode; entries: PackagerInputEntry[]; initialMessage: string; successMessage: string }) => {
    pushExportToast({ id: params.toastId, fileName: params.exportFileName, targetFormat: params.targetFormat, status: "processing", percent: 8, message: params.initialMessage })
    const result = await getPackagerWorker().run({ mode: params.mode, entries: params.entries, exportFileName: params.exportFileName, zipLevel: 6, onProgress: ({ percent, message }) => pushExportToast({ id: params.toastId, fileName: params.exportFileName, targetFormat: params.targetFormat, status: "processing", percent, message }) })
    pushExportToast({ id: params.toastId, fileName: params.exportFileName, targetFormat: params.targetFormat, status: "processing", percent: 96, message: "Opening download dialog..." })
    await downloadWithFilename(result.outputBlob, result.outputFileName)
    pushExportToast({ id: params.toastId, fileName: params.exportFileName, targetFormat: params.targetFormat, status: "success", percent: 100, message: params.successMessage })
  }

  const downloadAsZip = async () => {
    const successful = getSuccessfulOutputs(); if (!successful.length || isExporting) return
    setIsExporting(true); setActiveExportAction("zip")
    const toastId = `batch_export_zip_${Date.now()}`; const exportFileName = `imify_batch_${getBatchZipTimestamp()}.zip`
    try {
      await runPackagerExport({ toastId, exportFileName, targetFormat: config.format, mode: "zip", entries: successful.map((item) => ({ name: item.outputFileName as string, blob: item.outputBlob as Blob })), initialMessage: "Collecting converted files...", successMessage: "ZIP download started" })
    } catch (error) {
      pushExportToast({ id: toastId, fileName: exportFileName, targetFormat: config.format, status: "error", percent: 100, message: toUserFacingConversionError(error, "Unable to export ZIP") })
    } finally { setIsExporting(false); setActiveExportAction(null) }
  }

  const mergeIntoPdf = async () => {
    const successful = queue.filter((item) => item.status === "success" && item.outputBlob); if (!successful.length || isExporting) return
    setIsExporting(true); setActiveExportAction("merge_pdf"); onClosePdfSplit()
    const toastId = `batch_export_merge_pdf_${Date.now()}`; const exportFileName = `imify_batch_${getBatchZipTimestamp()}.pdf`
    try {
      await runPackagerExport({ toastId, exportFileName, targetFormat: "pdf", mode: "merge_pdf", entries: successful.map((item, index) => ({ name: item.outputFileName || `page_${index + 1}.jpg`, blob: item.outputBlob as Blob })), initialMessage: "Preparing pages for merged PDF...", successMessage: "PDF download started" })
    } catch (error) {
      pushExportToast({ id: toastId, fileName: exportFileName, targetFormat: "pdf", status: "error", percent: 100, message: toUserFacingConversionError(error, "Unable to merge PDF") })
    } finally { setIsExporting(false); setActiveExportAction(null) }
  }

  const downloadIndividualPdfs = async () => {
    const successful = getSuccessfulOutputs(); if (!successful.length || isExporting) return
    setIsExporting(true); setActiveExportAction("individual_pdf"); onClosePdfSplit()
    const toastId = `batch_export_individual_pdf_${Date.now()}`; const exportFileName = `imify_batch_pdf_${getBatchZipTimestamp()}.zip`
    try {
      await runPackagerExport({ toastId, exportFileName, targetFormat: "pdf", mode: "pdf_zip", entries: successful.map((item, index) => ({ name: item.outputFileName || `image_${index + 1}.jpg`, blob: item.outputBlob as Blob })), initialMessage: "Preparing individual PDFs...", successMessage: "PDF ZIP download started" })
    } catch (error) {
      pushExportToast({ id: toastId, fileName: exportFileName, targetFormat: "pdf", status: "error", percent: 100, message: toUserFacingConversionError(error, "Unable to export individual PDFs") })
    } finally { setIsExporting(false); setActiveExportAction(null) }
  }

  return { isExporting, activeExportAction, exportToastPayload, clearExportToast, showDownloadConfirm, closeDownloadConfirm, confirmDownloadIndividually, downloadIndividually, downloadAsZip, mergeIntoPdf, downloadIndividualPdfs }
}
