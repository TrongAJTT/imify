// PLATFORM:extension — uses @plasmohq/storage for persistence. TODO(monorepo-phase2): replace with StorageAdapter.
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import {
  mergeNormalizedAvifTextExportSource,
  mergeNormalizedPngExportSource,
  mergeNormalizedWebpExportSource
} from "@/core/codec-options"
import { mergeNormalizedJxlExportSource } from "@/core/jxl-options"
import type {
  PatternAsset,
  PatternAssetBorderSettings,
  PatternAssetMonochromeSettings,
  PatternAssetResizeSettings,
  PatternBoundarySettings,
  PatternCanvasSettings,
  PatternDistributionSettings,
  PatternExportFormat,
  PatternLayerBorderOverrideSettings,
  PatternLayerColorOverrideMode,
  PatternLayerColorOverrideSettings,
  PatternLayerCornerRadiusOverrideSettings,
  PatternSettings,
} from "@/features/pattern/types"
import {
  DEFAULT_PATTERN_ASSET_BORDER_SETTINGS,
  DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS,
  DEFAULT_PATTERN_ASSET_RESIZE_SETTINGS,
  DEFAULT_PATTERN_CANVAS_SETTINGS,
  DEFAULT_PATTERN_EXPORT_SETTINGS,
  DEFAULT_PATTERN_LAYER_BORDER_OVERRIDE_SETTINGS,
  DEFAULT_PATTERN_LAYER_COLOR_OVERRIDE_SETTINGS,
  DEFAULT_PATTERN_LAYER_CORNER_RADIUS_OVERRIDE_SETTINGS,
  DEFAULT_PATTERN_SETTINGS,
} from "@/features/pattern/types"
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
  },
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampNonNegative(value: number, fallback: number, max = 2000): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(max, value))
}

function clampPositiveDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return Math.round(value)
}

function normalizeDistributionSettings(
  distribution: PatternDistributionSettings
): PatternDistributionSettings {
  return {
    ...distribution,
    density: clamp(distribution.density, 0.2, 5),
    spacingX: clampPositiveDimension(distribution.spacingX, 160),
    spacingY: clampPositiveDimension(distribution.spacingY, 160),
    rowOffset: Number.isFinite(distribution.rowOffset) ? distribution.rowOffset : 80,
    jitterX: Math.max(0, Number.isFinite(distribution.jitterX) ? distribution.jitterX : 0),
    jitterY: Math.max(0, Number.isFinite(distribution.jitterY) ? distribution.jitterY : 0),
    baseScale: clamp(distribution.baseScale, 0.05, 8),
    scaleVariance: clamp(distribution.scaleVariance, 0, 0.95),
    randomRotationMin: Number.isFinite(distribution.randomRotationMin)
      ? distribution.randomRotationMin
      : -12,
    randomRotationMax: Number.isFinite(distribution.randomRotationMax)
      ? distribution.randomRotationMax
      : 12,
    randomSeed: Number.isFinite(distribution.randomSeed)
      ? Math.round(distribution.randomSeed)
      : 1337,
  }
}

function normalizeBoundarySettings(
  boundary: PatternBoundarySettings,
  canvas: PatternCanvasSettings
): PatternBoundarySettings {
  return {
    ...boundary,
    x: Number.isFinite(boundary.x) ? boundary.x : 0,
    y: Number.isFinite(boundary.y) ? boundary.y : 0,
    width: clampPositiveDimension(boundary.width, canvas.width),
    height: clampPositiveDimension(boundary.height, canvas.height),
    rotation: Number.isFinite(boundary.rotation) ? boundary.rotation : 0,
  }
}

