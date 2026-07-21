import { useMemo } from "react";
import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import type { SavedSetupPreset } from "@imify/stores/stores/batch-store";
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store";
import { useSplicingStore } from "@imify/stores/stores/splicing-store";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import type { SplicingExportFormat } from "./types";

export const SPLICING_TARGET_FORMATS: SplicingExportFormat[] = [
  "png",
  "webp",
  "avif",
  "jxl",
  "jpg",
  "mozjpeg",
  "bmp",
  "tiff",
];

export function useSplicingIdentifiedPreset(): {
  splicingIdentifiedPreset: SavedSetupPreset;
  activePresetId: string | null;
  activeSplicingPresetId: string | null;
} {
  const exportSettings = useSplicingStore((s) => s.exportSettings);
  const activePresetId = useSplicingStore((s) => s.activePresetId);

  const activeSplicingPresetId = useSplicingPresetStore(
    (s) => s.activePresetId,
  );
  const activeSplicingPreset = useSplicingPresetStore((s) =>
    s.presets.find((p) => p.id === activeSplicingPresetId),
  );

  const identifiedPresetId = `${FEATURE_PRESET_PREFIXES.SPLICING}_${activeSplicingPresetId}`;
  const identifiedPresetName = `Splicing #${activeSplicingPreset?.name || activeSplicingPresetId}`;
  const identifiedPresetColor =
    activeSplicingPreset?.highlightColor || "#f97316";

  const splicingIdentifiedPreset: SavedSetupPreset = useMemo(
    () => ({
      ...VIRTUAL_DEFAULT_PNG_PRESET,
      id: identifiedPresetId,
      name: identifiedPresetName,
      highlightColor: identifiedPresetColor,
      config: {
        ...VIRTUAL_DEFAULT_PNG_PRESET.config,
        targetFormat: exportSettings.targetFormat as any,
        quality: exportSettings.quality,
        formatOptions: exportSettings.codecOptions as any,
        fileNamePattern: exportSettings.fileNamePattern,
      },
    }),
    [
      identifiedPresetId,
      identifiedPresetName,
      identifiedPresetColor,
      exportSettings,
    ],
  );

  return {
    splicingIdentifiedPreset,
    activePresetId,
    activeSplicingPresetId,
  };
}
