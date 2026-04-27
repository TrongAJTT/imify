import { BATCH_TARGET_FORMATS, HIGH_CONCURRENCY_FORMATS as BASE_HIGH_CONCURRENCY_FORMATS } from "@imify/core/format-config"
import { buildTargetFormatOptions } from "../target-format-options"
import type { ImageFormat } from "@imify/core/types"
import type { BatchFormatOptions, BatchResizeMode, BatchWatermarkConfig } from "@imify/stores/stores/batch-types"

export type BatchItemStatus = "queued" | "processing" | "success" | "error"
export type BatchRunMode = "all" | "failed"
export type BatchExportAction = "zip" | "one_by_one" | "merge_pdf" | "individual_pdf"
export type BatchTargetFormat = Exclude<ImageFormat, "pdf"> | "mozjpeg"

export const TARGET_FORMAT_OPTIONS: Array<{ value: BatchTargetFormat; label: string }> =
  buildTargetFormatOptions([...BATCH_TARGET_FORMATS, "mozjpeg"] as BatchTargetFormat[]).map((option) => ({
    value: option.value as BatchTargetFormat,
    label: option.label
  }))

export const HIGH_CONCURRENCY_FORMATS: ImageFormat[] = BASE_HIGH_CONCURRENCY_FORMATS

export interface BatchQueueItem {
  id: string
  file: File
  sourceWidth?: number
  sourceHeight?: number
  status: BatchItemStatus
  percent: number
  message?: string
  outputBlob?: Blob
  outputFileName?: string
}

export interface BatchSummary {
  mode: BatchRunMode
  total: number
  success: number
  failed: number
  canceled: boolean
  durationMs: number
}

export type { BatchFormatOptions, BatchResizeMode, BatchWatermarkConfig }