function normalizeAssetResizeSettings(
  assetResize: PatternAssetResizeSettings | undefined
): PatternAssetResizeSettings {
  const source = assetResize ?? DEFAULT_PATTERN_ASSET_RESIZE_SETTINGS

  return {
    enabled: Boolean(source.enabled),
    width: clampPositiveDimension(source.width, DEFAULT_PATTERN_ASSET_RESIZE_SETTINGS.width),
    height: clampPositiveDimension(source.height, DEFAULT_PATTERN_ASSET_RESIZE_SETTINGS.height),
  }
}

function normalizeAssetMonochromeSettings(
  monochrome: PatternAssetMonochromeSettings | undefined
): PatternAssetMonochromeSettings {
  const source = monochrome ?? DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS

  return {
    enabled: Boolean(source.enabled),
    color: typeof source.color === "string" && source.color.trim().length > 0
      ? source.color
      : DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS.color,
  }
}

function normalizeAssetBorderSettings(
  border: PatternAssetBorderSettings | undefined
): PatternAssetBorderSettings {
  const source = border ?? DEFAULT_PATTERN_ASSET_BORDER_SETTINGS

  return {
    width: clampNonNegative(source.width, DEFAULT_PATTERN_ASSET_BORDER_SETTINGS.width, 512),
    color: typeof source.color === "string" && source.color.trim().length > 0
      ? source.color
      : DEFAULT_PATTERN_ASSET_BORDER_SETTINGS.color,
  }
}

function normalizeLayerColorOverrideSettings(
  settings: PatternLayerColorOverrideSettings | undefined
): PatternLayerColorOverrideSettings {
  const source = settings ?? DEFAULT_PATTERN_LAYER_COLOR_OVERRIDE_SETTINGS
  const mode: PatternLayerColorOverrideMode = source.mode === "unified" ? "unified" : "per-asset"

  return {
    enabled: Boolean(source.enabled),
    color: typeof source.color === "string" && source.color.trim().length > 0
      ? source.color
      : DEFAULT_PATTERN_LAYER_COLOR_OVERRIDE_SETTINGS.color,
    mode,
  }
}

function normalizeLayerBorderOverrideSettings(
  settings: PatternLayerBorderOverrideSettings | undefined
): PatternLayerBorderOverrideSettings {
  const source = settings ?? DEFAULT_PATTERN_LAYER_BORDER_OVERRIDE_SETTINGS

  return {
    enabled: Boolean(source.enabled),
    width: clampNonNegative(source.width, DEFAULT_PATTERN_LAYER_BORDER_OVERRIDE_SETTINGS.width, 512),
    color: typeof source.color === "string" && source.color.trim().length > 0
      ? source.color
      : DEFAULT_PATTERN_LAYER_BORDER_OVERRIDE_SETTINGS.color,
  }
}

function normalizeLayerCornerRadiusOverrideSettings(
  settings: PatternLayerCornerRadiusOverrideSettings | undefined
): PatternLayerCornerRadiusOverrideSettings {
  const source = settings ?? DEFAULT_PATTERN_LAYER_CORNER_RADIUS_OVERRIDE_SETTINGS

  return {
    enabled: Boolean(source.enabled),
    radius: clampNonNegative(source.radius, DEFAULT_PATTERN_LAYER_CORNER_RADIUS_OVERRIDE_SETTINGS.radius, 2048),
  }
}

function cloneSettings(settings: PatternSettings, canvas: PatternCanvasSettings): PatternSettings {
  return {
    distribution: normalizeDistributionSettings(settings.distribution),
    assetResize: normalizeAssetResizeSettings(settings.assetResize),
    layerColorOverride: normalizeLayerColorOverrideSettings(settings.layerColorOverride),
    layerBorderOverride: normalizeLayerBorderOverrideSettings(settings.layerBorderOverride),
    layerCornerRadiusOverride: normalizeLayerCornerRadiusOverrideSettings(settings.layerCornerRadiusOverride),
    inboundBoundary: normalizeBoundarySettings(settings.inboundBoundary, canvas),
    outboundBoundary: normalizeBoundarySettings(settings.outboundBoundary, canvas),
  }
}

