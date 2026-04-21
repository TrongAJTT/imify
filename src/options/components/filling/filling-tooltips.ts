export const FILLING_TOOLTIPS = {
  fillCanvas: {
    overrideLayerBorders: "Override the border settings for all layers in the canvas.",
    gradientMode:
      `For gradient border color:
      - Per Layer = separate gradient per shape.
      - Unified = one shared gradient across whole canvas.`,
    overrideCornerRadius: "Override the corner radius settings for all layers in the canvas.",
  },
  fillLayerCustomization: {
    clearImage: "Clear image",
    replaceImage: "Replace image",
    borderDisabled: "Disabled because Canvas border override is enabled.",
    radiusDisabled: "Disabled because Canvas corner radius override is enabled.",
  },
  fillLayerAccordion: {
    scaleInPercentage: "Scale in percentage",
  },
  fillTransformControls: {
    resetRotation: "Reset rotation",
    scaleInPercentage: "Scale in percentage",
  },
  layerProperties: {
    rotationInDegrees: "Rotation in degrees",
  },
  manualLayerList: {
    ungroupSelectedLayer: "Ungroup the selected layer from its current group.",
    groupSelectedLayer:
      "Group the selected layer. If it is already grouped, this button will ungroup it.",
    addShapeLayer: "Add a new shape layer.",
  },
  symmetricSidebar: {
    mainAxisDirection: "Direction of the main axes",
    numberOfAxes: "How many parallel axes to generate",
    baseLength: "Length of the base edge on the primary side of each generated shape.",
    sideLength: "Distance between the two parallel axes used by each generated shape.",
    oppositeLength: "Length of the edge opposite to Base Length. Set 0 to collapse into a triangle.",
    oppositeOffset:
      "Offset of the opposite base relative to the main base along the appearance axis.",
    axisSpacing: "Gap between main axes",
    shapeSpacing: "Gap between shapes on same axis",
    firstShapePosition: "Offset of the first shape on each axis",
    firstAxisPosition: "Position of the first axis on the perpendicular coordinate",
    oddEvenAxisOffset: "Offset applied to even-numbered axes for diagonal patterns",
    oddEvenShapeReverse:
      "Creates interleaving symmetric patterns by reversing shape orientation on odd/even sequence.",
  },
} as const
