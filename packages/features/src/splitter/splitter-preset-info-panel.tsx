import React from "react"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { useTranslation } from "@imify/i18n"

interface SplitterPresetInfoPanelProps {
  compact?: boolean
}

export function SplitterPresetInfoPanel({ compact = false }: SplitterPresetInfoPanelProps) {
  const { t } = useTranslation("splitter")

  const previewSources = [
    resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp),
    resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.splitter.preview2Webp),
  ]

  const previewMediaSources = [
    {
      src: previewSources[0],
      type: "image" as const,
      alt: "Image Splitter preview 1",
    },
    {
      src: previewSources[1],
      type: "image" as const,
      alt: "Image Splitter preview 2",
    },
    {
      src: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.splitter.guideVisualControlWebm),
      type: "video" as const,
    },
  ]

  const tips = t("showcase.tips", { returnObjects: true }) as string[]
  const featureChips = t("showcase.featureChips", { returnObjects: true }) as string[]
  const faqs = t("showcase.faqs", { returnObjects: true }) as Array<{ question: string; answer: string }>

  const panelContent = {
    previewSrc: previewSources[0],
    previewSources: previewSources,
    previewMediaSources: previewMediaSources,
    previewAlt: "Image Splitter preview",
    previewAspectRatio: "16 / 9",
    title: t("showcase.title"),
    subtitle: t("showcase.subtitle"),
    tips: Array.isArray(tips) ? tips : [],
    featureChips: Array.isArray(featureChips) ? featureChips : [],
    faqs: Array.isArray(faqs) ? faqs : [],
  }

  return <PresetInfoShowcasePanel {...panelContent} />
}



