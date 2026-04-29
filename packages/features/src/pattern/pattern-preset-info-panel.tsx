import React from "react"
import { PresetInfoShowcasePanel } from "@imify/features/shared/preset-info-showcase-panel"

interface PatternPresetInfoPanelProps {
  compact?: boolean
}

export function PatternPresetInfoPanel({ compact = false }: PatternPresetInfoPanelProps) {
  const previewAspectRatio = compact ? "16 / 9" : "16 / 9"

  return (
    <PresetInfoShowcasePanel
      previewSrc="/assets/features/preview-pattern_generator.webp"
      previewAlt="Pattern Generator canvas and sidebar controls preview"
      previewAspectRatio={previewAspectRatio}
      title="Pattern Generator"
      subtitle="Build reusable pattern presets, control boundaries and distribution behavior, then export high-quality decorative compositions."
      tips={[
        "Use inbound and outbound boundaries together to tightly control where the pattern appears and where it must stay empty.",
        "Tune jitter, scale variance, and random rotation to make repeated assets feel natural instead of mechanically tiled.",
        "Workspace changes are auto-synced back into the active preset with debounce, so your latest configuration is retained.",
        "You can style each asset directly with monochrome, border, and corner radius before export.",
      ]}
      featureChips={[
        "Random Distribution",
        "Boundary Control",
        "Asset Layer Styling",
        "Auto-save Presets",
        "Advanced Export Codecs",
      ]}
      faqs={[
        {
          question: "What is Pattern Generator best used for?",
          answer:
            "It is ideal for decorative backgrounds such as social post canvases, thumbnails, and mockup backdrops where consistent style and repeatability are important.",
        },
        {
          question: "How do inbound and outbound boundaries work?",
          answer:
            "You can define geometric regions (rectangle or ellipse) where pattern elements must appear (inbound) and exclusion regions where elements must not appear (outbound), giving you precise coverage control.",
        },
        {
          question: "If I refresh the page, will I lose my setup?",
          answer:
            "Your configuration is preserved, but uploaded asset files are not. Settings such as spacing, rotation, and boundaries are synced back to the preset (debounced), while heavy image files are intentionally not persisted across sessions.",
        },
        {
          question: "Can I recolor assets after uploading them?",
          answer:
            "Yes. You can apply monochrome/color override globally or tune each asset individually with color, border, and corner radius controls directly in the workspace.",
        },
        {
          question: "Why don't I see visual boundary overlays while editing on web?",
          answer:
            "The visual boundary overlay is currently optimized for the extension runtime. On web, you still get immediate real-time canvas feedback when changing boundary settings, and full parity is planned in a future update.",
        },
      ]}
    />
  )
}



