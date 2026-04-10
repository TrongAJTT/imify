import type {
  ExtensionStorageState,
  FormatCodecOptions,
  FormatConfig,
  PaperSize,
  ResizeConfig,
  ResizeMode,
  SupportedDPI
} from "@/core/types"
import { CUSTOM_FORMATS, QUALITY_FORMATS } from "@/core/format-config"
import { normalizeFormatOptionsForCustomFormat } from "@/features/custom-formats/format-options-normalizer"
import { patchStorageState } from "@/features/settings"

export interface CustomFormatInput {
  name: string
  format: FormatConfig["format"]
  enabled: boolean
  quality?: number
  formatOptions?: FormatCodecOptions
  resize: ResizeConfig
}

const PAPER_SIZE_VALUES: PaperSize[] = ["A3", "A4", "A5", "B5", "Letter", "Legal"]
const DPI_VALUES: SupportedDPI[] = [72, 150, 300]

function clampQuality(quality: number | undefined): number | undefined {
  if (typeof quality !== "number" || Number.isNaN(quality)) {
    return undefined
  }

  return Math.max(1, Math.min(100, Math.round(quality)))
}

function createCustomFormatId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeResizeValue(mode: ResizeMode, value: ResizeConfig["value"]): ResizeConfig["value"] {
  if (mode === "none") {
    return undefined
  }

  if (mode === "set_size") {
    return undefined
  }

  if (mode === "page_size") {
    return typeof value === "string" && PAPER_SIZE_VALUES.includes(value as PaperSize)
      ? value
      : "A4"
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    return 100
  }

  return Math.max(1, Math.round(value))
}

function normalizeResizeConfig(config: ResizeConfig, format: FormatConfig["format"]): ResizeConfig {
  const mode = config.mode
  const value = normalizeResizeValue(mode, config.value)

  if (mode === "set_size") {
    return {
      mode,
      width: typeof config.width === "number" ? Math.max(1, Math.round(config.width)) : 1280,
      height: typeof config.height === "number" ? Math.max(1, Math.round(config.height)) : 960,
      aspectMode: config.aspectMode ?? "free",
      aspectRatio: config.aspectRatio ?? "16:9",
      sizeAnchor: config.sizeAnchor ?? "width",
      fitMode: config.fitMode ?? "fill",
      containBackground: config.containBackground ?? "#000000"
    }
  }

  if (mode !== "page_size") {
    return {
      mode,
      value
    }
  }

  const dpi = DPI_VALUES.includes(config.dpi as SupportedDPI)
    ? (config.dpi as SupportedDPI)
    : 72

  return {
    mode,
    value,
    dpi
  }
}

function normalizeCustomFormat(input: CustomFormatInput, id: string): FormatConfig {
  const formatOptions = normalizeFormatOptionsForCustomFormat(
    input.format,
    input.formatOptions
  )

  return {
    id,
    name: input.name.trim() || "Custom Format",
    format: input.format,
    enabled: input.enabled,
    quality: clampQuality(input.quality),
    formatOptions,
    resize: normalizeResizeConfig(input.resize, input.format)
  }
}

export function validateCustomFormatInput(input: CustomFormatInput): string | null {
  if (!input.name.trim()) {
    return "Name is required"
  }

  if (!CUSTOM_FORMATS.includes(input.format)) {
    return "Unsupported custom format"
  }

  if (input.format === "ico") {
    const sizes = input.formatOptions?.ico?.sizes ?? []
    if (!sizes.length) {
      return "Select at least one ICO size"
    }
  }

  if (QUALITY_FORMATS.includes(input.format) && typeof input.quality !== "number") {
    return "Quality is required for JPG, WebP, and AVIF"
  }

  if (
    (input.resize.mode === "change_width" ||
      input.resize.mode === "change_height" ||
      input.resize.mode === "scale") &&
    typeof input.resize.value !== "number"
  ) {
    return "Resize value must be a number"
  }

  if (
    input.resize.mode === "set_size" &&
    (typeof input.resize.width !== "number" || typeof input.resize.height !== "number")
  ) {
    return "Set size mode requires width and height"
  }

  if (input.resize.mode === "page_size" && typeof input.resize.value !== "string") {
    return "Paper size is required for page size mode"
  }

  return null
}

export async function createCustomFormat(input: CustomFormatInput): Promise<FormatConfig> {
  const formatConfig = normalizeCustomFormat(input, createCustomFormatId())

  await patchStorageState((current) => {
    return {
      ...current,
      custom_formats: [...current.custom_formats, formatConfig]
    }
  })

  return formatConfig
}

export async function updateCustomFormat(
  id: string,
  input: CustomFormatInput
): Promise<FormatConfig | null> {
  const formatConfig = normalizeCustomFormat(input, id)
  let found = false

  await patchStorageState((current) => {
    const custom_formats = current.custom_formats.map((entry) => {
      if (entry.id !== id) {
        return entry
      }

      found = true
      return formatConfig
    })

    return {
      ...current,
      custom_formats
    }
  })

  return found ? formatConfig : null
}

export async function deleteCustomFormat(id: string): Promise<boolean> {
  let removed = false

  await patchStorageState((current: ExtensionStorageState) => {
    const custom_formats = current.custom_formats.filter((entry) => {
      if (entry.id !== id) {
        return true
      }

      removed = true
      return false
    })

    return {
      ...current,
      custom_formats
    }
  })

  return removed
}
