import React from "react";
import { PresetInfoShowcasePanel } from "@imify/features/shared/preset-info-showcase-panel";
import {
  FEATURE_MEDIA_ASSET_PATHS,
  resolveFeatureMediaAssetUrl,
} from "@imify/features/shared/media-assets";
import { useTranslation } from "@imify/i18n";

interface PatternPresetInfoPanelProps {
  compact?: boolean;
}

export function PatternPresetInfoPanel({
  compact = false,
}: PatternPresetInfoPanelProps) {
  const { t } = useTranslation("pattern");
  const previewAspectRatio = compact ? "16 / 9" : "16 / 9";

  return (
    <PresetInfoShowcasePanel
      previewSrc={resolveFeatureMediaAssetUrl(
        FEATURE_MEDIA_ASSET_PATHS.pattern.previewWebp,
      )}
      previewAlt={t("showcase.previewAlt")}
      previewAspectRatio={previewAspectRatio}
      title={t("showcase.title")}
      subtitle={t("showcase.subtitle")}
      tips={[
        t("showcase.tips.tip1"),
        t("showcase.tips.tip2"),
        t("showcase.tips.tip3"),
        t("showcase.tips.tip4"),
      ]}
      featureChips={[
        t("showcase.chips.distribution"),
        t("showcase.chips.boundary"),
        t("showcase.chips.styling"),
        t("showcase.chips.autosave"),
        t("showcase.chips.codecs"),
      ]}
      faqs={[
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
      ]}
    />
  );
}
