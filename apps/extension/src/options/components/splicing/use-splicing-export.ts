import type { Dispatch, MutableRefObject, SetStateAction } from "react"
import { useCallback } from "react"
import { zip } from "fflate"
import { PDFDocument } from "pdf-lib"

import { APP_CONFIG } from "@/core/config"
import type { ConversionProgressPayload } from "@/core/types"
import { getCanonicalExtension } from "@/core/download-utils"
import { setWasmWorkerPoolSize, terminateWasmWorkerPool } from "@/features/converter/wasm-worker-pool"
import { exportSplicedImage, computeSplicingExportCanvasDimensions } from "@/features/splicing/canvas-renderer"
import { calculateLayout, calculateProcessedSize } from "@/features/splicing/layout-engine"
import type { SplicingExportConfig, SplicingImageItem } from "@/features/splicing/types"
import { buildSmartOutputFileName, reserveUniqueFileName } from "@/options/components/batch/pipeline"
import type { ExportSplitMode } from "@/options/components/shared/export-split-button"
import { buildActiveSplicingFormatOptions } from "@/options/stores/splicing-format-options"
import { useSplicingStore, resolveCanvasStyle, resolveImageStyle, resolveLayoutConfig } from "@/options/stores/splicing-store"

export type SplicingExportMode = ExportSplitMode

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 500)
}

async function createZipBlob(files: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const zipData: Record<string, Uint8Array> = {}
  for (const file of files) {
    zipData[file.name] = new Uint8Array(await file.blob.arrayBuffer())
  }

  return new Promise((resolve, reject) => {
    zip(zipData, (err, data) => {
      if (err || !data) {
        reject(err ?? new Error("Unable to create ZIP"))
        return
      }
      resolve(new Blob([data as unknown as BlobPart], { type: "application/zip" }))
    })
  })
}

export interface UseSplicingExportArgs {
  images: SplicingImageItem[]
  exportTargetCount: number
  isExporting: boolean
  skipDownloadConfirm: boolean

  pushToast: (payload: ConversionProgressPayload) => void
  setImportToastPayload: Dispatch<SetStateAction<ConversionProgressPayload | null>>
  importToastHideTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>

  setIsExporting: (v: boolean) => void
  setShowDownloadConfirm: (v: boolean) => void
  setPendingExportModeForConfirm: (v: SplicingExportMode | null) => void
}