export type PatternVisualBoundaryTarget = "inbound" | "outbound"

export interface PatternVisualBoundaryVisibility {
  inbound: boolean
  outbound: boolean
}

export interface PatternStoreState {
  canvas: PatternCanvasSettings
  settings: PatternSettings
  assets: PatternAsset[]
  visualBoundaryVisibility: PatternVisualBoundaryVisibility
  activeVisualBoundary: PatternVisualBoundaryTarget | null
  previewContainerHeight: number

  exportFormat: PatternExportFormat
  exportQuality: number
  exportJxlEffort: number
  exportJxlLossless: boolean
  exportJxlProgressive: boolean
  exportJxlEpf: 0 | 1 | 2 | 3
  exportAvifSpeed: number
  exportAvifQualityAlpha: number
  exportAvifLossless: boolean
  exportAvifSubsample: string
  exportAvifTune: string
  exportAvifHighAlphaQuality: boolean
  exportMozJpegProgressive: boolean
  exportMozJpegChromaSubsampling: string
  exportPngTinyMode: boolean
  exportPngCleanTransparentPixels: boolean
  exportPngAutoGrayscale: boolean
  exportPngDithering: boolean
  exportPngDitheringLevel: number
  exportPngProgressiveInterlaced: boolean
  exportPngOxiPngCompression: boolean
  exportWebpLossless: boolean
  exportWebpNearLossless: number
  exportWebpEffort: number
  exportWebpSharpYuv: boolean
  exportWebpPreserveExactAlpha: boolean
  exportBmpColorDepth: BmpColorDepth
  exportBmpDithering: boolean
  exportBmpDitheringLevel: number
  exportTiffColorMode: TiffColorMode

  setCanvas: (partial: Partial<PatternCanvasSettings>) => void
  setCanvasSize: (width: number, height: number) => void
  setDistribution: (partial: Partial<PatternDistributionSettings>) => void
  setAssetResize: (partial: Partial<PatternAssetResizeSettings>) => void
  setLayerColorOverride: (partial: Partial<PatternLayerColorOverrideSettings>) => void
  setLayerBorderOverride: (partial: Partial<PatternLayerBorderOverrideSettings>) => void
  setLayerCornerRadiusOverride: (partial: Partial<PatternLayerCornerRadiusOverrideSettings>) => void
  setBoundary: (target: "inbound" | "outbound", partial: Partial<PatternBoundarySettings>) => void
  resetBoundariesToCanvas: () => void
  setVisualBoundaryVisibility: (target: PatternVisualBoundaryTarget, visible: boolean) => void
  toggleVisualBoundaryVisibility: (target: PatternVisualBoundaryTarget) => void
  setActiveVisualBoundary: (target: PatternVisualBoundaryTarget | null) => void
  triggerVisualBoundary: (target: PatternVisualBoundaryTarget) => void
  hideVisualBoundary: () => void  
  setPreviewContainerHeight: (v: number) => void
  addAsset: (asset: PatternAsset) => void
  updateAsset: (assetId: string, partial: Partial<PatternAsset>) => void
  removeAsset: (assetId: string) => void
  clearAssets: () => void
  reorderAssetsByIds: (ids: string[]) => void

