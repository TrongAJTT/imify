import type { FormatCodecOptions } from "@imify/core/types"
import type { RasterPipelineFormat } from "@imify/engine/converter/raster-processing-pipeline"
import type { PatternAsset, PatternCanvasSettings, PatternSettings } from "@imify/features/pattern/types"

export interface PatternExportWorkerPayload {
  canvas: PatternCanvasSettings
  settings: PatternSettings
  assets: PatternAsset[]
  targetFormat: RasterPipelineFormat
  quality: number
  formatOptions?: FormatCodecOptions
}

export interface PatternExportWorkerRequestMessage {
  id: number
  type: "start"
  payload: PatternExportWorkerPayload
}

export interface PatternExportWorkerProgressMessage {
  id: number
  type: "progress"
  percent: number
  message: string
}

export interface PatternExportWorkerSuccessMessage {
  id: number
  type: "result"
  ok: true
  outputBuffer: ArrayBuffer
  mimeType: string
}

export interface PatternExportWorkerErrorMessage {
  id: number
  type: "result"
  ok: false
  error: string
}

export type PatternExportWorkerResponseMessage =
  | PatternExportWorkerProgressMessage
  | PatternExportWorkerSuccessMessage
  | PatternExportWorkerErrorMessage
