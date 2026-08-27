import {
  mergeNormalizedAvifCodecOptions,
  mergeNormalizedBmpCodecOptions,
  mergeNormalizedIcoCodecOptions,
  mergeNormalizedPngCodecOptions,
  mergeNormalizedWebpCodecOptions,
} from "@imify/core/codec-options"
import { mergeNormalizedJxlCodecOptions } from "@imify/core/jxl-options"
import type { BmpColorDepth, TiffColorMode } from "@imify/core/types"
import type { BatchFormatOptions, BatchSetupState, BatchTargetFormat, SetupContext } from "../batch-types"
import { DEFAULT_BATCH_STATE, createDefaultContextConfigs } from "../batch-normalizer"
import { buildBatchContextFieldPatch, type BatchContextStoreBase } from "./context-helpers"

export interface CodecOptionsSliceState extends BatchContextStoreBase {
  targetFormat: BatchTargetFormat
  concurrency: number
  quality: number
  formatOptions: BatchFormatOptions
  stripExif: boolean
  fileNamePattern: string
  heavyFormatToast: { id: string; format: string } | null
}

export interface CodecOptionsSliceActions {
  setTargetFormat: (value: BatchTargetFormat) => void
  setConcurrency: (value: number) => void
  setQuality: (value: number) => void
  setJxlEffort: (value: number) => void
  setJxlLossless: (value: boolean) => void
  setJxlProgressive: (value: boolean) => void
  setJxlEpf: (value: 0 | 1 | 2 | 3) => void
  setWebpLossless: (value: boolean) => void
  setWebpNearLossless: (value: number) => void
  setWebpEffort: (value: number) => void
  setWebpSharpYuv: (value: boolean) => void
  setWebpPreserveExactAlpha: (value: boolean) => void
  setAvifSpeed: (value: number) => void
  setAvifQualityAlpha: (value: number) => void
  setAvifLossless: (value: boolean) => void
  setAvifSubsample: (value: 1 | 2 | 3) => void
  setAvifTune: (value: "auto" | "ssim" | "psnr") => void
  setAvifHighAlphaQuality: (value: boolean) => void
  setMozJpegProgressive: (value: boolean) => void
  setMozJpegChromaSubsampling: (value: 0 | 1 | 2) => void
  setIcoSizes: (value: number[]) => void
  setIcoGenerateWebIconKit: (value: boolean) => void
  setIcoOptimizeInternalPngLayers: (value: boolean) => void
  setPngTinyMode: (value: boolean) => void
  setPngCleanTransparentPixels: (value: boolean) => void
  setPngAutoGrayscale: (value: boolean) => void
  setPngDitheringLevel: (value: number) => void
  setPngProgressiveInterlaced: (value: boolean) => void
  setPngOxiPngCompression: (value: boolean) => void
  setBmpColorDepth: (value: BmpColorDepth) => void
  setBmpDitheringLevel: (value: number) => void
  setTiffColorMode: (value: TiffColorMode) => void
  setStripExif: (value: boolean) => void
  setFileNamePattern: (value: string) => void
  setHeavyFormatToast: (value: { id: string; format: string } | null) => void
}

export type CodecOptionsSlice = CodecOptionsSliceState & CodecOptionsSliceActions

export function buildBatchContextFormatOptionsStatePatch<TState extends BatchContextStoreBase>(
  state: TState,
  nextFormatOptions: BatchSetupState["formatOptions"]
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextConfig = {
    ...currentConfig,
    formatOptions: nextFormatOptions
  }

  return {
    formatOptions: nextFormatOptions,
    contextConfigs: {
      ...contextConfigs,
      [setupContext]: nextConfig
    }
  } as unknown as Partial<TState>
}

export type BatchJxlCodecPatch = Partial<BatchSetupState["formatOptions"]["jxl"]>

