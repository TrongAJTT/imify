/**
 * Feature preset identifiers and prefixes.
 * Centralized registry to prevent duplicate boilerplate across features and presets.
 */
export const FEATURE_PRESET_PREFIXES = {
  BACKGROUND_REMOVER: "preset_background-remover",
  SPLICING: "preset_splicing",
  IMAGE_SPLITTER: "preset_image-splitter",
  PATTERN_GEN: "preset_pattern-gen",
  FILLING: "preset_filling",
  IMAGE_UPSCALER: "preset_upscaler"
} as const;

/**
 * Checks if a preset ID corresponds to a specific tool feature preset.
 */
export function isFeaturePreset(id: string): boolean {
  return Object.values(FEATURE_PRESET_PREFIXES).some((prefix) =>
    id.startsWith(prefix)
  );
}
