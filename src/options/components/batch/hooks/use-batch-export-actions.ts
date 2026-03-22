import JSZip from "jszip"
import { useEffect, useRef, useState } from "react"

import { toUserFacingConversionError } from "@/core/error-utils"
import type { ConversionProgressPayload, FormatConfig } from "@/core/types"
import { convertImageToPdf, mergeImagesToPdf } from "@/features/converter/pdf-engine"
import type { BatchExportAction, BatchQueueItem } from "@/options/components/batch/types"
import { downloadWithFilename, sleep } from "@/options/components/batch/utils"

function getBatchZipTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

interface UseBatchExportActionsParams {
  queue: BatchQueueItem[]
  config: FormatConfig
  skipDownloadConfirm: boolean
  onClosePdfSplit: () => void
}

interface UseBatchExportActionsResult {
  isExporting: boolean
  activeExportAction: BatchExportAction | null
  exportToastPayload: ConversionProgressPayload | null
  showDownloadConfirm: boolean
  closeDownloadConfirm: () => void
  confirmDownloadIndividually: () => Promise<void>
  downloadIndividually: (force?: boolean) => Promise<void>
  downloadAsZip: () => Promise<void>
  mergeIntoPdf: () => Promise<void>
  downloadIndividualPdfs: () => Promise<void>
}

export function useBatchExportActions({
  queue,
  config,
  skipDownloadConfirm,
  onClosePdfSplit
}: UseBatchExportActionsParams): UseBatchExportActionsResult {
  const [isExporting, setIsExporting] = useState(false)
  const [activeExportAction, setActiveExportAction] = useState<BatchExportAction | null>(null)
  const [exportToastPayload, setExportToastPayload] = useState<ConversionProgressPayload | null>(null)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)

  const exportToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    return () => {
      clearExportToastHideTimer()
    }
  }, [])

  const getSuccessfulOutputs = () =>
    queue.filter((item) => item.status === "success" && item.outputBlob && item.outputFileName)

  const closeDownloadConfirm = () => {
    setShowDownloadConfirm(false)
  }

  const downloadIndividually = async (force: boolean = false) => {
    const successful = getSuccessfulOutputs()

    if (!successful.length || isExporting) {
      return
    }

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

  const confirmDownloadIndividually = async () => {
    setShowDownloadConfirm(false)
    await downloadIndividually(true)
  }

  const downloadAsZip = async () => {
    const successful = getSuccessfulOutputs()

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
        targetFormat: config.format,
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
          targetFormat: config.format,
          status: "processing",
          percent,
          message: `Added ${index + 1}/${successful.length} files to ZIP...`
        })
      }

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: config.format,
        status: "processing",
        percent: 82,
        message: "Compressing ZIP archive..."
      })

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      })

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: config.format,
        status: "processing",
        percent: 96,
        message: "Opening download dialog..."
      })

      await downloadWithFilename(zipBlob, exportFileName)

      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: config.format,
        status: "success",
        percent: 100,
        message: "ZIP download started"
      })
    } catch (error) {
      pushExportToast({
        id: toastId,
        fileName: exportFileName,
        targetFormat: config.format,
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
    onClosePdfSplit()
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
    const successful = getSuccessfulOutputs()

    if (!successful.length || isExporting) {
      return
    }

    setIsExporting(true)
    setActiveExportAction("individual_pdf")
    onClosePdfSplit()
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

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      })

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

  return {
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
  }
}
