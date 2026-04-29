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
    previewImageWebp: "/assets/features/preview-image_filling.webp",
    symmetricVisualEditorWebm: "/assets/features/guide-symgen-visual_editor.webm",
    manualMultiSelectWebm: "/assets/features/guide-image_filling_manual-visual_multi_select.webm"
  },
  processor: {
    previewSingleWebp: "/assets/features/preview-single_processor.webp",
    previewBatchWebp: "/assets/features/preview-batch_processor.webp"
  },
  splitter: {
    preview1Webp: "/assets/features/preview-image_splitter-1.webp",
    preview2Webp: "/assets/features/preview-image_splitter-2.webp",
    guideVisualControlWebm: "/assets/features/guide-image_splitter-visual_guides_control.webm"
  },
  splicing: {
    previewWebp: "/assets/features/preview-image_splicing.webp"
  },
  pattern: {
    previewWebp: "/assets/features/preview-pattern_generator.webp"
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
    previewImageWebp: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
    symmetricVisualEditorWebm: FEATURE_MEDIA_ASSET_PATHS.filling.symmetricVisualEditorWebm,
    manualMultiSelectWebm: FEATURE_MEDIA_ASSET_PATHS.filling.manualMultiSelectWebm
  },
  processor: {
    previewSingleWebp: FEATURE_MEDIA_ASSET_PATHS.processor.previewSingleWebp,
    previewBatchWebp: FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp
  },
  splitter: {
    preview1Webp: FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp,
    preview2Webp: FEATURE_MEDIA_ASSET_PATHS.splitter.preview2Webp,
    guideVisualControlWebm: FEATURE_MEDIA_ASSET_PATHS.splitter.guideVisualControlWebm
  },
  splicing: {
    previewWebp: FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp
  },
  pattern: {
    previewWebp: FEATURE_MEDIA_ASSET_PATHS.pattern.previewWebp
  },
  downloadHints: {
    chromeWebp: FEATURE_MEDIA_ASSET_PATHS.downloadHints.chromeWebp,
    edgeWebp: FEATURE_MEDIA_ASSET_PATHS.downloadHints.edgeWebp,
    firefoxWebp: FEATURE_MEDIA_ASSET_PATHS.downloadHints.firefoxWebp
  }
} as const
