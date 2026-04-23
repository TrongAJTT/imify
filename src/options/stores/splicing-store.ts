// PLATFORM:extension — uses @plasmohq/storage for persistence. TODO(monorepo-phase2): replace with StorageAdapter.
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import {
  mergeNormalizedAvifNumericExportSource,
  mergeNormalizedPngExportSource,
  mergeNormalizedWebpExportSource
} from "@/core/codec-options"
import { mergeNormalizedJxlExportSource } from "@/core/jxl-options"
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
} from "@/features/splicing/types"
import type { BmpColorDepth, TiffColorMode } from "@/core/types"

const storage = new Storage({ area: "local" })

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

export interface SplicingStoreState {
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
  /** Pattern for exported filenames (no [OriginalName]; default spliced-[Index]) */
  exportFileNamePattern: string

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

  setPreset: (v: SplicingPreset) => void
  setPrimaryDirection: (v: SplicingDirection) => void
  setSecondaryDirection: (v: SplicingDirection) => void
  setGridCount: (v: number) => void
  setFlowMaxSize: (v: number) => void
  setFlowSplitOverflow: (v: boolean) => void
  setAlignment: (v: SplicingAlignment) => void
  setImageAppearanceDirection: (v: SplicingImageAppearanceDirection) => void
  setCanvasPadding: (v: number) => void
  setMainSpacing: (v: number) => void
  setCrossSpacing: (v: number) => void
  setCanvasBorderRadius: (v: number) => void
  setCanvasBorderWidth: (v: number) => void
  setCanvasBorderColor: (v: string) => void
  setBackgroundColor: (v: string) => void
  setImageResize: (v: SplicingImageResize) => void
  setImageFitValue: (v: number) => void
  setImagePadding: (v: number) => void
  setImagePaddingColor: (v: string) => void
  setImageBorderRadius: (v: number) => void
  setImageBorderWidth: (v: number) => void
  setImageBorderColor: (v: string) => void
  setExportFormat: (v: SplicingExportFormat) => void
  setExportQuality: (v: number) => void
  setExportJxlEffort: (v: number) => void
  setExportJxlLossless: (v: boolean) => void
  setExportJxlProgressive: (v: boolean) => void
  setExportJxlEpf: (v: 0 | 1 | 2 | 3) => void
  setExportWebpLossless: (v: boolean) => void
  setExportWebpNearLossless: (v: number) => void
  setExportWebpEffort: (v: number) => void
  setExportWebpSharpYuv: (v: boolean) => void
  setExportWebpPreserveExactAlpha: (v: boolean) => void
  setExportAvifSpeed: (v: number) => void
  setExportAvifQualityAlpha: (v: number) => void
  setExportAvifLossless: (v: boolean) => void
  setExportAvifSubsample: (v: 1 | 2 | 3) => void
  setExportAvifTune: (v: "auto" | "ssim" | "psnr") => void
  setExportAvifHighAlphaQuality: (v: boolean) => void
  setExportMozJpegProgressive: (v: boolean) => void
  setExportMozJpegChromaSubsampling: (v: 0 | 1 | 2) => void
  setExportPngTinyMode: (v: boolean) => void
  setExportPngCleanTransparentPixels: (v: boolean) => void
  setExportPngAutoGrayscale: (v: boolean) => void
  setExportPngDitheringLevel: (v: number) => void
  setExportPngProgressiveInterlaced: (v: boolean) => void
  setExportPngOxiPngCompression: (v: boolean) => void
  setExportBmpColorDepth: (v: BmpColorDepth) => void
  setExportBmpDitheringLevel: (v: number) => void
  setExportTiffColorMode: (v: TiffColorMode) => void
  setExportMode: (v: SplicingExportMode) => void
  setExportTrimBackground: (v: boolean) => void
  setExportConcurrency: (v: number) => void
  setExportFileNamePattern: (v: string) => void
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
}

type SplicingJxlExportState = Pick<
  SplicingStoreState,
  "exportJxlEffort" | "exportJxlLossless" | "exportJxlProgressive" | "exportJxlEpf"
>

