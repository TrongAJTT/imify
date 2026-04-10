import type { FormatCodecOptions, ResizeConfig } from "@/core/types"
import {
  encodeRasterWithAdapters,
  type RasterAdapterRegistry,
  type RasterEncodeDependencies,
  type RasterEncodeInput,
  type RasterEncodeResult
} from "@/features/converter/raster-encode-adapters"
import {
  extractRasterFrame,
  type RasterFrame,
  type RasterPipelineFormat
} from "@/features/converter/raster-processing-pipeline"

export interface RasterConversionParams {
  sourceBlob: Blob
  targetFormat: RasterPipelineFormat
  resize: ResizeConfig
  quality?: number
  formatOptions?: Pick<FormatCodecOptions, "avif" | "jxl" | "mozjpeg" | "png">
}

export interface RasterConversionResult {
  outputBlob: Blob
  width: number
  height: number
  mimeType: string
}

export interface RasterConversionFacade {
  convert: (params: RasterConversionParams) => Promise<RasterConversionResult>
}

interface ExtractFrameParams {
  sourceBlob: Blob
  targetFormat: RasterPipelineFormat
  resize: ResizeConfig
}

export interface RasterConversionFacadeDependencies {
  adapterRegistry: RasterAdapterRegistry
  adapterDependencies: RasterEncodeDependencies
  extractFrame?: (params: ExtractFrameParams) => Promise<RasterFrame>
  encodeWithAdapters?: (
    input: RasterEncodeInput,
    deps: RasterEncodeDependencies,
    registry: RasterAdapterRegistry
  ) => Promise<RasterEncodeResult>
}

export function createRasterConversionFacade(
  dependencies: RasterConversionFacadeDependencies
): RasterConversionFacade {
  const extractFrame = dependencies.extractFrame ?? extractRasterFrame
  const encodeWithAdapters = dependencies.encodeWithAdapters ?? encodeRasterWithAdapters

  return {
    async convert(params: RasterConversionParams): Promise<RasterConversionResult> {
      const frame = await extractFrame({
        sourceBlob: params.sourceBlob,
        targetFormat: params.targetFormat,
        resize: params.resize
      })

      const encoded = await encodeWithAdapters(
        {
          imageData: frame.imageData,
          targetFormat: params.targetFormat,
          quality: params.quality,
          formatOptions: params.formatOptions
        },
        dependencies.adapterDependencies,
        dependencies.adapterRegistry
      )

      return {
        outputBlob: encoded.blob,
        width: frame.width,
        height: frame.height,
        mimeType: encoded.mimeType
      }
    }
  }
}