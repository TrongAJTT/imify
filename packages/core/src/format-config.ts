import type { ImageFormat } from "./types"

export const QUALITY_FORMATS: ImageFormat[] = ["jpg", "webp", "avif", "jxl"]

export const GLOBAL_FORMATS: ImageFormat[] = [
  "jpg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "ico",
  "tiff",
  "pdf"
]

export const CUSTOM_FORMATS: ImageFormat[] = [
  "jpg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "ico",
  "tiff"
]

export const BATCH_TARGET_FORMATS: Exclude<ImageFormat, "pdf">[] = [
  "jpg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "ico",
  "tiff"
]

export const HIGH_CONCURRENCY_FORMATS: ImageFormat[] = ["jpg", "png", "webp"]

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  jpg: "JPG",
  png: "PNG",
  webp: "WebP",
  avif: "AVIF",
  jxl: "JXL",
  bmp: "BMP",
  ico: "ICO",
  tiff: "TIFF",
  pdf: "PDF"
}

export const ICO_SIZE_OPTIONS: Array<{ value: number; label: string; note: string }> = [
  { value: 16, label: "16x16", note: "Web Tab" },
  { value: 32, label: "32x32", note: "Taskbar" },
  { value: 48, label: "48x48", note: "Windows Std" },
  { value: 64, label: "64x64", note: "" },
  { value: 128, label: "128x128", note: "" },
  { value: 256, label: "256x256", note: "Windows 10/11" }
]

export const DEFAULT_ICO_SIZES = [16, 32, 48] as const
