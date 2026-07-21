import { useMemo } from "react";
import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import type { SavedSetupPreset } from "@imify/stores/stores/batch-store";
import { useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store";
import { useSplitterStore } from "@imify/stores/stores/splitter-store";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import type { SplitterExportFormat } from "./types";

export const SPLITTER_TARGET_FORMATS: SplitterExportFormat[] = [
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "tiff",
];

export function useSplitterIdentifiedPreset(): {
  splitterIdentifiedPreset: SavedSetupPreset;
  activePresetId: string | null;
  activeSplitterPresetId: string | null;
} {
  const exportSettings = useSplitterStore((state) => state.exportSettings);
  const activePresetId = useSplitterStore((state) => state.activePresetId);

  const activeSplitterPresetId = useSplitterPresetStore(
    (state) => state.activePresetId,
  );
  const activeSplitterPreset = useSplitterPresetStore((state) =>
    state.presets.find((p) => p.id === activeSplitterPresetId),
  );

  const identifiedPresetId = `${FEATURE_PRESET_PREFIXES.IMAGE_SPLITTER}_${activeSplitterPresetId}`;
  const identifiedPresetName = `Image Splitter #${activeSplitterPreset?.name || activeSplitterPresetId}`;
  const identifiedPresetColor =
    activeSplitterPreset?.highlightColor || "#f97316";

  const splitterIdentifiedPreset: SavedSetupPreset = useMemo(
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
    splitterIdentifiedPreset,
    activePresetId,
    activeSplitterPresetId,
  };
}