export function useSplicingExport({
  images,
  exportTargetCount,
  isExporting,
  skipDownloadConfirm,
  pushToast,
  setImportToastPayload,
  importToastHideTimerRef,
  setIsExporting,
  setShowDownloadConfirm,
  setPendingExportModeForConfirm
}: UseSplicingExportArgs) {
  const performExport = useCallback(
    async (downloadMode: SplicingExportMode, forceDownloadConfirm: boolean = false) => {
      if (images.length === 0 || isExporting) return

      if (
        (downloadMode === "one_by_one" || downloadMode === "individual_pdf") &&
        !forceDownloadConfirm &&
        exportTargetCount > APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD &&
        !skipDownloadConfirm
      ) {
        setShowDownloadConfirm(true)
        setPendingExportModeForConfirm(downloadMode)
        return
      }

      setIsExporting(true)

      try {
        const store = useSplicingStore.getState()
        const usesWasmEncoder = store.exportFormat === "avif" || store.exportFormat === "jxl"
        if (usesWasmEncoder) {
          setWasmWorkerPoolSize(store.exportFormat === "jxl" ? "jxl" : "avif", store.exportConcurrency)
        }

        const layout = resolveLayoutConfig(store)
        const canvas = resolveCanvasStyle(store)
        const imgStyle = resolveImageStyle(store)

        const config: SplicingExportConfig = {
          format: store.exportFormat,
          quality: store.exportQuality,
          formatOptions: buildActiveSplicingFormatOptions(store),
          exportMode: store.exportMode,
          trimBackground: store.exportTrimBackground
        }

        const exportTsMs = Date.now()
        const toastId = `splicing_export_${exportTsMs}`
        pushToast({
          id: toastId,
          fileName: `Exporting ${exportTargetCount} images`,
          targetFormat: store.exportFormat,
          status: "processing",
          percent: 2,
          message: "Preparing export..."
        })

        const blobs = await exportSplicedImage(
          images,
          layout,
          canvas,
          imgStyle,
          store.imageResize,
          store.imageFitValue,
          config,
          {
            concurrency: store.exportConcurrency,
            onProgress: ({ phase, completed, total, active, message }) => {
              const safeTotal = Math.max(1, total)
              const ratio =
                phase === "render"
                  ? Math.min(1, (completed + active * 0.55) / safeTotal)
                  : Math.min(1, completed / safeTotal)
              const percent = phase === "decode" ? Math.min(30, Math.round(4 + ratio * 26)) : Math.min(78, Math.round(30 + ratio * 48))
              pushToast({
                id: toastId,
                fileName: `Exporting ${exportTargetCount} images`,
                targetFormat: store.exportFormat,
                status: "processing",
                percent,
                message
              })
            }
          }
        )

        const ext = getCanonicalExtension(store.exportFormat)

        const imageSizes = images.map((img) => {
          const processed = calculateProcessedSize(img.originalWidth, img.originalHeight, store.imageResize, store.imageFitValue)
          return { width: processed.width, height: processed.height }
        })
        const exportLayout = calculateLayout(imageSizes, layout, canvas, imgStyle, store.imageResize, store.imageFitValue)

        const pattern = store.exportFileNamePattern.trim() || "spliced-[Index]"
        const now = new Date(exportTsMs)
        const usedExportNames = new Set<string>()

        const buildImageFileName = (i: number) => {
          const dims = computeSplicingExportCanvasDimensions(exportLayout, canvas, config, i)
          const raw = buildSmartOutputFileName({
            pattern,
            originalFileName: "image",
            dimensions: dims,
            index: i + 1,
            totalFiles: blobs.length,
            outputExtension: ext,
            now
          })
          return reserveUniqueFileName(raw, usedExportNames)
        }

        const buildPdfFileName = (i: number) => {
          const dims = computeSplicingExportCanvasDimensions(exportLayout, canvas, config, i)
          const raw = buildSmartOutputFileName({
            pattern,
            originalFileName: "image",
            dimensions: dims,
            index: i + 1,
            totalFiles: blobs.length,
            outputExtension: "pdf",
            now
          })
          return reserveUniqueFileName(raw, usedExportNames)
        }

        // Note: merged PDF filename is always `spliced-image-<timestamp>.pdf`
        // (as required by current UX), so we don't apply the pattern to the merged PDF filename.

        if (downloadMode === "one_by_one") {
          for (let i = 0; i < blobs.length; i++) {
            downloadBlob(blobs[i], buildImageFileName(i))
            const percent = 78 + Math.round(((i + 1) / Math.max(1, blobs.length)) * 20)
            pushToast({
              id: toastId,
              fileName: `Exporting ${blobs.length} images`,
              targetFormat: store.exportFormat,
              status: "processing",
              percent: Math.min(98, percent),
              message: `Downloaded ${i + 1}/${blobs.length} files...`
            })
            await new Promise((r) => setTimeout(r, 120))
          }
          pushToast({
            id: toastId,
            fileName: "Export complete",
            targetFormat: store.exportFormat,
            status: "success",
            percent: 100,
            message: `Successfully exported ${blobs.length} images.`
          })
        } else if (downloadMode === "zip") {
          const zipFileName = `spliced-image-${exportTsMs}.zip`
          pushToast({
            id: toastId,
            fileName: zipFileName,
            targetFormat: store.exportFormat,
            status: "processing",
            percent: 85,
            message: "Packaging ZIP..."
          })
          const files: Array<{ name: string; blob: Blob }> = []
          for (let i = 0; i < blobs.length; i++) {
            files.push({ name: buildImageFileName(i), blob: blobs[i] })
          }
          const zipBlob = await createZipBlob(files)
          pushToast({
            id: toastId,
            fileName: zipFileName,
            targetFormat: store.exportFormat,
            status: "processing",
            percent: 96,
            message: "Starting ZIP download..."
          })
          downloadBlob(zipBlob, zipFileName)
          pushToast({
            id: toastId,
            fileName: zipFileName,
            targetFormat: store.exportFormat,
            status: "success",
            percent: 100,
            message: "ZIP download started"
          })
        } else if (downloadMode === "pdf" || downloadMode === "individual_pdf") {
          const convertBlobToPdfPage = async (pdfDoc: PDFDocument, blob: Blob) => {
            let image: Awaited<ReturnType<typeof pdfDoc.embedPng | typeof pdfDoc.embedJpg>>
            if (ext === "png") {
              image = await pdfDoc.embedPng(await blob.arrayBuffer())
            } else if (ext === "jpg" || ext === "jpeg") {
              image = await pdfDoc.embedJpg(await blob.arrayBuffer())
            } else {
              const canvas = new OffscreenCanvas(100, 100)
              const ctx = canvas.getContext("2d")
              if (!ctx) return

              const bitmap = await createImageBitmap(blob)
              canvas.width = bitmap.width
              canvas.height = bitmap.height
              ctx.drawImage(bitmap, 0, 0)
              bitmap.close()

              const pngBlob = await canvas.convertToBlob({ type: "image/png" })
              image = await pdfDoc.embedPng(await pngBlob.arrayBuffer())
            }

            const width = image.width as number
            const height = image.height as number
            const page = pdfDoc.addPage([width, height])
            page.drawImage(image, { x: 0, y: 0, width, height })
          }

          if (downloadMode === "individual_pdf") {
            for (let i = 0; i < blobs.length; i++) {
              const pdfDoc = await PDFDocument.create()
              await convertBlobToPdfPage(pdfDoc, blobs[i])
              const pdfBytes = await pdfDoc.save()
              const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
              downloadBlob(pdfBlob, buildPdfFileName(i))
              const percent = 78 + Math.round(((i + 1) / Math.max(1, blobs.length)) * 20)
              pushToast({
                id: toastId,
                fileName: `Exporting ${blobs.length} PDFs`,
                targetFormat: "pdf",
                status: "processing",
                percent: Math.min(98, percent),
                message: `Downloaded ${i + 1}/${blobs.length} PDFs...`
              })
            }
            pushToast({
              id: toastId,
              fileName: "Export complete",
              targetFormat: "pdf",
              status: "success",
              percent: 100,
              message: `Successfully exported ${blobs.length} PDFs.`
            })
            importToastHideTimerRef.current = setTimeout(() => {
              setImportToastPayload((current) => (current?.id === toastId ? null : current))
              importToastHideTimerRef.current = null
            }, 2500)
            return
          }

          const pdfDoc = await PDFDocument.create()
          for (const blob of blobs) {
            await convertBlobToPdfPage(pdfDoc, blob)
          }

          const pdfBytes = await pdfDoc.save()
          const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
          const singlePdfFileName = `spliced-image-${exportTsMs}.pdf`
          downloadBlob(pdfBlob, singlePdfFileName)
          pushToast({
            id: toastId,
            fileName: singlePdfFileName,
            targetFormat: "pdf",
            status: "success",
            percent: 100,
            message: "PDF download started"
          })
        }

        importToastHideTimerRef.current = setTimeout(() => {
          setImportToastPayload((current) => (current?.id === toastId ? null : current))
          importToastHideTimerRef.current = null
        }, 2500)
      } catch (err) {
        console.error("Export failed:", err)
        const store = useSplicingStore.getState()
        pushToast({
          id: `splicing_export_err_${Date.now()}`,
          fileName: "Export failed",
          targetFormat: store.exportFormat,
          status: "error",
          percent: 100,
          message: "Unable to export images"
        })
      } finally {
        const store = useSplicingStore.getState()
        if (store.exportFormat === "avif" || store.exportFormat === "jxl") {
          terminateWasmWorkerPool(store.exportFormat)
        }
        setIsExporting(false)
      }
    },
    [
      images,
      isExporting,
      exportTargetCount,
      skipDownloadConfirm,
      pushToast,
      setImportToastPayload,
      importToastHideTimerRef,
      setIsExporting,
      setShowDownloadConfirm,
      setPendingExportModeForConfirm
    ]
  )

  return { performExport }
}

