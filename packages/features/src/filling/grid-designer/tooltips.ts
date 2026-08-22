export const GRID_DESIGN_TOOLTIPS = {
  rowCount: "Set how many horizontal rows the layout should generate.",
  outerPadding: "Spacing between the canvas edge and the generated grid.",
  gapX: "Horizontal spacing between grid cells.",
  gapY: "Vertical spacing between grid cells.",
  rowDefinitionTitle: "Definition Guide:",
  rowDefinitionTips: [
    'Enter 1 number (e.g. "3"): Splits into equal cells.',
    'Enter ratios (e.g. "2 1", "1 2 1"): Customizes cell proportions.',
    'Merge indicators (e.g. "1ab 1b 1bc", "1a 2", "1a 1 1"): Merges matching lowercase letters (a-z) into connected chains.',
    'Suffix "C" (e.g. "1C", "1Cab"): Computes the Convex Hull of the merged cells instead of a bounding box.',
    'Suffix "T" (e.g. "1T", "1Ta", "1-T-a"): Parses the cell as a Text Layer.',
    'Enter "=": Inherits the exact definition from the previous row/column.',
  ],
  uniformColumns: "Use one shared row definition for every row.",
} as const

