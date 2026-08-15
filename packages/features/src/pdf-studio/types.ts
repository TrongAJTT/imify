import type {
  PaperSize,
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
  dpi: number // 72, 150, 300, 600
  format: "png" | "jpg" | "webp"
  quality: number // 1 - 100
  pageSelectionMode: "all" | "custom"
  customPageRange: string // e.g. "1-3, 5, 8-10"
}

export interface ImagesToPdfConfig {
  resizeMode: "inherit" | "paper_size"
  paperSize: PaperSize
  dpi: SupportedDPI
  resamplingAlgorithm: ResizeResamplingAlgorithm
  margin: number
}
