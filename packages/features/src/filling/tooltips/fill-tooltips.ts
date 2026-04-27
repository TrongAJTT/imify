export const FILL_CANVAS_TOOLTIPS = {
  overrideLayerBordersLabel: "Override Layer Borders",
  overrideLayerBorders: "Override the border settings for all layers in the canvas.",
  gradientMode:
    `For gradient border color:
    - Per Layer = separate gradient per shape.
    - Unified = one shared gradient across whole canvas.`,
  overrideCornerRadiusLabel: "Override Corner Radius",
  overrideCornerRadius: "Override the corner radius settings for all layers in the canvas."
} as const

export const FILL_LAYER_CUSTOMIZATION_TOOLTIPS = {
  clearImage: "Clear image",
  replaceImage: "Replace image",
  borderDisabled: "Disabled because Canvas border override is enabled.",
  radiusDisabled: "Disabled because Canvas corner radius override is enabled."
} as const

export const FILL_LAYER_ACCORDION_TOOLTIPS = {
  scaleInPercentage: "Scale in percentage"
} as const

export const FILL_TRANSFORM_CONTROL_TOOLTIPS = {
  resetRotation: "Reset rotation",
  scaleInPercentage: "Scale in percentage"
} as const

export const FILL_LAYER_PROPERTIES_TOOLTIPS = {
  rotationInDegrees: "Rotation in degrees"
} as const
