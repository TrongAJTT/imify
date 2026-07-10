import React from "react"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS } from "../shared/media-assets"
import { useTranslation } from "@imify/i18n"

export function DiffcheckerPresetInfoPanel() {
  const { t } = useTranslation("diffchecker")

  const tips = t("showcase.tips", { returnObjects: true }) as string[]
  const featureChips = t("showcase.featureChips", { returnObjects: true }) as string[]
  const faqs = t("showcase.faqs", { returnObjects: true }) as Array<{ question: string; answer: string }>

  return (
    <PresetInfoShowcasePanel
      title={t("showcase.title")}
      subtitle={t("showcase.subtitle")}
      previewSrc={FEATURE_MEDIA_ASSET_PATHS.diffchecker.previewWebp}
      previewAlt="Difference Checker Preview"
      featureChips={Array.isArray(featureChips) ? featureChips : []}
      tips={Array.isArray(tips) ? tips : []}
      faqs={Array.isArray(faqs) ? faqs : []}
    />
  )
}
