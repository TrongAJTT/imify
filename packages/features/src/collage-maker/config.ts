import type { GridDesignParams } from "../filling/types";

export const MAX_COLLAGE_IMAGES = 10;
export const MIN_COLLAGE_IMAGES = 2;
export const COLLAGE_DEFAULT_NAME_PREFIX = "imify-collage";
const DEFAULT_OUTER_PADDING = 20;
const DEFAULT_GAP = 16;

export interface CollageLayoutPreset {
  id: string;
  name?: string;
  imageCount: number;
  params: GridDesignParams;
}

const p = (
  id: string,
  imageCount: number,
  direction: "cols" | "rows",
  rowDefinitions: string[],
  name?: string,
): CollageLayoutPreset => ({
  id,
  name,
  imageCount,
  params: {
    direction,
    rowCount: rowDefinitions.length,
    rowDefinitions,
    outerPadding: DEFAULT_OUTER_PADDING,
    gapX: DEFAULT_GAP,
    gapY: DEFAULT_GAP,
    uniformColumns: false,
    uniformColumnsDef: "",
  },
});

export const COLLAGE_LAYOUT_PRESETS: CollageLayoutPreset[] = [
  // ==========================================
  // 2 IMAGES (14 configs)
  // ==========================================
  p("collage-2-cols-1-1", 2, "cols", ["1", "1"]),
  p("collage-2-rows-1-1", 2, "rows", ["1", "1"]),
  p("collage-2-rows-1-2", 2, "rows", ["1 2"]),
  p("collage-2-rows-2-1", 2, "rows", ["2 1"]),
  p("collage-2-rows-1-3", 2, "rows", ["1 3"]),
  p("collage-2-rows-3-1", 2, "rows", ["3 1"]),
  p("collage-2-rows-2-3", 2, "rows", ["2 3"]),
  p("collage-2-rows-3-2", 2, "rows", ["3 2"]),
  p("collage-2-cols-1-2", 2, "cols", ["1 2"]),
  p("collage-2-cols-2-1", 2, "cols", ["2 1"]),
  p("collage-2-cols-1-3", 2, "cols", ["1 3"]),
  p("collage-2-cols-3-1", 2, "cols", ["3 1"]),
  p("collage-2-cols-2-3", 2, "cols", ["2 3"]),
  p("collage-2-cols-3-2", 2, "cols", ["3 2"]),

  // ==========================================
  // 3 IMAGES (14 configs)
  // ==========================================
  p("collage-3-hero-left", 3, "cols", ["1", "2"]),
  p("collage-3-hero-right", 3, "cols", ["2", "1"]),
  p("collage-3-hero-top", 3, "rows", ["1", "2"]),
  p("collage-3-hero-bottom", 3, "rows", ["2", "1"]),
  p("collage-3-cols", 3, "cols", ["1", "1", "1"]),
  p("collage-3-rows", 3, "rows", ["1", "1", "1"]),
  p("collage-3-hero-top-left-asym", 3, "rows", ["2 1", "1"]),
  p("collage-3-hero-top-right-asym", 3, "rows", ["1 2", "1"]),
  p("collage-3-hero-bot-left-asym", 3, "rows", ["1", "2 1"]),
  p("collage-3-hero-bot-right-asym", 3, "rows", ["1", "1 2"]),
  p("collage-3-hero-left-top-asym", 3, "cols", ["2 1", "1"]),
  p("collage-3-hero-left-bot-asym", 3, "cols", ["1 2", "1"]),
  p("collage-3-hero-right-top-asym", 3, "cols", ["1", "2 1"]),
  p("collage-3-hero-right-bot-asym", 3, "cols", ["1", "1 2"]),

  // ==========================================
  // 4 IMAGES (14 configs)
  // ==========================================
  p("collage-4-grid-2x2", 4, "rows", ["2", "2"]),
  p("collage-4-hero-left", 4, "cols", ["1", "3"]),
  p("collage-4-hero-right", 4, "cols", ["3", "1"]),
  p("collage-4-hero-top", 4, "rows", ["1", "3"]),
  p("collage-4-hero-bottom", 4, "rows", ["3", "1"]),
  p("collage-4-cols", 4, "cols", ["1", "1", "1", "1"]),
  p("collage-4-rows", 4, "rows", ["1", "1", "1", "1"]),
  p("collage-4-1-2-1-rows", 4, "rows", ["1", "2", "1"]),
  p("collage-4-1-2-1-cols", 4, "cols", ["1", "2", "1"]),
  p("collage-4-2-1-1-cols", 4, "cols", ["2", "1", "1"]),
  p("collage-4-1-1-2-cols", 4, "cols", ["1", "1", "2"]),
  p("collage-4-2-1-1-rows", 4, "rows", ["2", "1", "1"]),
  p("collage-4-1-1-2-rows", 4, "rows", ["1", "1", "2"]),
  p("collage-4-asym-rows", 4, "rows", ["1 2", "2 1"]),

  // ==========================================
  // 5 IMAGES (10 configs)
  // ==========================================
  p("collage-5-hero-left-4grid", 5, "cols", ["1", "2", "2"]),
  p("collage-5-hero-right-4grid", 5, "cols", ["2", "2", "1"]),
  p("collage-5-hero-top-4grid", 5, "rows", ["1", "4"]),
  p("collage-5-hero-bottom-4grid", 5, "rows", ["4", "1"]),
  p("collage-5-2-3-rows", 5, "rows", ["2", "3"]),
  p("collage-5-3-2-rows", 5, "rows", ["3", "2"]),
  p("collage-5-2-3-cols", 5, "cols", ["2", "3"]),
  p("collage-5-3-2-cols", 5, "cols", ["3", "2"]),
  p("collage-5-1-3-1-rows", 5, "rows", ["1", "3", "1"]),
  p("collage-5-hero-center-col", 5, "cols", ["2", "1", "2"]),

  // ==========================================
  // 6 IMAGES (10 configs)
  // ==========================================
  p("collage-6-grid-3x2", 6, "rows", ["3", "3"]),
  p("collage-6-grid-2x3", 6, "rows", ["2", "2", "2"]),
  p("collage-6-hero-left-5split", 6, "cols", ["1", "5"]),
  p("collage-6-hero-right-5split", 6, "cols", ["5", "1"]),
  p("collage-6-hero-top-5split", 6, "rows", ["1", "5"]),
  p("collage-6-hero-bottom-5split", 6, "rows", ["5", "1"]),
  p("collage-6-1-4-1-rows", 6, "rows", ["1", "4", "1"]),
  p("collage-6-1-4-1-cols", 6, "cols", ["1", "4", "1"]),
  p("collage-6-2-2-2-asym", 6, "rows", ["1 2", "2 1", "1 2"]),
  p("collage-6-cols", 6, "cols", ["1", "1", "1", "1", "1", "1"]),

  // ==========================================
  // 7 IMAGES (8 configs)
  // ==========================================
  p("collage-7-3-4-rows", 7, "rows", ["3", "4"]),
  p("collage-7-4-3-rows", 7, "rows", ["4", "3"]),
  p("collage-7-hero-top-6grid", 7, "rows", ["1", "3", "3"]),
  p("collage-7-hero-bottom-6grid", 7, "rows", ["3", "3", "1"]),
  p("collage-7-hero-left-6grid", 7, "cols", ["1", "3", "3"]),
  p("collage-7-hero-right-6grid", 7, "cols", ["3", "3", "1"]),
  p("collage-7-2-3-2-rows", 7, "rows", ["2", "3", "2"]),
  p("collage-7-1-5-1-rows", 7, "rows", ["1", "5", "1"]),

  // ==========================================
  // 8 IMAGES (8 configs)
  // ==========================================
  p("collage-8-grid-4x2", 8, "rows", ["4", "4"]),
  p("collage-8-grid-2x4", 8, "rows", ["2", "2", "2", "2"]),
  p("collage-8-3-2-3-rows", 8, "rows", ["3", "2", "3"]),
  p("collage-8-2-4-2-rows", 8, "rows", ["2", "4", "2"]),
  p("collage-8-hero-top-7split", 8, "rows", ["1", "7"]),
  p("collage-8-hero-bottom-7split", 8, "rows", ["7", "1"]),
  p("collage-8-hero-left-7split", 8, "cols", ["1", "7"]),
  p("collage-8-hero-right-7split", 8, "cols", ["7", "1"]),

  // ==========================================
  // 9 IMAGES (6 configs)
  // ==========================================
  p("collage-9-grid-3x3", 9, "rows", ["3", "3", "3"]),
  p("collage-9-2-5-2-rows", 9, "rows", ["2", "5", "2"]),
  p("collage-9-4-1-4-rows", 9, "rows", ["4", "1", "4"]),
  p("collage-9-hero-top-8grid", 9, "rows", ["1", "4", "4"]),
  p("collage-9-hero-bottom-8grid", 9, "rows", ["4", "4", "1"]),
  p("collage-9-3-3-3-cols", 9, "cols", ["3", "3", "3"]),

  // ==========================================
  // 10 IMAGES (6 configs)
  // ==========================================
  p("collage-10-grid-5x2", 10, "rows", ["5", "5"]),
  p("collage-10-3-4-3-rows", 10, "rows", ["3", "4", "3"]),
  p("collage-10-4-2-4-rows", 10, "rows", ["4", "2", "4"]),
  p("collage-10-hero-top-9grid", 10, "rows", ["1", "3", "3", "3"]),
  p("collage-10-hero-bottom-9grid", 10, "rows", ["3", "3", "3", "1"]),
  p("collage-10-2-3-3-2-rows", 10, "rows", ["2", "3", "3", "2"]),
];
