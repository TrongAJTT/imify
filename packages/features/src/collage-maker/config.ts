import type { SavedSetupPreset } from "@imify/stores/stores/batch-store";
import { FEATURE_PRESET_PREFIXES } from "@imify/core/presets";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import type { GridDesignParams } from "../filling/types";

export const MAX_COLLAGE_IMAGES = 10;
export const MIN_COLLAGE_IMAGES = 2;
export const COLLAGE_DEFAULT_NAME_PREFIX = "imify-collage";

export interface CollageLayoutPreset {
  id: string;
  name: string;
  imageCount: number;
  params: GridDesignParams;
  svgPreview: string; // inline SVG paths or elements
}

export function useCollageIdentifiedPreset(): SavedSetupPreset {
  return {
    ...VIRTUAL_DEFAULT_PNG_PRESET,
    id: `${FEATURE_PRESET_PREFIXES.COLLAGE_MAKER}_identified`,
    name: "Collage Maker Preset",
    highlightColor: "#f59e0b",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false,
  };
}

export const COLLAGE_LAYOUT_PRESETS: CollageLayoutPreset[] = [
  // 2 Images
  {
    id: "collage-2-side-by-side",
    name: "2 Columns (Side-by-Side)",
    imageCount: 2,
    params: {
      direction: "cols",
      rowCount: 2,
      rowDefinitions: ["1", "1"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="42" height="90" rx="3" fill="#cbd5e1"/><rect x="53" y="5" width="42" height="90" rx="3" fill="#cbd5e1"/>`,
  },
  {
    id: "collage-2-stacked",
    name: "2 Rows (Stacked)",
    imageCount: 2,
    params: {
      direction: "rows",
      rowCount: 2,
      rowDefinitions: ["1", "1"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="90" height="42" rx="3" fill="#cbd5e1"/><rect x="5" y="53" width="90" height="42" rx="3" fill="#cbd5e1"/>`,
  },

  // 3 Images
  {
    id: "collage-3-hero-left",
    name: "Hero Left + 2 Right",
    imageCount: 3,
    params: {
      direction: "cols",
      rowCount: 2,
      rowDefinitions: ["1", "2"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="42" height="90" rx="3" fill="#cbd5e1"/><rect x="53" y="5" width="42" height="42" rx="3" fill="#cbd5e1"/><rect x="53" y="53" width="42" height="42" rx="3" fill="#cbd5e1"/>`,
  },
  {
    id: "collage-3-hero-top",
    name: "Hero Top + 2 Bottom",
    imageCount: 3,
    params: {
      direction: "rows",
      rowCount: 2,
      rowDefinitions: ["1", "2"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="90" height="42" rx="3" fill="#cbd5e1"/><rect x="5" y="53" width="42" height="42" rx="3" fill="#cbd5e1"/><rect x="53" y="53" width="42" height="42" rx="3" fill="#cbd5e1"/>`,
  },
  {
    id: "collage-3-cols",
    name: "3 Columns Equal",
    imageCount: 3,
    params: {
      direction: "cols",
      rowCount: 3,
      rowDefinitions: ["1", "1", "1"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="4" y="5" width="28" height="90" rx="3" fill="#cbd5e1"/><rect x="36" y="5" width="28" height="90" rx="3" fill="#cbd5e1"/><rect x="68" y="5" width="28" height="90" rx="3" fill="#cbd5e1"/>`,
  },

  // 4 Images
  {
    id: "collage-4-grid-2x2",
    name: "Grid 2x2",
    imageCount: 4,
    params: {
      direction: "rows",
      rowCount: 2,
      rowDefinitions: ["2", "2"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="42" height="42" rx="3" fill="#cbd5e1"/><rect x="53" y="5" width="42" height="42" rx="3" fill="#cbd5e1"/><rect x="5" y="53" width="42" height="42" rx="3" fill="#cbd5e1"/><rect x="53" y="53" width="42" height="42" rx="3" fill="#cbd5e1"/>`,
  },
  {
    id: "collage-4-hero-left",
    name: "Hero Left + 3 Right",
    imageCount: 4,
    params: {
      direction: "cols",
      rowCount: 2,
      rowDefinitions: ["1", "3"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="42" height="90" rx="3" fill="#cbd5e1"/><rect x="53" y="5" width="42" height="26" rx="3" fill="#cbd5e1"/><rect x="53" y="37" width="42" height="26" rx="3" fill="#cbd5e1"/><rect x="53" y="69" width="42" height="26" rx="3" fill="#cbd5e1"/>`,
  },

  // 5 Images
  {
    id: "collage-5-hero-center",
    name: "2 Top + 3 Bottom",
    imageCount: 5,
    params: {
      direction: "rows",
      rowCount: 2,
      rowDefinitions: ["2", "3"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="42" height="42" rx="3" fill="#cbd5e1"/><rect x="53" y="5" width="42" height="42" rx="3" fill="#cbd5e1"/><rect x="4" y="53" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="36" y="53" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="68" y="53" width="28" height="42" rx="3" fill="#cbd5e1"/>`,
  },
  {
    id: "collage-5-hero-left",
    name: "Hero Left + 4 Grid Right",
    imageCount: 5,
    params: {
      direction: "cols",
      rowCount: 3,
      rowDefinitions: ["C:1:2", "C:1:2", "C:1:1"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="5" y="5" width="42" height="90" rx="3" fill="#cbd5e1"/><rect x="53" y="5" width="42" height="20" rx="3" fill="#cbd5e1"/><rect x="53" y="30" width="42" height="20" rx="3" fill="#cbd5e1"/><rect x="53" y="55" width="20" height="40" rx="3" fill="#cbd5e1"/><rect x="75" y="55" width="20" height="40" rx="3" fill="#cbd5e1"/>`,
  },

  // 6 Images
  {
    id: "collage-6-grid-3x2",
    name: "Grid 3 Columns x 2 Rows",
    imageCount: 6,
    params: {
      direction: "rows",
      rowCount: 2,
      rowDefinitions: ["3", "3"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="4" y="5" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="36" y="5" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="68" y="5" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="4" y="53" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="36" y="53" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="68" y="53" width="28" height="42" rx="3" fill="#cbd5e1"/>`,
  },

  // 7 Images
  {
    id: "collage-7-mixed",
    name: "3 Top + 4 Bottom",
    imageCount: 7,
    params: {
      direction: "rows",
      rowCount: 2,
      rowDefinitions: ["3", "4"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="4" y="5" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="36" y="5" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="68" y="5" width="28" height="42" rx="3" fill="#cbd5e1"/><rect x="4" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="27" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="50" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="73" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/>`,
  },

  // 8 Images
  {
    id: "collage-8-grid-4x2",
    name: "Grid 4 Columns x 2 Rows",
    imageCount: 8,
    params: {
      direction: "rows",
      rowCount: 2,
      rowDefinitions: ["4", "4"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="4" y="5" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="27" y="5" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="50" y="5" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="73" y="5" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="4" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="27" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="50" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/><rect x="73" y="53" width="20" height="42" rx="3" fill="#cbd5e1"/>`,
  },

  // 9 Images
  {
    id: "collage-9-grid-3x3",
    name: "Grid 3x3",
    imageCount: 9,
    params: {
      direction: "rows",
      rowCount: 3,
      rowDefinitions: ["3", "3", "3"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="4" y="5" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="36" y="5" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="68" y="5" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="4" y="37" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="36" y="37" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="68" y="37" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="4" y="69" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="36" y="69" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="68" y="69" width="28" height="26" rx="3" fill="#cbd5e1"/>`,
  },

  // 10 Images
  {
    id: "collage-10-mixed",
    name: "3 Top + 4 Mid + 3 Bot",
    imageCount: 10,
    params: {
      direction: "rows",
      rowCount: 3,
      rowDefinitions: ["3", "4", "3"],
      outerPadding: 20,
      gapX: 16,
      gapY: 16,
      uniformColumns: false,
      uniformColumnsDef: "",
    },
    svgPreview: `<rect x="4" y="5" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="36" y="5" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="68" y="5" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="4" y="37" width="20" height="26" rx="3" fill="#cbd5e1"/><rect x="27" y="37" width="20" height="26" rx="3" fill="#cbd5e1"/><rect x="50" y="37" width="20" height="26" rx="3" fill="#cbd5e1"/><rect x="73" y="37" width="20" height="26" rx="3" fill="#cbd5e1"/><rect x="4" y="69" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="36" y="69" width="28" height="26" rx="3" fill="#cbd5e1"/><rect x="68" y="69" width="28" height="26" rx="3" fill="#cbd5e1"/>`,
  },
];
