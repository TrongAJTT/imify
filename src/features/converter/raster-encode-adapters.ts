import type {
  AvifCodecOptions,
  JxlCodecOptions,
  MozJpegCodecOptions,
  PngCodecOptions
} from "@/core/types"
import type {
  CanvasConvertibleFormat,
  RasterPipelineFormat
} from "@/features/converter/raster-processing-pipeline"

export interface RasterEncodeInput {
  imageData: ImageData
  targetFormat: RasterPipelineFormat
  quality?: number
  formatOptions?: {
    avif?: AvifCodecOptions
    jxl?: JxlCodecOptions
    mozjpeg?: MozJpegCodecOptions
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
  encodePng: (imageData: ImageData, options?: PngCodecOptions) => Blob
  encodeMozJpeg: (
    imageData: ImageData,
    options?: {
      quality?: number
      mozjpeg?: MozJpegCodecOptions
    }
  ) => Promise<Blob>
  optimisePng?: (blob: Blob, options?: PngCodecOptions) => Promise<Blob>
  convertImageDataToRasterBlob: (
    imageData: ImageData,
    targetFormat: CanvasConvertibleFormat,
    quality?: number
  ) => Promise<Blob>
  mimeByFormat: Record<CanvasConvertibleFormat, string>
}

export interface RasterAdapterContext {
  input: RasterEncodeInput
  deps: RasterEncodeDependencies
}

export interface RasterEncoderAdapter {
  id: string
  supports: (targetFormat: RasterPipelineFormat, input: RasterEncodeInput) => boolean
  encode: (context: RasterAdapterContext) => Promise<RasterEncodeResult>
}

export interface RasterAdapterRegistry {
  adapters: readonly RasterEncoderAdapter[]
  resolve: (input: RasterEncodeInput) => RasterEncoderAdapter | null
}

function hasPngDithering(options?: PngCodecOptions): boolean {
  if (typeof options?.ditheringLevel === "number") {
    return options.ditheringLevel > 0
  }

  return Boolean(options?.dithering)
}

function createBuiltInRasterEncoderAdapters(): RasterEncoderAdapter[] {
  return [
    {
      id: "bmp",
      supports: (format) => format === "bmp",
      encode: async ({ input, deps }) => {
        return {
          blob: deps.encodeBmp(input.imageData),
          mimeType: "image/bmp"
        }
      }
    },
    {
      id: "tiff",
      supports: (format) => format === "tiff",
      encode: async ({ input, deps }) => {
        return {
          blob: deps.encodeTiff(input.imageData),
          mimeType: "image/tiff"
        }
      }
    },
    {
      id: "avif",
      supports: (format) => format === "avif",
      encode: async ({ input, deps }) => {
        return {
          blob: await deps.encodeAvif(input.imageData, {
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
        return {
          blob: await deps.encodeJxl(input.imageData, {
            quality: input.quality,
            jxl: input.formatOptions?.jxl
          }),
          mimeType: "image/jxl"
        }
      }
    },
    {
      id: "png-upng",
      supports: (format, input) =>
        format === "png" &&
        Boolean(
          input.formatOptions?.png?.tinyMode ||
          input.formatOptions?.png?.cleanTransparentPixels ||
          input.formatOptions?.png?.autoGrayscale ||
          hasPngDithering(input.formatOptions?.png) ||
          input.formatOptions?.png?.progressiveInterlaced ||
          input.formatOptions?.png?.oxipngCompression
        ),
      encode: async ({ input, deps }) => {
        const pngOptions = input.formatOptions?.png
        const needsPixelPipeline = Boolean(
          pngOptions?.tinyMode ||
          pngOptions?.cleanTransparentPixels ||
          pngOptions?.autoGrayscale ||
          hasPngDithering(pngOptions)
        )

        let pngBlob: Blob

        if (needsPixelPipeline) {
          pngBlob = deps.encodePng(input.imageData, pngOptions)
        } else {
          pngBlob = await deps.convertImageDataToRasterBlob(input.imageData, "png", input.quality)
        }

        if ((pngOptions?.oxipngCompression || pngOptions?.progressiveInterlaced) && deps.optimisePng) {
          try {
            pngBlob = await deps.optimisePng(pngBlob, pngOptions)
          } catch {
            // Fall back to pre-optimised PNG when wasm optimisation fails.
          }
        }

        return {
          blob: pngBlob,
          mimeType: "image/png"
        }
      }
    },
    {
      id: "mozjpeg",
      supports: (format, input) =>
        format === "jpg" && Boolean(input.formatOptions?.mozjpeg?.enabled),
      encode: async ({ input, deps }) => {
        return {
          blob: await deps.encodeMozJpeg(input.imageData, {
            quality: input.quality,
            mozjpeg: input.formatOptions?.mozjpeg
          }),
          mimeType: "image/jpeg"
        }
      }
    },
    {
      id: "canvas-default",
      supports: (format) => format === "jpg" || format === "png" || format === "webp",
      encode: async ({ input, deps }) => {
        const canvasFormat = input.targetFormat as CanvasConvertibleFormat
        const blob = await deps.convertImageDataToRasterBlob(input.imageData, canvasFormat, input.quality)
        return {
          blob,
          mimeType: deps.mimeByFormat[canvasFormat]
        }
      }
    }
  ]
}

export function createRasterAdapterRegistry(
  adapters: readonly RasterEncoderAdapter[]
): RasterAdapterRegistry {
  return {
    adapters,
    resolve: (input) => {
      for (const adapter of adapters) {
        if (adapter.supports(input.targetFormat, input)) {
          return adapter
        }
      }

      return null
    }
  }
}

export function createDefaultRasterAdapterRegistry(
  customAdapters: readonly RasterEncoderAdapter[] = []
): RasterAdapterRegistry {
  // Custom adapters come first so callers can override default behavior safely.
  return createRasterAdapterRegistry([
    ...customAdapters,
    ...createBuiltInRasterEncoderAdapters()
  ])
}

export async function encodeRasterWithAdapters(
  input: RasterEncodeInput,
  deps: RasterEncodeDependencies,
  registry: RasterAdapterRegistry
): Promise<RasterEncodeResult> {
  const adapter = registry.resolve(input)

  if (adapter) {
    return adapter.encode({ input, deps })
  }

  throw new Error(`Unsupported raster format in adapter pipeline: ${input.targetFormat}`)
}
