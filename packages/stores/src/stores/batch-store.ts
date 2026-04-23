import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import {
  mergeNormalizedAvifCodecOptions,
  mergeNormalizedBmpCodecOptions,
  mergeNormalizedIcoCodecOptions,
  mergeNormalizedPngCodecOptions,
  mergeNormalizedWebpCodecOptions,
  normalizeAvifCodecOptions,
  normalizeBmpCodecOptions,
  normalizeIcoCodecOptions,
  normalizeMozJpegChromaSubsampling,
  normalizePngCodecOptions,
  normalizeWebpCodecOptions
} from "@imify/core/codec-options"
import { mergeNormalizedJxlCodecOptions } from "@imify/core/jxl-options"
import { DEFAULT_ICO_SIZES } from "@imify/core/format-config"
import { normalizeResizeResamplingAlgorithm } from "@imify/core/resize-resampling"
import type { BmpColorDepth, PaperSize, SupportedDPI, TiffColorMode } from "@imify/core/types"
import type { BatchResizeMode, BatchSetupState, BatchTargetFormat } from "@/options/components/batch/types"
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "@/options/shared/preset-colors"



export type SetupContext = "single" | "batch"
export type ProcessorPresetViewMode = "select" | "workspace"

export interface SavedSetupPreset {
  id: string
  context: SetupContext
  name: string
  highlightColor: string
  config: BatchSetupState
  createdAt: number
  updatedAt: number
}

