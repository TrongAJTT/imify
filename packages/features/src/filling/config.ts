

// Workspace constants
export const CANVAS_PADDING = 40;
export const PREVIEW_MIN_ZOOM = 50;
export const PREVIEW_MAX_ZOOM = 10000;
export const PREVIEW_ZOOM_FACTOR = 0.15;
export const IMAGE_HITBOX_PADDING = 50;
export const PREVIEW_ZOOM_STEP = 10;
export const ROTATE_CURSOR = "crosshair";
export const FIRST_CONTROL_ID = "first_axis_first_shape";
export const SECOND_CONTROL_ID = "first_axis_second_shape";
export const THIRD_CONTROL_ID = "second_axis_first_shape";

export type SymmetricControlId =
  | typeof FIRST_CONTROL_ID
  | typeof SECOND_CONTROL_ID
  | typeof THIRD_CONTROL_ID;

// Transform guides constants
export const DEFAULT_ROTATION_STEP = 45;
export const DEFAULT_ROTATION_TOLERANCE = 4;
export const DEFAULT_POSITION_TOLERANCE = 8;

// Drag swap threshold constant
export const LAYER_SWAP_HOVER_RADIUS = 80;

// Aspect ratio options & helpers


// Grid designer presets
export interface GridTemplatePreset {
  id: string;
  label: string;
  templateString: string;
}

export const GRID_TEMPLATE_PRESETS: GridTemplatePreset[] = [
  {
    id: "horizontal-3",
    label: "3 horiz columns",
    templateString: "R:1:-:-",
  },
  {
    id: "vertical-3",
    label: "3 vertical columns",
    templateString: "C:1:-:-",
  },
  {
    id: "row3-col2",
    label: "Left Rail + Right Stack",
    templateString: "R:1a 2:1a 1 1:1",
  },
  {
    id: "row3-col3",
    label: "Alternating Split",
    templateString: "R:2 1:1 2:2 1",
  },
  {
    id: "row3-col4",
    label: "Top-Right Merge",
    templateString: "R:1 2a:-:3",
  },
  {
    id: "row3-col5",
    label: "Top-Left Merge",
    templateString: "R:2a 1:-:1 2",
  },
  {
    id: "grid-2x2",
    label: "2x2 Uniform Grid",
    templateString: "R:2:-",
  },
  {
    id: "grid-3x3",
    label: "3x3 Uniform Grid",
    templateString: "R:3:-:-",
  },
  {
    id: "col-2x2",
    label: "2 Columns (2 rows each)",
    templateString: "C:2:-",
  },
  {
    id: "hero-top-3col-bottom",
    label: "Hero Top + 3 Cols Bottom",
    templateString: "R:1:3",
  },
  {
    id: "3col-top-hero-bottom",
    label: "3 Cols Top + Hero Bottom",
    templateString: "R:3:1",
  },
  {
    id: "left-hero-right-2row",
    label: "Left Hero + Right Stack",
    templateString: "C:1a 1:-",
  },
];
