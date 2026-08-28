import type { GridDesignParams } from "@imify/features/filling/types";
import { DEFAULT_COLLAGE_GRID_PARAMS } from "./collage-maker-store";
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "./preset-colors";
import type { PresetViewMode, SavedPreset } from "@imify/core";
import {
  createPresetStore,
  type PresetStoreState,
} from "../factories/create-preset-store";

export type CollagePresetViewMode = PresetViewMode;

export interface CollagePresetConfig {
  imageCount: number;
  params: GridDesignParams;
}

export type SavedCollagePreset = SavedPreset<CollagePresetConfig>;
export type CollagePresetStoreState = PresetStoreState<CollagePresetConfig>;

export function cloneCollagePresetConfig(
  config: CollagePresetConfig,
): CollagePresetConfig {
  return {
    imageCount: config.imageCount,
    params: {
      ...config.params,
      rowDefinitions: [...config.params.rowDefinitions],
    },
  };
}

export function createDefaultCollagePresetConfig(): CollagePresetConfig {
  return {
    imageCount: 2,
    params: {
      ...DEFAULT_COLLAGE_GRID_PARAMS,
      rowDefinitions: [...DEFAULT_COLLAGE_GRID_PARAMS.rowDefinitions],
    },
  };
}

export const useCollagePresetStore = createPresetStore<CollagePresetConfig>({
  storageName: "imify-collage-preset",
  idPrefix: "collage_preset",
  defaultPresetPinned: false,
  defaultViewModeOnEnsure: "select",
  createDefaultConfig: createDefaultCollagePresetConfig,
  cloneConfig: cloneCollagePresetConfig,
});
