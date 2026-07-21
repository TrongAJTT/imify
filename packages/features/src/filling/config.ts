import { useMemo } from "react";
import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import type { SavedSetupPreset } from "@imify/stores/stores/batch-store";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";

export const FILLING_TARGET_FORMATS = [
  "png",
  "webp",
  "avif",
  "jxl",
  "jpg",
  "bmp",
  "tiff",
];

export function useFillingIdentifiedPreset(
  templateId: string,
  templateName: string,
): {
  fillingIdentifiedPreset: SavedSetupPreset;
  activePresetId: string | null;
} {
  const exportSettings = useFillingStore((s) => s.exportSettings);
  const activePresetId = useFillingStore((s) => s.activePresetId);

  const identifiedPresetId = `${FEATURE_PRESET_PREFIXES.FILLING}_${templateId}`;
  const identifiedPresetName = `Filling #${templateName}`;
  const identifiedPresetColor = "#06b6d4";

  const fillingIdentifiedPreset: SavedSetupPreset = useMemo(
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
    fillingIdentifiedPreset,
    activePresetId,
  };
}

// Workspace constants
export const CANVAS_PADDING = 40;
export const PREVIEW_MIN_ZOOM = 50;
export const PREVIEW_MAX_ZOOM = 10000;
export const PREVIEW_ZOOM_FACTOR = 0.15;
export const IMAGE_HITBOX_PADDING = 50;
export const PREVIEW_ZOOM_STEP = 10;
export const ROTATE_CURSOR = "crosshair";
export const FIRST_CONTROL_ID = "first_axis_first_shape";
export const SECOND_CONTROL_ID = "first_axis_second_shape";
export const THIRD_CONTROL_ID = "second_axis_first_shape";

export type SymmetricControlId =
  | typeof FIRST_CONTROL_ID
  | typeof SECOND_CONTROL_ID
  | typeof THIRD_CONTROL_ID;

// Transform guides constants
export const DEFAULT_ROTATION_STEP = 45;
export const DEFAULT_ROTATION_TOLERANCE = 4;
export const DEFAULT_POSITION_TOLERANCE = 8;