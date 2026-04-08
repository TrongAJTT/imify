import { clampQuality } from "@/core/image-utils"
import type { AvifSubsample, AvifTune } from "@/core/types"

export const AVIF_DEFAULT_SPEED = 6
export const AVIF_DEFAULT_SUBSAMPLE: AvifSubsample = 1
export const AVIF_DEFAULT_TUNE: AvifTune = "auto"

export interface AvifOptionSource {
  quality?: number
  avifSpeed?: number
  avifQualityAlpha?: number
  avifLossless?: boolean
  avifSubsample?: AvifSubsample
  avifTune?: AvifTune
  avifHighAlphaQuality?: boolean
}

export function clampAvifSpeed(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return AVIF_DEFAULT_SPEED
  }

  return Math.max(0, Math.min(10, Math.round(value)))
}

export function normalizeAvifSubsample(value: AvifSubsample | number | undefined): AvifSubsample {
  if (value === 1 || value === 2 || value === 3) {
    return value
  }

  return AVIF_DEFAULT_SUBSAMPLE
}

export function normalizeAvifTune(value: AvifTune | undefined): AvifTune {
  if (value === "ssim" || value === "psnr" || value === "auto") {
    return value
  }

  return AVIF_DEFAULT_TUNE
}

export function mapAvifTuneToNumeric(value: AvifTune | undefined): 0 | 1 | 2 {
  const tune = normalizeAvifTune(value)

  if (tune === "ssim") {
    return 1
  }

  if (tune === "psnr") {
    return 2
  }

  return 0
}

export function resolveAvifQualityAlpha(input: Pick<AvifOptionSource, "avifHighAlphaQuality" | "avifQualityAlpha">): number {
  if (input.avifHighAlphaQuality) {
    return 100
  }

  if (typeof input.avifQualityAlpha !== "number" || Number.isNaN(input.avifQualityAlpha)) {
    return -1
  }

  return Math.max(0, Math.min(100, Math.round(input.avifQualityAlpha)))
}

export function buildNormalizedAvifOptions(input: AvifOptionSource): {
  quality: number
  qualityAlpha: number
  speed: number
  subsample: AvifSubsample
  tune: 0 | 1 | 2
  lossless: boolean
} {
  return {
    quality: clampQuality(input.quality),
    qualityAlpha: resolveAvifQualityAlpha(input),
    speed: clampAvifSpeed(input.avifSpeed),
    subsample: normalizeAvifSubsample(input.avifSubsample),
    tune: mapAvifTuneToNumeric(input.avifTune),
    lossless: Boolean(input.avifLossless)
  }
}
