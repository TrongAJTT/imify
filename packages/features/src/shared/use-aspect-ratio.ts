export const ASPECT_RATIO_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "original", label: "Original" },
  { value: "1:1", label: "1:1" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "4:5", label: "4:5" },
  { value: "5:4", label: "5:4" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "2:3", label: "2:3" },
  { value: "3:2", label: "3:2" },
  { value: "5:7", label: "5:7" },
  { value: "6:5", label: "6:5" },
  { value: "1:2", label: "1:2" },
  { value: "2:1", label: "2:1" },
] as const;

export const RATIO_EPSILON = 0.0025;

export function parseAspectRatio(value: string): number | null {
  const matched = /^(\d+)\s*:\s*(\d+)$/.exec(value);
  if (!matched) {
    return null;
  }

  const width = Number(matched[1]);
  const height = Number(matched[2]);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return width / height;
}

export function ratioFromDimensions(width: number, height: number): number | null {
  if (width <= 0 || height <= 0) {
    return null;
  }

  return width / height;
}

export function isSameRatio(a: number | null, b: number | null): boolean {
  if (!a || !b) {
    return false;
  }

  return Math.abs(a - b) <= RATIO_EPSILON;
}

export function toAspectRatioLabel(width: number, height: number): string {
  const currentRatio = ratioFromDimensions(width, height);
  if (!currentRatio) {
    return "free";
  }

  for (const option of ASPECT_RATIO_OPTIONS) {
    if (option.value === "free" || option.value === "original") {
      continue;
    }

    const optionRatio = parseAspectRatio(option.value);
    if (isSameRatio(currentRatio, optionRatio)) {
      return option.value;
    }
  }

  return "free";
}