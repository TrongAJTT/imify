import React from "react"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURES_INFO_COMMON_FAQS } from "../shared/features-info-common-faqs"

export const QR_GENERATOR_PANEL_CONTENT = {
  title: "QR Generator",
  subtitle: "Generate clean, customizable, and privacy-first QR codes directly in your browser. Supports logos and vector export.",
  previewSrc: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.imifyLogoPng),
  previewAlt: "QR Generator Showcase",
  previewAspectRatio: "3 / 2",
  featureChips: [
    "No Tracking",
    "Offline Safe",
    "Logo Overlay",
    "SVG/PNG Export",
    "Custom Colors",
    "Pattern Styling",
    "Frame & Text"
  ],
  tips: [
    "Use frame styles (like Bottom Label or Pill) to add a clear 'SCAN ME' call to action to boost engagement.",
    "Customize dots and markers with modern designs (like rounded or classy) or fun center shapes (like hearts and stars).",
    "Ensure 'Excavate Logo' is enabled when embedding a logo so it doesn't overlap the QR code dots.",
    "Make sure there is high contrast between the Foreground and Background colors so scanning is reliable.",
    "Export as **SVG** for lossless scaling, perfect for printing on high-resolution flyers or posters."
  ],
  faqs: [
    {
      question: "Are these QR codes dynamic or static?",
      answer: "These are 100% static QR codes. Imify does not track scans or redirect traffic. They never expire and work completely offline."
    },
    {
      question: "How do I choose the right logo size?",
      answer: "Keep the logo size under 20% of the overall QR code size. If the logo is too large, the QR scanner may not be able to read the code, even with High error correction."
    },
    {
      question: "Which Error Correction level should I use?",
      answer: "If you don't use a logo, **M (Medium)** or **L (Low)** is fine and makes the code simpler. If you embed a logo, choose **Q (Quartile)** or **H (High)** for better readability."
    },
    ...FEATURES_INFO_COMMON_FAQS
  ]
}

export function QrGeneratorInfoPanel() {
  return <PresetInfoShowcasePanel {...QR_GENERATOR_PANEL_CONTENT} />
}
