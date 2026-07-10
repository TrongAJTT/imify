import React from "react";
import { PresetInfoShowcasePanel } from "@imify/features/shared/preset-info-showcase-panel";
import {
  FEATURE_MEDIA_ASSET_PATHS,
  resolveFeatureMediaAssetUrl,
} from "@imify/features/shared/media-assets";
import { useTranslation } from "@imify/i18n";

export function FillingInfoPanel() {
  const { t } = useTranslation("filling");

  const previewSrc = resolveFeatureMediaAssetUrl(
    FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
  );
  const previewMediaSources = [
    {
      src: resolveFeatureMediaAssetUrl(
        FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
      ),
      type: "image" as const,
      alt: t("showcase.previewAlt"),
    },
    {
      src: resolveFeatureMediaAssetUrl(
        FEATURE_MEDIA_ASSET_PATHS.filling.symmetricVisualEditorWebm,
      ),
      type: "video" as const,
    },
    {
      src: resolveFeatureMediaAssetUrl(
        FEATURE_MEDIA_ASSET_PATHS.filling.manualMultiSelectWebm,
      ),
      type: "video" as const,
    },
  ];

  const tips = [
    t("showcase.tips.tip1"),
    t("showcase.tips.tip2"),
    t("showcase.tips.tip3"),
    t("showcase.tips.tip4"),
  ];

  const featureChips = [
    t("showcase.chips.manual"),
    t("showcase.chips.auto"),
    t("showcase.chips.transform"),
    t("showcase.chips.style"),
    t("showcase.chips.multiformat"),
    t("showcase.chips.storage"),
  ];

  const faqs = [
    {
      question: t("showcase.faqs.q1"),
      answer: t("showcase.faqs.a1"),
    },
    {
      question: t("showcase.faqs.q2"),
      answer: t("showcase.faqs.a2"),
    },
    {
      question: t("showcase.faqs.q3"),
      answer: t("showcase.faqs.a3"),
    },
    {
      question: t("showcase.faqs.q4"),
      answer: t("showcase.faqs.a4"),
    },
    {
      question: t("showcase.faqs.q5"),
      answer: t("showcase.faqs.a5"),
    },
    {
      question: t("showcase.faqs.q6"),
      answer: t("showcase.faqs.a6"),
    },
    {
      question: t("showcase.faqs.q7"),
      answer: t("showcase.faqs.a7"),
    },
    {
      question: t("showcase.faqs.q8"),
      answer: t("showcase.faqs.a8"),
    },
  ];

  return (
    <PresetInfoShowcasePanel
      previewSrc={previewSrc}
      previewMediaSources={previewMediaSources}
      previewAlt={t("showcase.previewAlt")}
      previewAspectRatio="16 / 9"
      title={t("showcase.title")}
      subtitle={t("showcase.subtitle")}
      tips={tips}
      featureChips={featureChips}
      faqs={faqs}
    />
  );
}