function buildNormalizedSplicingJxlPatch(
  state: SplicingJxlExportState,
  patch: Partial<SplicingJxlExportState>
): SplicingJxlExportState {
  return mergeNormalizedJxlExportSource(state, patch)
}

type SplicingWebpExportState = Pick<
  SplicingStoreState,
  | "exportWebpLossless"
  | "exportWebpNearLossless"
  | "exportWebpEffort"
  | "exportWebpSharpYuv"
  | "exportWebpPreserveExactAlpha"
>

function buildNormalizedSplicingWebpPatch(
  state: SplicingWebpExportState,
  patch: Partial<SplicingWebpExportState>
): SplicingWebpExportState {
  return mergeNormalizedWebpExportSource(state, patch)
}

type SplicingAvifExportState = Pick<
  SplicingStoreState,
  | "exportAvifSpeed"
  | "exportAvifQualityAlpha"
  | "exportAvifLossless"
  | "exportAvifSubsample"
  | "exportAvifTune"
  | "exportAvifHighAlphaQuality"
>

function buildNormalizedSplicingAvifPatch(
  state: SplicingAvifExportState,
  patch: Partial<SplicingAvifExportState>
): SplicingAvifExportState {
  return mergeNormalizedAvifNumericExportSource(state, patch)
}

type SplicingPngExportState = Pick<
  SplicingStoreState,
  | "exportPngTinyMode"
  | "exportPngCleanTransparentPixels"
  | "exportPngAutoGrayscale"
  | "exportPngDithering"
  | "exportPngDitheringLevel"
  | "exportPngProgressiveInterlaced"
  | "exportPngOxiPngCompression"
>

function buildNormalizedSplicingPngPatch(
  state: SplicingPngExportState,
  patch: Partial<SplicingPngExportState>
): SplicingPngExportState {
  return mergeNormalizedPngExportSource(state, patch)
}

