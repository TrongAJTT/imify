import React from "react";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";
import {
  FEATURE_MEDIA_ASSET_PATHS,
  resolveFeatureMediaAssetUrl,
} from "../shared/media-assets";
import { useTranslation } from "@imify/i18n";

interface SplicingPresetInfoPanelProps {
  compact?: boolean;
}

export function useSplicingShowcaseContent() {
  const { t } = useTranslation("splicing");

  return {
    previewSrc: resolveFeatureMediaAssetUrl(
      FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp,
    ),
    previewAlt: t("showcase.previewAlt"),
    previewAspectRatio: "16 / 9",
    title: t("showcase.title"),
    subtitle: t("showcase.subtitle"),
    tips: [
      t("showcase.tips.sync"),
      t("showcase.tips.preview"),
      t("showcase.tips.export"),
      t("showcase.tips.import"),
    ],
    featureChips: [
      t("showcase.chips.layouts"),
      t("showcase.chips.styling"),
      t("showcase.chips.preview"),
      t("showcase.chips.zip"),
      t("showcase.chips.pool"),
      t("showcase.chips.sync"),
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
      {
        question: t("showcase.faqs.q9"),
        answer: t("showcase.faqs.a9"),
      },
    ],
  };
}

export function SplicingPresetInfoPanel({
  compact = false,
}: SplicingPresetInfoPanelProps) {
  const showcaseContent = useSplicingShowcaseContent();
  return <PresetInfoShowcasePanel {...showcaseContent} />;
}
