import React from "react";
import {
  FEATURE_MEDIA_ASSETS,
  resolveFeatureMediaAssetUrl,
} from "../shared/media-assets";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";
import { getCommonFaqs } from "../shared/features-info-common-faqs";
import { useTranslation } from "@imify/i18n";

export function useUpscalerPanelContent() {
  const { t } = useTranslation("upscaler");
  return {
    title: t("showcase.title"),
    subtitle: t("showcase.subtitle"),
    previewSrc: resolveFeatureMediaAssetUrl(
      FEATURE_MEDIA_ASSETS.upscaler.previewWebp,
    ),
    previewSources: [
      resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.upscaler.previewWebp),
    ],
    previewAlt: t("showcase.previewAlt"),
    previewAspectRatio: "3 / 2",
    featureChips: [
      t("showcase.chips.aiSuperResolution"),
      t("showcase.chips.local"),
      t("showcase.chips.privacyProtected"),
      t("showcase.chips.safeModeTiling"),
    ],
    tips: t("showcase.tips", { returnObjects: true }) as string[],
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
      ...getCommonFaqs(t),
    ],
  };
}

export function UpscalerPresetInfoPanel() {
  const content = useUpscalerPanelContent();
  return <PresetInfoShowcasePanel {...content} />;
}
