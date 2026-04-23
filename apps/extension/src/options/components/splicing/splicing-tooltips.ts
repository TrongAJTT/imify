export const SPLICING_TOOLTIPS = {
  previewZoom: {
    label: "Zoom",
    controlsHelp: "Hold and drag left/right to scrub zoom.\nClick to type exact value (min 50%).",
  },
  layout: {
    splitOverflow: {
      label: "Split overflow at max size",
      content:
        "When enabled, Bento Vertical/Horizontal keeps the remaining space in the current column/row by slicing only the overflowing part of the image, then continues that remainder in the next column/row."
    }
  }
} as const
