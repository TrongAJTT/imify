import React, { useMemo, useState } from "react";
import { useTranslation } from "@imify/i18n";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui";
import { PatternAssetSettingsAccordion } from "./pattern-asset-settings-accordion";
import { PatternAssetsAccordion } from "./pattern-assets-accordion";
import { PatternBoundaryAccordion } from "./pattern-boundary-accordion";
import { PatternCanvasAccordion } from "./pattern-canvas-accordion";
import { PatternSettingsAccordion } from "./pattern-settings-accordion";
import { PresetSelector } from "../processor/preset-selector";
import { useIdentifiedPresetLoader } from "../shared/use-identified-preset-loader";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { usePatternPresetStore } from "@imify/stores/stores/pattern-preset-store";
import {
  useBatchStore,
  type SavedSetupPreset,
} from "@imify/stores/stores/batch-store";
import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import type { PatternExportFormat } from "./types";

interface PatternSidebarPanelProps {
  enableWideSidebarGrid?: boolean;
}

const PATTERN_TARGET_FORMATS = [
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "tiff",
];

export function PatternSidebarPanel({
  enableWideSidebarGrid = false,
}: PatternSidebarPanelProps) {
  const { t } = useTranslation("pattern");

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

  const [activePresetId, setActivePresetId] = useState<string | null>(null);

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
          ico: {
            sizes: [16, 32, 48, 64, 128, 256],
            generateWebIconKit: false,
            optimizeInternalPngLayers: false,
          },
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

  const applyPreset = (preset: SavedSetupPreset) => {
    const { targetFormat, quality, formatOptions } = preset.config;
    const isIdentified = preset.id.startsWith(`${FEATURE_PRESET_PREFIXES.PATTERN_GEN}_`);

    setActivePresetId(
      preset.id === VIRTUAL_DEFAULT_PNG_PRESET.id || isIdentified
        ? null
        : preset.id,
    );

    usePatternStore.setState((state) => {
      const patch: any = {
        exportFormat: targetFormat as PatternExportFormat,
        exportQuality: quality,
      };

      if (formatOptions) {
        if (formatOptions.webp) {
          patch.exportWebpLossless = formatOptions.webp.lossless;
          patch.exportWebpNearLossless = formatOptions.webp.nearLossless;
          patch.exportWebpEffort = formatOptions.webp.effort;
          patch.exportWebpSharpYuv = formatOptions.webp.sharpYuv;
          patch.exportWebpPreserveExactAlpha =
            formatOptions.webp.preserveExactAlpha;
        }
        if (formatOptions.avif) {
          patch.exportAvifSpeed = formatOptions.avif.speed;
          patch.exportAvifQualityAlpha = formatOptions.avif.qualityAlpha;
          patch.exportAvifLossless = formatOptions.avif.lossless;
          patch.exportAvifSubsample = String(formatOptions.avif.subsample);
          patch.exportAvifTune = formatOptions.avif.tune;
          patch.exportAvifHighAlphaQuality =
            formatOptions.avif.highAlphaQuality;
        }
        if (formatOptions.jxl) {
          patch.exportJxlEffort = formatOptions.jxl.effort;
          patch.exportJxlLossless = formatOptions.jxl.lossless;
          patch.exportJxlProgressive = formatOptions.jxl.progressive;
          patch.exportJxlEpf = formatOptions.jxl.epf;
        }
        if (formatOptions.png) {
          patch.exportPngTinyMode = formatOptions.png.tinyMode;
          patch.exportPngCleanTransparentPixels =
            formatOptions.png.cleanTransparentPixels;
          patch.exportPngAutoGrayscale = formatOptions.png.autoGrayscale;
          patch.exportPngDithering = formatOptions.png.dithering;
          patch.exportPngDitheringLevel = formatOptions.png.ditheringLevel;
          patch.exportPngProgressiveInterlaced =
            formatOptions.png.progressiveInterlaced;
          patch.exportPngOxiPngCompression =
            formatOptions.png.oxipngCompression;
        }
        if (formatOptions.mozjpeg) {
          patch.exportMozJpegProgressive = formatOptions.mozjpeg.progressive;
          patch.exportMozJpegChromaSubsampling = String(
            formatOptions.mozjpeg.chromaSubsampling,
          );
        }
        if (formatOptions.bmp) {
          patch.exportBmpColorDepth = formatOptions.bmp.colorDepth;
          patch.exportBmpDithering = formatOptions.bmp.dithering;
          patch.exportBmpDitheringLevel = formatOptions.bmp.ditheringLevel;
        }
        if (formatOptions.tiff) {
          patch.exportTiffColorMode = formatOptions.tiff.colorMode;
        }
      }

      return {
        ...state,
        ...patch,
      };
    });

    const batchStore = useBatchStore.getState();
    batchStore.setTargetFormat(targetFormat as any);
    batchStore.setQuality(quality);
  };

  const resetToDefault = () => {
    applyPreset(VIRTUAL_DEFAULT_PNG_PRESET);
  };

  useIdentifiedPresetLoader(
    patternIdentifiedPreset,
    activePresetId,
    applyPreset,
  );

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "canvas",
      label: t("sidebar.canvas"),
      columnSpan: 2,
      content: <PatternCanvasAccordion />,
    },
    {
      id: "assets",
      label: t("sidebar.assets"),
      columnSpan: 2,
      content: <PatternAssetsAccordion />,
    },
    {
      id: "asset-settings",
      label: t("sidebar.assetSettings"),
      content: <PatternAssetSettingsAccordion />,
    },
    {
      id: "distribution-settings",
      label: t("sidebar.pattern"),
      content: <PatternSettingsAccordion />,
    },
    {
      id: "boundary-settings",
      label: t("sidebar.boundarySettings"),
      content: <PatternBoundaryAccordion />,
    },
    {
      id: "export-settings",
      label: "",
      columnSpan: 2,
      content: (
        <PresetSelector
          label={t("sidebar.exportSettings")}
          theme="amber"
          identifiedPreset={patternIdentifiedPreset}
          formatFilter={PATTERN_TARGET_FORMATS}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
        />
      ),
    },
  ];

  return (
    <WorkspaceConfigSidebarPanel
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
    />
  );
}