function toAspectRatioLabel(width: number, height: number): string {
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

const DEFAULT_BATCH_STATE: BatchSetupState = {
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

function cloneSetupState(state: BatchSetupState | undefined): BatchSetupState {
  if (!state) {
    // Fallback to default if state is undefined
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

  return {
    ...stateWithoutLegacyWatermark,
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

function createDefaultContextConfigs(): Record<SetupContext, BatchSetupState> {
  return {
    single: cloneSetupState(DEFAULT_BATCH_STATE),
    batch: cloneSetupState(DEFAULT_BATCH_STATE)
  }
}

function createDefaultSourceState(): Record<SetupContext, { width: number; height: number; syncVersion: number }> {
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

function createDefaultUIState(): Record<SetupContext, { isTargetFormatQualityOpen: boolean; isResizeOpen: boolean }> {
  return {
    single: { isTargetFormatQualityOpen: false, isResizeOpen: false },
    batch: { isTargetFormatQualityOpen: false, isResizeOpen: false }
  }
}

function createDefaultPresetViewByContext(): Record<SetupContext, ProcessorPresetViewMode> {
  return {
    single: "select",
    batch: "select"
  }
}

function createDefaultPresetBootstrapState(): Record<SetupContext, boolean> {
  return {
    single: false,
    batch: false
  }
}

function getRecentPresetIdForContext(
  context: SetupContext,
  recentPresetIds: Partial<Record<SetupContext, string>>,
  presets: SavedSetupPreset[]
): string | null {
  const preferredId = recentPresetIds[context]

  if (preferredId && presets.some((preset) => preset.id === preferredId && preset.context === context)) {
    return preferredId
  }

  const latestPreset = presets
    .filter((preset) => preset.context === context)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]

  return latestPreset?.id ?? null
}

interface BatchStoreState extends BatchSetupState {
  setupContext: SetupContext
  contextConfigs: Record<SetupContext, BatchSetupState>
  sourceStateByContext: Record<SetupContext, { width: number; height: number; syncVersion: number }>
  uiStates: Record<SetupContext, { isTargetFormatQualityOpen: boolean; isResizeOpen: boolean }>
  presetViewByContext: Record<SetupContext, ProcessorPresetViewMode>
  defaultPresetBootstrappedByContext: Record<SetupContext, boolean>
  activePresetIds: Partial<Record<SetupContext, string>>
  resizeSourceWidth: number
  resizeSourceHeight: number
  resizeSyncVersion: number
  isRunning: boolean
  presets: SavedSetupPreset[]
  recentPresetIds: Partial<Record<SetupContext, string>>
  setSetupContext: (context: SetupContext) => void
  setIsRunning: (value: boolean) => void
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
  setResizeMode: (value: BatchResizeMode) => void
  setResizeValue: (value: number) => void
  setResizeWidth: (value: number) => void
  setResizeHeight: (value: number) => void
  setResizeAspectMode: (value: BatchSetupState["resizeAspectMode"]) => void
  setResizeAspectRatio: (value: string) => void
  setResizeAnchor: (value: BatchSetupState["resizeAnchor"]) => void
  setResizeFitMode: (value: BatchSetupState["resizeFitMode"]) => void
  setResizeContainBackground: (value: string) => void
  setResizeResamplingAlgorithm: (value: BatchSetupState["resizeResamplingAlgorithm"]) => void
  syncResizeToSource: (width: number, height: number) => void
  setPaperSize: (value: PaperSize) => void
  setDpi: (value: SupportedDPI) => void
  setStripExif: (value: boolean) => void
  setPngTinyMode: (value: boolean) => void
  setPngCleanTransparentPixels: (value: boolean) => void
  setPngAutoGrayscale: (value: boolean) => void
  setPngDitheringLevel: (value: number) => void
  setPngProgressiveInterlaced: (value: boolean) => void
  setPngOxiPngCompression: (value: boolean) => void
  setBmpColorDepth: (value: BmpColorDepth) => void
  setBmpDitheringLevel: (value: number) => void
  setTiffColorMode: (value: TiffColorMode) => void
  setFileNamePattern: (value: string) => void
  skipDownloadConfirm: boolean
  setSkipDownloadConfirm: (value: boolean) => void
  skipOomWarning: boolean
  setSkipOomWarning: (value: boolean) => void
  /** If true, do not show Image Splicing “high preview quality” warning */
  skipSplicingHeavyPreviewQualityWarning: boolean
  setSkipSplicingHeavyPreviewQualityWarning: (value: boolean) => void
  heavyFormatToast: { id: string; format: string } | null
  setHeavyFormatToast: (value: { id: string; format: string } | null) => void
  /** Accordion open/close state for Export Format & Quality - per context */
  isTargetFormatQualityOpen: boolean
  setIsTargetFormatQualityOpen: (value: boolean) => void
  /** Accordion open/close state for Resize - per context */
  isResizeOpen: boolean
  setIsResizeOpen: (value: boolean) => void
  setPresetViewMode: (context: SetupContext, mode: ProcessorPresetViewMode) => void
  saveCurrentPreset: (payload: { name: string; highlightColor: string }) => string
  applyPresetToCurrentContext: (presetId: string) => void
  ensureDefaultPresetForContext: (context: SetupContext) => string | null
  syncActivePresetConfig: (context: SetupContext) => void
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  deletePreset: (presetId: string) => void
}

function cloneContextConfig(state: BatchStoreState, context: SetupContext): BatchSetupState {
  return cloneSetupState(state.contextConfigs[context] ?? DEFAULT_BATCH_STATE)
}

function buildBatchContextFormatOptionsStatePatch(
  state: BatchStoreState,
  nextFormatOptions: BatchSetupState["formatOptions"]
): Partial<BatchStoreState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext]
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
  } as Partial<BatchStoreState>
}

type BatchJxlCodecPatch = Partial<BatchSetupState["formatOptions"]["jxl"]>

function buildBatchContextJxlStatePatch(
  state: BatchStoreState,
  patch: BatchJxlCodecPatch
): Partial<BatchStoreState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext]
  const nextJxlOptions = mergeNormalizedJxlCodecOptions(currentConfig.formatOptions.jxl, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    jxl: nextJxlOptions
  })
}

type BatchWebpCodecPatch = Partial<BatchSetupState["formatOptions"]["webp"]>

function buildBatchContextWebpStatePatch(
  state: BatchStoreState,
  patch: BatchWebpCodecPatch
): Partial<BatchStoreState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext]
  const nextWebpOptions = mergeNormalizedWebpCodecOptions(currentConfig.formatOptions.webp, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    webp: nextWebpOptions
  })
}

type BatchAvifCodecPatch = Partial<BatchSetupState["formatOptions"]["avif"]>

function buildBatchContextAvifStatePatch(
  state: BatchStoreState,
  patch: BatchAvifCodecPatch
): Partial<BatchStoreState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext]
  const nextAvifOptions = mergeNormalizedAvifCodecOptions(currentConfig.formatOptions.avif, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    avif: nextAvifOptions
  })
}

type BatchPngCodecPatch = Partial<BatchSetupState["formatOptions"]["png"]>

