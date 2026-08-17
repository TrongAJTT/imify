import {
  normalizeAvifCodecOptions,
  normalizeBmpCodecOptions,
  normalizeIcoCodecOptions,
  normalizeMozJpegChromaSubsampling,
  normalizePngCodecOptions,
  normalizeWebpCodecOptions
} from "@imify/core/codec-options"
import { DEFAULT_ICO_SIZES } from "@imify/core/format-config"
import { normalizeResizeResamplingAlgorithm } from "@imify/core/resize-resampling"
import type { BatchResizeMode, BatchSetupState, SetupContext } from "./batch-types"

export const DEFAULT_BATCH_STATE: BatchSetupState = {
  targetFormat: "jpg",
  concurrency: 3,
  quality: 90,
  formatOptions: {
    bmp: {
      colorDepth: 24,
      dithering: false,
      ditheringLevel: 0
    },
    jxl: {
      effort: 7,
      lossless: false,
      progressive: false,
      epf: 1
    },
    webp: {
      lossless: false,
      nearLossless: 100,
      effort: 5,
      sharpYuv: false,
      preserveExactAlpha: false
    },
    avif: {
      speed: 6,
      qualityAlpha: undefined,
      lossless: false,
      subsample: 1,
      tune: "auto",
      highAlphaQuality: false
    },
    mozjpeg: {
      progressive: true,
      chromaSubsampling: 2
    },
    ico: {
      sizes: [...DEFAULT_ICO_SIZES],
      generateWebIconKit: false,
      optimizeInternalPngLayers: false
    },
    png: {
      tinyMode: false,
      cleanTransparentPixels: false,
      autoGrayscale: false,
      dithering: false,
      ditheringLevel: 0,
      progressiveInterlaced: false,
      oxipngCompression: false
    },
    tiff: {
      colorMode: "color"
    }
  },
  resizeMode: "inherit",
  resizeValue: 1280,
  resizeApplyTo: "width",
  resizeWidth: 1280,
  resizeHeight: 960,
  resizeAspectMode: "original",
  resizeAspectRatio: "16:9",
  resizeAnchor: "width",
  resizeFitMode: "fill",
  resizeContainBackground: "#000000",
  resizeResamplingAlgorithm: "browser-default",
  paperSize: "A4",
  dpi: 300,
  stripExif: false,
  fileNamePattern: "[OriginalName]"
}

export function toAspectRatioLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return "16:9"
  }

  const gcd = (a: number, b: number): number => {
    if (!b) {
      return a
    }

    return gcd(b, a % b)
  }

  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const divisor = gcd(safeWidth, safeHeight)

  return `${Math.round(safeWidth / divisor)}:${Math.round(safeHeight / divisor)}`
}

export function cloneSetupState(state: BatchSetupState | undefined): BatchSetupState {
  if (!state) {
    return cloneSetupState(DEFAULT_BATCH_STATE)
  }

  const { watermark: _legacyWatermark, ...stateWithoutLegacyWatermark } = state as BatchSetupState & {
    watermark?: unknown
  }

  const formatOptions = state.formatOptions ?? DEFAULT_BATCH_STATE.formatOptions
  const bmpOptions = normalizeBmpCodecOptions({
    ...DEFAULT_BATCH_STATE.formatOptions.bmp,
    ...formatOptions.bmp
  })
  const avifOptions = normalizeAvifCodecOptions({
    ...DEFAULT_BATCH_STATE.formatOptions.avif,
    ...formatOptions.avif
  })
  const mozjpegOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.mozjpeg,
    ...formatOptions.mozjpeg
  }
  const rawJxlOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.jxl,
    ...formatOptions.jxl
  }
  const jxlOptions = {
    effort:
      typeof rawJxlOptions.effort === "number"
        ? Math.max(1, Math.min(9, Math.round(rawJxlOptions.effort)))
        : 7,
    lossless: Boolean(rawJxlOptions.lossless),
    progressive: Boolean(rawJxlOptions.progressive),
    epf:
      rawJxlOptions.epf === 0 ||
      rawJxlOptions.epf === 1 ||
      rawJxlOptions.epf === 2 ||
      rawJxlOptions.epf === 3
        ? rawJxlOptions.epf
        : 1
  }
  const webpOptions = normalizeWebpCodecOptions({
    ...DEFAULT_BATCH_STATE.formatOptions.webp,
    ...formatOptions.webp
  })
  const pngOptions = normalizePngCodecOptions({
    ...DEFAULT_BATCH_STATE.formatOptions.png,
    ...formatOptions.png
  })
  const icoOptions = normalizeIcoCodecOptions(
    {
      ...DEFAULT_BATCH_STATE.formatOptions.ico,
      ...formatOptions.ico,
      sizes: [...(formatOptions.ico?.sizes ?? DEFAULT_BATCH_STATE.formatOptions.ico.sizes)]
    },
    {
      defaultSizes: DEFAULT_BATCH_STATE.formatOptions.ico.sizes
    }
  )
  const rawTiffOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.tiff,
    ...formatOptions.tiff
  }
  const tiffOptions: BatchSetupState["formatOptions"]["tiff"] = {
    colorMode: rawTiffOptions.colorMode === "grayscale" ? "grayscale" : "color"
  }

  let mode: BatchResizeMode = state.resizeMode
  let applyTo = state.resizeApplyTo ?? "width"

  if ((mode as any) === "none") {
    mode = "inherit"
  } else if ((mode as any) === "fit_width" || (mode as any) === "change_width") {
    mode = "fit_value"
    applyTo = "width"
  } else if ((mode as any) === "fit_height" || (mode as any) === "change_height") {
    mode = "fit_value"
    applyTo = "height"
  } else if ((mode as any) === "page_size") {
    mode = "paper_size"
  }

  return {
    ...stateWithoutLegacyWatermark,
    resizeMode: mode,
    resizeApplyTo: applyTo,
    formatOptions: {
      ...formatOptions,
      bmp: bmpOptions,
      avif: avifOptions,
      mozjpeg: {
        progressive: Boolean(mozjpegOptions.progressive),
        chromaSubsampling: normalizeMozJpegChromaSubsampling(mozjpegOptions.chromaSubsampling)
      },
      jxl: jxlOptions,
      webp: webpOptions,
      png: pngOptions,
      tiff: tiffOptions,
      ico: icoOptions
    },
    resizeResamplingAlgorithm: normalizeResizeResamplingAlgorithm(state.resizeResamplingAlgorithm)
  }
}

export function createDefaultContextConfigs(): Record<SetupContext, BatchSetupState> {
  return {
    single: cloneSetupState(DEFAULT_BATCH_STATE),
    batch: cloneSetupState(DEFAULT_BATCH_STATE)
  }
}

export function createDefaultSourceState(): Record<SetupContext, { width: number; height: number; syncVersion: number }> {
  return {
    single: {
      width: DEFAULT_BATCH_STATE.resizeWidth,
      height: DEFAULT_BATCH_STATE.resizeHeight,
      syncVersion: 0
    },
    batch: {
      width: DEFAULT_BATCH_STATE.resizeWidth,
      height: DEFAULT_BATCH_STATE.resizeHeight,
      syncVersion: 0
    }
  }
}
