interface FeatureMediaRuntimeAdapter {
  resolveAssetUrl?: (url: string) => string
}

let activeFeatureMediaRuntimeAdapter: FeatureMediaRuntimeAdapter | null = null

export function registerFeatureMediaRuntimeAdapter(adapter: FeatureMediaRuntimeAdapter): void {
  activeFeatureMediaRuntimeAdapter = adapter
}

export function resolveFeatureMediaAssetUrl(url: string): string {
  try {
    return activeFeatureMediaRuntimeAdapter?.resolveAssetUrl?.(url) ?? url
  } catch {
    return url
  }
}

export const FEATURE_MEDIA_ASSET_PATHS = {
  brand: {
    imifyLogoPng: "/assets/icon.png",
    githubLogoSvg: "/assets/images/github-logo.svg",
    buyMeCoffeeLogoSvg: "/assets/images/bmc-logo.svg"
  },
  devMode: {
    enableVideoWebm: "/assets/features/dev_mode-enable.webm",
    exportStep1Webp: "/assets/images/dev-export-1.webp",
    exportStep2Webp: "/assets/images/dev-export-2.webp"
  },
  filling: {
    symmetricVisualEditorWebm: "/assets/features/symmetric_generator-visual_editor.webm"
  },
  downloadHints: {
    chromeWebp: "/assets/images/img-download-not-ask-chrome.webp",
    edgeWebp: "/assets/images/img-download-not-ask-edge.webp",
    firefoxWebp: "/assets/images/img-download-not-ask-firefox.webp"
  }
} as const

export const FEATURE_MEDIA_ASSETS = {
  brand: {
    imifyLogoPng: FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
    githubLogoSvg: FEATURE_MEDIA_ASSET_PATHS.brand.githubLogoSvg,
    buyMeCoffeeLogoSvg: FEATURE_MEDIA_ASSET_PATHS.brand.buyMeCoffeeLogoSvg
  },
  devMode: {
    enableVideoWebm: FEATURE_MEDIA_ASSET_PATHS.devMode.enableVideoWebm,
    exportStep1Webp: FEATURE_MEDIA_ASSET_PATHS.devMode.exportStep1Webp,
    exportStep2Webp: FEATURE_MEDIA_ASSET_PATHS.devMode.exportStep2Webp
  },
  filling: {
    symmetricVisualEditorWebm: FEATURE_MEDIA_ASSET_PATHS.filling.symmetricVisualEditorWebm
  },
  downloadHints: {
    chromeWebp: FEATURE_MEDIA_ASSET_PATHS.downloadHints.chromeWebp,
    edgeWebp: FEATURE_MEDIA_ASSET_PATHS.downloadHints.edgeWebp,
    firefoxWebp: FEATURE_MEDIA_ASSET_PATHS.downloadHints.firefoxWebp
  }
} as const
