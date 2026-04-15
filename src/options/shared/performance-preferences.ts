import { normalizeResizeResamplingAlgorithm } from "@/core/resize-resampling"
import type { FormatCodecOptions, ImageFormat, ResizeConfig } from "@/core/types"

export const PERFORMANCE_PREFERENCES_KEY = "imify_performance_preferences"
export const MAX_CONCURRENCY = 90
export const POTATO_CPU_CORES = 4
export const POTATO_RAM_BUDGET_GB = 4

const MIN_CPU_CORES = 1
const MAX_CPU_CORES = 64
const MIN_RAM_BUDGET_GB = 0.5
const MAX_RAM_BUDGET_GB = 64
const DEFAULT_CPU_CORES = POTATO_CPU_CORES
const DEFAULT_RAM_BUDGET_GB = POTATO_RAM_BUDGET_GB
const DEFAULT_ESTIMATED_MEGAPIXELS = 12

type HardwareProfileSource = "manual" | "detected" | "fallback"
export type AdvisorRiskLevel = "optimal" | "caution" | "danger"
export type AdvisorTargetFormat = ImageFormat | "mozjpeg"

export interface SmartHardwareProfile {
  cpuCores: number
  ramBudgetGb: number
  detectedLogicalCores?: number
  detectedDeviceMemoryGb?: number
  source: HardwareProfileSource
}

export interface PerformancePreferences {
  smartAdvisorEnabled: boolean
  allowConcurrencyOverclock: boolean
  hardwareProfile: SmartHardwareProfile
}

export interface ConcurrencyAdvisorResult {
  enabled: true
  advisorName: "Smart Concurrency Advisor" | "Concurrency Advisor"
  advisorNameShort: "SCA" | "CA"
  usingFallbackProfile: boolean
  recommended: number
  recommendedMin: number
  recommendedMax: number
  cpuLimit: number
  memoryLimit: number
  memoryPerWorkerMB: number
  riskLevel: AdvisorRiskLevel
  statusText: string
  detailText: string
  summaryText: string
  reasons: string[]
}

export const DEFAULT_PERFORMANCE_PREFERENCES: PerformancePreferences = {
  smartAdvisorEnabled: false,
  allowConcurrencyOverclock: false,
  hardwareProfile: {
    cpuCores: DEFAULT_CPU_CORES,
    ramBudgetGb: DEFAULT_RAM_BUDGET_GB,
    source: "fallback"
  }
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
  fractionDigits = 2
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  const bounded = Math.max(min, Math.min(max, parsed))
  return Number(bounded.toFixed(fractionDigits))
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const normalized = clampNumber(value, min, max, fallback, 0)
  return Math.round(normalized)
}

function normalizeHardwareProfile(value: unknown): SmartHardwareProfile {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PERFORMANCE_PREFERENCES.hardwareProfile }
  }

  const input = value as Partial<SmartHardwareProfile>
  const source: HardwareProfileSource =
    input.source === "manual" || input.source === "detected" || input.source === "fallback"
      ? input.source
      : "manual"

  const detectedLogicalCores =
    typeof input.detectedLogicalCores === "number"
      ? clampInteger(input.detectedLogicalCores, MIN_CPU_CORES, MAX_CPU_CORES, DEFAULT_CPU_CORES)
      : undefined

  const detectedDeviceMemoryGb =
    typeof input.detectedDeviceMemoryGb === "number"
      ? clampNumber(input.detectedDeviceMemoryGb, 1, MAX_RAM_BUDGET_GB, DEFAULT_RAM_BUDGET_GB, 1)
      : undefined

  return {
    cpuCores: clampInteger(input.cpuCores, MIN_CPU_CORES, MAX_CPU_CORES, DEFAULT_CPU_CORES),
    ramBudgetGb: clampNumber(
      input.ramBudgetGb,
      MIN_RAM_BUDGET_GB,
      MAX_RAM_BUDGET_GB,
      DEFAULT_RAM_BUDGET_GB,
      1
    ),
    detectedLogicalCores,
    detectedDeviceMemoryGb,
    source
  }
}