export const useSplicingStore = create<SplicingStoreState>()(
  persist(
    (set) => ({
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

      previewContainerHeight: 400,
      previewZoom: 100,
      previewQualityPercent: 20,
      previewShowImageNumber: false,
      previewBentoFlowGroupCount: null,
      isImageResizeOpen: false,
      isExportFormatQualityOpen: false,

      setPreset: (v) => set({ preset: v }),
      setPrimaryDirection: (v) => set({ primaryDirection: v }),
      setSecondaryDirection: (v) => set({ secondaryDirection: v }),
      setGridCount: (v) => set({ gridCount: v }),
      setFlowMaxSize: (v) => set({ flowMaxSize: v }),
      setFlowSplitOverflow: (v) => set({ flowSplitOverflow: v }),
      setAlignment: (v) => set({ alignment: v }),
      setImageAppearanceDirection: (v) => set({ imageAppearanceDirection: v }),
      setCanvasPadding: (v) => set({ canvasPadding: v }),
      setMainSpacing: (v) => set({ mainSpacing: v }),
      setCrossSpacing: (v) => set({ crossSpacing: v }),
      setCanvasBorderRadius: (v) => set({ canvasBorderRadius: v }),
      setCanvasBorderWidth: (v) => set({ canvasBorderWidth: v }),
      setCanvasBorderColor: (v) => set({ canvasBorderColor: v }),
      setBackgroundColor: (v) => set({ backgroundColor: v }),
      setImageResize: (v) => set({ imageResize: v }),
      setImageFitValue: (v) => set({ imageFitValue: v }),
      setImagePadding: (v) => set({ imagePadding: v }),
      setImagePaddingColor: (v) => set({ imagePaddingColor: v }),
      setImageBorderRadius: (v) => set({ imageBorderRadius: v }),
      setImageBorderWidth: (v) => set({ imageBorderWidth: v }),
      setImageBorderColor: (v) => set({ imageBorderColor: v }),
      setExportFormat: (v) => set({ exportFormat: v }),
      setExportQuality: (v) => set({ exportQuality: v }),
      setExportJxlEffort: (v) => set((state) => buildNormalizedSplicingJxlPatch(state, { exportJxlEffort: v })),
      setExportJxlLossless: (v) =>
        set((state) => buildNormalizedSplicingJxlPatch(state, { exportJxlLossless: v })),
      setExportJxlProgressive: (v) =>
        set((state) => buildNormalizedSplicingJxlPatch(state, { exportJxlProgressive: v })),
      setExportJxlEpf: (v) => set((state) => buildNormalizedSplicingJxlPatch(state, { exportJxlEpf: v })),
      setExportWebpLossless: (v) =>
        set((state) => buildNormalizedSplicingWebpPatch(state, { exportWebpLossless: v })),
      setExportWebpNearLossless: (v) =>
        set((state) => buildNormalizedSplicingWebpPatch(state, { exportWebpNearLossless: v })),
      setExportWebpEffort: (v) =>
        set((state) => buildNormalizedSplicingWebpPatch(state, { exportWebpEffort: v })),
      setExportWebpSharpYuv: (v) =>
        set((state) => buildNormalizedSplicingWebpPatch(state, { exportWebpSharpYuv: v })),
      setExportWebpPreserveExactAlpha: (v) =>
        set((state) => buildNormalizedSplicingWebpPatch(state, { exportWebpPreserveExactAlpha: v })),
      setExportAvifSpeed: (v) => set((state) => buildNormalizedSplicingAvifPatch(state, { exportAvifSpeed: v })),
      setExportAvifQualityAlpha: (v) =>
        set((state) => buildNormalizedSplicingAvifPatch(state, { exportAvifQualityAlpha: v })),
      setExportAvifLossless: (v) =>
        set((state) => buildNormalizedSplicingAvifPatch(state, { exportAvifLossless: v })),
      setExportAvifSubsample: (v) =>
        set((state) => buildNormalizedSplicingAvifPatch(state, { exportAvifSubsample: v })),
      setExportAvifTune: (v) => set((state) => buildNormalizedSplicingAvifPatch(state, { exportAvifTune: v })),
      setExportAvifHighAlphaQuality: (v) =>
        set((state) => buildNormalizedSplicingAvifPatch(state, { exportAvifHighAlphaQuality: v })),
      setExportMozJpegProgressive: (v) => set({ exportMozJpegProgressive: v }),
      setExportMozJpegChromaSubsampling: (v) =>
        set({
          exportMozJpegChromaSubsampling:
            v === 0 || v === 1
              ? v
              : 2
        }),
      setExportPngTinyMode: (v) =>
        set((state) => buildNormalizedSplicingPngPatch(state, { exportPngTinyMode: v })),
      setExportPngCleanTransparentPixels: (v) =>
        set((state) => buildNormalizedSplicingPngPatch(state, { exportPngCleanTransparentPixels: v })),
      setExportPngAutoGrayscale: (v) =>
        set((state) => buildNormalizedSplicingPngPatch(state, { exportPngAutoGrayscale: v })),
      setExportPngDitheringLevel: (v) =>
        set((state) => buildNormalizedSplicingPngPatch(state, { exportPngDitheringLevel: v })),
      setExportPngProgressiveInterlaced: (v) =>
        set((state) => buildNormalizedSplicingPngPatch(state, { exportPngProgressiveInterlaced: v })),
      setExportPngOxiPngCompression: (v) =>
        set((state) => buildNormalizedSplicingPngPatch(state, { exportPngOxiPngCompression: v })),
      setExportBmpColorDepth: (v) => {
        const normalizedDepth: BmpColorDepth = v === 1 || v === 8 || v === 32 ? v : 24
        set((state) => ({
          exportBmpColorDepth: normalizedDepth,
          exportBmpDithering: normalizedDepth === 1 && state.exportBmpDitheringLevel > 0,
          exportBmpDitheringLevel: normalizedDepth === 1 ? state.exportBmpDitheringLevel : 0
        }))
      },
      setExportBmpDitheringLevel: (v) => {
        const normalized = Math.max(0, Math.min(100, Math.round(v)))
        set((state) => ({
          exportBmpDitheringLevel: state.exportBmpColorDepth === 1 ? normalized : 0,
          exportBmpDithering: state.exportBmpColorDepth === 1 && normalized > 0
        }))
      },
      setExportTiffColorMode: (v) => set({ exportTiffColorMode: v }),
      setExportMode: (v) => set({ exportMode: v }),
      setExportTrimBackground: (v) => set({ exportTrimBackground: v }),
      setExportConcurrency: (v) => set({ exportConcurrency: v }),
      setExportFileNamePattern: (v: string) => set({ exportFileNamePattern: v }),
      setPreviewContainerHeight: (v) => set({ previewContainerHeight: v }),
      setPreviewZoom: (v) => set({ previewZoom: v }),
      setPreviewQualityPercent: (v) => set({ previewQualityPercent: normalizePreviewQualityPercent(v) }),
      setPreviewShowImageNumber: (v) => set({ previewShowImageNumber: v }),
      setPreviewBentoFlowGroupCount: (v) => set({ previewBentoFlowGroupCount: v }),
      setIsImageResizeOpen: (v) => set({ isImageResizeOpen: v }),
      setIsExportFormatQualityOpen: (v) => set({ isExportFormatQualityOpen: v })
    }),
    {
      name: "imify_splicing",
      storage: createJSONStorage(() => plasmoStorage),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<SplicingStoreState>
        const next: SplicingStoreState = { ...currentState, ...p }
        if (typeof next.exportPngDitheringLevel !== "number") {
          next.exportPngDitheringLevel = next.exportPngDithering ? 100 : 0
        }
        next.exportPngDitheringLevel = Math.max(0, Math.min(100, Math.round(next.exportPngDitheringLevel)))
        next.exportPngDithering = next.exportPngDitheringLevel > 0
        next.exportPngProgressiveInterlaced = Boolean(next.exportPngProgressiveInterlaced)
        next.exportBmpColorDepth =
          next.exportBmpColorDepth === 1 || next.exportBmpColorDepth === 8 || next.exportBmpColorDepth === 32
            ? next.exportBmpColorDepth
            : 24
        if (typeof next.exportBmpDitheringLevel !== "number") {
          next.exportBmpDitheringLevel = next.exportBmpDithering ? 100 : 0
        }
        next.exportBmpDitheringLevel = Math.max(0, Math.min(100, Math.round(next.exportBmpDitheringLevel)))
        if (next.exportBmpColorDepth !== 1) {
          next.exportBmpDitheringLevel = 0
        }
        next.exportBmpDithering = next.exportBmpColorDepth === 1 && next.exportBmpDitheringLevel > 0
        next.exportWebpLossless = Boolean(next.exportWebpLossless)
        next.exportJxlEffort =
          typeof next.exportJxlEffort === "number"
            ? Math.max(1, Math.min(9, Math.round(next.exportJxlEffort)))
            : 7
        next.exportJxlLossless = Boolean(next.exportJxlLossless)
        next.exportJxlProgressive = Boolean(next.exportJxlProgressive)
        next.exportJxlEpf =
          next.exportJxlEpf === 0 || next.exportJxlEpf === 1 || next.exportJxlEpf === 2 || next.exportJxlEpf === 3
            ? next.exportJxlEpf
            : 1
        next.exportWebpNearLossless =
          typeof next.exportWebpNearLossless === "number"
            ? Math.max(0, Math.min(100, Math.round(next.exportWebpNearLossless)))
            : 100
        next.exportWebpEffort =
          typeof next.exportWebpEffort === "number"
            ? Math.max(1, Math.min(9, Math.round(next.exportWebpEffort)))
            : 5
        next.exportWebpSharpYuv = Boolean(next.exportWebpSharpYuv)
        next.exportWebpPreserveExactAlpha = Boolean(next.exportWebpPreserveExactAlpha)
        next.exportMozJpegProgressive = Boolean(next.exportMozJpegProgressive)
        next.exportMozJpegChromaSubsampling =
          next.exportMozJpegChromaSubsampling === 0 || next.exportMozJpegChromaSubsampling === 1
            ? next.exportMozJpegChromaSubsampling
            : 2
        next.exportTiffColorMode =
          next.exportTiffColorMode === "grayscale" ? "grayscale" : "color"
        const rawPreset = (persistedState as { preset?: string }).preset
        if (rawPreset === "custom") {
          next.preset = "bento"
        }
        if (typeof next.previewQualityPercent === "number") {
          next.previewQualityPercent = normalizePreviewQualityPercent(next.previewQualityPercent)
        }
        // Preview zoom is session-only (not persisted).
        next.previewZoom = currentState.previewZoom
        next.previewBentoFlowGroupCount = currentState.previewBentoFlowGroupCount
        return next
      },
      partialize: (state) => {
        const { setPreset, setPrimaryDirection, setSecondaryDirection, setGridCount,
          setFlowMaxSize, setAlignment, setImageAppearanceDirection, setCanvasPadding, setMainSpacing, setCrossSpacing,
          setFlowSplitOverflow,
          setCanvasBorderRadius, setCanvasBorderWidth, setCanvasBorderColor, setBackgroundColor,
          setImageResize, setImageFitValue, setImagePadding, setImagePaddingColor,
          setImageBorderRadius, setImageBorderWidth, setImageBorderColor,
          setExportFormat, setExportQuality, setExportJxlEffort,
          setExportJxlLossless, setExportJxlProgressive, setExportJxlEpf,
          setExportWebpLossless, setExportWebpNearLossless, setExportWebpEffort,
          setExportWebpSharpYuv, setExportWebpPreserveExactAlpha,
          setExportAvifSpeed, setExportAvifQualityAlpha, setExportAvifLossless,
          setExportAvifSubsample, setExportAvifTune, setExportAvifHighAlphaQuality,
          setExportMozJpegProgressive, setExportMozJpegChromaSubsampling,
          setExportPngTinyMode, setExportPngCleanTransparentPixels, setExportPngAutoGrayscale,
          setExportPngDitheringLevel, setExportPngProgressiveInterlaced,
          setExportPngOxiPngCompression, setExportBmpColorDepth, setExportBmpDitheringLevel,
          setExportTiffColorMode, setExportMode,
          setExportTrimBackground, setExportConcurrency, setExportFileNamePattern,
          setPreviewContainerHeight, setPreviewZoom, setPreviewQualityPercent, setPreviewShowImageNumber,
          setPreviewBentoFlowGroupCount,
          previewZoom,
          previewBentoFlowGroupCount,
          ...persisted } = state
        return persisted
      }
    }
  )
)

