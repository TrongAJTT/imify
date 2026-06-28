import React from "react"

import type { SetupContext } from "@imify/stores/stores/batch-store"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { useTranslation } from "@imify/i18n"

interface ProcessorPresetInfoPanelProps {
  context: SetupContext
}

export function ProcessorPresetInfoPanel({ context }: ProcessorPresetInfoPanelProps) {
  const { t } = useTranslation("processor")

  if (context === "single") {
    const tips = t("showcaseSingle.tips", { returnObjects: true }) as string[]
    const featureChips = t("showcaseSingle.featureChips", { returnObjects: true }) as string[]
    const faqs = t("showcaseSingle.faqs", { returnObjects: true }) as Array<{ question: string; answer: string }>

    return (
      <PresetInfoShowcasePanel
        previewSrc={resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.processor.previewSingleWebp)}
        previewAlt="Single Processor preview"
        previewAspectRatio="16 / 9"
        title={t("showcaseSingle.title")}
        subtitle={t("showcaseSingle.subtitle")}
        tips={Array.isArray(tips) ? tips : []}
        featureChips={Array.isArray(featureChips) ? featureChips : []}
        faqs={Array.isArray(faqs) ? faqs : []}
      />
    )
  }

  const tips = t("showcaseBatch.tips", { returnObjects: true }) as string[]
  const featureChips = t("showcaseBatch.featureChips", { returnObjects: true }) as string[]
  const faqs = t("showcaseBatch.faqs", { returnObjects: true }) as Array<{ question: string; answer: string }>

  return (
    <PresetInfoShowcasePanel
      previewSrc={resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp)}
      previewAlt="Batch Processor preview"
      previewAspectRatio="39 / 35"
      title={t("showcaseBatch.title")}
      subtitle={t("showcaseBatch.subtitle")}
      tips={Array.isArray(tips) ? tips : []}
      featureChips={Array.isArray(featureChips) ? featureChips : []}
      faqs={Array.isArray(faqs) ? faqs : []}
    />
  )
}

