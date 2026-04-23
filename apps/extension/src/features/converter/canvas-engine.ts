import { buildJxlEncodeOptions } from "@/core/jxl-options"
import type { FormatCodecOptions, ImageFormat, ResizeConfig } from "@/core/types"
import { encodeAvif } from "@/features/converter/avif-encoder"
import { encodeImageDataToBmp } from "@/features/converter/bmp-encoder"
import { encodeJxl } from "@/features/converter/jxl-encoder"
import { encodeMozJpeg } from "@/features/converter/mozjpeg-encoder"
import { optimisePngWithOxi } from "@/features/converter/oxipng"
import { encodePngFromImageData } from "@/features/converter/png-tiny"
import {
  createRasterConversionFacade,
  type RasterConversionParams,
  type RasterConversionResult
} from "@/features/converter/raster-conversion-facade"
import { createDefaultRasterAdapterRegistry } from "@/features/converter/raster-encode-adapters"
import {
  CANVAS_MIME_BY_FORMAT,
  encodeCanvasFormatFromImageData
} from "@/features/converter/raster-processing-pipeline"
import { encodeImageDataToTiff } from "@/features/converter/tiff-encoder"
import { encodeWebp } from "@/features/converter/webp-encoder"

export interface RasterConvertParams extends RasterConversionParams {
  sourceBlob: Blob
  targetFormat: Exclude<ImageFormat, "pdf" | "ico">
  resize: ResizeConfig
  quality?: number
  formatOptions?: Pick<FormatCodecOptions, "avif" | "bmp" | "jxl" | "mozjpeg" | "png" | "tiff" | "webp">
}

export interface RasterConvertResult extends RasterConversionResult {
  outputBlob: Blob
  width: number
  height: number
  mimeType: string
}

const mainThreadRasterConversionFacade = createRasterConversionFacade({
  adapterRegistry: createDefaultRasterAdapterRegistry(),
  adapterDependencies: {
    encodeBmp: encodeImageDataToBmp,
    encodeTiff: encodeImageDataToTiff,
    encodeAvif,
    encodeJxl: (imageData, options) =>
      encodeJxl(imageData, buildJxlEncodeOptions(options.quality, options.jxl)),
    encodeMozJpeg,
    encodeWebp,
    encodePng: encodePngFromImageData,
    optimisePng: optimisePngWithOxi,
    convertImageDataToRasterBlob: encodeCanvasFormatFromImageData,
    mimeByFormat: CANVAS_MIME_BY_FORMAT
  }
})

export async function convertRasterImage(
  params: RasterConvertParams
): Promise<RasterConvertResult> {
  return mainThreadRasterConversionFacade.convert(params)
}
