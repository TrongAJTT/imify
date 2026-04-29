import React from "react"
import { PresetInfoShowcasePanel } from "@imify/features/shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS, resolveFeatureMediaAssetUrl } from "@imify/features/shared/media-assets"

export function ContextMenuInfoPanel() {
  return (
    <PresetInfoShowcasePanel
      previewSrc={resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.contextMenu.previewWebp)}
      previewAlt="Context Menu settings preview with global formats and sorting controls"
      previewAspectRatio="16 / 9"
      title="Context Menu"
      subtitle="Convert web images directly from right-click with curated formats, custom presets, and adaptive sorting."
      tips={[
        "Pin up to 2 items so your favorite conversions stay at the top of the menu.",
        "Use Most used (stable) to adapt ordering over time without constantly reshuffling entries.",
        "Global format cards and Custom presets are shared with the app's conversion logic for consistent output.",
        "The menu appears only on image targets, so normal page context menus stay clean.",
      ]}
      featureChips={[
        "Right-click Convert",
        "Pinned Favorites",
        "Stable Usage Sorting",
        "Global + Custom Presets",
        "Background Runtime",
        "Live Preview",
      ]}
      faqs={[
        {
          question: "When does the Imify context menu appear?",
          answer:
            "Only when right-clicking an image element. This keeps the menu focused and avoids clutter on non-image targets.",
        },
        {
          question: "What is the difference between Global Formats and Custom Presets?",
          answer:
            "Global Formats are built-in profiles you can enable, reorder, and tweak. Custom Presets are user-defined conversion profiles with advanced codec controls and reusable settings.",
        },
        {
          question: "How does Most used (stable) work?",
          answer:
            "The menu tracks usage counts and promotes frequently used items gradually using a threshold-based swap rule, so ordering improves over time while preserving muscle memory.",
        },
        {
          question: "Do menu changes apply immediately?",
          answer:
            "Yes. Saving updates the extension state and triggers a context-menu rebuild in the background runtime.",
        },
        {
          question: "Are heavy formats like AVIF and JXL supported?",
          answer:
            "Yes. For heavier conversions, the background pipeline can leverage offscreen processing when available, with automatic fallback to standard conversion paths.",
        },
        {
          question: "Why might conversion fail on some sites?",
          answer:
            "Some pages enforce restrictions (for example protected pages or CORS fetch limits). In those cases, save the source image first and run conversion through Single or Batch Processor.",
        },
      ]}
    />
  )
}