function buildBatchContextPngStatePatch(
  state: BatchStoreState,
  patch: BatchPngCodecPatch
): Partial<BatchStoreState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext]
  const nextPngOptions = mergeNormalizedPngCodecOptions(currentConfig.formatOptions.png, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    png: nextPngOptions
  })
}

type BatchBmpCodecPatch = Partial<BatchSetupState["formatOptions"]["bmp"]>

function buildBatchContextBmpStatePatch(
  state: BatchStoreState,
  patch: BatchBmpCodecPatch
): Partial<BatchStoreState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext]
  const nextBmpOptions = mergeNormalizedBmpCodecOptions(currentConfig.formatOptions.bmp, patch)

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    bmp: nextBmpOptions
  })
}

type BatchIcoCodecPatch = Partial<BatchSetupState["formatOptions"]["ico"]>

function buildBatchContextIcoStatePatch(
  state: BatchStoreState,
  patch: BatchIcoCodecPatch
): Partial<BatchStoreState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext]
  const nextIcoOptions = mergeNormalizedIcoCodecOptions(currentConfig.formatOptions.ico, patch, {
    defaultSizes: DEFAULT_BATCH_STATE.formatOptions.ico.sizes
  })

  return buildBatchContextFormatOptionsStatePatch(state, {
    ...currentConfig.formatOptions,
    ico: nextIcoOptions
  })
}

function isSetupConfigEqual(a: BatchSetupState, b: BatchSetupState): boolean {
  return JSON.stringify(cloneSetupState(a)) === JSON.stringify(cloneSetupState(b))
}

