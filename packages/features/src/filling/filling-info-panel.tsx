import React from "react"
import { PresetInfoShowcasePanel } from "@imify/features/shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS, resolveFeatureMediaAssetUrl } from "@imify/features/shared/media-assets"

const FILLING_PANEL_CONTENT = {
  previewSrc: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp),
  previewMediaSources: [
    {
      src: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp),
      type: "image" as const,
      alt: "Image Filling layout and final composition preview",
    },
    {
      src: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.filling.symmetricVisualEditorWebm),
      type: "video" as const,
    },
    {
      src: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.filling.manualMultiSelectWebm),
      type: "video" as const,
    },
  ],
  previewAlt: "Image Filling layout and final composition preview",
  previewAspectRatio: "16 / 9",
  title: "Image Filling",
  subtitle:
    "Design a reusable frame layout, place images into each region, and export polished composites with full style and codec control.",
  tips: [
    "Start with Auto Generators when you need a clean layout fast, then switch to Manual Editor for precise tweaks.",
    "In Fill Workspace, drag, zoom, and rotate each image inside its frame to align subjects exactly where you want.",
    "Use canvas and border overrides to keep a consistent visual style across multiple outputs from one template.",
    "Reuse saved templates to speed up social cards, collage sets, and catalog-like production workflows.",
  ],
  featureChips: [
    "Manual Editor",
    "Auto Generators",
    "Transform Tools",
    "Style Overrides",
    "Multi-format Export",
    "Template Storage",
  ],
  faqs: [
    {
      question: "How is Image Filling different from Image Splicing?",
      answer:
        "Image Splicing stitches independent images into a generated strip or grid automatically. Image Filling uses a fixed template you design first, then lets you place and transform images inside each predefined region.",
    },
    {
      question: "What workflows is this tool best for?",
      answer:
        "It is ideal for template-based production where consistency matters: social cards, collage layouts, and product showcase compositions with repeated structure.",
    },
    {
      question: "How can I create a layout quickly?",
      answer:
        "You have three approaches: Manual Editor for custom drawing, Symmetric Generator for mirrored structures, and Grid Designer for fast bento-like layouts.",
    },
    {
      question: "Can I edit auto-generated layouts manually afterward?",
      answer:
      "Yes. Templates created from Symmetric Generator or Grid Designer can be sent to Manual Editor for final fine-tuning before filling.",
    },
    {
      question: "Can I export a PSD file from the Template List to use in Photoshop or Affinity?",
      answer:
        "Yes. You can. Just hover over the template and click the Export PSD button. The PSD export is structure-first: it preserves your layer shapes and positions, but it does not include per-layer photo fills from the Fill workspace session.",
    },
    {
      question: "Can I share a URL so others can open my design?",
      answer:
        "No. The workflow is local-first and stores data in your browser environment, so there is no server-hosted share link for template sessions.",
    },
    {
      question: "Do style settings get saved with my template?",
      answer:
        "Yes. Layout structure and style-related settings can be reused through templates, which makes repeat runs much faster.",
    },
  ],
}

export function FillingInfoPanel() {
  return (
    <PresetInfoShowcasePanel
      previewSrc={FILLING_PANEL_CONTENT.previewSrc}
      previewMediaSources={FILLING_PANEL_CONTENT.previewMediaSources}
      previewAlt={FILLING_PANEL_CONTENT.previewAlt}
      previewAspectRatio={FILLING_PANEL_CONTENT.previewAspectRatio}
      title={FILLING_PANEL_CONTENT.title}
      subtitle={FILLING_PANEL_CONTENT.subtitle}
      tips={FILLING_PANEL_CONTENT.tips}
      featureChips={FILLING_PANEL_CONTENT.featureChips}
      faqs={FILLING_PANEL_CONTENT.faqs}
    />
  )
}
