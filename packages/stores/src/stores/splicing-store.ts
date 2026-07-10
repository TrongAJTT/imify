import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type { FormatCodecOptions } from "@imify/core/types"
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats"
import type {
  SplicingAlignment,
  SplicingCanvasStyle,
  SplicingDirection,
  SplicingExportFormat,
  SplicingExportMode,
  SplicingImageAppearanceDirection,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig,
  SplicingPreset
} from "@imify/features/splicing/types"
import { useBatchStore, type SavedSetupPreset } from "./batch-store"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "@imify/features/processor/preset-utils"

export const PREVIEW_QUALITY_PERCENTS = [20, 30, 50, 75, 100] as const

export function normalizePreviewQualityPercent(value: number): number {
  const allowed = PREVIEW_QUALITY_PERCENTS as readonly number[]
  if (allowed.includes(value)) return value
  let best = allowed[0]
  let bestDist = Math.abs(value - best)
  for (const option of allowed) {
    const dist = Math.abs(value - option)
    if (dist < bestDist) {
      best = option
      bestDist = dist
    }
  }
  return best
}

export interface SplicingExportSettings {
  targetFormat: SplicingExportFormat
  quality: number
  codecOptions: FormatCodecOptions
  exportMode: SplicingExportMode
  trimBackground: boolean
  concurrency: number
  fileNamePattern: string
}

export interface SplicingLayoutState {
  preset: SplicingPreset
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  flowSplitOverflow: boolean
  alignment: SplicingAlignment
  imageAppearanceDirection: SplicingImageAppearanceDirection
}

export interface SplicingCanvasState {
  padding: number
  mainSpacing: number
  crossSpacing: number
  borderRadius: number
  borderWidth: number
  borderColor: string
  backgroundColor: string
}

export interface SplicingImageState {
  resizeMode: SplicingImageResize
  fitValue: number
  padding: number
  paddingColor: string
  borderRadius: number
  borderWidth: number
  borderColor: string
}

export interface SplicingStoreState {
  layout: SplicingLayoutState
  canvas: SplicingCanvasState
  image: SplicingImageState
  exportSettings: SplicingExportSettings
  
  resizeQuickStats: ResizeQuickStats

  /** Preview panel height (px) in Image Splicing tab */
  previewContainerHeight: number
  /** Canvas preview zoom percent (minimum 50; not persisted—resets when options page reloads) */
  previewZoom: number
  /** Downscale quality for preview rendering (% of original size) */
  previewQualityPercent: number
  /** Show image order number overlay on preview canvas */
  previewShowImageNumber: boolean

  /**
   * Latest Bento preview group count from layout (`layout.groups.length`): columns for
   * vertical/fixed-vertical, rows for horizontal/fixed-horizontal. Session-only; not persisted.
   */
  previewBentoFlowGroupCount: number | null

  activePresetId: string | null

  setLayout: (patch: Partial<SplicingLayoutState>) => void
  setCanvas: (patch: Partial<SplicingCanvasState>) => void
  setImage: (patch: Partial<SplicingImageState>) => void
  setExportSettings: (patch: Partial<SplicingExportSettings>) => void
  
  setResizeQuickStats: (v: ResizeQuickStats) => void
  setPreviewContainerHeight: (v: number) => void
  setPreviewZoom: (v: number) => void
  setPreviewQualityPercent: (v: number) => void
  setPreviewShowImageNumber: (v: boolean) => void
  setPreviewBentoFlowGroupCount: (v: number | null) => void
  
  /** Accordion open/close state for Image Resize */
  isImageResizeOpen: boolean
  setIsImageResizeOpen: (v: boolean) => void
  /** Accordion open/close state for Export Format & Quality */
  isExportFormatQualityOpen: boolean
  setIsExportFormatQualityOpen: (v: boolean) => void

  applyPreset: (preset: SavedSetupPreset) => void
  resetToDefault: () => void
}

export const DEFAULT_SPLICING_EXPORT_SETTINGS: SplicingExportSettings = {
  targetFormat: "png",
  quality: 92,
  codecOptions: {
    bmp: { colorDepth: 24, dithering: false, ditheringLevel: 0 },
    jxl: { effort: 7, lossless: false, progressive: false, epf: 1 },
    webp: { lossless: false, nearLossless: 100, effort: 5, sharpYuv: false, preserveExactAlpha: false },
    avif: { speed: 6, qualityAlpha: undefined, lossless: false, subsample: 1, tune: "auto", highAlphaQuality: false },
    mozjpeg: { enabled: true, progressive: true, chromaSubsampling: 2 },
    png: { tinyMode: false, cleanTransparentPixels: false, autoGrayscale: false, dithering: false, ditheringLevel: 0, progressiveInterlaced: false, oxipngCompression: false },
    tiff: { colorMode: "color" }
  },
  exportMode: "single",
  trimBackground: false,
  concurrency: 2,
  fileNamePattern: "spliced-[Index]"
}

