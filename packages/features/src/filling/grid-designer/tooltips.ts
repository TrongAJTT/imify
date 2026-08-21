export const GRID_DESIGN_TOOLTIPS = {
  rowCount: "Set how many horizontal rows the layout should generate.",
  outerPadding: "Spacing between the canvas edge and the generated grid.",
  gapX: "Horizontal spacing between grid cells.",
  gapY: "Vertical spacing between grid cells.",
  rowDefinition:
    'Enter one value for equal columns, or ratios separated by spaces such as "2 1". Add lowercase indicators like "a" to merge matching cells, suffix "T" for text layers (e.g. "1T", "1Ta", "1-T-a"), or "=" to repeat the previous row.',
  uniformColumns: "Use one shared row definition for every row.",
} as const