export function buildBatchContextJxlStatePatch<TState extends BatchContextStoreBase & { formatOptions: BatchFormatOptions }>(
  state: TState,
  patch: BatchJxlCodecPatch
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextJxlOptions = mergeNormalizedJxlCodecOptions(currentConfig.formatOptions.jxl, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    jxl: nextJxlOptions
  })
}

export type BatchWebpCodecPatch = Partial<BatchSetupState["formatOptions"]["webp"]>

export function buildBatchContextWebpStatePatch<TState extends BatchContextStoreBase & { formatOptions: BatchFormatOptions }>(
  state: TState,
  patch: BatchWebpCodecPatch
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextWebpOptions = mergeNormalizedWebpCodecOptions(currentConfig.formatOptions.webp, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    webp: nextWebpOptions
  })
}

export type BatchAvifCodecPatch = Partial<BatchSetupState["formatOptions"]["avif"]>

export function buildBatchContextAvifStatePatch<TState extends BatchContextStoreBase & { formatOptions: BatchFormatOptions }>(
  state: TState,
  patch: BatchAvifCodecPatch
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextAvifOptions = mergeNormalizedAvifCodecOptions(currentConfig.formatOptions.avif, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    avif: nextAvifOptions
  })
}

export type BatchPngCodecPatch = Partial<BatchSetupState["formatOptions"]["png"]>

export function buildBatchContextPngStatePatch<TState extends BatchContextStoreBase & { formatOptions: BatchFormatOptions }>(
  state: TState,
  patch: BatchPngCodecPatch
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextPngOptions = mergeNormalizedPngCodecOptions(currentConfig.formatOptions.png, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    png: nextPngOptions
  })
}

export type BatchBmpCodecPatch = Partial<BatchSetupState["formatOptions"]["bmp"]>

export function buildBatchContextBmpStatePatch<TState extends BatchContextStoreBase & { formatOptions: BatchFormatOptions }>(
  state: TState,
  patch: BatchBmpCodecPatch
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextBmpOptions = mergeNormalizedBmpCodecOptions(currentConfig.formatOptions.bmp, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    bmp: nextBmpOptions
  })
}

export type BatchIcoCodecPatch = Partial<BatchSetupState["formatOptions"]["ico"]>

export function buildBatchContextIcoStatePatch<TState extends BatchContextStoreBase & { formatOptions: BatchFormatOptions }>(
  state: TState,
  patch: BatchIcoCodecPatch
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextIcoOptions = mergeNormalizedIcoCodecOptions(currentConfig.formatOptions.ico, patch, {
    defaultSizes: DEFAULT_BATCH_STATE.formatOptions.ico.sizes
  })

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    ico: nextIcoOptions
  })
}

