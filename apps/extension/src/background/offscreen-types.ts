import type { FormatConfig } from "@/core/types"
import type { ConvertImageResult } from "@/features/converter"

export const OFFSCREEN_DOCUMENT_PATH = "options.html?offscreen=1"
export const OFFSCREEN_CONVERT_REQUEST = "IMIFY_OFFSCREEN_CONVERT_REQUEST"

export interface OffscreenConvertRequest {
  sourceBlob: Blob
  config: FormatConfig
}

export interface OffscreenConvertResponse {
  ok: boolean
  result?: ConvertImageResult
  error?: string
}
