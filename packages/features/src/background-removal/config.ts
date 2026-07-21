import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import type { SavedSetupPreset } from "@imify/stores";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";

export const EDGE_REFINEMENT_MIN = -10;
export const EDGE_REFINEMENT_MAX = 20;
export const EDGE_REFINEMENT_DEFAULT = 0;

export const BACKGROUND_REMOVER_TARGET_FORMATS = [
  "png",
  "webp",
  "avif",
  "jxl",
  "jpg",
];

export const BACKGROUND_REMOVER_PRESET: SavedSetupPreset = {
  ...VIRTUAL_DEFAULT_PNG_PRESET,
  id: FEATURE_PRESET_PREFIXES.BACKGROUND_REMOVER,
  name: "Background Remover",
  highlightColor: "#ec4899",
};

export const BG_REMOVER_PRESET = BACKGROUND_REMOVER_PRESET;
