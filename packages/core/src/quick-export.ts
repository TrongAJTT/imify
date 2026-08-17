import type { FormatCodecOptions } from "./types";

export type QuickExportFormat = "png" | "jpg" | "webp" | "webp-lossless";

export interface QuickExportSettings {
  format: QuickExportFormat;
  fileNamePattern: string;
}

export const DEFAULT_QUICK_EXPORT_FORMAT: QuickExportFormat = "png";
export const DEFAULT_QUICK_EXPORT_FILENAME_PATTERN = "[OriginalName]";

export function mapQuickExportToEngineConfig(format: QuickExportFormat): {
  targetFormat: string;
  quality: number;
  codecOptions: Partial<FormatCodecOptions>;
} {
  switch (format) {
    case "jpg":
      return {
        targetFormat: "jpg",
        quality: 92,
        codecOptions: {},
      };
    case "webp":
      return {
        targetFormat: "webp",
        quality: 88,
        codecOptions: {},
      };
    case "webp-lossless":
      return {
        targetFormat: "webp",
        quality: 100,
        codecOptions: {
          webp: {
            lossless: true,
            nearLossless: 100,
            effort: 4,
            sharpYuv: false,
            preserveExactAlpha: true,
          },
        },
      };
    case "png":
    default:
      return {
        targetFormat: "png",
        quality: 100,
        codecOptions: {},
      };
  }
}