export function normalizePerformancePreferences(value: unknown): PerformancePreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_PERFORMANCE_PREFERENCES
  }

  const input = value as Partial<PerformancePreferences> & {
    maxHeavyFormatConcurrency?: unknown
    maxStandardFormatConcurrency?: unknown
  }

  // Backward compatibility: old shape only had max concurrency sliders.
  if (
    typeof input.smartAdvisorEnabled !== "boolean" &&
    !(input.hardwareProfile && typeof input.hardwareProfile === "object") &&
    (input.maxHeavyFormatConcurrency !== undefined ||
      input.maxStandardFormatConcurrency !== undefined)
  ) {
    return DEFAULT_PERFORMANCE_PREFERENCES
  }

  return {
    smartAdvisorEnabled: Boolean(input.smartAdvisorEnabled),
    allowConcurrencyOverclock: Boolean(input.allowConcurrencyOverclock),
    hardwareProfile: normalizeHardwareProfile(input.hardwareProfile)
  }
}

export function detectHardwareProfile(): SmartHardwareProfile {
  const hasNavigator = typeof navigator !== "undefined"
  const cpuCores = clampInteger(
    hasNavigator ? navigator.hardwareConcurrency : DEFAULT_CPU_CORES,
    MIN_CPU_CORES,
    MAX_CPU_CORES,
    DEFAULT_CPU_CORES
  )
  const detectedDeviceMemoryGb = clampNumber(
    hasNavigator ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined,
    1,
    MAX_RAM_BUDGET_GB,
    DEFAULT_RAM_BUDGET_GB,
    1
  )

  return {
    cpuCores,
    // Auto-detect should reflect detected RAM directly to avoid confusing mismatch in UI.
    ramBudgetGb: detectedDeviceMemoryGb,
    detectedLogicalCores: cpuCores,
    detectedDeviceMemoryGb,
    source: hasNavigator ? "detected" : "fallback"
  }
}

function getAdvisorHardwareProfile(preferences: PerformancePreferences): {
  profile: SmartHardwareProfile
  usingFallbackProfile: boolean
} {
  if (preferences.smartAdvisorEnabled) {
    return {
      profile: preferences.hardwareProfile,
      usingFallbackProfile: false
    }
  }

  return {
    profile: {
      cpuCores: POTATO_CPU_CORES,
      ramBudgetGb: POTATO_RAM_BUDGET_GB,
      source: "fallback"
    },
    usingFallbackProfile: true
  }
}

export function buildConcurrencyOptions(maxValue = MAX_CONCURRENCY): number[] {
  const safeMax = clampInteger(maxValue, 1, MAX_CONCURRENCY, MAX_CONCURRENCY)
  return Array.from({ length: safeMax }, (_, index) => index + 1)
}

export function clampConcurrencyValue(value: number, maxValue = MAX_CONCURRENCY): number {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 1
  const safeMax = clampInteger(maxValue, 1, MAX_CONCURRENCY, MAX_CONCURRENCY)
  return Math.max(1, Math.min(safeMax, safeValue))
}

function normalizeTargetFormat(format: AdvisorTargetFormat): ImageFormat {
  return format === "mozjpeg" ? "jpg" : format
}

function estimateResizeCost(
  resizeConfig: ResizeConfig | undefined
): { memoryMultiplier: number; cpuMultiplier: number; reasons: string[] } {
  if (!resizeConfig || resizeConfig.mode === "none") {
    return {
      memoryMultiplier: 1,
      cpuMultiplier: 1,
      reasons: []
    }
  }

  let memoryMultiplier = 1.08
  let cpuMultiplier = 1.14
  const reasons: string[] = []

  switch (resizeConfig.mode) {
    case "set_size": {
      memoryMultiplier *= 1.08
      cpuMultiplier *= 1.14
      reasons.push("Custom resize")

      if (resizeConfig.fitMode === "cover") {
        cpuMultiplier *= 1.06
        reasons.push("Resize cover crop")
      } else if (resizeConfig.fitMode === "contain") {
        memoryMultiplier *= 1.04
        reasons.push("Resize contain")
      }
      break
    }
    case "page_size": {
      memoryMultiplier *= 1.12
      cpuMultiplier *= 1.18
      reasons.push("Paper-size resize")
      break
    }
    case "scale": {
      const scaleValue =
        typeof resizeConfig.value === "number"
          ? Math.max(1, Math.min(300, Math.round(resizeConfig.value)))
          : 100
      const scaleFactor = Math.max(0.35, scaleValue / 100)
      memoryMultiplier *= Math.max(0.85, Math.min(1.35, 0.85 + scaleFactor * 0.5))
      cpuMultiplier *= Math.max(0.8, Math.min(1.45, 0.75 + scaleFactor * 0.65))
      reasons.push(`Resize scale ${scaleValue}%`)
      break
    }
    default:
      reasons.push("Resize enabled")
      break
  }

  const resamplingAlgorithm = normalizeResizeResamplingAlgorithm(
    resizeConfig.resamplingAlgorithm
  )

  if (resamplingAlgorithm === "lanczos3") {
    memoryMultiplier *= 1.06
    cpuMultiplier *= 1.28
    reasons.push("Lanczos3 resampling")
  } else if (resamplingAlgorithm === "magic-kernel") {
    memoryMultiplier *= 1.12
    cpuMultiplier *= 1.45
    reasons.push("Magic Kernel resampling")
  } else if (resamplingAlgorithm === "hqx") {
    memoryMultiplier *= 1.22
    cpuMultiplier *= 1.78
    reasons.push("HQX resampling")
  }

  return {
    memoryMultiplier,
    cpuMultiplier,
    reasons
  }
}

