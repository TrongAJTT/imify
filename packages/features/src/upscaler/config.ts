import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import type { SavedSetupPreset } from "@imify/stores";

export const IMAGE_DIMENSION_THRESHOLD = 1000;
export const DENOISE_STRENGTH_MIN = 0;
export const DENOISE_STRENGTH_MAX = 100;
export const DENOISE_STRENGTH_STEP = 1;

export const UPSCALER_SIDEBAR_PANEL_ID = "upscaler-settings";

export const UPSCALER_PRESET: SavedSetupPreset = {
  ...VIRTUAL_DEFAULT_PNG_PRESET,
  id: FEATURE_PRESET_PREFIXES.IMAGE_UPSCALER,
  name: "Upscaler",
  highlightColor: "#a855f7", // Purple color theme
};
