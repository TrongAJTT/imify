export const DIFFCHECKER_TOOLTIPS = {
  imageDropPair: {
    replaceImage: (label: string) => `Replace ${label}`
  },
  pixelCompareWorkspace: {
    fallbackPreviewWarning:
      "Rendering the original image failed, so a fallback preview was used. This may not accurately reflect the true pixel differences."
  },
  viewerShell: {
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen"
  }
} as const
