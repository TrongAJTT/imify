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

  return (
    <PresetInfoShowcasePanel
      previewSrc={previewSrc}
      previewMediaSources={previewMediaSources}
      previewAlt={t("showcase.previewAlt", { defaultValue: "Collage Maker" })}
      previewAspectRatio="16 / 9"
      title={t("showcase.title")}
      subtitle={t("showcase.subtitle")}
      tips={tips}
      featureChips={featureChips}
      faqs={commonFaqs}
    />
  );
}
