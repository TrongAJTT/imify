import type { QuickExportFormat } from "@imify/core"
import type {
  PaperSize,
  ResizeApplyTo,
  ResizeAspectMode,
  ResizeFitMode,
  ResizeMode,
  ResizeResamplingAlgorithm,
  SupportedDPI
} from "@imify/core/types"

export type PdfStudioMode = "images-to-pdf" | "pdf-to-images"

export interface PdfStudioImageItem {
  id: string
  file: File
  previewUrl: string
  name: string
  size: number
}

export interface PdfToImagesConfig {
  format: QuickExportFormat
  dpi: number // 72, 150, 300
  fileNamePattern: string
  pageSelectionMode: "all" | "custom"
  customPageRange: string
}

export interface ImagesToPdfConfig {
  resizeMode: ResizeMode
  resizeValue: number
  resizeApplyTo: ResizeApplyTo
  resizeWidth: number
  resizeHeight: number
  resizeAspectMode: ResizeAspectMode
  resizeAspectRatio: string
  resizeFitMode: ResizeFitMode
  resizeContainBackground: string
  resamplingAlgorithm: ResizeResamplingAlgorithm
  paperSize: PaperSize
  dpi: SupportedDPI
  margin: number
}
