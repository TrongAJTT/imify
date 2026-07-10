export function getFormatAdvancedLabel(format: string, t?: (key: string) => string): string {
  if (t) {
    switch (format) {
      case "png":
        return t("pngAdvanced")
      case "mozjpeg":
        return t("mozjpegAdvanced")
      case "webp":
        return t("webpAdvanced")
      case "avif":
        return t("avifAdvanced")
      case "jxl":
        return t("jxlAdvanced")
      default:
        return t("formatAdvancedSettings")
    }
  }
  switch (format) {
    case "png":
      return "PNG Advanced"
    case "mozjpeg":
      return "MozJPEG Advanced"
    case "webp":
      return "WebP Advanced"
    case "avif":
      return "AVIF Advanced"
    case "jxl":
      return "JXL Advanced"
    default:
      return "Format Advanced Settings"
  }
}

