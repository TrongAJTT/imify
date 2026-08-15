import type { PaperSize, SupportedDPI } from "./types"

export interface Dimension {
  width: number
  height: number
}

export type PaperDimensions = Record<PaperSize, Record<SupportedDPI, Dimension>>

export const SUPPORTED_DPIS: SupportedDPI[] = [72, 96, 150, 300, 600]

export const DPI_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: "72", label: "72 DPI" },
  { value: "96", label: "96 DPI" },
  { value: "150", label: "150 DPI" },
  { value: "300", label: "300 DPI" },
  { value: "600", label: "600 DPI" },
]

export const DPI_VERBOSE_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: "72", label: "72 DPI (Web / Fast)" },
  { value: "96", label: "96 DPI (Desktop / UI)" },
  { value: "150", label: "150 DPI (Standard)" },
  { value: "300", label: "300 DPI (High Quality / Print)" },
  { value: "600", label: "600 DPI (Ultra HD / Archival)" },
]

// Pixel dimensions rounded to nearest integer for each paper size at supported DPI values.
export const PAPER_DIMENSIONS: PaperDimensions = {
  A3: {
    72: { width: 842, height: 1191 },
    96: { width: 1123, height: 1587 },
    150: { width: 1754, height: 2480 },
    300: { width: 3508, height: 4961 },
    600: { width: 7016, height: 9921 }
  },
  A4: {
    72: { width: 595, height: 842 },
    96: { width: 794, height: 1123 },
    150: { width: 1240, height: 1754 },
    300: { width: 2480, height: 3508 },
    600: { width: 4960, height: 7016 }
  },
  A5: {
    72: { width: 420, height: 595 },
    96: { width: 559, height: 794 },
    150: { width: 874, height: 1240 },
    300: { width: 1748, height: 2480 },
    600: { width: 3496, height: 4960 }
  },
  B5: {
    72: { width: 516, height: 729 },
    96: { width: 665, height: 945 },
    150: { width: 1076, height: 1518 },
    300: { width: 2152, height: 3035 },
    600: { width: 4304, height: 6070 }
  },
  Letter: {
    72: { width: 612, height: 792 },
    96: { width: 816, height: 1056 },
    150: { width: 1275, height: 1650 },
    300: { width: 2550, height: 3300 },
    600: { width: 5100, height: 6600 }
  },
  Legal: {
    72: { width: 612, height: 1008 },
    96: { width: 816, height: 1344 },
    150: { width: 1275, height: 2100 },
    300: { width: 2550, height: 4200 },
    600: { width: 5100, height: 8400 }
  }
}