export const useSplicingStore = create<SplicingStoreState>()(
  persist(
    (set) => ({
      layout: {
        preset: "stitch_vertical",
        primaryDirection: "vertical",
        secondaryDirection: "vertical",
        gridCount: 2,
        flowMaxSize: 2000,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: "top_to_bottom",
      },

      canvas: {
        padding: 0,
        mainSpacing: 0,
        crossSpacing: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "#000000",
        backgroundColor: "#ffffff",
      },

      image: {
        resizeMode: "original",
        fitValue: 800,
        padding: 0,
        paddingColor: "#ffffff",
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "#000000",
      },

      exportSettings: DEFAULT_SPLICING_EXPORT_SETTINGS,
      
      resizeQuickStats: {
        width: null,
        height: null
      },

      previewContainerHeight: 400,
      previewZoom: 100,
      previewQualityPercent: 20,
      previewShowImageNumber: false,
      previewBentoFlowGroupCount: null,
      isImageResizeOpen: true,
      isExportFormatQualityOpen: true,
      activePresetId: null,

      setLayout: (patch) => set((state) => ({ layout: { ...state.layout, ...patch } })),
      setCanvas: (patch) => set((state) => ({ canvas: { ...state.canvas, ...patch } })),
      setImage: (patch) => set((state) => ({ image: { ...state.image, ...patch } })),
      
      setExportSettings: (patch) => set((state) => ({
        exportSettings: {
          ...state.exportSettings,
          ...patch
        }
      })),

      setResizeQuickStats: (v) => set({ resizeQuickStats: v }),
      setPreviewContainerHeight: (v) => set({ previewContainerHeight: v }),
      setPreviewZoom: (v) => set({ previewZoom: v }),
      setPreviewQualityPercent: (v) => set({ previewQualityPercent: normalizePreviewQualityPercent(v) }),
      setPreviewShowImageNumber: (v) => set({ previewShowImageNumber: v }),
      setPreviewBentoFlowGroupCount: (v) => set({ previewBentoFlowGroupCount: v }),
      setIsImageResizeOpen: (v) => set({ isImageResizeOpen: v }),
      setIsExportFormatQualityOpen: (v) => set({ isExportFormatQualityOpen: v }),

      applyPreset: (preset) => {
        const { targetFormat, quality, formatOptions, fileNamePattern } = preset.config
        const supportedFormats: SplicingExportFormat[] = ["png", "webp", "avif", "jxl", "jpg", "bmp", "tiff", "mozjpeg"]
        
        let mappedFormat: SplicingExportFormat = "png"
        if (supportedFormats.includes(targetFormat as any)) {
          mappedFormat = targetFormat as SplicingExportFormat
        } else if (targetFormat === "ico") {
          mappedFormat = "png"
        }

        const isIdentified = preset.id.startsWith("preset_splicing_")

        set((state) => ({
          activePresetId: (preset.id === VIRTUAL_DEFAULT_PNG_PRESET.id || isIdentified) ? null : preset.id,
          exportSettings: {
            ...state.exportSettings,
            targetFormat: mappedFormat,
            quality,
            fileNamePattern: fileNamePattern || "spliced-[Index]",
            codecOptions: formatOptions as any
          }
        }))

        // Sync global batch store to keep the Output Settings dialog in sync
        const batchStore = useBatchStore.getState()
        batchStore.setTargetFormat(targetFormat as any)
        batchStore.setQuality(quality)
        if (fileNamePattern) {
          batchStore.setFileNamePattern(fileNamePattern)
        }
      },

      resetToDefault: () => {
        const defaultConfig = VIRTUAL_DEFAULT_PNG_PRESET.config
        
        set((state) => ({
          activePresetId: null,
          exportSettings: {
            ...state.exportSettings,
            targetFormat: defaultConfig.targetFormat as SplicingExportFormat,
            quality: defaultConfig.quality,
            fileNamePattern: defaultConfig.fileNamePattern || "spliced-[Index]",
            codecOptions: defaultConfig.formatOptions as any
          }
        }))

        const batchStore = useBatchStore.getState()
        batchStore.setTargetFormat(defaultConfig.targetFormat as any)
        batchStore.setQuality(defaultConfig.quality)
        if (defaultConfig.fileNamePattern) {
          batchStore.setFileNamePattern(defaultConfig.fileNamePattern)
        }
      }
    }),
    {
      name: "imify_splicing_v3",
      storage: createJSONStorage(() => deferredStorage),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<SplicingStoreState>
        return { ...currentState, ...p }
      },
      partialize: (state) => {
        const { 
          setLayout, setCanvas, setImage,
          setExportSettings,
          setResizeQuickStats,
          setPreviewContainerHeight, setPreviewZoom, setPreviewQualityPercent, setPreviewShowImageNumber,
          setPreviewBentoFlowGroupCount,
          previewZoom,
          previewBentoFlowGroupCount,
          applyPreset,
          resetToDefault,
          activePresetId,
          ...persisted 
        } = state
        return persisted
      }
    }
  )
)

export function resolveLayoutConfig(state: SplicingStoreState): SplicingLayoutConfig {
  const { layout } = state
  switch (layout.preset) {
    case "stitch_vertical":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "vertical",
        gridCount: 1,
        flowMaxSize: 999999,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
    case "stitch_horizontal":
      return {
        primaryDirection: "horizontal",
        secondaryDirection: "horizontal",
        gridCount: 1,
        flowMaxSize: 999999,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
    case "grid":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "horizontal",
        gridCount: layout.gridCount,
        flowMaxSize: layout.flowMaxSize,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
    case "bento":
      return {
        primaryDirection: layout.primaryDirection,
        secondaryDirection: layout.secondaryDirection,
        gridCount: layout.gridCount,
        flowMaxSize: layout.flowMaxSize,
        flowSplitOverflow: layout.flowSplitOverflow,
        alignment: layout.alignment,
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
  }
}

export function resolveCanvasStyle(state: SplicingStoreState): SplicingCanvasStyle {
  return state.canvas
}

export function resolveImageStyle(state: SplicingStoreState): SplicingImageStyle {
  const { image } = state
  return {
    padding: image.padding,
    paddingColor: image.paddingColor,
    borderRadius: image.borderRadius,
    borderWidth: image.borderWidth,
    borderColor: image.borderColor
  }
}
