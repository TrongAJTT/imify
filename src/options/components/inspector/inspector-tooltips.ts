export const INSPECTOR_TOOLTIPS = {
  colorInspector: {
    contrastTitle: "Contrast (WCAG)",
    onDark: "on dark",
    onLight: "on light",
    copyColor: (formatted: string) => `Copy ${formatted}`
  },
  developerActions: {
    copyBase64DataUri:
      "Copy a raw Data URI string (data:image/...;base64,...) for direct inline usage in HTML or scripts.",
    copyCssDataUri:
      'Copy a CSS-ready value like url("data:image/...base64,...") so you can paste directly into background-image.',
    copyThumbHash:
      "Copy ThumbHash placeholder text for lightweight blurred previews during lazy-loading.",
    copyPictureTag:
      "Copy a responsive <picture> snippet with AVIF/WebP sources and JPG fallback image.",
    copyCssAspectRatio:
      "Copy aspect-ratio and object-fit CSS to reserve layout space and reduce CLS.",
    copyPaletteCssVariables:
      "Convert extracted dominant colors into reusable CSS custom properties (:root variables).",
    copySha256Hash:
      "Generate SHA-256 fingerprint locally for integrity checks, deduplication, or verification workflows.",
    copyMd5Hash:
      "Generate MD5 fingerprint locally for quick compatibility checks with legacy systems.",
    copyMagicNumberSignature:
      "Copy first bytes (hex signature) to verify true file format regardless of extension.",
    copyInspectionJson:
      "Copy structured inspection output (dimensions, color, GPS, metadata counts) as formatted JSON.",
    copyOptimizedBase64:
      "Copy a tiny, low-quality data URI placeholder (downscaled and compressed) for lightweight previews."
  }
} as const