function estimateFormatCost(
  targetFormat: AdvisorTargetFormat,
  options: FormatCodecOptions | undefined,
  estimatedMegapixels: number,
  resizeConfig?: ResizeConfig
): { memoryMB: number; cpuScore: number; reasons: string[] } {
  const format = normalizeTargetFormat(targetFormat)
  const reasons: string[] = []
  const megapixelScale = Math.max(0.75, clampNumber(estimatedMegapixels, 1, 50, DEFAULT_ESTIMATED_MEGAPIXELS) / DEFAULT_ESTIMATED_MEGAPIXELS)

  let memoryMB = 70 * megapixelScale
  let cpuScore = 1

  switch (format) {
    case "jpg":
      memoryMB = 60 * megapixelScale
      cpuScore = targetFormat === "mozjpeg" ? 1.35 : 0.9
      break
    case "png":
      memoryMB = 120 * megapixelScale
      cpuScore = 1.4
      break
    case "webp":
      memoryMB = 95 * megapixelScale
      cpuScore = 1.25
      break
    case "avif":
      memoryMB = 420 * megapixelScale
      cpuScore = 3.2
      break
    case "jxl":
      memoryMB = 360 * megapixelScale
      cpuScore = 2.8
      break
    case "bmp":
      memoryMB = 85 * megapixelScale
      cpuScore = 0.9
      break
    case "ico":
      memoryMB = 80 * megapixelScale
      cpuScore = 1
      break
    case "tiff":
      memoryMB = 130 * megapixelScale
      cpuScore = 1.8
      break
    default:
      break
  }

  if (targetFormat === "mozjpeg") {
    const mozjpeg = options?.mozjpeg
    if (mozjpeg?.progressive) {
      cpuScore *= 1.12
      reasons.push("MozJPEG progressive scan")
    }

    if (mozjpeg?.chromaSubsampling === 0) {
      memoryMB *= 1.15
      cpuScore *= 1.18
      reasons.push("MozJPEG 4:4:4 chroma")
    } else if (mozjpeg?.chromaSubsampling === 1) {
      memoryMB *= 1.07
      cpuScore *= 1.08
      reasons.push("MozJPEG 4:2:2 chroma")
    }
  }

  if (format === "avif") {
    const avif = options?.avif
    const speed = clampInteger(avif?.speed, 0, 10, 6)
    const speedModifier = 1 + (10 - speed) * 0.18
    cpuScore *= speedModifier
    if (speed <= 4) {
      reasons.push(`AVIF speed ${speed} (high effort)`)
    }

    if (avif?.lossless) {
      memoryMB *= 1.25
      cpuScore *= 1.45
      reasons.push("AVIF lossless")
    }

    if (avif?.highAlphaQuality) {
      memoryMB *= 1.2
      cpuScore *= 1.18
      reasons.push("AVIF high alpha quality")
    }

    if (typeof avif?.qualityAlpha === "number" && avif.qualityAlpha >= 95) {
      cpuScore *= 1.08
      reasons.push("AVIF alpha quality >=95")
    }

    if (avif?.subsample === 2) {
      memoryMB *= 1.08
      cpuScore *= 1.12
      reasons.push("AVIF chroma 4:2:2")
    } else if (avif?.subsample === 3) {
      memoryMB *= 1.16
      cpuScore *= 1.2
      reasons.push("AVIF chroma 4:4:4")
    }
  }

  if (format === "jxl") {
    const effort = clampInteger(options?.jxl?.effort, 1, 9, 7)
    cpuScore *= 0.8 + effort * 0.2
    memoryMB *= 0.9 + effort * 0.08
    if (effort >= 7) {
      reasons.push(`JXL effort ${effort}`)
    }
  }

  if (format === "png") {
    const png = options?.png
    if (png?.tinyMode) {
      cpuScore *= 1.45
      reasons.push("PNG tiny mode")
    }

    if (png?.ditheringLevel && png.ditheringLevel > 0) {
      const ditherFactor = 1 + clampNumber(png.ditheringLevel, 0, 100, 0) / 140
      cpuScore *= ditherFactor
      memoryMB *= 1.04
      reasons.push(`PNG dithering ${png.ditheringLevel}%`)
    }

    if (png?.oxipngCompression) {
      cpuScore *= 4.4
      memoryMB *= 1.08
      reasons.push("OxiPNG compression")
    }

    if (png?.progressiveInterlaced) {
      cpuScore *= 1.12
      reasons.push("PNG progressive interlaced")
    }

    if (png?.cleanTransparentPixels) {
      cpuScore *= 1.05
      reasons.push("PNG clean transparent pixels")
    }

    if (png?.autoGrayscale) {
      cpuScore *= 1.08
      reasons.push("PNG auto grayscale")
    }
  }

  if (format === "webp") {
    const webp = options?.webp
    const effort = clampInteger(webp?.effort, 1, 9, 5)
    cpuScore *= 0.85 + effort * 0.14

    if (effort >= 7) {
      reasons.push(`WebP effort ${effort}`)
    }

    if (webp?.lossless) {
      memoryMB *= 1.32
      cpuScore *= 1.95
      reasons.push("WebP lossless")
    }

    if (webp?.sharpYuv) {
      cpuScore *= 1.1
      reasons.push("WebP Sharp YUV")
    }

    if (webp?.preserveExactAlpha) {
      memoryMB *= 1.1
      cpuScore *= 1.08
      reasons.push("WebP preserve exact alpha")
    }
  }

  if (format === "bmp") {
    const bmp = options?.bmp
    if (bmp?.colorDepth === 32) {
      memoryMB *= 1.16
      reasons.push("BMP 32-bit")
    }

    if (bmp?.colorDepth === 1 && bmp?.ditheringLevel && bmp.ditheringLevel > 0) {
      cpuScore *= 1.22
      reasons.push("BMP 1-bit dithering")
    }
  }

  if (format === "tiff") {
    const tiff = options?.tiff
    if (tiff?.colorMode === "grayscale") {
      memoryMB *= 0.76
      cpuScore *= 0.88
      reasons.push("TIFF grayscale")
    }
  }

  if (format === "ico") {
    const ico = options?.ico
    const sizeCount = Array.isArray(ico?.sizes) ? ico.sizes.length : 3
    memoryMB *= Math.max(1, 0.7 + sizeCount * 0.22)
    cpuScore *= Math.max(1, 0.7 + sizeCount * 0.18)

    if (sizeCount >= 4) {
      reasons.push(`ICO ${sizeCount} layers`)
    }

    if (ico?.generateWebIconKit) {
      memoryMB *= 1.35
      cpuScore *= 1.4
      reasons.push("ICO web toolkit")
    }

    if (ico?.optimizeInternalPngLayers) {
      memoryMB *= 1.12
      cpuScore *= 1.75
      reasons.push("ICO internal PNG optimization")
    }
  }

  const resizeCost = estimateResizeCost(resizeConfig)
  memoryMB *= resizeCost.memoryMultiplier
  cpuScore *= resizeCost.cpuMultiplier
  reasons.push(...resizeCost.reasons)

  return {
    memoryMB: Math.max(40, Math.round(memoryMB)),
    cpuScore: Math.max(0.55, Number(cpuScore.toFixed(2))),
    reasons
  }
}

