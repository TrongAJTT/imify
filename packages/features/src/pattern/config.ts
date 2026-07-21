import { useMemo } from "react";
import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import type { SavedSetupPreset } from "@imify/stores/stores/batch-store";
import { usePatternPresetStore } from "@imify/stores/stores/pattern-preset-store";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import type { PatternExportFormat } from "./types";
import type { DrawingTool } from "./pattern-drawing-utils";

export const PATTERN_TARGET_FORMATS: PatternExportFormat[] = [
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "tiff",
];

// Workspace constants -----

export const PREVIEW_PADDING = 16;
export const PREVIEW_MIN_ZOOM = 50;
export const PREVIEW_MAX_ZOOM = 2000;
export const PREVIEW_ZOOM_STEP = 10;
export const PREVIEW_ZOOM_FACTOR = 0.15;

// Drawing dialog ----------

export interface CanvasSize {
  width: number;
  height: number;
}

export const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 1024,
  height: 640,
};

export const DEFAULT_BRUSH_SIZE_BY_TOOL: Record<DrawingTool, number> = {
  brush: 10,
  eraser: 18,
};

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 120;
export const BRUSH_SIZE_STEP = 1;

export const DEFAULT_STREAMLINE_PERCENT = 65;
export const DEFAULT_SMOOTHING_PERCENT = 55;

// Pattern preset config ----------

