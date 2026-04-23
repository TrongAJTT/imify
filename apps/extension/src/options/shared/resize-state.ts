import type {
  FormatConfig,
  PaperSize,
  ResizeConfig,
  ResizeMode,
  ResizeResamplingAlgorithm,
  SupportedDPI
} from "@/core/types"
import {
  DEFAULT_RESAMPLING_ALGORITHM,
  normalizeResizeResamplingAlgorithm
} from "@/core/resize-resampling"

export const PAPER_OPTIONS: PaperSize[] = ["A3", "A4", "A5", "B5", "Letter", "Legal"]
export const DPI_OPTIONS: SupportedDPI[] = [72, 150, 300]

function normalizePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(1, Math.round(value))
}

function normalizePaperSize(value: ResizeConfig["value"]): PaperSize {
  if (typeof value === "string" && PAPER_OPTIONS.includes(value as PaperSize)) {
    return value as PaperSize
  }

  return "A4"
}

function normalizeDpi(dpi: ResizeConfig["dpi"]): SupportedDPI {
  if (DPI_OPTIONS.includes(dpi as SupportedDPI)) {
    return dpi as SupportedDPI
  }

  return 72
}

function normalizeLinearResizeValue(mode: ResizeMode, value: ResizeConfig["value"]): number | undefined {
  if (mode === "change_width" || mode === "change_height" || mode === "scale") {
    return normalizePositiveInteger(value, 100)
  }

  return undefined
}

export function normalizeCustomResizeConfig(
  config: ResizeConfig,
  format: FormatConfig["format"]
): ResizeConfig {
  const normalizedMode: ResizeMode = format === "ico" ? "none" : config.mode

  if (normalizedMode === "none") {
    return {
      mode: "none",
      resamplingAlgorithm: undefined
    }
  }

  const normalizedResamplingAlgorithm = normalizeResizeResamplingAlgorithm(config.resamplingAlgorithm)

  if (normalizedMode === "set_size") {
    return {
      mode: "set_size",
      width: normalizePositiveInteger(config.width, 1280),
      height: normalizePositiveInteger(config.height, 960),
      aspectMode: config.aspectMode ?? "free",
      aspectRatio: config.aspectRatio ?? "16:9",
      sizeAnchor: config.sizeAnchor ?? "width",
      fitMode: config.fitMode ?? "fill",
      containBackground: config.containBackground ?? "#000000",
      resamplingAlgorithm: normalizedResamplingAlgorithm
    }
  }

  if (normalizedMode === "page_size") {
    return {
      mode: "page_size",
      value: normalizePaperSize(config.value),
      dpi: normalizeDpi(config.dpi),
      resamplingAlgorithm: normalizedResamplingAlgorithm
    }
  }

  const normalizedLinearValue = normalizeLinearResizeValue(normalizedMode, config.value)
  if (typeof normalizedLinearValue === "number") {
    return {
      mode: normalizedMode,
      value: normalizedLinearValue,
      resamplingAlgorithm: normalizedResamplingAlgorithm
    }
  }

  // Fallback for unexpected resize mode values from legacy data.
  return {
    mode: normalizedMode,
    value: config.value,
    dpi: config.dpi,
    width: config.width,
    height: config.height,
    aspectMode: config.aspectMode,
    aspectRatio: config.aspectRatio,
    sizeAnchor: config.sizeAnchor,
    fitMode: config.fitMode,
    containBackground: config.containBackground,
    resamplingAlgorithm: DEFAULT_RESAMPLING_ALGORITHM
  }
}

export function buildResizeOverrideFromState(params: {
  mode: ResizeMode | "inherit"
  value: number
  width: number
  height: number
  aspectMode: "free" | "original" | "fixed"
  aspectRatio: string
  anchor: "width" | "height"
  fitMode: "fill" | "cover" | "contain"
  containBackground: string
  resamplingAlgorithm: ResizeResamplingAlgorithm
  paperSize: string
  dpi: SupportedDPI
}): ResizeConfig | null {
  if (params.mode === "inherit") {
    return null
  }

  if (params.mode === "none") {
    return {
      mode: "none",
      resamplingAlgorithm: undefined
    }
  }

  const normalizedResamplingAlgorithm = normalizeResizeResamplingAlgorithm(params.resamplingAlgorithm)

  if (params.mode === "page_size") {
    const paper = PAPER_OPTIONS.includes(params.paperSize as PaperSize)
      ? (params.paperSize as PaperSize)
      : PAPER_OPTIONS[0]

    return {
      mode: "page_size",
      dpi: params.dpi,
      value: paper,
      resamplingAlgorithm: normalizedResamplingAlgorithm
    }
  }

  if (params.mode === "set_size") {
    return {
      mode: "set_size",
      width: normalizePositiveInteger(params.width, 1280),
      height: normalizePositiveInteger(params.height, 960),
      aspectMode: params.aspectMode,
      aspectRatio: params.aspectRatio,
      sizeAnchor: params.anchor,
      fitMode: params.fitMode,
      containBackground: params.containBackground,
      resamplingAlgorithm: normalizedResamplingAlgorithm
    }
  }

  return {
    mode: params.mode,
    value: normalizePositiveInteger(params.value, 100),
    resamplingAlgorithm: normalizedResamplingAlgorithm
  }
}
