import type {
  AvifCodecOptions,
  ImageFormat,
  JxlCodecOptions,
  PngCodecOptions
} from "@/core/types"

export type RasterPipelineFormat = Exclude<ImageFormat, "pdf" | "ico">
export type CanvasConvertibleFormat = Exclude<ImageFormat, "bmp" | "pdf" | "ico" | "tiff">

export interface RasterEncodeInput {
  ctx: OffscreenCanvasRenderingContext2D
  canvas: OffscreenCanvas
  targetWidth: number
  targetHeight: number
  targetFormat: RasterPipelineFormat
  quality?: number
  formatOptions?: {
    avif?: AvifCodecOptions
    jxl?: JxlCodecOptions
    png?: PngCodecOptions
  }
}

export interface RasterEncodeResult {
  blob: Blob
  mimeType: string
}

export interface RasterEncodeDependencies {
  encodeBmp: (imageData: ImageData) => Blob
  encodeTiff: (imageData: ImageData) => Blob
  encodeAvif: (
    imageData: ImageData,
    options: {
      quality?: number
      avif?: AvifCodecOptions
    }
  ) => Promise<Blob>
  encodeJxl: (
    imageData: ImageData,
    options: {
      quality?: number
      jxl?: JxlCodecOptions
    }
  ) => Promise<Blob>
  encodeTinyPng: (imageData: ImageData) => Blob
  convertToRasterBlob: (
    canvas: OffscreenCanvas,
    targetFormat: CanvasConvertibleFormat,
    quality?: number
  ) => Promise<Blob>
  mimeByFormat: Record<CanvasConvertibleFormat, string>
}

interface RasterAdapterContext {
  input: RasterEncodeInput
  deps: RasterEncodeDependencies
}

interface RasterEncoderAdapter {
  id: string
  supports: (targetFormat: RasterPipelineFormat, input: RasterEncodeInput) => boolean
  encode: (context: RasterAdapterContext) => Promise<RasterEncodeResult>
}

function getImageData(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): ImageData {
  return ctx.getImageData(0, 0, width, height)
}

const adapters: RasterEncoderAdapter[] = [
  {
    id: "bmp",
    supports: (format) => format === "bmp",
    encode: async ({ input, deps }) => {
      const imageData = getImageData(input.ctx, input.targetWidth, input.targetHeight)
      return {
        blob: deps.encodeBmp(imageData),
        mimeType: "image/bmp"
      }
    }
  },
  {
    id: "tiff",
    supports: (format) => format === "tiff",
    encode: async ({ input, deps }) => {
      const imageData = getImageData(input.ctx, input.targetWidth, input.targetHeight)
      return {
        blob: deps.encodeTiff(imageData),
        mimeType: "image/tiff"
      }
    }
  },
  {
    id: "avif",
    supports: (format) => format === "avif",
    encode: async ({ input, deps }) => {
      const imageData = getImageData(input.ctx, input.targetWidth, input.targetHeight)
      return {
        blob: await deps.encodeAvif(imageData, {
          quality: input.quality,
          avif: input.formatOptions?.avif
        }),
        mimeType: "image/avif"
      }
    }
  },
  {
    id: "jxl",
    supports: (format) => format === "jxl",
    encode: async ({ input, deps }) => {
      const imageData = getImageData(input.ctx, input.targetWidth, input.targetHeight)
      return {
        blob: await deps.encodeJxl(imageData, {
          quality: input.quality,
          jxl: input.formatOptions?.jxl
        }),
        mimeType: "image/jxl"
      }
    }
  },
  {
    id: "png-tiny",
    supports: (format, input) => format === "png" && Boolean(input.formatOptions?.png?.tinyMode),
    encode: async ({ input, deps }) => {
      const imageData = getImageData(input.ctx, input.targetWidth, input.targetHeight)
      return {
        blob: deps.encodeTinyPng(imageData),
        mimeType: "image/png"
      }
    }
  },
  {
    id: "canvas-default",
    supports: (format) => format === "jpg" || format === "png" || format === "webp",
    encode: async ({ input, deps }) => {
      const canvasFormat = input.targetFormat as CanvasConvertibleFormat
      const blob = await deps.convertToRasterBlob(input.canvas, canvasFormat, input.quality)
      return {
        blob,
        mimeType: deps.mimeByFormat[canvasFormat]
      }
    }
  }
]

export async function encodeRasterWithAdapters(
  input: RasterEncodeInput,
  deps: RasterEncodeDependencies
): Promise<RasterEncodeResult> {
  for (const adapter of adapters) {
    if (!adapter.supports(input.targetFormat, input)) {
      continue
    }

    return adapter.encode({ input, deps })
  }

  throw new Error(`Unsupported raster format in adapter pipeline: ${input.targetFormat}`)
}
