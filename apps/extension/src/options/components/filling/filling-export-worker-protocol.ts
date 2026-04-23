import type { FillRuntimeItem } from "@/features/filling/fill-runtime-items"
import type {
  CanvasFillState,
  FillingExportConfig,
  FillingTemplate,
  ImageTransform,
  LayerFillState,
} from "@/features/filling/types"
import type { RasterPipelineFormat } from "@/features/converter/raster-processing-pipeline"

export interface FillExportWorkerPayload {
  template: FillingTemplate
  layerFillStates: LayerFillState[]
  canvasFillState: CanvasFillState
  runtimeItems: FillRuntimeItem[]
  groupRuntimeTransforms?: Record<string, ImageTransform>
  targetFormat: RasterPipelineFormat
  quality: number
  formatOptions?: FillingExportConfig["formatOptions"]
}

export interface FillExportWorkerRequestMessage {
  id: number
  type: "start"
  payload: FillExportWorkerPayload
}

export interface FillExportWorkerProgressMessage {
  id: number
  type: "progress"
  percent: number
  message: string
}

export interface FillExportWorkerSuccessMessage {
  id: number
  type: "result"
  ok: true
  outputBuffer: ArrayBuffer
  mimeType: string
}

export interface FillExportWorkerErrorMessage {
  id: number
  type: "result"
  ok: false
  error: string
}

export type FillExportWorkerResponseMessage =
  | FillExportWorkerProgressMessage
  | FillExportWorkerSuccessMessage
  | FillExportWorkerErrorMessage