function buildStatusText(
  riskLevel: AdvisorRiskLevel,
  selectedConcurrency: number,
  recommended: number,
  recommendedMin: number,
  recommendedMax: number
): string {
  if (riskLevel === "danger") {
    return `High crash risk: selected ${selectedConcurrency} exceeds safe range ${recommendedMin}-${recommendedMax}.`
  }

  if (riskLevel === "caution") {
    return `Pushing limits: selected ${selectedConcurrency}, recommended around ${recommended} (${recommendedMin}-${recommendedMax}).`
  }

  return `Optimal: selected ${selectedConcurrency} is within safe range ${recommendedMin}-${recommendedMax}.`
}

export function calculateConcurrencyAdvisor(input: {
  targetFormat: AdvisorTargetFormat
  selectedConcurrency: number
  formatOptions?: FormatCodecOptions
  resizeConfig?: ResizeConfig
  preferences: PerformancePreferences
  estimatedMegapixels?: number
}): ConcurrencyAdvisorResult {
  const preferences = normalizePerformancePreferences(input.preferences)
  const selectedConcurrency = clampConcurrencyValue(input.selectedConcurrency)
  const { profile, usingFallbackProfile } = getAdvisorHardwareProfile(preferences)
  const cost = estimateFormatCost(
    input.targetFormat,
    input.formatOptions,
    input.estimatedMegapixels ?? DEFAULT_ESTIMATED_MEGAPIXELS,
    input.resizeConfig
  )

  const availableCpuThreads = Math.max(1, profile.cpuCores - 1)
  const cpuLimit = clampConcurrencyValue(
    Math.floor((availableCpuThreads * 1.35) / Math.max(0.7, cost.cpuScore))
  )

  const safeRamBudgetMB = Math.max(512, Math.floor(profile.ramBudgetGb * 1024 * 0.72))
  const memoryLimit = clampConcurrencyValue(
    Math.floor(safeRamBudgetMB / Math.max(1, cost.memoryMB))
  )

  const recommended = clampConcurrencyValue(Math.min(cpuLimit, memoryLimit))
  const recommendedMin = clampConcurrencyValue(Math.max(1, Math.floor(recommended * 0.7)))
  const recommendedMax = clampConcurrencyValue(
    Math.max(recommended, Math.ceil(recommended * 1.25))
  )

  const riskLevel: AdvisorRiskLevel =
    selectedConcurrency <= recommendedMax
      ? "optimal"
      : selectedConcurrency <= Math.max(recommendedMax + 2, Math.ceil(recommended * 1.6))
      ? "caution"
      : "danger"

  const sourceLabel =
    profile.source === "detected" ? "Detected" : profile.source === "manual" ? "Manual" : "Fallback"

  return {
    enabled: true,
    advisorName: usingFallbackProfile ? "Concurrency Advisor" : "Smart Concurrency Advisor",
    advisorNameShort: usingFallbackProfile ? "CA" : "SCA",
    usingFallbackProfile,
    recommended,
    recommendedMin,
    recommendedMax,
    cpuLimit,
    memoryLimit,
    memoryPerWorkerMB: cost.memoryMB,
    riskLevel,
    statusText: buildStatusText(
      riskLevel,
      selectedConcurrency,
      recommended,
      recommendedMin,
      recommendedMax
    ),
    detailText: `CPU limit ${cpuLimit}, RAM limit ${memoryLimit}, estimated ${cost.memoryMB}MB per worker.`,
    summaryText: usingFallbackProfile
      ? `Default profile: ${profile.cpuCores} threads, ${profile.ramBudgetGb}GB RAM budget.`
      : `${sourceLabel} profile: ${profile.cpuCores} threads, ${profile.ramBudgetGb}GB RAM budget.`,
    reasons: cost.reasons
  }
}

export function resolveConcurrencyLockState(input: {
  preferences: PerformancePreferences
  advisor: ConcurrencyAdvisorResult
}): {
  isLocked: boolean
  maxAllowedConcurrency: number
} {
  const preferences = normalizePerformancePreferences(input.preferences)
  const isLocked = !preferences.allowConcurrencyOverclock

  return {
    isLocked,
    maxAllowedConcurrency: isLocked
      ? clampConcurrencyValue(input.advisor.recommendedMax)
      : MAX_CONCURRENCY
  }
}
