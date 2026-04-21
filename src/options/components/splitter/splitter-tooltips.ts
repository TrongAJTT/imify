export const SPLITTER_TOOLTIPS = {
  colorMatchGridFallback:
    "Color Match only works with a single axis. Grid is currently treated as vertical splitting.",
  colorMatchOffset:
    "Moves the cut position away from the detected matching line/column. Positive values cut later, negative values cut earlier.",
  colorMatchTolerance:
    "How close a pixel color must be to your rule color to count as a match. Higher values are more lenient.",
  colorMatchSkipBefore:
    "Requires this many consecutive matching lines/columns before the current one before a cut is allowed.",
  colorMatchBreakAfter:
    "After a cut is created, skip this many lines/columns before checking for the next cut.",
  safeZoneVarianceThreshold:
    "Lower values are stricter and avoid busy lines. Higher values accept more detail.",
  safeZoneSearchRadius:
    "How far to slide up/down (or left/right) from the detected line to find a safer cut.",
  safeZoneSearchStep:
    "Distance between candidate lines while searching for a safe zone.",
  spriteAlphaThreshold:
    "Pixels with alpha strictly greater than this value are treated as solid sprite pixels.",
  spriteMinArea:
    "Ignore tiny islands smaller than this area to reduce noise.",
  spritePadding:
    "Expand each detected sprite bounding box by this padding.",
  orderDialogLiveSequence:
    "This text reflects current horizontal/vertical direction and priority axis."
} as const

export const SPLITTER_BASIC_METHOD_TABLE_ROWS = [
  { method: "Count", description: "Split into an equal number of slices." },
  { method: "Percent", description: "Split by repeated percentage size." },
  { method: "Pixel", description: "Split by repeated fixed pixel size." }
] as const

export const SPLITTER_ADVANCED_METHOD_TABLE_ROWS = [
  { method: "Pixel Pattern", description: "Repeat pixel sequence." },
  { method: "Percent Pattern", description: "Repeat percentage sequence." },
  { method: "Custom List", description: "Manual guides with unit and edge." },
  { method: "Social Carousel", description: "Fixed-ratio carousel slices." },
  { method: "Gutter & Margin Grid", description: "Grid with margin/gutter controls." },
  { method: "Auto Sprite Extractor", description: "Detect alpha islands as sprite boxes." },
  { method: "Color Match", description: "Cut by color-based line detection." }
] as const
