export function getFormatAdvancedLabel(format: string): string {
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

