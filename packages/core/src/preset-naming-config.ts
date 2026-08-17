function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export const DEFAULT_PRESET_NAME_PATTERNS = {
  processor: "Processor #[DateTime]",
  splitter: "Splitter #[DateTime]",
  backgroundRemover: "BG Remover #[DateTime]",
  bgRemover: "BG Remover #[DateTime]",
  "background-removal": "BG Remover #[DateTime]",
  upscaler: "Upscaler #[DateTime]",
  splicing: "Splicing #[DateTime]",
  filling: "Filling #[DateTime]",
  pattern: "Pattern #[DateTime]",
} as const;

export type PresetNamingFeatureKey = keyof typeof DEFAULT_PRESET_NAME_PATTERNS;

/**
 * Format a string pattern replacing `[DateTime]`, `[Date]`, `[Time]` with current timestamp.
 */
export function formatPresetNameWithDateTime(
  pattern: string,
  date: Date = new Date(),
): string {
  const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const timeStr = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const dateTimeStr = `${dateStr} ${timeStr}`;

  return pattern
    .replace(/\[DateTime\]/g, dateTimeStr)
    .replace(/\[Date\]/g, dateStr)
    .replace(/\[Time\]/g, timeStr);
}

/** Alias for backward compatibility */
export const formatPresetNameWithTime = formatPresetNameWithDateTime;

/**
 * Generates the default preset/template name for a given feature key at the current date and time.
 */
export function generateDefaultPresetName(
  featureKey: PresetNamingFeatureKey | string,
  date: Date = new Date(),
): string {
  const pattern =
    (DEFAULT_PRESET_NAME_PATTERNS as Record<string, string>)[featureKey] ||
    `${featureKey} #[DateTime]`;
  return formatPresetNameWithDateTime(pattern, date);
}
