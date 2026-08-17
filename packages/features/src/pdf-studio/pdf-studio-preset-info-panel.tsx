"use client"

import React from "react"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURE_MEDIA_ASSET_PATHS } from "../shared/media-assets"
import { useTranslation } from "@imify/i18n"

export function PdfStudioPresetInfoPanel() {
  const { t } = useTranslation("pdfStudio")

  const tips = t("showcase.tips", { returnObjects: true }) as string[]
  const featureChips = t("showcase.featureChips", { returnObjects: true }) as string[]
  const faqs = t("showcase.faqs", { returnObjects: true }) as Array<{ question: string; answer: string }>

  return (
    <PresetInfoShowcasePanel
      title={t("showcase.title")}
      subtitle={t("showcase.subtitle")}
      previewSrc={FEATURE_MEDIA_ASSET_PATHS.pdfStudio?.previewWebp || "/assets/features/preview-pdf_studio.webp"}
      previewAlt="PDF Studio Preview"
      featureChips={Array.isArray(featureChips) ? featureChips : []}
      tips={Array.isArray(tips) ? tips : []}
      faqs={Array.isArray(faqs) ? faqs : []}
    />
  )
}
