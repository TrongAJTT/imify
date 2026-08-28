import type {
  SplicingPreset,
  SplicingDirection,
  SplicingAlignment,
  SplicingImageAppearanceDirection,
  SplicingImageResize,
  SplicingExportMode,
  ResizeApplyTo,
  QuickExportFormat,
  SplicingCaptionMode,
  SplicingCaptionPosition,
  SplicingCaptionAlignment,
  SplicingCaptionOffsetLockMode,
  SplicingCaptionOffsetPaddingSource,
  SplicingCaptionConfig,
  PresetViewMode,
  SavedPreset,
} from "@imify/core"

import { DEFAULT_SPLICING_CAPTION_CONFIG } from "@imify/core"
import { createPresetStore, type PresetStoreState } from "../factories/create-preset-store"

export type SplicingPresetViewMode = PresetViewMode

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
  imageApplyTo: ResizeApplyTo
  imagePadding: number
  imagePaddingColor: string
  imageBorderRadius: number
  imageBorderWidth: number
  imageBorderColor: string
  exportFormat: QuickExportFormat
  exportMode: SplicingExportMode
  exportTrimBackground: boolean
  exportConcurrency: number
  exportFileNamePattern: string
  previewQualityPercent: number
  previewShowImageNumber: boolean
  caption?: SplicingCaptionConfig
  captionMode?: SplicingCaptionMode
  captionFontFamily?: string
  captionFontSize?: number
  captionTextColor?: string
  captionPaddingV?: number
  captionPaddingH?: number
  captionPaddingLinked?: boolean
  captionContainerColor?: string
  captionContainerOpacity?: number
  captionBorderRadius?: number
  captionPosition?: SplicingCaptionPosition
  captionAlignment?: SplicingCaptionAlignment
  captionOffsetX?: number
  captionOffsetY?: number
  captionOffsetLockMode?: SplicingCaptionOffsetLockMode
  captionOffsetFontSizeMultiplier?: number
  captionOffsetPaddingSource?: SplicingCaptionOffsetPaddingSource
  captionOffsetPaddingMultiplier?: number
  captionRotate180?: boolean
}

export type SavedSplicingPreset = SavedPreset<SplicingPresetConfig>
export type SplicingPresetStoreState = PresetStoreState<SplicingPresetConfig>

export function createDefaultSplicingPresetConfig(): SplicingPresetConfig {
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
    imageResize: "inherit",
    imageFitValue: 800,
    imageApplyTo: "width",
    imagePadding: 0,
    imagePaddingColor: "#ffffff",
    imageBorderRadius: 0,
    imageBorderWidth: 0,
    imageBorderColor: "#000000",
    exportFormat: "png",
    exportMode: "single",
    exportTrimBackground: false,
    exportConcurrency: 2,
    exportFileNamePattern: "spliced-[Index]",
    previewQualityPercent: 20,
    previewShowImageNumber: false,
    caption: { ...DEFAULT_SPLICING_CAPTION_CONFIG },
    captionMode: DEFAULT_SPLICING_CAPTION_CONFIG.mode,
    captionFontFamily: DEFAULT_SPLICING_CAPTION_CONFIG.fontFamily,
    captionFontSize: DEFAULT_SPLICING_CAPTION_CONFIG.fontSize,
    captionTextColor: DEFAULT_SPLICING_CAPTION_CONFIG.textColor,
    captionPaddingV: DEFAULT_SPLICING_CAPTION_CONFIG.paddingV,
    captionPaddingH: DEFAULT_SPLICING_CAPTION_CONFIG.paddingH,
    captionPaddingLinked: DEFAULT_SPLICING_CAPTION_CONFIG.paddingLinked,
    captionContainerColor: DEFAULT_SPLICING_CAPTION_CONFIG.containerColor,
    captionContainerOpacity: DEFAULT_SPLICING_CAPTION_CONFIG.containerOpacity,
    captionBorderRadius: DEFAULT_SPLICING_CAPTION_CONFIG.borderRadius,
    captionPosition: DEFAULT_SPLICING_CAPTION_CONFIG.position,
    captionAlignment: DEFAULT_SPLICING_CAPTION_CONFIG.alignment,
    captionOffsetX: DEFAULT_SPLICING_CAPTION_CONFIG.offsetX,
    captionOffsetY: DEFAULT_SPLICING_CAPTION_CONFIG.offsetY,
    captionOffsetLockMode: DEFAULT_SPLICING_CAPTION_CONFIG.offsetLockMode,
    captionOffsetFontSizeMultiplier: DEFAULT_SPLICING_CAPTION_CONFIG.offsetFontSizeMultiplier,
    captionOffsetPaddingSource: DEFAULT_SPLICING_CAPTION_CONFIG.offsetPaddingSource,
    captionOffsetPaddingMultiplier: DEFAULT_SPLICING_CAPTION_CONFIG.offsetPaddingMultiplier,
    captionRotate180: DEFAULT_SPLICING_CAPTION_CONFIG.rotate180,
  }
}

function normalizeSplicingPresetConfigOnHydrate(config: SplicingPresetConfig): SplicingPresetConfig {
  const nextConfig = { ...config }
  let mode = nextConfig.imageResize
  let applyTo = nextConfig.imageApplyTo ?? "width"

  if ((mode as any) === "original" || (mode as any) === "none") {
    mode = "inherit"
  } else if ((mode as any) === "fit_width") {
    mode = "fit_value"
    applyTo = "width"
  } else if ((mode as any) === "fit_height") {
    mode = "fit_value"
    applyTo = "height"
  }

  nextConfig.imageResize = mode
  nextConfig.imageApplyTo = applyTo
  return nextConfig
}

export const useSplicingPresetStore = createPresetStore<SplicingPresetConfig>({
  storageName: "imify-splicing-preset",
  idPrefix: "splicing_preset",
  defaultPresetId: "splicing_preset_default_blue",
  defaultPresetName: "Default Preset",
  defaultHighlightColor: "rgb(59, 130, 246)",
  defaultViewModeOnEnsure: "workspace",
  createDefaultConfig: createDefaultSplicingPresetConfig,
  cloneConfig: (config) => ({ ...config }),
  normalizeConfigOnHydrate: normalizeSplicingPresetConfigOnHydrate,
})
