export const GRID_DESIGN_TOOLTIPS = {
  rowCount: "Set how many horizontal rows the layout should generate.",
  outerPadding: "Spacing between the canvas edge and the generated grid.",
  gapX: "Horizontal spacing between grid cells.",
  gapY: "Vertical spacing between grid cells.",
  rowDefinition:
    'Enter one value for equal columns, or ratios separated by spaces such as "2 1". Add an indicator like "#" or "@" to merge matching cells across adjacent rows.',
  uniformColumns: "Use one shared row definition for every row.",
} as const