  setExportFormat: (format: PatternExportFormat) => void
  setExportQuality: (quality: number) => void
  setExportJxlEffort: (effort: number) => void
  setExportJxlLossless: (enabled: boolean) => void
  setExportJxlProgressive: (enabled: boolean) => void
  setExportJxlEpf: (value: 0 | 1 | 2 | 3) => void
  setExportAvifSpeed: (speed: number) => void
  setExportAvifQualityAlpha: (v: number) => void
  setExportAvifLossless: (v: boolean) => void
  setExportAvifSubsample: (v: string) => void
  setExportAvifTune: (v: string) => void
  setExportAvifHighAlphaQuality: (v: boolean) => void
  setExportMozJpegProgressive: (v: boolean) => void
  setExportMozJpegChromaSubsampling: (v: string) => void
  setExportPngTinyMode: (v: boolean) => void
  setExportPngCleanTransparentPixels: (v: boolean) => void
  setExportPngAutoGrayscale: (v: boolean) => void
  setExportPngDitheringLevel: (v: number) => void
  setExportPngProgressiveInterlaced: (v: boolean) => void
  setExportPngOxiPngCompression: (v: boolean) => void
  setExportWebpLossless: (v: boolean) => void
  setExportWebpNearLossless: (v: number) => void
  setExportWebpEffort: (v: number) => void
  setExportWebpSharpYuv: (v: boolean) => void
  setExportWebpPreserveExactAlpha: (v: boolean) => void
  setExportBmpColorDepth: (v: BmpColorDepth) => void
  setExportBmpDitheringLevel: (v: number) => void
  setExportTiffColorMode: (v: TiffColorMode) => void
}

type PatternJxlExportState = Pick<
  PatternStoreState,
  "exportJxlEffort" | "exportJxlLossless" | "exportJxlProgressive" | "exportJxlEpf"
>

function buildNormalizedPatternJxlPatch(
  state: PatternJxlExportState,
  patch: Partial<PatternJxlExportState>
): PatternJxlExportState {
  return mergeNormalizedJxlExportSource(state, patch)
}

type PatternWebpExportState = Pick<
  PatternStoreState,
  | "exportWebpLossless"
  | "exportWebpNearLossless"
  | "exportWebpEffort"
  | "exportWebpSharpYuv"
  | "exportWebpPreserveExactAlpha"
>

function buildNormalizedPatternWebpPatch(
  state: PatternWebpExportState,
  patch: Partial<PatternWebpExportState>
): PatternWebpExportState {
  return mergeNormalizedWebpExportSource(state, patch)
}

type PatternAvifExportState = Pick<
  PatternStoreState,
  | "exportAvifSpeed"
  | "exportAvifQualityAlpha"
  | "exportAvifLossless"
  | "exportAvifSubsample"
  | "exportAvifTune"
  | "exportAvifHighAlphaQuality"
>

function buildNormalizedPatternAvifPatch(
  state: PatternAvifExportState,
  patch: Partial<PatternAvifExportState>
): PatternAvifExportState {
  return mergeNormalizedAvifTextExportSource(state, patch)
}

type PatternPngExportState = Pick<
  PatternStoreState,
  | "exportPngTinyMode"
  | "exportPngCleanTransparentPixels"
  | "exportPngAutoGrayscale"
  | "exportPngDithering"
  | "exportPngDitheringLevel"
  | "exportPngProgressiveInterlaced"
  | "exportPngOxiPngCompression"
>

function buildNormalizedPatternPngPatch(
  state: PatternPngExportState,
  patch: Partial<PatternPngExportState>
): PatternPngExportState {
  return mergeNormalizedPngExportSource(state, patch)
}

