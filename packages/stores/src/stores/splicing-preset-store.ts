import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type {
  SplicingPreset,
  SplicingDirection,
  SplicingAlignment,
  SplicingImageAppearanceDirection,
  SplicingImageResize,
  SplicingExportFormat,
  SplicingExportMode
} from "@imify/features/splicing/types"
import type { TiffColorMode, BmpColorDepth } from "@imify/core/types"



export type SplicingPresetViewMode = "select" | "workspace"

export interface SplicingPresetConfig {
  preset: SplicingPreset
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  flowSplitOverflow: boolean
  alignment: SplicingAlignment
  imageAppearanceDirection: SplicingImageAppearanceDirection
  canvasPadding: number
  mainSpacing: number
  crossSpacing: number
  canvasBorderRadius: number
  canvasBorderWidth: number
  canvasBorderColor: string
  backgroundColor: string
  imageResize: SplicingImageResize
  imageFitValue: number
  imagePadding: number
  imagePaddingColor: string
  imageBorderRadius: number
  imageBorderWidth: number
  imageBorderColor: string
  exportFormat: SplicingExportFormat
  exportQuality: number
  exportJxlEffort: number
  exportJxlLossless: boolean
  exportJxlProgressive: boolean
  exportJxlEpf: 0 | 1 | 2 | 3
  exportWebpLossless: boolean
  exportWebpNearLossless: number
  exportWebpEffort: number
  exportWebpSharpYuv: boolean
  exportWebpPreserveExactAlpha: boolean
  exportAvifSpeed: number
  exportAvifQualityAlpha?: number
  exportAvifLossless: boolean
  exportAvifSubsample: 1 | 2 | 3
  exportAvifTune: "auto" | "ssim" | "psnr"
  exportAvifHighAlphaQuality: boolean
  exportMozJpegProgressive: boolean
  exportMozJpegChromaSubsampling: 0 | 1 | 2
  exportPngTinyMode: boolean
  exportPngCleanTransparentPixels: boolean
  exportPngAutoGrayscale: boolean
  exportPngDithering: boolean
  exportPngDitheringLevel: number
  exportPngProgressiveInterlaced: boolean
  exportPngOxiPngCompression: boolean
  exportBmpColorDepth: BmpColorDepth
  exportBmpDithering: boolean
  exportBmpDitheringLevel: number
  exportTiffColorMode: TiffColorMode
  exportMode: SplicingExportMode
  exportTrimBackground: boolean
  exportConcurrency: number
  exportFileNamePattern: string
  previewQualityPercent: number
  previewShowImageNumber: boolean
}

export interface SavedSplicingPreset {
  id: string
  name: string
  highlightColor: string
  config: SplicingPresetConfig
  createdAt: number
  updatedAt: number
}

interface SplicingPresetStoreState {
  presets: SavedSplicingPreset[]
  activePresetId: string | null
  presetViewMode: SplicingPresetViewMode
  defaultPresetBootstrapped: boolean
  recentPresetId: string | null

  saveCurrentPreset: (payload: { name: string; highlightColor: string; config: SplicingPresetConfig }) => string
  applyPreset: (presetId: string) => void
  ensureDefaultPreset: () => string | null
  setPresetViewMode: (mode: SplicingPresetViewMode) => void
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  deletePreset: (presetId: string) => void
  syncActivePresetConfig: (config: SplicingPresetConfig) => void
}

const PRESET_HIGHLIGHT_COLORS = ["rgb(59, 130, 246)", "rgb(34, 197, 94)", "rgb(249, 115, 22)", "rgb(168, 85, 247)"]

