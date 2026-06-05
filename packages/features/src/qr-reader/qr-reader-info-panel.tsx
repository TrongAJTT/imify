import React from "react"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"
import { FEATURES_INFO_COMMON_FAQS } from "../shared/features-info-common-faqs"

export const QR_READER_PANEL_CONTENT = {
  title: "QR Reader",
  subtitle: "Scan QR codes instantly using your device's camera or by uploading image files (PNG/SVG) directly in your browser.",
  previewSrc: resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.imifyLogoPng),
  previewAlt: "QR Reader Showcase",
  previewAspectRatio: "3 / 2",
  featureChips: [
    "Instant Scan",
    "Camera Live Support",
    "File Upload Scans",
    "SVG & PNG Compatible",
    "Local Processing"
  ],
  tips: [
    "Place the QR code in clear view of the camera. Hold your device steady for the best results.",
    "For file uploads, ensure the image is clear and not too blurry or low-resolution.",
    "If your camera isn't working, verify that you have granted camera permissions in your browser settings.",
    "All decoding happens locally on your device — your camera feed and images are never uploaded to any server.",
    "Click the copy button on the sidebar to quickly copy the decoded contents to your clipboard."
  ],
  faqs: [
    {
      question: "Is scanning private and secure?",
      answer: "Yes, absolutely. Scanning is performed entirely in JavaScript on your local machine. No image data or video feeds are ever sent over the network."
    },
    {
      question: "Which formats can I upload?",
      answer: "You can drag and drop or upload any common image file, including **PNG**, **JPG**, **WebP**, and even vector **SVG** files containing QR codes."
    },
    {
      question: "What happens if a QR code has no valid URL?",
      answer: "The QR Reader decodes any content, including plain text, contact cards (vCards), Wi-Fi logins, and phone numbers. If it's a URL, a link will be provided to open it directly."
    },
    ...FEATURES_INFO_COMMON_FAQS
  ]
}

export function QrReaderInfoPanel() {
  return <PresetInfoShowcasePanel {...QR_READER_PANEL_CONTENT} />
}
