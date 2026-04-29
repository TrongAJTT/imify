import { clampQuality } from "./image-utils"
import type { AvifCodecOptions, AvifSubsample, AvifTune } from "./types"

export const AVIF_DEFAULT_SPEED = 6
export const AVIF_DEFAULT_SUBSAMPLE: AvifSubsample = 1
export const AVIF_DEFAULT_TUNE: AvifTune = "auto"

export interface AvifOptionSource {
  quality?: number
  avif?: AvifCodecOptions
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

export function resolveAvifQualityAlpha(input: Pick<AvifCodecOptions, "highAlphaQuality" | "qualityAlpha">): number {
  if (input.highAlphaQuality) {
    return 100
  }

  if (typeof input.qualityAlpha !== "number" || Number.isNaN(input.qualityAlpha)) {
    return -1
  }

  return Math.max(0, Math.min(100, Math.round(input.qualityAlpha)))
}

export function buildNormalizedAvifOptions(input: AvifOptionSource): {
  quality: number
  qualityAlpha: number
  speed: number
  subsample: AvifSubsample
  tune: 0 | 1 | 2
  lossless: boolean
} {
  const avifOptions = input.avif

  return {
    quality: clampQuality(input.quality),
    qualityAlpha: resolveAvifQualityAlpha(avifOptions ?? {}),
    speed: clampAvifSpeed(avifOptions?.speed),
    subsample: normalizeAvifSubsample(avifOptions?.subsample),
    tune: mapAvifTuneToNumeric(avifOptions?.tune),
    lossless: Boolean(avifOptions?.lossless)
  }
}
