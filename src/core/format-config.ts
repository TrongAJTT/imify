import type { ImageFormat } from "@/core/types"

export const QUALITY_FORMATS: ImageFormat[] = ["jpg", "webp", "avif"]

export const GLOBAL_FORMATS: ImageFormat[] = [
  "jpg",
  "png",
  "webp",
  "avif",
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
  "bmp",
  "ico",
  "tiff"
]

export const BATCH_TARGET_FORMATS: Exclude<ImageFormat, "pdf">[] = [
  "jpg",
  "png",
  "webp",
  "avif",
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
  bmp: "BMP",
  ico: "ICO",
  tiff: "TIFF",
  pdf: "PDF"
}
