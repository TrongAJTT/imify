import React from "react"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS } from "../shared/media-assets"

export function DiffcheckerPresetInfoPanel() {
  return (
    <PresetInfoShowcasePanel
      title="Difference Checker"
      subtitle="Compare images with pixel-level precision. Detect compression artifacts, color shifts, and visual regressions instantly."
      previewSrc={FEATURE_MEDIA_ASSET_PATHS.diffchecker.previewWebp}
      previewAlt="Difference Checker Preview"
      featureChips={[
        "Side-by-Side",
        "Split-View",
        "Overlay Mode",
        "Heatmap Diff",
        "Threshold Control",
        "Pixel Alignment"
      ]}
      tips={[
        "Use the Split-View to quickly wipe between images and spot subtle layout shifts.",
        "The Heatmap mode highlights even the smallest color deviations in bright red.",
        "Adjust Overlay Opacity to see how two images stack up against each other.",
        "Zoom and Pan are synchronized across both images for precise comparison."
      ]}
      faqs={[
        {
          question: "How does the Heatmap algorithm work?",
          answer: "It calculates the per-pixel difference between Image A and B. Any mismatch is highlighted with a color intensity proportional to the difference."
        },
        {
          question: "Can I compare images of different sizes?",
          answer: "Yes! Use the Alignment settings to fit, stretch, or anchor images to the center, top-left, etc. to align them perfectly."
        },
        {
          question: "Is this tool suitable for quality testing?",
          answer: "Absolutely. It's designed for designers and developers to verify compression quality and visual consistency after image processing."
        }
      ]}
    />
  )
}