export function resolveLayoutConfig(state: SplicingStoreState): SplicingLayoutConfig {
  switch (state.preset) {
    case "stitch_vertical":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "vertical",
        gridCount: 1,
        flowMaxSize: 999999,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
    case "stitch_horizontal":
      return {
        primaryDirection: "horizontal",
        secondaryDirection: "horizontal",
        gridCount: 1,
        flowMaxSize: 999999,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
    case "grid":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "horizontal",
        gridCount: state.gridCount,
        flowMaxSize: state.flowMaxSize,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
    case "bento":
      return {
        primaryDirection: state.primaryDirection,
        secondaryDirection: state.secondaryDirection,
        gridCount: state.gridCount,
        flowMaxSize: state.flowMaxSize,
        flowSplitOverflow: state.flowSplitOverflow,
        alignment: state.alignment,
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
  }
}

export function resolveCanvasStyle(state: SplicingStoreState): SplicingCanvasStyle {
  return {
    padding: state.canvasPadding,
    mainSpacing: state.mainSpacing,
    crossSpacing: state.crossSpacing,
    borderRadius: state.canvasBorderRadius,
    borderWidth: state.canvasBorderWidth,
    borderColor: state.canvasBorderColor,
    backgroundColor: state.backgroundColor
  }
}

export function resolveImageStyle(state: SplicingStoreState): SplicingImageStyle {
  return {
    padding: state.imagePadding,
    paddingColor: state.imagePaddingColor,
    borderRadius: state.imageBorderRadius,
    borderWidth: state.imageBorderWidth,
    borderColor: state.imageBorderColor
  }
}