export const useBatchStore = create<BatchStoreState>()(
  persist(
    (set, get) => ({
      ...cloneSetupState(DEFAULT_BATCH_STATE),
      setupContext: "single",
      resizeSourceWidth: DEFAULT_BATCH_STATE.resizeWidth,
      resizeSourceHeight: DEFAULT_BATCH_STATE.resizeHeight,
      resizeSyncVersion: 0,
      isRunning: false,
      presets: [],
      recentPresetIds: {},
      presetViewByContext: createDefaultPresetViewByContext(),
      defaultPresetBootstrappedByContext: createDefaultPresetBootstrapState(),
      activePresetIds: {},
      skipDownloadConfirm: false,
      skipOomWarning: false,
      skipSplicingHeavyPreviewQualityWarning: false,
      heavyFormatToast: null,
      isTargetFormatQualityOpen: false,
      isResizeOpen: false,
      contextConfigs: createDefaultContextConfigs(),
      sourceStateByContext: createDefaultSourceState(),
      uiStates: createDefaultUIState(),
      setSetupContext: (context) =>
        set((state) => {
          if (state.setupContext === context) {
            return state
          }

          const contextConfigs = state.contextConfigs ?? createDefaultContextConfigs()
          const sourceStateByContext = state.sourceStateByContext ?? createDefaultSourceState()
          const uiStates = state.uiStates ?? createDefaultUIState()
          const presetViewByContext = state.presetViewByContext ?? createDefaultPresetViewByContext()
          const activePresetIds = { ...state.activePresetIds }

          let nextConfig = contextConfigs[context]
          const nextSourceState = sourceStateByContext[context]
          const nextUIState = uiStates[context]

          if (presetViewByContext[context] === "workspace") {
            const activePresetId = activePresetIds[context]
            const resolvedPreset = state.presets.find(
              (preset) => preset.id === activePresetId && preset.context === context
            )

            if (resolvedPreset) {
              nextConfig = cloneSetupState(resolvedPreset.config)
            } else {
              const fallbackPresetId = getRecentPresetIdForContext(context, state.recentPresetIds, state.presets)
              if (fallbackPresetId) {
                const fallbackPreset = state.presets.find(
                  (preset) => preset.id === fallbackPresetId && preset.context === context
                )
                if (fallbackPreset) {
                  activePresetIds[context] = fallbackPreset.id
                  nextConfig = cloneSetupState(fallbackPreset.config)
                }
              } else {
                delete activePresetIds[context]
                presetViewByContext[context] = "select"
              }
            }
          }

          const nextContextConfigs = {
            ...contextConfigs,
            [context]: cloneSetupState(nextConfig)
          }

          return {
            setupContext: context,
            ...cloneSetupState(nextConfig),
            resizeSourceWidth: nextSourceState.width,
            resizeSourceHeight: nextSourceState.height,
            resizeSyncVersion: nextSourceState.syncVersion,
            isTargetFormatQualityOpen: nextUIState.isTargetFormatQualityOpen,
            isResizeOpen: nextUIState.isResizeOpen,
            contextConfigs: nextContextConfigs,
            sourceStateByContext,
            uiStates,
            activePresetIds,
            presetViewByContext
          } as Partial<BatchStoreState>
        }),
      setIsRunning: (value) => set({ isRunning: value }),
      setTargetFormat: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            targetFormat: value
          }

          return {
            targetFormat: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setConcurrency: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            concurrency: value
          }

          return {
            concurrency: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setQuality: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            quality: value
          }

          return {
            quality: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
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
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            mozjpeg: {
              ...currentConfig.formatOptions.mozjpeg,
              progressive: value
            }
          }
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
          } as Partial<BatchStoreState>
        }),
      setMozJpegChromaSubsampling: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            mozjpeg: {
              ...currentConfig.formatOptions.mozjpeg,
              chromaSubsampling: value
            }
          }
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
          } as Partial<BatchStoreState>
        }),
      setIcoSizes: (value) => set((state) => buildBatchContextIcoStatePatch(state, { sizes: value })),
      setIcoGenerateWebIconKit: (value) =>
        set((state) => buildBatchContextIcoStatePatch(state, { generateWebIconKit: value })),
      setIcoOptimizeInternalPngLayers: (value) =>
        set((state) => buildBatchContextIcoStatePatch(state, { optimizeInternalPngLayers: value })),
      setResizeMode: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeMode: value
          }

          return {
            resizeMode: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeValue: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeValue: value
          }

          return {
            resizeValue: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeWidth: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeWidth: value
          }

          return {
            resizeWidth: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeHeight: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeHeight: value
          }

          return {
            resizeHeight: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeAspectMode: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeAspectMode: value
          }

          return {
            resizeAspectMode: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeAspectRatio: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeAspectRatio: value
          }

          return {
            resizeAspectRatio: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeAnchor: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeAnchor: value
          }

          return {
            resizeAnchor: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeFitMode: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeFitMode: value
          }

          return {
            resizeFitMode: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeContainBackground: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeContainBackground: value
          }

          return {
            resizeContainBackground: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setResizeResamplingAlgorithm: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeResamplingAlgorithm: value
          }

          return {
            resizeResamplingAlgorithm: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      syncResizeToSource: (width, height) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const sourceStateByContext = (state as any).sourceStateByContext ?? createDefaultSourceState()
          const nextWidth = Math.max(1, Math.round(width))
          const nextHeight = Math.max(1, Math.round(height))
          const nextSyncVersion = (sourceStateByContext[setupContext]?.syncVersion ?? 0) + 1
          const nextConfig = {
            ...contextConfigs[setupContext],
            resizeWidth: nextWidth,
            resizeHeight: nextHeight,
            resizeAspectMode: "original" as const,
            resizeAspectRatio: toAspectRatioLabel(nextWidth, nextHeight),
            resizeAnchor: "width" as const
          }

          return {
            resizeSourceWidth: nextWidth,
            resizeSourceHeight: nextHeight,
            resizeWidth: nextWidth,
            resizeHeight: nextHeight,
            resizeAspectMode: "original",
            resizeAspectRatio: toAspectRatioLabel(nextWidth, nextHeight),
            resizeAnchor: "width",
            resizeSyncVersion: nextSyncVersion,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            },
            sourceStateByContext: {
              ...sourceStateByContext,
              [setupContext]: {
                width: nextWidth,
                height: nextHeight,
                syncVersion: nextSyncVersion
              }
            }
          } as Partial<BatchStoreState>
        }),
      setPaperSize: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            paperSize: value
          }

          return {
            paperSize: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setDpi: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            dpi: value
          }

          return {
            dpi: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setStripExif: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            stripExif: value
          }

          return {
            stripExif: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
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
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            tiff: {
              ...currentConfig.formatOptions.tiff,
              colorMode: value
            }
          }
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
          } as Partial<BatchStoreState>
        }),
      setFileNamePattern: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            fileNamePattern: value
          }

          return {
            fileNamePattern: value,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: nextConfig
            }
          } as Partial<BatchStoreState>
        }),
      setSkipDownloadConfirm: (value) => set({ skipDownloadConfirm: value }),
      setSkipSplicingHeavyPreviewQualityWarning: (value) =>
        set({ skipSplicingHeavyPreviewQualityWarning: value }),
      setSkipOomWarning: (value) => set({ skipOomWarning: value }),
      setHeavyFormatToast: (value) => set({ heavyFormatToast: value }),
      setIsTargetFormatQualityOpen: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const uiStates = (state as any).uiStates ?? createDefaultUIState()
          const nextUIState = {
            ...uiStates[setupContext],
            isTargetFormatQualityOpen: value
          }

          return {
            isTargetFormatQualityOpen: value,
            uiStates: {
              ...uiStates,
              [setupContext]: nextUIState
            }
          }
        }),
      setIsResizeOpen: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const uiStates = state.uiStates ?? createDefaultUIState()
          const nextUIState = {
            ...uiStates[setupContext],
            isResizeOpen: value
          }

          return {
            isResizeOpen: value,
            uiStates: {
              ...uiStates,
              [setupContext]: nextUIState
            }
          }
        }),
      setPresetViewMode: (context, mode) =>
        set((state) => {
          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext()),
            [context]: mode
          }
          const nextActivePresetIds = {
            ...state.activePresetIds
          }

          if (mode === "select") {
            delete nextActivePresetIds[context]
          }

          return {
            presetViewByContext: nextPresetViewByContext,
            activePresetIds: nextActivePresetIds
          }
        }),
      saveCurrentPreset: ({ name, highlightColor }) => {
        const timestamp = Date.now()
        const presetId = `preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

        set((state) => {
          const setupContext = state.setupContext
          const currentConfig = cloneContextConfig(state, setupContext)

          const nextPreset: SavedSetupPreset = {
            id: presetId,
            context: setupContext,
            name: name.trim() || "Untitled preset",
            highlightColor,
            config: currentConfig,
            createdAt: timestamp,
            updatedAt: timestamp
          }

          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext()),
            [setupContext]: "workspace" as ProcessorPresetViewMode
          }

          return {
            presets: [nextPreset, ...state.presets],
            recentPresetIds: {
              ...state.recentPresetIds,
              [setupContext]: nextPreset.id
            },
            activePresetIds: {
              ...state.activePresetIds,
              [setupContext]: nextPreset.id
            },
            presetViewByContext: nextPresetViewByContext
          }
        })

        return presetId
      },
      applyPresetToCurrentContext: (presetId) =>
        set((state) => {
          const setupContext = state.setupContext
          const preset = state.presets.find((entry) => entry.id === presetId)
          if (!preset || preset.context !== setupContext) {
            return state
          }

          const config = cloneSetupState(preset.config)
          const contextConfigs = state.contextConfigs ?? createDefaultContextConfigs()
          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext()),
            [setupContext]: "workspace" as ProcessorPresetViewMode
          }

          return {
            ...config,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: config
            },
            recentPresetIds: {
              ...state.recentPresetIds,
              [setupContext]: preset.id
            },
            activePresetIds: {
              ...state.activePresetIds,
              [setupContext]: preset.id
            },
            presetViewByContext: nextPresetViewByContext
          }
        }),
      ensureDefaultPresetForContext: (context) => {
        let ensuredPresetId: string | null = null

        set((state) => {
          const scopedPresets = state.presets.filter((preset) => preset.context === context)
          if (scopedPresets.length > 0) {
            ensuredPresetId = getRecentPresetIdForContext(context, state.recentPresetIds, state.presets)
            if (state.defaultPresetBootstrappedByContext[context]) {
              return state
            }

            return {
              defaultPresetBootstrappedByContext: {
                ...state.defaultPresetBootstrappedByContext,
                [context]: true
              }
            }
          }

          if (state.defaultPresetBootstrappedByContext[context]) {
            return state
          }

          const timestamp = Date.now()
          const presetId = `preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`
          ensuredPresetId = presetId
          const defaultConfig = cloneContextConfig(state, context)

          const nextPreset: SavedSetupPreset = {
            id: presetId,
            context,
            name: "Default Preset",
            highlightColor: DEFAULT_PRESET_HIGHLIGHT_COLOR,
            config: defaultConfig,
            createdAt: timestamp,
            updatedAt: timestamp
          }

          return {
            presets: [nextPreset, ...state.presets],
            recentPresetIds: {
              ...state.recentPresetIds,
              [context]: presetId
            },
            defaultPresetBootstrappedByContext: {
              ...state.defaultPresetBootstrappedByContext,
              [context]: true
            }
          }
        })

        return ensuredPresetId
      },
      syncActivePresetConfig: (context) =>
        set((state) => {
          const activePresetId = state.activePresetIds[context]
          if (!activePresetId) {
            return state
          }

          const currentConfig = cloneContextConfig(state, context)
          let didUpdate = false

          const nextPresets = state.presets.map((preset) => {
            if (preset.id !== activePresetId || preset.context !== context) {
              return preset
            }

            if (isSetupConfigEqual(preset.config, currentConfig)) {
              return preset
            }

            didUpdate = true
            return {
              ...preset,
              config: currentConfig,
              updatedAt: Date.now()
            }
          })

          if (!didUpdate) {
            return state
          }

          return {
            presets: nextPresets,
            recentPresetIds: {
              ...state.recentPresetIds,
              [context]: activePresetId
            }
          }
        }),
      updatePresetMeta: ({ id, name, highlightColor }) =>
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  name: name.trim() || "Untitled preset",
                  highlightColor,
                  updatedAt: Date.now()
                }
              : preset
          )
        })),
      deletePreset: (presetId) =>
        set((state) => {
          const nextPresets = state.presets.filter((preset) => preset.id !== presetId)
          const nextRecentPresetIds = {
            ...state.recentPresetIds
          }
          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext())
          }
          const nextActivePresetIds = {
            ...state.activePresetIds
          }
          const contextConfigs = state.contextConfigs ?? createDefaultContextConfigs()
          let nextContextConfigs = contextConfigs
          let activeConfigPatch: BatchSetupState | null = null

          ;(["single", "batch"] as SetupContext[]).forEach((context) => {
            const recentId = state.recentPresetIds[context]
            if (recentId === presetId) {
              const fallbackId = getRecentPresetIdForContext(context, nextRecentPresetIds, nextPresets)

              if (fallbackId) {
                nextRecentPresetIds[context] = fallbackId
              } else {
                delete nextRecentPresetIds[context]
              }
            }

            if (nextActivePresetIds[context] === presetId) {
              const fallbackId = getRecentPresetIdForContext(context, nextRecentPresetIds, nextPresets)

              if (fallbackId) {
                nextActivePresetIds[context] = fallbackId

                const fallbackPreset = nextPresets.find(
                  (preset) => preset.id === fallbackId && preset.context === context
                )
                if (fallbackPreset) {
                  const fallbackConfig = cloneSetupState(fallbackPreset.config)
                  nextContextConfigs = {
                    ...nextContextConfigs,
                    [context]: fallbackConfig
                  }

                  if (context === state.setupContext) {
                    activeConfigPatch = fallbackConfig
                  }
                }
              } else {
                delete nextActivePresetIds[context]
                nextPresetViewByContext[context] = "select"
              }
            }
          })

          return {
            ...(activeConfigPatch ? activeConfigPatch : {}),
            presets: nextPresets,
            recentPresetIds: nextRecentPresetIds,
            activePresetIds: nextActivePresetIds,
            presetViewByContext: nextPresetViewByContext,
            contextConfigs: nextContextConfigs
          }
        })
    }),
    {
      name: "imify-batch-setup",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => {
        // Only persist the non-runtime state
        const { isRunning, heavyFormatToast, isTargetFormatQualityOpen, isResizeOpen, ...rest } = state
        const presets = state.presets.map((preset) => ({
          ...preset,
          config: cloneSetupState(preset.config)
        }))

        const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
        const normalizedContextConfigs = {
          single: cloneSetupState(contextConfigs.single),
          batch: cloneSetupState(contextConfigs.batch)
        }
        const presetViewByContext = state.presetViewByContext ?? createDefaultPresetViewByContext()
        const normalizedPresetViewByContext = {
          single: presetViewByContext.single === "workspace" ? "workspace" : "select",
          batch: presetViewByContext.batch === "workspace" ? "workspace" : "select"
        } as Record<SetupContext, ProcessorPresetViewMode>

        const activePresetIds = {
          ...state.activePresetIds
        }
        const defaultPresetBootstrappedByContext = {
          ...(state.defaultPresetBootstrappedByContext ?? createDefaultPresetBootstrapState())
        }
        const hasSinglePreset = presets.some((preset) => preset.context === "single")
        const hasBatchPreset = presets.some((preset) => preset.context === "batch")

        if (hasSinglePreset) {
          defaultPresetBootstrappedByContext.single = true
        }

        if (hasBatchPreset) {
          defaultPresetBootstrappedByContext.batch = true
        }

        ;(["single", "batch"] as SetupContext[]).forEach((context) => {
          const activePresetId = activePresetIds[context]
          if (!activePresetId || !presets.some((preset) => preset.id === activePresetId && preset.context === context)) {
            delete activePresetIds[context]
            if (normalizedPresetViewByContext[context] === "workspace") {
              normalizedPresetViewByContext[context] = "select"
            }
          }
        })

        return {
          ...rest,
          ...cloneSetupState(rest as unknown as BatchSetupState),
          contextConfigs: normalizedContextConfigs,
          presets,
          activePresetIds,
          defaultPresetBootstrappedByContext,
          presetViewByContext: normalizedPresetViewByContext
        }
      },
      onRehydrateStorage: (state) => {
        return () => {
          // Migration: ensure all contextConfigs have formatOptions
          const migrateContextConfigs = (configs: Record<SetupContext, BatchSetupState>) => {
            return {
              single: cloneSetupState(configs.single),
              batch: cloneSetupState(configs.batch)
            }
          }

          useBatchStore.setState((state) => {
            const setupContext = state.setupContext ?? "single"
            const contextConfigs = state.contextConfigs
            const presets = state.presets.map((preset) => ({
              ...preset,
              config: cloneSetupState(preset.config)
            }))
            const presetViewByContext = {
              ...(state.presetViewByContext ?? createDefaultPresetViewByContext())
            }
            const defaultPresetBootstrappedByContext = {
              ...(state.defaultPresetBootstrappedByContext ?? createDefaultPresetBootstrapState())
            }
            const hasSinglePreset = presets.some((preset) => preset.context === "single")
            const hasBatchPreset = presets.some((preset) => preset.context === "batch")

            if (hasSinglePreset) {
              defaultPresetBootstrappedByContext.single = true
            }

            if (hasBatchPreset) {
              defaultPresetBootstrappedByContext.batch = true
            }
            const activePresetIds = {
              ...state.activePresetIds
            }

            ;(["single", "batch"] as SetupContext[]).forEach((context) => {
              const activePresetId = activePresetIds[context]
              if (!activePresetId || !presets.some((preset) => preset.id === activePresetId && preset.context === context)) {
                delete activePresetIds[context]
              }

              if (presetViewByContext[context] === "workspace" && !activePresetIds[context]) {
                const fallbackId = getRecentPresetIdForContext(context, state.recentPresetIds, presets)
                if (fallbackId) {
                  activePresetIds[context] = fallbackId
                } else {
                  presetViewByContext[context] = "select"
                }
              }
            })

            if (contextConfigs?.single && contextConfigs?.batch) {
              const migratedContextConfigs = migrateContextConfigs(contextConfigs)
              const activePresetId = activePresetIds[setupContext]
              const activePreset = activePresetId
                ? presets.find((preset) => preset.id === activePresetId && preset.context === setupContext)
                : null
              const activeConfig = activePreset
                ? cloneSetupState(activePreset.config)
                : cloneSetupState(migratedContextConfigs[setupContext])

              const nextContextConfigs = {
                ...migratedContextConfigs,
                [setupContext]: activeConfig
              }

              return {
                ...activeConfig,
                contextConfigs: nextContextConfigs,
                presets,
                activePresetIds,
                defaultPresetBootstrappedByContext,
                presetViewByContext,
                _hasHydrated: true
              } as any
            }

            const normalizedRootConfig = cloneSetupState(state as unknown as BatchSetupState)

            return {
              ...normalizedRootConfig,
              presets,
              activePresetIds,
              defaultPresetBootstrappedByContext,
              presetViewByContext,
              _hasHydrated: true
            } as any
          })
        }
      }
    }
  )
)
