import React from "react";
import { PresetInfoShowcasePanel } from "@imify/features/shared/preset-info-showcase-panel";
import {
  FEATURE_MEDIA_ASSET_PATHS,
  resolveFeatureMediaAssetUrl,
} from "@imify/features/shared/media-assets";
import { useTranslation } from "@imify/i18n";
import { useCommonFaqs } from "@imify/features/shared/features-info-common-faqs";

export function CollageMakerInfoPanel() {
  const { t } = useTranslation("collageMaker");

  const previewSrc = resolveFeatureMediaAssetUrl(
    FEATURE_MEDIA_ASSET_PATHS.collageMaker.previewWebp,
  );

  const previewMediaSources = [
    {
      src: resolveFeatureMediaAssetUrl(
        FEATURE_MEDIA_ASSET_PATHS.collageMaker.previewWebp,
      ),
      type: "image" as const,
      alt: t("showcase.previewAlt", { defaultValue: "Collage Maker" }),
    },
  ];

  const tips = [
    t("showcase.tips.tip1"),
    t("showcase.tips.tip2"),
    t("showcase.tips.tip3"),
    t("showcase.tips.tip4"),
  ];

  const featureChips = [
    t("showcase.chips.autoLayout", { defaultValue: "Bố cục tự động" }),
    t("showcase.chips.dragReorder", { defaultValue: "Kéo thả thứ tự" }),
    t("showcase.chips.customSpacing", {
      defaultValue: "Tùy chỉnh lề & khoảng cách",
    }),
    t("showcase.chips.fineTune", { defaultValue: "Tinh chỉnh vị trí" }),
    t("showcase.chips.multiFormat", { defaultValue: "Xuất đa định dạng" }),
  ];

  const commonFaqs = useCommonFaqs();

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
    ...commonFaqs,
  ];

  return (
    <PresetInfoShowcasePanel
      padding={3}
      previewSrc={previewSrc}
      previewMediaSources={previewMediaSources}
      previewAlt={t("showcase.previewAlt", { defaultValue: "Collage Maker" })}
      previewAspectRatio="16 / 9"
      title={t("showcase.title")}
      subtitle={t("showcase.subtitle")}
      tips={tips}
      featureChips={featureChips}
      faqs={faqs}
    />
  );
}
