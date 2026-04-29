import React from "react"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS } from "../shared/media-assets"

export function InspectorPresetInfoPanel() {
  return (
    <PresetInfoShowcasePanel
      title="Image Inspector"
      subtitle="Deep audit for hidden data and visual performance. Uncover EXIF tags, GPS coordinates, dominant color palettes, and privacy risks."
      previewSrc={FEATURE_MEDIA_ASSET_PATHS.inspector.previewWebp}
      previewAlt="Image Inspector Preview"
      featureChips={[
        "EXIF Deep Audit",
        "GPS Map Integration",
        "Privacy Alerts",
        "Color Palette",
        "Web Perf Analysis",
        "Color Blind Sim"
      ]}
      tips={[
        "The Privacy Alert section highlights sensitive data like camera serial numbers or precise locations.",
        "Use the Color Blind Simulator to ensure your image remains accessible to everyone.",
        "The Color Palette extractor provides HEX codes and dominant ratios for any image.",
        "Check the Web Performance card to see how well your image is optimized for modern browsers."
      ]}
      faqs={[
        {
          question: "What metadata can be detected?",
          answer: "Imify can read hundreds of EXIF, IPTC, and XMP tags, including camera settings, software used, and creation timestamps."
        },
        {
          question: "How does the Privacy Alert system work?",
          answer: "It scans for tags that might identify you personally (like GPS coordinates, names, or device IDs) and marks them with high-visibility warnings."
        },
        {
          question: "Can I extract colors for my design?",
          answer: "Yes, the Palette section automatically extracts the most prominent colors and allows you to copy their HEX values instantly."
        }
      ]}
    />
  )
}
