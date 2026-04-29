import React from "react"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"

interface SplitterPresetInfoPanelProps {
  compact?: boolean
}

const SPLITTER_PREVIEW_SOURCES = [
  resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp),
  resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.splitter.preview2Webp),
]

const SPLITTER_PREVIEW_MEDIA_SOURCES = [
  {
    src: SPLITTER_PREVIEW_SOURCES[0],
    type: "image" as const,
    alt: "Image Splitter preview 1",
  },
  {
    src: SPLITTER_PREVIEW_SOURCES[1],
    type: "image" as const,
    alt: "Image Splitter preview 2",
  },
  {
    src: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.splitter.guideVisualControlWebm),
    type: "video" as const,
  },
]

const SPLITTER_PANEL_CONTENT = {
  previewSrc: SPLITTER_PREVIEW_SOURCES[0],
  previewSources: SPLITTER_PREVIEW_SOURCES,
  previewMediaSources: SPLITTER_PREVIEW_MEDIA_SOURCES,
  previewAlt: "Image Splitter preview",
  previewAspectRatio: "16 / 9",
  title: "Image Splitter for structured batch slicing",
  subtitle: "Split one or many images using guides, patterns, color detection, and smart export presets.",
  tips: [
    "Preview is based on the active image, but export applies your split rules to the entire queue.",
    "Preset changes auto-sync in workspace mode with a short debounce, so your latest setup is preserved.",
    "Advanced methods like color match and auto sprite analyze image pixels and can be heavier on RAM and CPU.",
    "Use ZIP export for large runs, or one-by-one download when you need direct per-file browser saving."
  ],
  featureChips: [
    "Multi-Method Splitting",
    "Batch Queue",
    "Preview and Guides",
    "Format and Codec Controls",
    "ZIP or One-by-One Export",
    "Preset Auto Sync",
    "Smart Naming"
  ],
  faqs: [
    {
      question: "Does preview only affect the selected image?",
      answer: "Preview renders on the active image so you can validate the split plan quickly. When exporting, the same split configuration is executed across all queued images."
    },
    {
      question: "How do Basic mode methods work (count, percent, pixel)?",
      answer: "Basic mode uses uniform cuts: count splits into N parts, percent uses fixed percentage steps, and pixel uses fixed pixel intervals."
    },
    {
      question: "When should I use pixel/percent pattern methods?",
      answer: "Pattern methods are ideal for repeating non-uniform slices, such as alternating card layouts, where each step can follow a custom sequence."
    },
    {
      question: "What is Color Match best used for?",
      answer: "Color Match scans lines for target color ratios and is useful for finding natural separators like white gutters. For best performance, tune tolerance and safe-zone values."
    },
    {
      question: "What is the difference between Custom List and Social Carousel?",
      answer: "Custom List cuts by explicit guides from edges, while Social Carousel builds ratio-based slices for social posting and supports crop, stretch, or pad overflow handling."
    },
    {
      question: "When should I use Auto Sprite mode?",
      answer: "Use Auto Sprite for transparent sprite sheets. It detects alpha islands, then extracts and sorts bounded regions based on connectivity and sort mode."
    },
    {
      question: "When should I choose ZIP versus one-by-one export?",
      answer: "ZIP is best for large outputs and cleaner download flow. One-by-one is useful when you need immediate individual files, and the app will confirm before very large download counts."
    }
  ]
}

export function SplitterPresetInfoPanel({ compact = false }: SplitterPresetInfoPanelProps) {
  if (compact) {
    return <PresetInfoShowcasePanel {...SPLITTER_PANEL_CONTENT} />
  }

  return <PresetInfoShowcasePanel {...SPLITTER_PANEL_CONTENT} />
}



