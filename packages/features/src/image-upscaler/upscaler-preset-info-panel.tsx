import React from "react"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURES_INFO_COMMON_FAQS } from "../shared/features-info-common-faqs"

export const IMAGE_UPSCALER_PANEL_CONTENT = {
  title: "AI Image Upscaler",
  subtitle: "Magnify and restore your images locally in your web browser using state-of-the-art super-resolution neural networks.",
  previewSrc: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.upscaler.previewWebp),
  previewSources: [
    resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.upscaler.previewWebp)
  ],
  previewAlt: "Image Upscaling Showcase",
  previewAspectRatio: "3 / 2",
  featureChips: [
    "AI-Super-Resolution",
    "100% Local",
    "Privacy Protected",
    "Safe Mode Tiling"
  ],
  tips: [
    "The selected model now locks the scale factor automatically, so choose the 2x or 4x model first.",
    "Use **Safe Mode (Tiling)** for large images to keep memory usage stable.",
    "Raise **Denoise Strength** only when you need stronger restoration; low values preserve more detail.",
    "Choose the **Quantized** variant if your machine has less than 8GB of RAM or you want faster model loading.",
    "Enable 'Auto-unload Model' to free up VRAM/RAM immediately after processing."
  ],
  faqs: [
    {
      question: "What is Safe Mode (Tiling)?",
      answer: "Safe Mode splits large images into smaller tiles (e.g. 256x256), processes them sequentially, and stitches them back together. This keeps RAM usage low and constant, preventing browser crashes on high-res images."
    },
    {
      question: "Does it need an internet connection?",
      answer: "Only to download the model files on the very first run. After that, they are cached in your browser and run fully offline."
    },
    {
      question: "Why is the first run slower?",
      answer: "The first run downloads the weights (if not cached) and compiles the ONNX execution engine, which takes a few seconds depending on your hardware."
    },
    {
      question: "What is the maximum supported scale?",
      answer: "Each model has its own fixed scale factor. Upscaling 4x on an already large image creates a massive file, so we recommend keeping outputs under 4096x4096px to avoid browser canvas limits."
    },
    ...FEATURES_INFO_COMMON_FAQS
  ]
}

export function ImageUpscalerPresetInfoPanel() {
  return <PresetInfoShowcasePanel {...IMAGE_UPSCALER_PANEL_CONTENT} />
}
