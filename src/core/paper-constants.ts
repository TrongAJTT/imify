import type { PaperSize, SupportedDPI } from "@/core/types"

export interface Dimension {
  width: number
  height: number
}

export type PaperDimensions = Record<PaperSize, Record<SupportedDPI, Dimension>>

// Pixel dimensions rounded to nearest integer for each paper size at supported DPI values.
export const PAPER_DIMENSIONS: PaperDimensions = {
  A3: {
    72: { width: 842, height: 1191 },
    150: { width: 1754, height: 2480 },
    300: { width: 3508, height: 4961 }
  },
  A4: {
    72: { width: 595, height: 842 },
    150: { width: 1240, height: 1754 },
    300: { width: 2480, height: 3508 }
  },
  A5: {
    72: { width: 420, height: 595 },
    150: { width: 874, height: 1240 },
    300: { width: 1748, height: 2480 }
  },
  B5: {
    72: { width: 516, height: 729 },
    150: { width: 1076, height: 1518 },
    300: { width: 2152, height: 3035 }
  },
  Letter: {
    72: { width: 612, height: 792 },
    150: { width: 1275, height: 1650 },
    300: { width: 2550, height: 3300 }
  },
  Legal: {
    72: { width: 612, height: 1008 },
    150: { width: 1275, height: 2100 },
    300: { width: 2550, height: 4200 }
  }
}
