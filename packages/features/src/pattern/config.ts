import type { DrawingTool } from "./pattern-drawing-utils";

// Workspace constants -----

export const PREVIEW_PADDING = 16;
export const PREVIEW_MIN_ZOOM = 50;
export const PREVIEW_MAX_ZOOM = 2000;
export const PREVIEW_ZOOM_STEP = 10;
export const PREVIEW_ZOOM_FACTOR = 0.15;

// Drawing dialog ----------

export interface CanvasSize {
  width: number;
  height: number;
}

export const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 1024,
  height: 640,
};

export const DEFAULT_BRUSH_SIZE_BY_TOOL: Record<DrawingTool, number> = {
  brush: 10,
  eraser: 18,
};

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 120;
export const BRUSH_SIZE_STEP = 1;

export const DEFAULT_STREAMLINE_PERCENT = 65;
export const DEFAULT_SMOOTHING_PERCENT = 55;
