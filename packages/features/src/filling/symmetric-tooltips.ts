export const SYMMETRIC_SIDEBAR_TOOLTIPS = {
  mainAxisDirection: "Direction of the main axes",
  numberOfAxes: "How many parallel axes to generate",
  baseLength: "Length of the base edge on the primary side of each generated shape.",
  sideLength: "Distance between the two parallel axes used by each generated shape.",
  oppositeLength: "Length of the edge opposite to Base Length. Set 0 to collapse into a triangle.",
  oppositeOffset: "Offset of the opposite base relative to the main base along the appearance axis.",
  axisSpacing: "Gap between main axes",
  shapeSpacing: "Gap between shapes on same axis",
  firstShapePosition: "Offset of the first shape on each axis",
  firstAxisPosition: "Position of the first axis on the perpendicular coordinate",
  oddEvenAxisOffset: "Offset applied to even-numbered axes for diagonal patterns",
  oddEvenShapeReverse: "Creates interleaving symmetric patterns by reversing shape orientation on odd/even sequence.",
} as const

export const SYMMETRIC_VISUAL_HELP_TOOLTIPS = {
  label: "Visual editing tips",
  description:
    `• You can adjust size and spacing visually using the first two components on the first main axis, and the first component on the second main axis.
    • Use arrow keys to nudge the selected control (hold Shift for larger steps).`,
  buttonAriaLabel: "Symmetric Generator visual editor help",
  mediaAlt: "Symmetric Generator visual editor",
} as const