function createDefaultConfig(): SplicingPresetConfig {
  return {
    preset: "stitch_vertical",
    primaryDirection: "vertical",
    secondaryDirection: "vertical",
    gridCount: 2,
    flowMaxSize: 2000,
    flowSplitOverflow: false,
    alignment: "start",
    imageAppearanceDirection: "top_to_bottom",
    canvasPadding: 0,
    mainSpacing: 0,
    crossSpacing: 0,
    canvasBorderRadius: 0,
    canvasBorderWidth: 0,
    canvasBorderColor: "#000000",
    backgroundColor: "#ffffff",
    imageResize: "original",
    imageFitValue: 800,
    imagePadding: 0,
    imagePaddingColor: "#ffffff",
    imageBorderRadius: 0,
    imageBorderWidth: 0,
    imageBorderColor: "#000000",
    exportFormat: "png",
    exportQuality: 92,
    exportJxlEffort: 7,
    exportJxlLossless: false,
    exportJxlProgressive: false,
    exportJxlEpf: 1,
    exportWebpLossless: false,
    exportWebpNearLossless: 100,
    exportWebpEffort: 5,
    exportWebpSharpYuv: false,
    exportWebpPreserveExactAlpha: false,
    exportAvifSpeed: 6,
    exportAvifQualityAlpha: undefined,
    exportAvifLossless: false,
    exportAvifSubsample: 1,
    exportAvifTune: "auto",
    exportAvifHighAlphaQuality: false,
    exportMozJpegProgressive: true,
    exportMozJpegChromaSubsampling: 2,
    exportPngTinyMode: false,
    exportPngCleanTransparentPixels: false,
    exportPngAutoGrayscale: false,
    exportPngDithering: false,
    exportPngDitheringLevel: 0,
    exportPngProgressiveInterlaced: false,
    exportPngOxiPngCompression: false,
    exportBmpColorDepth: 24,
    exportBmpDithering: false,
    exportBmpDitheringLevel: 0,
    exportTiffColorMode: "color",
    exportMode: "single",
    exportTrimBackground: false,
    exportConcurrency: 2,
    exportFileNamePattern: "spliced-[Index]",
    previewQualityPercent: 20,
    previewShowImageNumber: false
  }
}

export const useSplicingPresetStore = create<SplicingPresetStoreState>()(
  persist(
    (set, get) => ({
      presets: [],
      activePresetId: null,
      presetViewMode: "select",
      defaultPresetBootstrapped: false,
      recentPresetId: null,

      setPresetViewMode: (mode) =>
        set((state) => {
          if (mode === "select") {
            return {
              presetViewMode: mode,
              activePresetId: null
            }
          }
          return { presetViewMode: mode }
        }),

      saveCurrentPreset: ({ name, highlightColor, config }) => {
        const timestamp = Date.now()
        const presetId = `splicing_preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

        set((state) => ({
          presets: [
            {
              id: presetId,
              name,
              highlightColor,
              config: { ...config },
              createdAt: timestamp,
              updatedAt: timestamp
            },
            ...state.presets
          ],
          recentPresetId: presetId,
          activePresetId: presetId,
          presetViewMode: "workspace"
        }))

        return presetId
      },

      applyPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId)
        if (!preset) return

        set({
          activePresetId: presetId,
          recentPresetId: presetId,
          presetViewMode: "workspace"
        })
      },

      ensureDefaultPreset: () => {
        const state = get()
        if (state.defaultPresetBootstrapped) return null
        if (state.presets.length > 0) {
          set({ defaultPresetBootstrapped: true })
          return null
        }

        const timestamp = Date.now()
        const presetId = "splicing_preset_default_blue"

        set((state) => ({
          presets: [
            {
              id: presetId,
              name: "Default Preset",
              highlightColor: PRESET_HIGHLIGHT_COLORS[0],
              config: createDefaultConfig(),
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ],
          activePresetId: presetId,
          recentPresetId: presetId,
          presetViewMode: "workspace",
          defaultPresetBootstrapped: true
        }))

        return presetId
      },

      updatePresetMeta: ({ id, name, highlightColor }) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name,
                  highlightColor,
                  updatedAt: Date.now()
                }
              : p
          )
        }))
      },

      deletePreset: (presetId) => {
        set((state) => {
          const nextPresets = state.presets.filter((p) => p.id !== presetId)
          const nextActivePresetId = state.activePresetId === presetId ? null : state.activePresetId
          const nextRecentPresetId = state.recentPresetId === presetId ? nextPresets[0]?.id ?? null : state.recentPresetId
          const nextPresetViewMode =
            nextActivePresetId === null ? ("select" as const) : state.presetViewMode

          return {
            presets: nextPresets,
            activePresetId: nextActivePresetId,
            recentPresetId: nextRecentPresetId,
            presetViewMode: nextPresetViewMode
          }
        })
      },

      syncActivePresetConfig: (config) => {
        set((state) => {
          const activeId = state.activePresetId
          if (!activeId) return {}

          return {
            presets: state.presets.map((p) =>
              p.id === activeId
                ? {
                    ...p,
                    config: { ...config },
                    updatedAt: Date.now()
                  }
                : p
            )
          }
        })
      }
    }),
    {
      name: "imify-splicing-preset",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => ({
        presets: state.presets,
        activePresetId: state.activePresetId,
        presetViewMode: state.presetViewMode === "workspace" ? "workspace" : "select",
        defaultPresetBootstrapped: state.defaultPresetBootstrapped,
        recentPresetId: state.recentPresetId
      })
    }
  )
)
