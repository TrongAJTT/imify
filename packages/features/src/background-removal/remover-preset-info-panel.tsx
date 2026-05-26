import React from "react"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURES_INFO_COMMON_FAQS } from "../shared/features-info-common-faqs"

export const BACKGROUND_REMOVER_PANEL_CONTENT = {
  title: "AI Background Remover",
  subtitle: "Isolate subjects from their background instantly using state-of-the-art AI that runs 100% locally on your device.",
  previewSrc: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.remover.preview1Webp),
  previewSources: [
    resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.remover.preview1Webp),
    resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.remover.preview2Webp)
  ],
  previewAlt: "Background Removal Showcase",
  previewAspectRatio: "3 / 2",
  featureChips: [
    "AI-Powered",
    "100% Local",
    "Privacy First",
    // "HD Quality",
    // "Batch Ready",
    "Smart Edges"
  ],
  tips: [
    "Select the **Quantized** variant to save RAM and prevent crashes on lower-end machines.",
    "The **FP16** variant typically offers the **fastest processing speed** if your machine has enough RAM.",
    "Enable 'Auto-unload Model' to free up browser memory immediately after each task.",
    "Use the 'Edge Refinement' slider to fine-tune how subjects blend with new backgrounds.",
    "You can drag and drop multiple images at once to start a batch process.",
    "Hover over the variant selection to see detailed technical differences."
  ],
  faqs: [
    {
      question: "What kinds of images are best for this tool?",
      answer: "It works best for photos with a clear subject in the foreground, such as portraits, product shots, pets, or objects with well-defined edges."
    },
    {
      question: "Does it require powerful hardware?",
      answer: "Yes, AI processing is resource-intensive. A mid-to-high-end machine with a dedicated GPU and at least 8GB of RAM is recommended for the best experience. On lower-end devices, use *Quantized* variants."
    },
    {
      question: "Does it need an internet connection?",
      answer: "Only for the initial download of the AI models. Once cached in your browser, the tool works 100% offline."
    },
    ...FEATURES_INFO_COMMON_FAQS,
    {
      question: "Why is the first processing slower?",
      answer: "The first run requires initializing the AI engine and loading the model from the local cache into memory, which can take a few seconds depending on your hardware."
    },
    {
      question: "Which export formats are supported?",
      answer: "You can export your processed images as **PNG** (with transparency), **WebP**, **AVIF**, **JXL**, or **JPG** (on a solid background)."
    }
  ]
}

export function BackgroundRemoverPresetInfoPanel() {
  return <PresetInfoShowcasePanel {...BACKGROUND_REMOVER_PANEL_CONTENT} />
}
