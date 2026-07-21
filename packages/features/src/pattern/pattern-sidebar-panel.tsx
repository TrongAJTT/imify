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
import { PATTERN_TARGET_FORMATS, usePatternIdentifiedPreset } from "./config";

interface PatternSidebarPanelProps {
  enableWideSidebarGrid?: boolean;
}

export function PatternSidebarPanel({
  enableWideSidebarGrid = false,
}: PatternSidebarPanelProps) {
  const { t } = useTranslation("pattern");

  const { patternIdentifiedPreset, activePresetId, setActivePresetId } =
    usePatternIdentifiedPreset();

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
