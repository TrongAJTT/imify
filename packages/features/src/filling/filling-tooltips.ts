import {
  FILL_CANVAS_TOOLTIPS,
  FILL_LAYER_ACCORDION_TOOLTIPS,
  FILL_LAYER_CUSTOMIZATION_TOOLTIPS,
  FILL_LAYER_PROPERTIES_TOOLTIPS,
  FILL_TRANSFORM_CONTROL_TOOLTIPS
} from "@imify/features/filling/tooltips/fill-tooltips"
import {
  MANUAL_EDITOR_VISUAL_HELP_TOOLTIPS,
  MANUAL_LAYER_LIST_TOOLTIPS
} from "@imify/features/filling/tooltips/manual-editor-tooltips"
import {
  SYMMETRIC_SIDEBAR_TOOLTIPS,
  SYMMETRIC_VISUAL_HELP_TOOLTIPS
} from "@imify/features/filling/symmetric-tooltips"

export const FILLING_TOOLTIPS = {
  fillCanvas: FILL_CANVAS_TOOLTIPS,
  fillLayerCustomization: FILL_LAYER_CUSTOMIZATION_TOOLTIPS,
  fillLayerAccordion: FILL_LAYER_ACCORDION_TOOLTIPS,
  fillTransformControls: FILL_TRANSFORM_CONTROL_TOOLTIPS,
  layerProperties: FILL_LAYER_PROPERTIES_TOOLTIPS,
  manualLayerList: MANUAL_LAYER_LIST_TOOLTIPS,
  symmetricSidebar: SYMMETRIC_SIDEBAR_TOOLTIPS,
  visualHelp: {
    manualEditor: MANUAL_EDITOR_VISUAL_HELP_TOOLTIPS,
    symmetricGenerator: SYMMETRIC_VISUAL_HELP_TOOLTIPS
  }
} as const
