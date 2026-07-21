import React from "react";
import {
  FEATURE_MEDIA_ASSETS,
  resolveFeatureMediaAssetUrl,
} from "../shared/media-assets";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";
import { getCommonFaqs } from "../shared/features-info-common-faqs";
import { useTranslation } from "@imify/i18n";

export function useBackgroundRemoverShowcaseContent() {
  const { t } = useTranslation("backgroundRemover");

  return {
    title: t("showcase.title"),
    subtitle: t("showcase.subtitle"),
    previewSrc: resolveFeatureMediaAssetUrl(
      FEATURE_MEDIA_ASSETS.remover.preview1Webp,
    ),
    previewSources: [
      resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.remover.preview1Webp),
      resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.remover.preview2Webp),
    ],
    previewAlt: t("showcase.previewAlt"),
    previewAspectRatio: "3 / 2",
    featureChips: [
      t("showcase.chips.aiPowered"),
      t("showcase.chips.local"),
      t("showcase.chips.privacy"),
      t("showcase.chips.edges"),
    ],
    tips: [
      t("showcase.tips.quantized"),
      t("showcase.tips.fp16"),
      t("showcase.tips.unload"),
      t("showcase.tips.refinement"),
      t("showcase.tips.batch"),
      t("showcase.tips.hover"),
    ],
    faqs: [
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
      ...getCommonFaqs(t),
      {
        question: t("showcase.faqs.q4"),
        answer: t("showcase.faqs.a4"),
      },
      {
        question: t("showcase.faqs.q5"),
        answer: t("showcase.faqs.a5"),
      },
    ],
  };
}

export function BackgroundRemoverPresetInfoPanel() {
  const showcaseContent = useBackgroundRemoverShowcaseContent();
  return <PresetInfoShowcasePanel {...showcaseContent} />;
}
