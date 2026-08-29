import type { GridDesignParams } from "../filling/types";

export const MAX_COLLAGE_IMAGES = 10;
export const MIN_COLLAGE_IMAGES = 2;
export const COLLAGE_DEFAULT_NAME_PREFIX = "imify-collage";
const DEFAULT_OUTER_PADDING = 20;
const DEFAULT_GAP = 16;

export const DEFAULT_COLLAGE_PRESET_COLOR = "#94a3b8";

export interface CollageLayoutPreset {
  id: string;
  name?: string;
  imageCount: number;
  params: GridDesignParams;
  highlightColor?: string;
}

const p = (
  id: string,
  imageCount: number,
  direction: "cols" | "rows",
  rowDefinitions: string[],
  name?: string,
  highlightColor: string = DEFAULT_COLLAGE_PRESET_COLOR,
): CollageLayoutPreset => {
  const match = id.match(/default-(\d+)$/i);
  const defaultName = match ? `Default ${imageCount}x${match[1]}` : undefined;
  return {
    id,
    name: name ?? defaultName,
    imageCount,
    highlightColor,
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
  };
};

export const COLLAGE_LAYOUT_PRESETS: CollageLayoutPreset[] = [
  // ==========================================
  // 2 IMAGES
  // ==========================================
  p("collage-2-default-1", 2, "rows", ["2"]),
  p("collage-2-default-2", 2, "cols", ["1", "1a", "1a"]),
  p("collage-2-default-3", 2, "cols", ["1", "1a", "1a", "1a"]),
  p("collage-2-default-4", 2, "cols", ["1a", "1a", "1b", "1b", "1b"]),

  // ==========================================
  // 3 IMAGES
  // ==========================================
  p("collage-3-default-1", 3, "rows", ["3"]),
  p("collage-3-default-2", 3, "rows", ["1e 1e 1a 1aC", "1e 1b 1b 1ba", "1c 1c 1cb 1f", "1d 1dc 1f 1f"]),
  p("collage-3-default-3", 3, "cols", ["1", "2"]),
  p("collage-3-default-4", 3, "rows", ["1a 2", "1a 2"]),
  p("collage-3-default-5", 3, "cols", ["1", "2 1"]),
  p("collage-3-default-6", 3, "rows", ["2", "1a", "="]),
  p("collage-3-default-7", 3, "rows", ["1a 1b", "=", "1c", "=", "="]),

  // ==========================================
  // 4 IMAGES
  // ==========================================
  p("collage-4-default-1", 4, "rows", ["4"]),
  p("collage-4-default-2", 4, "rows", ["2", "2"]),
  p("collage-4-default-3", 4, "cols", ["1", "3"]),
  p("collage-4-default-4", 4, "cols", ["1", "2", "1"]),
  p("collage-4-default-5", 4, "cols", ["1 2", "2 1"]),
  p("collage-4-default-6", 4, "cols", ["1 2", "1 2"]),
  p("collage-4-default-7", 4, "cols", ["1 1a", "1 1a", "1"]),
  p("collage-4-default-8", 4, "cols", ["3 2a", "3 2a", "1"]),
  p("collage-4-default-9", 4, "cols", ["2 1a", "2 1a", "1"]),

  // ==========================================
  // 5 IMAGES
  // ==========================================
  p("collage-5-default-1", 5, "cols", ["1", "3", "1"]),
  p("collage-5-default-2", 5, "cols", ["2", "1", "2"]),
  p("collage-5-default-3", 5, "cols", ["2", "3"]),
  p("collage-5-default-4", 5, "cols", ["1", "4"]),
  p("collage-5-default-5", 5, "cols", ["1", "1a 1b 1c 1d", "="]),
  p("collage-5-default-6", 5, "cols", ["1", "1a 1b 1", "1a 1b 1"]),
  p("collage-5-default-7", 5, "cols", ["1", "1a 1b 2", "1a 1b 2"]),
  p("collage-5-default-8", 5, "rows", ["2a 3 3", "2a 3 3"]),
  p("collage-5-default-9", 5, "rows", ["3 2a 3", "3 2a 3"]),

  // ==========================================
  // 6 IMAGES
  // ==========================================
  p("collage-6-default-1", 6, "rows", ["2", "2", "2"]),
  p("collage-6-default-2", 6, "rows", ["1", "2", "3"]),
  p("collage-6-default-3", 6, "rows", ["1", "1a 2b 1c", "1a 2b 1c", "2"]),
  p("collage-6-default-4", 6, "cols", ["1", "4", "1"]),
  p("collage-6-default-5", 6, "rows", ["1 2", "2 1", "1 2"]),
  p("collage-6-default-6", 6, "rows", ["6"]),
  p("collage-6-default-7", 6, "rows", ["3 2a 2b", "=", "=", "="]),
  p("collage-6-default-8", 6, "rows", ["2a 3 2b", "=", "=", "="]),
  p("collage-6-default-9", 6, "rows", ["1a 1", "=", "1 1a", "="]),
  p("collage-6-default-10", 6, "rows", ["2a 1 1", "2a 1 1", "1"]),
  p("collage-6-default-11", 6, "rows", ["2a 3", "=", "3 2a", "="]),
  p("collage-6-default-12", 6, "rows", ["2", "1a 1b", "1a 1b", "2"]),
  p("collage-6-default-13", 6, "cols", ["3", "1", "1", "1"]),
  p("collage-6-default-14", 6, "rows", ["1", "2a 1b 1c", "2a 1b 1c", "2"]),
  p("collage-6-default-15", 6, "rows", ["3 2a 2b 2c", "=", "="]),
  p("collage-6-default-16", 6, "rows", ["2a 3 2b 2c", "=", "="]),
  p("collage-6-default-17", 6, "rows", ["1 1a", "=", "=", "=", "="]),
  p("collage-6-default-18", 6, "rows", ["2 3a", "=", "=", "=", "="]),

  // ==========================================
  // 7 IMAGES
  // ==========================================
  p("collage-7-default-1", 7, "rows", ["4", "3"]),
  p("collage-7-default-2", 7, "rows", ["3", "1", "3"]),
  p("collage-7-default-3", 7, "rows", ["2", "3", "2"]),
  p("collage-7-default-4", 7, "rows", ["1", "5", "1"]),
  p("collage-7-default-5", 7, "cols", ["2 1", "2 1", "3"]),
  p("collage-7-default-6", 7, "cols", ["2 1", "1 2", "3"]),
  p("collage-7-default-7", 7, "rows", ["2", "1a 1b", "=", "3"]),
  p("collage-7-default-8", 7, "rows", ["2", "1a 1b 1c", "=", "2"]),
  p("collage-7-default-9", 7, "rows", ["3", "1a", "1a", "3"]),
  p("collage-7-default-10", 7, "rows", ["3", "1a", "1a", "1a", "3"]),
  p("collage-7-default-11", 7, "cols", ["1a 1b", "=", "=", "1a 1c", "=", "=", "1e 1d", "=", "1f 1d", "=", "1g 1d", "="]),
  p("collage-7-default-12", 7, "cols", ["2a 1b 1c", "=", "=", "1f 1d", "1e 1d", "1g 1d"]),
  p("collage-7-default-13", 7, "cols", ["1a 1b", "=", "2b 1 1", "2b 1 1"]),
  p("collage-7-default-14", 7, "rows", ["2", "1a 2b 1c", "=", "2"]),
  
  // ==========================================
  // 8 IMAGES
  // ==========================================
  p("collage-8-default-1", 8, "rows", ["4", "4"]),
  p("collage-8-default-2", 8, "rows", ["3", "2", "3"]),
  p("collage-8-default-3", 8, "rows", ["2", "4", "2"]),
  p("collage-8-default-4", 8, "cols", ["2 1", "1 2", "2 1", "1 2"]),
  p("collage-8-default-5", 8, "cols", ["1a 1b", "=", "2", "4"]),
  p("collage-8-default-6", 8, "cols", ["1", "1", "1 1 2", "1 1 2"]),
  p("collage-8-default-7", 8, "cols", ["1", "1", "1 1 2", "2 1 1"]),
  p("collage-8-default-8", 8, "cols", ["1", "1", "1 1 2", "1 2 1"]),
  p("collage-8-default-9", 8, "cols", ["1", "1", "1 2 1", "1 2 1"]),
  p("collage-8-default-10", 8, "cols", ["1a 1b", "=", "1c 1 1 1d", "="]),
  p("collage-8-default-11", 8, "cols", ["1a 1b", "=", "1 1c 1d 1", "="]),
  p("collage-8-default-12", 8, "cols", ["2a 1c 1", "=", "1 1c 2a", "="]),
  p("collage-8-default-13", 8, "cols", ["2", "1", "2", "1", "2"]),
  p("collage-8-default-14", 8, "cols", ["1", "7"]),
  
  // ==========================================
  // 9 IMAGES
  // ==========================================
  p("collage-9-default-1", 9, "rows", ["3", "3", "3"]),
  p("collage-9-default-2", 9, "rows", ["3", "1a 1b 1c", "=", "3"]),
  p("collage-9-default-3", 9, "rows", ["2", "5", "2"]),
  p("collage-9-default-4", 9, "rows", ["4", "1", "4"]),
  p("collage-9-default-5", 9, "rows", ["1", "3", "2", "3"]),
  p("collage-9-default-6", 9, "rows", ["2", "2", "3", "2"]),
  p("collage-9-default-7", 9, "rows", ["2", "2", "1", "2", "2"]),
  p("collage-9-default-8", 9, "rows", ["2", "1 2a 1", "=", "2"]),
  p("collage-9-default-9", 9, "rows", ["2", "2a 1 1", "=", "2"]),
  p("collage-9-default-10", 9, "cols", ["2a 1 1", "=", "1d 1c 1b 1a", "="]),
  p("collage-9-default-11", 9, "cols", ["1a 1b", "=", "1c 1 1 1", "="]),
  p("collage-9-default-12", 9, "cols", ["1a 1b", "=", "1 1c 1 1", "="]),
  p("collage-9-default-13", 9, "cols", ["2c 1b 1", "=", "1 1 2a", "="]),
  p("collage-9-default-14", 9, "cols", ["2c 1b 1b", "2c 1 1", "1 1 2a", "="]),
  p("collage-9-default-15", 9, "cols", ["2c 1b 1", "=", "1 2a 1", "="]),
  p("collage-9-default-16", 9, "cols", ["1a", "=", "4", "4"]),
  
  // ==========================================
  // 10 IMAGES
  // ==========================================
  p("collage-10-default-1", 10, "rows", ["5", "5"]),
  p("collage-10-default-2", 10, "rows", ["3", "4", "3"]),
  p("collage-10-default-3", 10, "rows", ["4", "2", "4"]),
  p("collage-10-default-4", 10, "rows", ["2", "3", "3", "2"]),
  p("collage-10-default-5", 10, "rows", ["1", "3", "3", "3"]),
  p("collage-10-default-6", 10, "cols", ["2a 1 1", "=", "1 1 2a", "="]),
  p("collage-10-default-7", 10, "cols", ["2a 1 1", "=", "1b 1c 1d 1", "="]),
  p("collage-10-default-8", 10, "cols", ["2a 1b 1", "=", "1c 1d 1 1", "="]),
  p("collage-10-default-9", 10, "cols", ["2a 1b 1", "=", "1 1c 1d 1", "="]),
  p("collage-10-default-10", 10, "cols", ["1a 2b 1", "=", "1 1c 1d 1", "="]),
  p("collage-10-default-11", 10, "cols", ["2a 1 1", "=", "2b 1 1", "="]),
  p("collage-10-default-12", 10, "cols", ["2a 1 1", "=", "1 2b 1", "="]),
];
