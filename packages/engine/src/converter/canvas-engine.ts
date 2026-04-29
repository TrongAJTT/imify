import { buildJxlEncodeOptions } from "@imify/core/jxl-options"
import type { FormatCodecOptions, ImageFormat, ResizeConfig } from "@imify/core/types"
import { encodeAvif } from "./avif-encoder"
import { encodeImageDataToBmp } from "./bmp-encoder"
import { encodeJxl } from "./jxl-encoder"
import { encodeMozJpeg } from "./mozjpeg-encoder"
import { optimisePngWithOxi } from "./oxipng"
import { encodePngFromImageData } from "./png-tiny"
import {
  createRasterConversionFacade,
  type RasterConversionParams,
  type RasterConversionResult
} from "./raster-conversion-facade"
import { createDefaultRasterAdapterRegistry } from "./raster-encode-adapters"
import {
  CANVAS_MIME_BY_FORMAT,
  encodeCanvasFormatFromImageData
} from "./raster-processing-pipeline"
import { encodeImageDataToTiff } from "./tiff-encoder"
import { encodeWebp } from "./webp-encoder"

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