export const usePatternStore = create<PatternStoreState>()(
  persist(
    (set) => ({
      canvas: { ...DEFAULT_PATTERN_CANVAS_SETTINGS },
      settings: cloneSettings(DEFAULT_PATTERN_SETTINGS, DEFAULT_PATTERN_CANVAS_SETTINGS),
      assets: [],
      visualBoundaryVisibility: {
        inbound: false,
        outbound: false,
      },
      activeVisualBoundary: null,
      previewContainerHeight: 560,

      exportFormat: DEFAULT_PATTERN_EXPORT_SETTINGS.exportFormat,
      exportQuality: DEFAULT_PATTERN_EXPORT_SETTINGS.exportQuality,
      exportJxlEffort: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlEffort,
      exportJxlLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlLossless,
      exportJxlProgressive: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlProgressive,
      exportJxlEpf: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlEpf,
      exportAvifSpeed: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifSpeed,
      exportAvifQualityAlpha: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifQualityAlpha,
      exportAvifLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifLossless,
      exportAvifSubsample: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifSubsample,
      exportAvifTune: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifTune,
      exportAvifHighAlphaQuality: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifHighAlphaQuality,
      exportMozJpegProgressive: DEFAULT_PATTERN_EXPORT_SETTINGS.exportMozJpegProgressive,
      exportMozJpegChromaSubsampling: DEFAULT_PATTERN_EXPORT_SETTINGS.exportMozJpegChromaSubsampling,
      exportPngTinyMode: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngTinyMode,
      exportPngCleanTransparentPixels: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngCleanTransparentPixels,
      exportPngAutoGrayscale: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngAutoGrayscale,
      exportPngDithering: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngDithering,
      exportPngDitheringLevel: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngDitheringLevel,
      exportPngProgressiveInterlaced: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngProgressiveInterlaced,
      exportPngOxiPngCompression: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngOxiPngCompression,
      exportWebpLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpLossless,
      exportWebpNearLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpNearLossless,
      exportWebpEffort: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpEffort,
      exportWebpSharpYuv: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpSharpYuv,
      exportWebpPreserveExactAlpha: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpPreserveExactAlpha,
      exportBmpColorDepth: DEFAULT_PATTERN_EXPORT_SETTINGS.exportBmpColorDepth,
      exportBmpDithering: DEFAULT_PATTERN_EXPORT_SETTINGS.exportBmpDithering,
      exportBmpDitheringLevel: DEFAULT_PATTERN_EXPORT_SETTINGS.exportBmpDitheringLevel,
      exportTiffColorMode: DEFAULT_PATTERN_EXPORT_SETTINGS.exportTiffColorMode,

      setCanvas: (partial) =>
        set((state) => {
          const nextCanvas: PatternCanvasSettings = {
            ...state.canvas,
            ...partial,
            width: clampPositiveDimension(partial.width ?? state.canvas.width, state.canvas.width),
            height: clampPositiveDimension(partial.height ?? state.canvas.height, state.canvas.height),
            backgroundImageOpacity: clamp(
              partial.backgroundImageOpacity ?? state.canvas.backgroundImageOpacity,
              0,
              1
            ),
          }

          return {
            canvas: nextCanvas,
            settings: cloneSettings(state.settings, nextCanvas),
          }
        }),
      setCanvasSize: (width, height) =>
        set((state) => {
          const nextCanvas = {
            ...state.canvas,
            width: clampPositiveDimension(width, state.canvas.width),
            height: clampPositiveDimension(height, state.canvas.height),
          }

          return {
            canvas: nextCanvas,
            settings: cloneSettings(state.settings, nextCanvas),
          }
        }),
      setDistribution: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            distribution: normalizeDistributionSettings({
              ...state.settings.distribution,
              ...partial,
            }),
          },
        })),
      setAssetResize: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            assetResize: normalizeAssetResizeSettings({
              ...state.settings.assetResize,
              ...partial,
            }),
          },
        })),
      setLayerColorOverride: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            layerColorOverride: normalizeLayerColorOverrideSettings({
              ...state.settings.layerColorOverride,
              ...partial,
            }),
          },
        })),
      setLayerBorderOverride: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            layerBorderOverride: normalizeLayerBorderOverrideSettings({
              ...state.settings.layerBorderOverride,
              ...partial,
            }),
          },
        })),
      setLayerCornerRadiusOverride: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            layerCornerRadiusOverride: normalizeLayerCornerRadiusOverrideSettings({
              ...state.settings.layerCornerRadiusOverride,
              ...partial,
            }),
          },
        })),
      setBoundary: (target, partial) =>
        set((state) => {
          const current = target === "inbound" ? state.settings.inboundBoundary : state.settings.outboundBoundary
          const normalized = normalizeBoundarySettings(
            {
              ...current,
              ...partial,
            },
            state.canvas
          )

          if (target === "inbound") {
            return {
              settings: {
                ...state.settings,
                inboundBoundary: normalized,
              },
            }
          }

          return {
            settings: {
              ...state.settings,
              outboundBoundary: normalized,
            },
          }
        }),
      resetBoundariesToCanvas: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            inboundBoundary: {
              ...state.settings.inboundBoundary,
              x: 0,
              y: 0,
              width: state.canvas.width,
              height: state.canvas.height,
              rotation: 0,
            },
            outboundBoundary: {
              ...state.settings.outboundBoundary,
              x: state.canvas.width * 0.36,
              y: state.canvas.height * 0.27,
              width: state.canvas.width * 0.28,
              height: state.canvas.height * 0.42,
              rotation: 0,
            },
          },
        })),
      setVisualBoundaryVisibility: (target, visible) =>
        set((state) => {
          const nextVisibility = {
            ...state.visualBoundaryVisibility,
            [target]: visible,
          }

          let nextActive = state.activeVisualBoundary
          if (visible) {
            nextActive = target
          } else if (state.activeVisualBoundary === target) {
            nextActive = target === "inbound"
              ? nextVisibility.outbound
                ? "outbound"
                : null
              : nextVisibility.inbound
                ? "inbound"
                : null
          }

          return {
            visualBoundaryVisibility: nextVisibility,
            activeVisualBoundary: nextActive,
          }
        }),
      toggleVisualBoundaryVisibility: (target) =>
        set((state) => {
          const nextVisible = !state.visualBoundaryVisibility[target]
          const nextVisibility = {
            ...state.visualBoundaryVisibility,
            [target]: nextVisible,
          }

          let nextActive = state.activeVisualBoundary
          if (nextVisible) {
            nextActive = target
          } else if (state.activeVisualBoundary === target) {
            nextActive = target === "inbound"
              ? nextVisibility.outbound
                ? "outbound"
                : null
              : nextVisibility.inbound
                ? "inbound"
                : null
          }

          return {
            visualBoundaryVisibility: nextVisibility,
            activeVisualBoundary: nextActive,
          }
        }),
      setActiveVisualBoundary: (target) =>
        set((state) => {
          if (!target) {
            return { activeVisualBoundary: null }
          }

          if (!state.visualBoundaryVisibility[target]) {
            return {
              visualBoundaryVisibility: {
                ...state.visualBoundaryVisibility,
                [target]: true,
              },
              activeVisualBoundary: target,
            }
          }

          return { activeVisualBoundary: target }
        }),
      triggerVisualBoundary: (target) =>
        set({
          visualBoundaryVisibility: {
            inbound: target === "inbound",
            outbound: target === "outbound",
          },
          activeVisualBoundary: target,
        }),
      hideVisualBoundary: () =>
        set({
          visualBoundaryVisibility: {
            inbound: false,
            outbound: false,
          },
          activeVisualBoundary: null,
        }),
      addAsset: (asset) =>
        set((state) => ({
          assets: [...state.assets, asset],
        })),
      updateAsset: (assetId, partial) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === assetId
              ? {
                  ...asset,
                  ...partial,
                  opacity: clamp(partial.opacity ?? asset.opacity, 0, 1),
                  width: clampPositiveDimension(partial.width ?? asset.width, asset.width),
                  height: clampPositiveDimension(partial.height ?? asset.height, asset.height),
                  monochrome: normalizeAssetMonochromeSettings({
                    ...normalizeAssetMonochromeSettings(asset.monochrome),
                    ...(partial.monochrome ?? {}),
                  }),
                  border: normalizeAssetBorderSettings({
                    ...normalizeAssetBorderSettings(asset.border),
                    ...(partial.border ?? {}),
                  }),
                  cornerRadius: clampNonNegative(
                    partial.cornerRadius ?? asset.cornerRadius ?? 0,
                    asset.cornerRadius ?? 0,
                    2048
                  ),
                }
              : asset
          ),
        })),
      removeAsset: (assetId) =>
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== assetId),
        })),
      clearAssets: () => set({ assets: [] }),
      reorderAssetsByIds: (ids) =>
        set((state) => {
          const byId = new Map(state.assets.map((asset) => [asset.id, asset]))
          const ordered: PatternAsset[] = []

          for (const id of ids) {
            const asset = byId.get(id)
            if (asset) {
              ordered.push(asset)
              byId.delete(id)
            }
          }

          for (const asset of byId.values()) {
            ordered.push(asset)
          }

          return { assets: ordered }
        }),

      setExportFormat: (v) => set({ exportFormat: v }),
      setExportQuality: (v) => set({ exportQuality: v }),
      setExportJxlEffort: (v) => set((state) => buildNormalizedPatternJxlPatch(state, { exportJxlEffort: v })),
      setExportJxlLossless: (v) => set((state) => buildNormalizedPatternJxlPatch(state, { exportJxlLossless: v })),
      setExportJxlProgressive: (v) =>
        set((state) => buildNormalizedPatternJxlPatch(state, { exportJxlProgressive: v })),
      setExportJxlEpf: (v) => set((state) => buildNormalizedPatternJxlPatch(state, { exportJxlEpf: v })),
      setExportAvifSpeed: (v) => set((state) => buildNormalizedPatternAvifPatch(state, { exportAvifSpeed: v })),
      setExportAvifQualityAlpha: (v) =>
        set((state) => buildNormalizedPatternAvifPatch(state, { exportAvifQualityAlpha: v })),
      setExportAvifLossless: (v) =>
        set((state) => buildNormalizedPatternAvifPatch(state, { exportAvifLossless: v })),
      setExportAvifSubsample: (v) =>
        set((state) => buildNormalizedPatternAvifPatch(state, { exportAvifSubsample: v })),
      setExportAvifTune: (v) => set((state) => buildNormalizedPatternAvifPatch(state, { exportAvifTune: v })),
      setExportAvifHighAlphaQuality: (v) =>
        set((state) => buildNormalizedPatternAvifPatch(state, { exportAvifHighAlphaQuality: v })),
      setExportMozJpegProgressive: (v) => set({ exportMozJpegProgressive: v }),
      setExportMozJpegChromaSubsampling: (v) => set({ exportMozJpegChromaSubsampling: v }),
      setExportPngTinyMode: (v) => set((state) => buildNormalizedPatternPngPatch(state, { exportPngTinyMode: v })),
      setExportPngCleanTransparentPixels: (v) =>
        set((state) => buildNormalizedPatternPngPatch(state, { exportPngCleanTransparentPixels: v })),
      setExportPngAutoGrayscale: (v) =>
        set((state) => buildNormalizedPatternPngPatch(state, { exportPngAutoGrayscale: v })),
      setExportPngDitheringLevel: (v) =>
        set((state) => buildNormalizedPatternPngPatch(state, { exportPngDitheringLevel: v })),
      setExportPngProgressiveInterlaced: (v) =>
        set((state) => buildNormalizedPatternPngPatch(state, { exportPngProgressiveInterlaced: v })),
      setExportPngOxiPngCompression: (v) =>
        set((state) => buildNormalizedPatternPngPatch(state, { exportPngOxiPngCompression: v })),
      setExportWebpLossless: (v) =>
        set((state) => buildNormalizedPatternWebpPatch(state, { exportWebpLossless: v })),
      setExportWebpNearLossless: (v) =>
        set((state) => buildNormalizedPatternWebpPatch(state, { exportWebpNearLossless: v })),
      setExportWebpEffort: (v) =>
        set((state) => buildNormalizedPatternWebpPatch(state, { exportWebpEffort: v })),
      setExportWebpSharpYuv: (v) =>
        set((state) => buildNormalizedPatternWebpPatch(state, { exportWebpSharpYuv: v })),
      setExportWebpPreserveExactAlpha: (v) =>
        set((state) => buildNormalizedPatternWebpPatch(state, { exportWebpPreserveExactAlpha: v })),
      setExportBmpColorDepth: (v) => set({ exportBmpColorDepth: v }),
      setExportBmpDitheringLevel: (v) => set({ exportBmpDitheringLevel: v, exportBmpDithering: v > 0 }),
      setExportTiffColorMode: (v) => set({ exportTiffColorMode: v }),
      setPreviewContainerHeight: (v) => set({ previewContainerHeight: Math.max(200, v) }),
    }),
    {
      name: "imify_pattern_generator",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        canvas: {
          ...state.canvas,
          backgroundImageUrl: null,
        },
        settings: {
          distribution: state.settings.distribution,
          assetResize: state.settings.assetResize,
          layerColorOverride: state.settings.layerColorOverride,
          layerBorderOverride: state.settings.layerBorderOverride,
          layerCornerRadiusOverride: state.settings.layerCornerRadiusOverride,
          inboundBoundary: state.settings.inboundBoundary,
          outboundBoundary: state.settings.outboundBoundary,
        },
        exportFormat: state.exportFormat,
        exportQuality: state.exportQuality,
        exportJxlEffort: state.exportJxlEffort,
        exportJxlLossless: state.exportJxlLossless,
        exportJxlProgressive: state.exportJxlProgressive,
        exportJxlEpf: state.exportJxlEpf,
        exportAvifSpeed: state.exportAvifSpeed,
        exportAvifQualityAlpha: state.exportAvifQualityAlpha,
        exportAvifLossless: state.exportAvifLossless,
        exportAvifSubsample: state.exportAvifSubsample,
        exportAvifTune: state.exportAvifTune,
        exportAvifHighAlphaQuality: state.exportAvifHighAlphaQuality,
        exportMozJpegProgressive: state.exportMozJpegProgressive,
        exportMozJpegChromaSubsampling: state.exportMozJpegChromaSubsampling,
        exportPngTinyMode: state.exportPngTinyMode,
        exportPngCleanTransparentPixels: state.exportPngCleanTransparentPixels,
        exportPngAutoGrayscale: state.exportPngAutoGrayscale,
        exportPngDithering: state.exportPngDithering,
        exportPngDitheringLevel: state.exportPngDitheringLevel,
        exportPngProgressiveInterlaced: state.exportPngProgressiveInterlaced,
        exportPngOxiPngCompression: state.exportPngOxiPngCompression,
        exportWebpLossless: state.exportWebpLossless,
        exportWebpNearLossless: state.exportWebpNearLossless,
        exportWebpEffort: state.exportWebpEffort,
        exportWebpSharpYuv: state.exportWebpSharpYuv,
        exportWebpPreserveExactAlpha: state.exportWebpPreserveExactAlpha,
        exportBmpColorDepth: state.exportBmpColorDepth,
        exportBmpDithering: state.exportBmpDithering,
        exportBmpDitheringLevel: state.exportBmpDitheringLevel,
        exportTiffColorMode: state.exportTiffColorMode,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PatternStoreState> | undefined
        if (!persisted) {
          return currentState
        }

        const nextCanvas: PatternCanvasSettings = {
          ...currentState.canvas,
          ...(persisted.canvas ?? {}),
          backgroundImageUrl: null,
        }

        const persistedSettings = persisted.settings
          ? cloneSettings(persisted.settings, nextCanvas)
          : currentState.settings

        return {
          ...currentState,
          ...persisted,
          canvas: nextCanvas,
          settings: persistedSettings,
          assets: [],
          visualBoundaryVisibility: {
            inbound: false,
            outbound: false,
          },
          activeVisualBoundary: null,
        }
      },
    }
  )
)
