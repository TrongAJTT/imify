export const PATTERN_TOOLTIPS = {
  settings: {
    density: "Higher values pack more assets into the same area.",
    baseScale: "Asset size multiplier before random variance.",
    scaleVariance: "Random scale deviation around base scale.",
    seed: "Same seed + same settings = repeatable layout."
  },
  assetSettings: {
    overrideMode:
      "Per Asset: apply gradient/paint per layer tile. Unified: one shared color field across the full canvas."
  },
  assets: {
    clearAllAssets: "Clear all assets"
  },
  drawingDialog: {
    curveSmoothingLabel: "Curve Smoothing",
    curveSmoothingContent: "Enable perfect-freehand smoothing for cleaner curves and less jitter.",
    brushSizeShortcutsLabel: "Brush Size Shortcuts",
    undoStroke: "Revert the most recent stroke.",
    clearCanvas: "Clear the source layer and all drawn strokes.",
    unsavedChangesConfirm: "You have unsaved drawing progress. Close without saving?"
  }
} as const


