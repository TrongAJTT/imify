import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import { normalizeResizeResamplingAlgorithm } from "@/core/resize-resampling"
import type { BmpColorDepth, PaperSize, SupportedDPI, TiffColorMode } from "@/core/types"
import type { BatchResizeMode, BatchSetupState, BatchTargetFormat, BatchWatermarkConfig } from "@/options/components/batch/types"
import { DEFAULT_BATCH_WATERMARK } from "@/options/components/batch/watermark"
import { watermarkStorage } from "@/core/indexed-db"

const storage = new Storage({
  area: "local"
})

// Custom storage for Zustand that uses Plasmo's Storage
const plasmoStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await storage.get(name)
    return value ? JSON.stringify(value) : null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await storage.set(name, JSON.parse(value))
  },
  removeItem: async (name: string): Promise<void> => {
    await storage.remove(name)
  }
}

export type SetupContext = "single" | "batch"

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
      effort: 7
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
  fileNamePattern: "[OriginalName]",
  watermark: DEFAULT_BATCH_WATERMARK
}

function cloneSetupState(state: BatchSetupState | undefined): BatchSetupState {
  if (!state) {
    // Fallback to default if state is undefined
    return cloneSetupState(DEFAULT_BATCH_STATE)
  }

  const formatOptions = state.formatOptions ?? DEFAULT_BATCH_STATE.formatOptions
  const rawBmpOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.bmp,
    ...formatOptions.bmp
  }
  const bmpColorDepth: BmpColorDepth =
    rawBmpOptions.colorDepth === 1 || rawBmpOptions.colorDepth === 8 || rawBmpOptions.colorDepth === 32
      ? rawBmpOptions.colorDepth
      : 24
  const bmpDitheringLevel =
    typeof rawBmpOptions.ditheringLevel === "number"
      ? Math.max(0, Math.min(100, Math.round(rawBmpOptions.ditheringLevel)))
      : rawBmpOptions.dithering
      ? 100
      : 0
  const bmpOptions = {
    colorDepth: bmpColorDepth,
    dithering: bmpColorDepth === 1 && bmpDitheringLevel > 0,
    ditheringLevel: bmpColorDepth === 1 ? bmpDitheringLevel : 0
  }
  const avifOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.avif,
    ...formatOptions.avif
  }
  const mozjpegOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.mozjpeg,
    ...formatOptions.mozjpeg
  }
  const jxlOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.jxl,
    ...formatOptions.jxl
  }
  const rawWebpOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.webp,
    ...formatOptions.webp
  }
  const webpOptions = {
    lossless: Boolean(rawWebpOptions.lossless),
    nearLossless:
      typeof rawWebpOptions.nearLossless === "number"
        ? Math.max(0, Math.min(100, Math.round(rawWebpOptions.nearLossless)))
        : 100,
    effort:
      typeof rawWebpOptions.effort === "number"
        ? Math.max(1, Math.min(9, Math.round(rawWebpOptions.effort)))
        : 5,
    sharpYuv: Boolean(rawWebpOptions.sharpYuv),
    preserveExactAlpha: Boolean(rawWebpOptions.preserveExactAlpha)
  }
  const rawPngOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.png,
    ...formatOptions.png
  }
  const normalizedPngDitheringLevel =
    typeof rawPngOptions.ditheringLevel === "number"
      ? Math.max(0, Math.min(100, Math.round(rawPngOptions.ditheringLevel)))
      : rawPngOptions.dithering
      ? 100
      : 0
  const pngOptions = {
    ...rawPngOptions,
    dithering: normalizedPngDitheringLevel > 0,
    ditheringLevel: normalizedPngDitheringLevel,
    progressiveInterlaced: Boolean(rawPngOptions.progressiveInterlaced)
  }
  const icoOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.ico,
    ...formatOptions.ico,
    sizes: [...(formatOptions.ico?.sizes ?? DEFAULT_BATCH_STATE.formatOptions.ico.sizes)],
    generateWebIconKit: Boolean(formatOptions.ico?.generateWebIconKit),
    optimizeInternalPngLayers: Boolean(formatOptions.ico?.optimizeInternalPngLayers)
  }
  const rawTiffOptions = {
    ...DEFAULT_BATCH_STATE.formatOptions.tiff,
    ...formatOptions.tiff
  }
  const tiffOptions: BatchSetupState["formatOptions"]["tiff"] = {
    colorMode: rawTiffOptions.colorMode === "grayscale" ? "grayscale" : "color"
  }

  return {
    ...state,
    formatOptions: {
      ...formatOptions,
      bmp: bmpOptions,
      avif: avifOptions,
      mozjpeg: {
        progressive: Boolean(mozjpegOptions.progressive),
        chromaSubsampling:
          mozjpegOptions.chromaSubsampling === 0 || mozjpegOptions.chromaSubsampling === 1
            ? mozjpegOptions.chromaSubsampling
            : 2
      },
      jxl: jxlOptions,
      webp: webpOptions,
      png: pngOptions,
      tiff: tiffOptions,
      ico: icoOptions
    },
    resizeResamplingAlgorithm: normalizeResizeResamplingAlgorithm(state.resizeResamplingAlgorithm),
    watermark: {
      ...state.watermark
    }
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
  setWatermark: (value: BatchWatermarkConfig) => void
  skipDownloadConfirm: boolean
  setSkipDownloadConfirm: (value: boolean) => void
  skipOomWarning: boolean
  setSkipOomWarning: (value: boolean) => void
  /** If true, do not show Image Splicing “high preview quality” warning */
  skipSplicingHeavyPreviewQualityWarning: boolean
  setSkipSplicingHeavyPreviewQualityWarning: (value: boolean) => void
  heavyFormatToast: { id: string; format: string } | null
  setHeavyFormatToast: (value: { id: string; format: string } | null) => void
  /** Accordion open/close state for Target Format & Quality - per context */
  isTargetFormatQualityOpen: boolean
  setIsTargetFormatQualityOpen: (value: boolean) => void
  /** Accordion open/close state for Resize - per context */
  isResizeOpen: boolean
  setIsResizeOpen: (value: boolean) => void
  saveCurrentPreset: (payload: { name: string; highlightColor: string }) => void
  applyPresetToCurrentContext: (presetId: string) => void
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  deletePreset: (presetId: string) => void
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

          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const sourceStateByContext = (state as any).sourceStateByContext ?? createDefaultSourceState()
          const uiStates = (state as any).uiStates ?? createDefaultUIState()

          const nextConfig = contextConfigs[context]
          const nextSourceState = sourceStateByContext[context]
          const nextUIState = uiStates[context]

          return {
            setupContext: context,
            ...cloneSetupState(nextConfig),
            resizeSourceWidth: nextSourceState.width,
            resizeSourceHeight: nextSourceState.height,
            resizeSyncVersion: nextSourceState.syncVersion,
            isTargetFormatQualityOpen: nextUIState.isTargetFormatQualityOpen,
            isResizeOpen: nextUIState.isResizeOpen,
            contextConfigs,
            sourceStateByContext,
            uiStates
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
      setJxlEffort: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            jxl: {
              ...currentConfig.formatOptions.jxl,
              effort: value
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
      setWebpLossless: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            webp: {
              ...currentConfig.formatOptions.webp,
              lossless: value
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
      setWebpNearLossless: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const normalizedValue = Math.max(0, Math.min(100, Math.round(value)))
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            webp: {
              ...currentConfig.formatOptions.webp,
              nearLossless: normalizedValue
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
      setWebpEffort: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const normalizedValue = Math.max(1, Math.min(9, Math.round(value)))
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            webp: {
              ...currentConfig.formatOptions.webp,
              effort: normalizedValue
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
      setWebpSharpYuv: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            webp: {
              ...currentConfig.formatOptions.webp,
              sharpYuv: value
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
      setWebpPreserveExactAlpha: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            webp: {
              ...currentConfig.formatOptions.webp,
              preserveExactAlpha: value
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
      setAvifSpeed: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            avif: {
              ...currentConfig.formatOptions.avif,
              speed: value
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
      setAvifQualityAlpha: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            avif: {
              ...currentConfig.formatOptions.avif,
              qualityAlpha: value
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
      setAvifLossless: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            avif: {
              ...currentConfig.formatOptions.avif,
              lossless: value
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
      setAvifSubsample: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            avif: {
              ...currentConfig.formatOptions.avif,
              subsample: value
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
      setAvifTune: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            avif: {
              ...currentConfig.formatOptions.avif,
              tune: value
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
      setAvifHighAlphaQuality: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            avif: {
              ...currentConfig.formatOptions.avif,
              highAlphaQuality: value
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
      setIcoSizes: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            ico: {
              ...currentConfig.formatOptions.ico,
              sizes: value
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
      setIcoGenerateWebIconKit: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            ico: {
              ...currentConfig.formatOptions.ico,
              generateWebIconKit: value
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
      setIcoOptimizeInternalPngLayers: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            ico: {
              ...currentConfig.formatOptions.ico,
              optimizeInternalPngLayers: value
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
      setPngTinyMode: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            png: {
              ...currentConfig.formatOptions.png,
              tinyMode: value
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
      setPngCleanTransparentPixels: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            png: {
              ...currentConfig.formatOptions.png,
              cleanTransparentPixels: value
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
      setPngAutoGrayscale: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            png: {
              ...currentConfig.formatOptions.png,
              autoGrayscale: value
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
      setPngDitheringLevel: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const normalizedValue = Math.max(0, Math.min(100, Math.round(value)))
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            png: {
              ...currentConfig.formatOptions.png,
              dithering: normalizedValue > 0,
              ditheringLevel: normalizedValue
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
      setPngProgressiveInterlaced: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            png: {
              ...currentConfig.formatOptions.png,
              progressiveInterlaced: value
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
      setPngOxiPngCompression: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            png: {
              ...currentConfig.formatOptions.png,
              oxipngCompression: value
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
      setBmpColorDepth: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const normalizedDepth: BmpColorDepth =
            value === 1 || value === 8 || value === 32 ? value : 24
          const currentDitheringLevel =
            typeof currentConfig.formatOptions.bmp.ditheringLevel === "number"
              ? Math.max(0, Math.min(100, Math.round(currentConfig.formatOptions.bmp.ditheringLevel)))
              : 0
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            bmp: {
              ...currentConfig.formatOptions.bmp,
              colorDepth: normalizedDepth,
              dithering: normalizedDepth === 1 && currentDitheringLevel > 0,
              ditheringLevel: normalizedDepth === 1 ? currentDitheringLevel : 0
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
      setBmpDitheringLevel: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const currentConfig = contextConfigs[setupContext]
          const normalizedValue = Math.max(0, Math.min(100, Math.round(value)))
          const colorDepth = currentConfig.formatOptions.bmp.colorDepth
          const nextFormatOptions = {
            ...currentConfig.formatOptions,
            bmp: {
              ...currentConfig.formatOptions.bmp,
              dithering: colorDepth === 1 && normalizedValue > 0,
              ditheringLevel: colorDepth === 1 ? normalizedValue : 0
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
      setWatermark: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            watermark: value
          }

          return {
            watermark: value,
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
          const uiStates = (state as any).uiStates ?? createDefaultUIState()
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
      saveCurrentPreset: ({ name, highlightColor }) =>
        set((state) => {
          const timestamp = Date.now()
          const setupContext = state.setupContext
          const currentConfig: BatchSetupState = {
            targetFormat: state.targetFormat,
            concurrency: state.concurrency,
            quality: state.quality,
            formatOptions: {
              bmp: {
                ...state.formatOptions.bmp
              },
              jxl: {
                ...state.formatOptions.jxl
              },
              webp: {
                ...state.formatOptions.webp
              },
              avif: {
                ...state.formatOptions.avif
              },
              mozjpeg: {
                ...state.formatOptions.mozjpeg
              },
              png: {
                ...state.formatOptions.png
              },
              tiff: {
                ...state.formatOptions.tiff
              },
              ico: {
                ...state.formatOptions.ico,
                sizes: [...state.formatOptions.ico.sizes]
              }
            },
            resizeMode: state.resizeMode,
            resizeValue: state.resizeValue,
            resizeWidth: state.resizeWidth,
            resizeHeight: state.resizeHeight,
            resizeAspectMode: state.resizeAspectMode,
            resizeAspectRatio: state.resizeAspectRatio,
            resizeAnchor: state.resizeAnchor,
            resizeFitMode: state.resizeFitMode,
            resizeContainBackground: state.resizeContainBackground,
            resizeResamplingAlgorithm: state.resizeResamplingAlgorithm,
            paperSize: state.paperSize,
            dpi: state.dpi,
            stripExif: state.stripExif,
            fileNamePattern: state.fileNamePattern,
            watermark: {
              ...state.watermark
            }
          }

          const presetId = `preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`
          const nextPreset: SavedSetupPreset = {
            id: presetId,
            context: setupContext,
            name: name.trim(),
            highlightColor,
            config: currentConfig,
            createdAt: timestamp,
            updatedAt: timestamp
          }

          return {
            presets: [nextPreset, ...state.presets],
            recentPresetIds: {
              ...state.recentPresetIds,
              [setupContext]: nextPreset.id
            }
          }
        }),
      applyPresetToCurrentContext: (presetId) =>
        set((state) => {
          const preset = state.presets.find((entry) => entry.id === presetId)
          if (!preset || preset.context !== state.setupContext) {
            return state
          }

          const config = cloneSetupState(preset.config)
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()

          return {
            ...config,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: config
            }
          }
        }),
      updatePresetMeta: ({ id, name, highlightColor }) =>
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  name: name.trim(),
                  highlightColor,
                  updatedAt: Date.now()
                }
              : preset
          )
        })),
      deletePreset: (presetId) =>
        set((state) => {
          const presetToRemove = state.presets.find(p => p.id === presetId)
          
          // Cleanup IndexedDB if this preset had a unique logo
          if (presetToRemove?.config.watermark.logoBlobId) {
            const logoId = presetToRemove.config.watermark.logoBlobId
            
            // Only delete if no other preset OR current context is using this logo
            const isLogoInUseByOtherPresets = state.presets.some(p => 
              p.id !== presetId && p.config.watermark.logoBlobId === logoId
            )
            const isLogoInUseByCurrentContexts = (["single", "batch"] as SetupContext[]).some(ctx => {
              const contextConfigs = (state as any).contextConfigs
              return contextConfigs?.[ctx]?.watermark?.logoBlobId === logoId
            })

            if (!isLogoInUseByOtherPresets && !isLogoInUseByCurrentContexts) {
              void watermarkStorage.remove(logoId)
            }
          }

          const nextPresets = state.presets.filter((preset) => preset.id !== presetId)
          const nextRecentPresetIds = {
            ...state.recentPresetIds
          }

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
          })

          return {
            presets: nextPresets,
            recentPresetIds: nextRecentPresetIds
          }
        })
    }),
    {
      name: "imify-batch-setup",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => {
        // Only persist the non-runtime state
        const { isRunning, heavyFormatToast, isTargetFormatQualityOpen, isResizeOpen, ...rest } = state

        // Deep clean watermark to remove logoDataUrl from permanent storage
        // IndexedDB handles the actual image data via logoBlobId
        const cleanContextConfig = (config: BatchSetupState): BatchSetupState => ({
          ...config,
          watermark: {
            ...config.watermark,
            logoDataUrl: undefined
          }
        })

        const presets = state.presets.map(p => ({
          ...p,
          config: cleanContextConfig(p.config)
        }))

        return {
          ...rest,
          ...cleanContextConfig(rest as unknown as BatchSetupState),
          presets
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
            const contextConfigs = (state as any).contextConfigs
            if (contextConfigs?.single && contextConfigs?.batch) {
              const migratedContextConfigs = migrateContextConfigs(contextConfigs)
              const activeConfig = cloneSetupState(migratedContextConfigs[setupContext])

              return {
                ...activeConfig,
                contextConfigs: migratedContextConfigs,
                _hasHydrated: true
              } as any
            }

            const normalizedRootConfig = cloneSetupState(state as unknown as BatchSetupState)

            return {
              ...normalizedRootConfig,
              _hasHydrated: true
            } as any
          })
        }
      }
    }
  )
)