export function createCodecOptionsSlice<TState extends CodecOptionsSlice>(
  set: (fn: (state: TState) => Partial<TState> | TState) => void
): CodecOptionsSliceActions {
  return {
    setTargetFormat: (value) => set((state) => buildBatchContextFieldPatch(state, "targetFormat", value)),
    setConcurrency: (value) => set((state) => buildBatchContextFieldPatch(state, "concurrency", value)),
    setQuality: (value) => set((state) => buildBatchContextFieldPatch(state, "quality", value)),
    setJxlEffort: (value) => set((state) => buildBatchContextJxlStatePatch(state, { effort: value })),
    setJxlLossless: (value) => set((state) => buildBatchContextJxlStatePatch(state, { lossless: value })),
    setJxlProgressive: (value) => set((state) => buildBatchContextJxlStatePatch(state, { progressive: value })),
    setJxlEpf: (value) => set((state) => buildBatchContextJxlStatePatch(state, { epf: value })),
    setWebpLossless: (value) => set((state) => buildBatchContextWebpStatePatch(state, { lossless: value })),
    setWebpNearLossless: (value) =>
      set((state) => buildBatchContextWebpStatePatch(state, { nearLossless: value })),
    setWebpEffort: (value) => set((state) => buildBatchContextWebpStatePatch(state, { effort: value })),
    setWebpSharpYuv: (value) => set((state) => buildBatchContextWebpStatePatch(state, { sharpYuv: value })),
    setWebpPreserveExactAlpha: (value) =>
      set((state) => buildBatchContextWebpStatePatch(state, { preserveExactAlpha: value })),
    setAvifSpeed: (value) => set((state) => buildBatchContextAvifStatePatch(state, { speed: value })),
    setAvifQualityAlpha: (value) =>
      set((state) => buildBatchContextAvifStatePatch(state, { qualityAlpha: value })),
    setAvifLossless: (value) => set((state) => buildBatchContextAvifStatePatch(state, { lossless: value })),
    setAvifSubsample: (value) => set((state) => buildBatchContextAvifStatePatch(state, { subsample: value })),
    setAvifTune: (value) => set((state) => buildBatchContextAvifStatePatch(state, { tune: value })),
    setAvifHighAlphaQuality: (value) =>
      set((state) => buildBatchContextAvifStatePatch(state, { highAlphaQuality: value })),
    setMozJpegProgressive: (value) =>
      set((state) => {
        const setupContext = state.setupContext
        const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
        const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
        return buildBatchContextFormatOptionsStatePatch(state, {
          ...currentConfig.formatOptions,
          mozjpeg: {
            ...currentConfig.formatOptions.mozjpeg,
            progressive: value
          }
        })
      }),
    setMozJpegChromaSubsampling: (value) =>
      set((state) => {
        const setupContext = state.setupContext
        const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
        const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
        return buildBatchContextFormatOptionsStatePatch(state, {
          ...currentConfig.formatOptions,
          mozjpeg: {
            ...currentConfig.formatOptions.mozjpeg,
            chromaSubsampling: value
          }
        })
      }),
    setIcoSizes: (value) => set((state) => buildBatchContextIcoStatePatch(state, { sizes: value })),
    setIcoGenerateWebIconKit: (value) =>
      set((state) => buildBatchContextIcoStatePatch(state, { generateWebIconKit: value })),
    setIcoOptimizeInternalPngLayers: (value) =>
      set((state) => buildBatchContextIcoStatePatch(state, { optimizeInternalPngLayers: value })),
    setPngTinyMode: (value) => set((state) => buildBatchContextPngStatePatch(state, { tinyMode: value })),
    setPngCleanTransparentPixels: (value) =>
      set((state) => buildBatchContextPngStatePatch(state, { cleanTransparentPixels: value })),
    setPngAutoGrayscale: (value) =>
      set((state) => buildBatchContextPngStatePatch(state, { autoGrayscale: value })),
    setPngDitheringLevel: (value) =>
      set((state) => buildBatchContextPngStatePatch(state, { ditheringLevel: value })),
    setPngProgressiveInterlaced: (value) =>
      set((state) => buildBatchContextPngStatePatch(state, { progressiveInterlaced: value })),
    setPngOxiPngCompression: (value) =>
      set((state) => buildBatchContextPngStatePatch(state, { oxipngCompression: value })),
    setBmpColorDepth: (value) => set((state) => buildBatchContextBmpStatePatch(state, { colorDepth: value })),
    setBmpDitheringLevel: (value) =>
      set((state) => buildBatchContextBmpStatePatch(state, { ditheringLevel: value })),
    setTiffColorMode: (value) =>
      set((state) => {
        const setupContext = state.setupContext
        const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
        const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
        return buildBatchContextFormatOptionsStatePatch(state, {
          ...currentConfig.formatOptions,
          tiff: {
            ...currentConfig.formatOptions.tiff,
            colorMode: value
          }
        })
      }),
    setStripExif: (value) => set((state) => buildBatchContextFieldPatch(state, "stripExif", value)),
    setFileNamePattern: (value) => set((state) => buildBatchContextFieldPatch(state, "fileNamePattern", value)),
    setHeavyFormatToast: (value) => set(() => ({ heavyFormatToast: value } as Partial<TState>)),
  }
}
