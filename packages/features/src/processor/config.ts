import type { ImageFormat } from "@imify/core/types";
import type { SavedSetupPreset } from "@imify/stores/stores/batch-store";

export type TargetFormatOptionValue = Exclude<ImageFormat, "pdf"> | "mozjpeg";

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

/**
 * A virtual preset for PNG output with no resizing.
 * Used as a default fallback when no user presets are selected.
 */
export const VIRTUAL_DEFAULT_PNG_PRESET: SavedSetupPreset = {
  id: "virtual-default-png",
  context: "single",
  name: "Default (PNG)",
  highlightColor: "#94a3b8",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  config: {
    targetFormat: "png",
    quality: 92,
    concurrency: 3,
    formatOptions: {
      bmp: {
        colorDepth: 24,
        dithering: false,
        ditheringLevel: 0,
      },
      jxl: {
        effort: 7,
        lossless: false,
        progressive: false,
        epf: 1,
      },
      webp: {
        lossless: false,
        nearLossless: 100,
        effort: 5,
        sharpYuv: false,
        preserveExactAlpha: false,
      },
      avif: {
        speed: 6,
        qualityAlpha: undefined,
        lossless: false,
        subsample: 1,
        tune: "auto",
        highAlphaQuality: false,
      },
      mozjpeg: {
        progressive: true,
        chromaSubsampling: 2,
      },
      ico: {
        sizes: [16, 32, 48, 64, 128, 256],
        generateWebIconKit: false,
        optimizeInternalPngLayers: false,
      },
      png: {
        tinyMode: false,
        cleanTransparentPixels: false,
        autoGrayscale: false,
        dithering: false,
        ditheringLevel: 0,
        progressiveInterlaced: false,
        oxipngCompression: false,
      },
      tiff: {
        colorMode: "color",
      },
    },
    resizeMode: "inherit",
    resizeValue: 100,
    resizeApplyTo: "width",
    resizeWidth: 1280,
    resizeHeight: 960,
    resizeAspectMode: "original",
    resizeAspectRatio: "16:9",
    resizeAnchor: "width",
    resizeFitMode: "fill",
    resizeContainBackground: "#000000",
    resizeResamplingAlgorithm: "browser-default",
    paperSize: "A4",
    dpi: 300,
    stripExif: false,
    fileNamePattern: "[OriginalName]",
  },
};

export const DEFAULT_PROCESSOR_PRESET = VIRTUAL_DEFAULT_PNG_PRESET;