export function usePatternIdentifiedPreset(): {
  patternIdentifiedPreset: SavedSetupPreset;
  activePresetId: string | null;
  setActivePresetId: (id: string | null) => void;
} {
  const activePatternPresetId = usePatternPresetStore(
    (state) => state.activePresetId,
  );
  const activePatternPreset = usePatternPresetStore((state) =>
    state.presets.find((p) => p.id === activePatternPresetId),
  );

  const identifiedPresetId = `${FEATURE_PRESET_PREFIXES.PATTERN_GEN}_${activePatternPresetId}`;
  const identifiedPresetName = `PatternGen #${activePatternPreset?.name || activePatternPresetId}`;
  const identifiedPresetColor =
    activePatternPreset?.highlightColor || "#f97316";

  const exportFormat = usePatternStore((s) => s.exportFormat);
  const exportQuality = usePatternStore((s) => s.exportQuality);
  const exportJxlEffort = usePatternStore((s) => s.exportJxlEffort);
  const exportJxlLossless = usePatternStore((s) => s.exportJxlLossless);
  const exportJxlProgressive = usePatternStore((s) => s.exportJxlProgressive);
  const exportJxlEpf = usePatternStore((s) => s.exportJxlEpf);
  const exportAvifSpeed = usePatternStore((s) => s.exportAvifSpeed);
  const exportAvifQualityAlpha = usePatternStore(
    (s) => s.exportAvifQualityAlpha,
  );
  const exportAvifLossless = usePatternStore((s) => s.exportAvifLossless);
  const exportAvifSubsample = usePatternStore((s) => s.exportAvifSubsample);
  const exportAvifTune = usePatternStore((s) => s.exportAvifTune);
  const exportAvifHighAlphaQuality = usePatternStore(
    (s) => s.exportAvifHighAlphaQuality,
  );
  const exportMozJpegProgressive = usePatternStore(
    (s) => s.exportMozJpegProgressive,
  );
  const exportMozJpegChromaSubsampling = usePatternStore(
    (s) => s.exportMozJpegChromaSubsampling,
  );
  const exportPngTinyMode = usePatternStore((s) => s.exportPngTinyMode);
  const exportPngCleanTransparentPixels = usePatternStore(
    (s) => s.exportPngCleanTransparentPixels,
  );
  const exportPngAutoGrayscale = usePatternStore(
    (s) => s.exportPngAutoGrayscale,
  );
  const exportPngDithering = usePatternStore((s) => s.exportPngDithering);
  const exportPngDitheringLevel = usePatternStore(
    (s) => s.exportPngDitheringLevel,
  );
  const exportPngProgressiveInterlaced = usePatternStore(
    (s) => s.exportPngProgressiveInterlaced,
  );
  const exportPngOxiPngCompression = usePatternStore(
    (s) => s.exportPngOxiPngCompression,
  );
  const exportWebpLossless = usePatternStore((s) => s.exportWebpLossless);
  const exportWebpNearLossless = usePatternStore(
    (s) => s.exportWebpNearLossless,
  );
  const exportWebpEffort = usePatternStore((s) => s.exportWebpEffort);
  const exportWebpSharpYuv = usePatternStore((s) => s.exportWebpSharpYuv);
  const exportWebpPreserveExactAlpha = usePatternStore(
    (s) => s.exportWebpPreserveExactAlpha,
  );
  const exportBmpColorDepth = usePatternStore((s) => s.exportBmpColorDepth);
  const exportBmpDithering = usePatternStore((s) => s.exportBmpDithering);
  const exportBmpDitheringLevel = usePatternStore(
    (s) => s.exportBmpDitheringLevel,
  );
  const exportTiffColorMode = usePatternStore((s) => s.exportTiffColorMode);

  const patternIdentifiedPreset: SavedSetupPreset = useMemo(
    () => ({
      ...VIRTUAL_DEFAULT_PNG_PRESET,
      id: identifiedPresetId,
      name: identifiedPresetName,
      highlightColor: identifiedPresetColor,
      pinned: false,
      config: {
        ...VIRTUAL_DEFAULT_PNG_PRESET.config,
        targetFormat: exportFormat,
        quality: exportQuality,
        fileNamePattern: "",
        formatOptions: {
          webp: {
            lossless: exportWebpLossless,
            nearLossless: exportWebpNearLossless,
            effort: exportWebpEffort,
            sharpYuv: exportWebpSharpYuv,
            preserveExactAlpha: exportWebpPreserveExactAlpha,
          },
          avif: {
            speed: exportAvifSpeed,
            qualityAlpha: exportAvifQualityAlpha,
            lossless: exportAvifLossless,
            subsample: Number(exportAvifSubsample) as 1 | 2 | 3,
            tune: exportAvifTune as "auto" | "ssim" | "psnr",
            highAlphaQuality: exportAvifHighAlphaQuality,
          },
          jxl: {
            effort: exportJxlEffort,
            lossless: exportJxlLossless,
            progressive: exportJxlProgressive,
            epf: exportJxlEpf,
          },
          png: {
            tinyMode: exportPngTinyMode,
            cleanTransparentPixels: exportPngCleanTransparentPixels,
            autoGrayscale: exportPngAutoGrayscale,
            dithering: exportPngDithering,
            ditheringLevel: exportPngDitheringLevel,
            progressiveInterlaced: exportPngProgressiveInterlaced,
            oxipngCompression: exportPngOxiPngCompression,
          },
          mozjpeg: {
            progressive: exportMozJpegProgressive,
            chromaSubsampling: Number(exportMozJpegChromaSubsampling) as
              | 0
              | 1
              | 2,
          },
          bmp: {
            colorDepth: exportBmpColorDepth,
            dithering: exportBmpDithering,
            ditheringLevel: exportBmpDitheringLevel,
          },
          tiff: {
            colorMode: exportTiffColorMode,
          },
          ico: VIRTUAL_DEFAULT_PNG_PRESET.config.formatOptions.ico,
        },
      },
    }),
    [
      identifiedPresetId,
      identifiedPresetName,
      identifiedPresetColor,
      exportFormat,
      exportQuality,
      exportWebpLossless,
      exportWebpNearLossless,
      exportWebpEffort,
      exportWebpSharpYuv,
      exportWebpPreserveExactAlpha,
      exportAvifSpeed,
      exportAvifQualityAlpha,
      exportAvifLossless,
      exportAvifSubsample,
      exportAvifTune,
      exportAvifHighAlphaQuality,
      exportJxlEffort,
      exportJxlLossless,
      exportJxlProgressive,
      exportJxlEpf,
      exportPngTinyMode,
      exportPngCleanTransparentPixels,
      exportPngAutoGrayscale,
      exportPngDithering,
      exportPngDitheringLevel,
      exportPngProgressiveInterlaced,
      exportPngOxiPngCompression,
      exportMozJpegProgressive,
      exportMozJpegChromaSubsampling,
      exportBmpColorDepth,
      exportBmpDithering,
      exportBmpDitheringLevel,
      exportTiffColorMode,
    ],
  );

  return {
    patternIdentifiedPreset,
    activePresetId: null,
    setActivePresetId: () => {},
  };
}
