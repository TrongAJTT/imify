import type { FillCustomizationTab } from "@/options/stores/fill-ui-store"

export type LayerContainerHighlightMode = "none" | "missing" | "focus"

export function resolveLayerContainerHighlightMode(
  isSelected: boolean,
  hasImage: boolean,
  tab: FillCustomizationTab
): LayerContainerHighlightMode {
  if (!isSelected) return "none"

  if (tab === "image") {
    return hasImage ? "none" : "missing"
  }

  return "focus"
}
