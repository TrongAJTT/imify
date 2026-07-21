import type { TargetFormatOptionValue } from "./target-format-options";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "./preset-utils";

export const PROCESSOR_TARGET_FORMATS: TargetFormatOptionValue[] = [
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "ico",
  "tiff",
];

export const SINGLE_PROCESSOR_TARGET_FORMATS = PROCESSOR_TARGET_FORMATS;
export const BATCH_PROCESSOR_TARGET_FORMATS = PROCESSOR_TARGET_FORMATS;

export const DEFAULT_PROCESSOR_PRESET = VIRTUAL_DEFAULT_PNG_PRESET;
