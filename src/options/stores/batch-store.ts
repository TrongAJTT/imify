import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import type { PaperSize, SupportedDPI } from "@/core/types"
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
  icoSizes: [...DEFAULT_ICO_SIZES],
  icoGenerateWebIconKit: false,
  resizeMode: "inherit",
  resizeValue: 1280,
  resizeWidth: 1280,
  resizeHeight: 960,
  resizeAspectMode: "original",
  resizeAspectRatio: "16:9",
  resizeAnchor: "width",
  resizeFitMode: "fill",
  resizeContainBackground: "#000000",
  paperSize: "A4",
  dpi: 300,
  stripExif: false,
  pngTinyMode: false,
  fileNamePattern: "[OriginalName]",
  watermark: DEFAULT_BATCH_WATERMARK
}

function cloneSetupState(state: BatchSetupState): BatchSetupState {
  return {
    ...state,
    icoSizes: [...state.icoSizes],
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
  setIcoSizes: (value: number[]) => void
  setIcoGenerateWebIconKit: (value: boolean) => void
  setResizeMode: (value: BatchResizeMode) => void
  setResizeValue: (value: number) => void
  setResizeWidth: (value: number) => void
  setResizeHeight: (value: number) => void
  setResizeAspectMode: (value: BatchSetupState["resizeAspectMode"]) => void
  setResizeAspectRatio: (value: string) => void
  setResizeAnchor: (value: BatchSetupState["resizeAnchor"]) => void
  setResizeFitMode: (value: BatchSetupState["resizeFitMode"]) => void
  setResizeContainBackground: (value: string) => void
  syncResizeToSource: (width: number, height: number) => void
  setPaperSize: (value: PaperSize) => void
  setDpi: (value: SupportedDPI) => void
  setStripExif: (value: boolean) => void
  setPngTinyMode: (value: boolean) => void
  setFileNamePattern: (value: string) => void
  setWatermark: (value: BatchWatermarkConfig) => void
  skipDownloadConfirm: boolean
  setSkipDownloadConfirm: (value: boolean) => void
  skipOomWarning: boolean
  setSkipOomWarning: (value: boolean) => void
  heavyFormatToast: { id: string; format: string } | null
  setHeavyFormatToast: (value: { id: string; format: string } | null) => void
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
      heavyFormatToast: null,
      setSetupContext: (context) =>
        set((state) => {
          if (state.setupContext === context) {
            return state
          }

          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const sourceStateByContext = (state as any).sourceStateByContext ?? createDefaultSourceState()

          const nextConfig = contextConfigs[context]
          const nextSourceState = sourceStateByContext[context]

          return {
            setupContext: context,
            ...cloneSetupState(nextConfig),
            resizeSourceWidth: nextSourceState.width,
            resizeSourceHeight: nextSourceState.height,
            resizeSyncVersion: nextSourceState.syncVersion,
            contextConfigs,
            sourceStateByContext
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
      setIcoSizes: (value) =>
        set((state) => {
          const setupContext = state.setupContext
          const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
          const nextConfig = {
            ...contextConfigs[setupContext],
            icoSizes: value
          }

          return {
            icoSizes: value,
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
          const nextConfig = {
            ...contextConfigs[setupContext],
            icoGenerateWebIconKit: value
          }

          return {
            icoGenerateWebIconKit: value,
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
          const nextConfig = {
            ...contextConfigs[setupContext],
            pngTinyMode: value
          }

          return {
            pngTinyMode: value,
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
      setSkipOomWarning: (value) => set({ skipOomWarning: value }),
      setHeavyFormatToast: (value) => set({ heavyFormatToast: value }),
      saveCurrentPreset: ({ name, highlightColor }) =>
        set((state) => {
          const timestamp = Date.now()
          const setupContext = state.setupContext
          const currentConfig: BatchSetupState = {
            targetFormat: state.targetFormat,
            concurrency: state.concurrency,
            quality: state.quality,
            icoSizes: [...state.icoSizes],
            icoGenerateWebIconKit: state.icoGenerateWebIconKit,
            resizeMode: state.resizeMode,
            resizeValue: state.resizeValue,
            resizeWidth: state.resizeWidth,
            resizeHeight: state.resizeHeight,
            resizeAspectMode: state.resizeAspectMode,
            resizeAspectRatio: state.resizeAspectRatio,
            resizeAnchor: state.resizeAnchor,
            resizeFitMode: state.resizeFitMode,
            resizeContainBackground: state.resizeContainBackground,
            paperSize: state.paperSize,
            dpi: state.dpi,
            stripExif: state.stripExif,
            pngTinyMode: state.pngTinyMode,
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
        const { isRunning, heavyFormatToast, ...rest } = state

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
          useBatchStore.setState({ _hasHydrated: true } as any)
        }
      }
    }
  )
)
