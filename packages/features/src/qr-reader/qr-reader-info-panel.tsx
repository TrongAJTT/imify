import React from "react";
import {
  FEATURE_MEDIA_ASSETS,
  resolveFeatureMediaAssetUrl,
} from "../shared/media-assets";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";
import { FEATURES_INFO_COMMON_FAQS } from "../shared/features-info-common-faqs";
import { useTranslation } from "@imify/i18n";

export function QrReaderInfoPanel() {
  const { t } = useTranslation("qrReader");

  const showcase = {
    title: t("showcase.title", { defaultValue: "QR Reader" }),
    subtitle: t("showcase.subtitle", {
      defaultValue:
        "Scan QR codes instantly using your device's camera or by uploading image files (PNG/SVG) directly in your browser.",
    }),
    previewSrc: resolveFeatureMediaAssetUrl(
      FEATURE_MEDIA_ASSETS.illustrations.qrReaderSvg,
    ),
    previewAlt: "QR Reader Showcase",
    previewAspectRatio: "3 / 2" as const,
    featureChips: t("showcase.featureChips", {
      returnObjects: true,
      defaultValue: [
        "Instant Scan",
        "Camera Live Support",
        "File Upload Scans",
        "SVG & PNG Compatible",
        "Local Processing",
      ],
    }) as string[],
    tips: t("showcase.tips", {
      returnObjects: true,
      defaultValue: [
        "Place the QR code in clear view of the camera. Hold your device steady for the best results.",
        "For file uploads, ensure the image is clear and not too blurry or low-resolution.",
        "If your camera isn't working, verify that you have granted camera permissions in your browser settings.",
        "All decoding happens locally on your device — your camera feed and images are never uploaded to any server.",
        "Click the copy button on the sidebar to quickly copy the decoded contents to your clipboard.",
      ],
    }) as string[],
    faqs: [
      {
        question: t("showcase.faqs.0.question", {
          defaultValue: "Is scanning private and secure?",
        }),
        answer: t("showcase.faqs.0.answer", {
          defaultValue:
            "Yes, absolutely. Scanning is performed entirely in JavaScript on your local machine. No image data or video feeds are ever sent over the network.",
        }),
      },
      {
        question: t("showcase.faqs.1.question", {
          defaultValue: "Which formats can I upload?",
        }),
        answer: t("showcase.faqs.1.answer", {
          defaultValue:
            "You can drag and drop or upload any common image file, including **PNG**, **JPG**, **WebP**, and even vector **SVG** files containing QR codes.",
        }),
      },
      {
        question: t("showcase.faqs.2.question", {
          defaultValue: "What happens if a QR code has no valid URL?",
        }),
        answer: t("showcase.faqs.2.answer", {
          defaultValue:
            "The QR Reader decodes any content, including plain text, contact cards (vCards), Wi-Fi logins, and phone numbers. If it's a URL, a link will be provided to open it directly.",
        }),
      },
      ...FEATURES_INFO_COMMON_FAQS,
    ],
  };

  return <PresetInfoShowcasePanel {...showcase} />;
}
