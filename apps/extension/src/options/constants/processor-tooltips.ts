export const PROCESSOR_TOOLTIPS = {
  batch: {
    actionBar: {
      queuedItems: "Queued items",
      processingItems: "Processing items",
      successfulItems: "Successful items",
      failedItems: "Failed items",
    },
    exportPanel: {
      privacyMode: "Removes sensitive metadata (GPS, Camera info).",
    },
    watermarkDialog: {
      resetToDefaults: "Reset watermark settings to defaults",
    },
  },
  shared: {
    avifAdvanced: {
      keepSharpEdges:
        "When enabled, forces alpha quality to 100 to preserve sharp edges in logos and soft shadows. When disabled, you can manually adjust alpha quality for smaller file sizes at the cost of potential blurriness around edges.",
      alphaQuality: "Controls transparency channel quality. Leave unticked above to tune manually.",
      chromaSubsampling:
        `● 4:2:0 is smallest and ideal for photos.
        ● 4:4:4 keeps color edges sharp for text, UI, and pixel art.`,
      tune:
      `● Auto is balanced.
      ● SSIM usually looks more natural.
      ● PSNR may improve objective signal metrics.`,
    },
    mozjpegAdvanced: {
      progressiveLoading:
        "Progressive JPEG often improves perceived load speed and can reduce file size slightly for web delivery.",
      colorResolution:
        `● 4:2:0 is smallest and ideal for photos.
        ● 4:2:2 offers better color accuracy for web graphics.`,
    },
    pngAdvanced: {
      cleanTransparentPixels:
        `● Removes hidden data from transparent areas to shrink file size. It's 100% invisible to the eye and perfect for logos and icons.
        ● Sometimes 'invisible' parts of an image still carry hidden data. We scrub that away to make your file lighter while keeping it looking exactly the same.`,
      autoGrayscale:
        "Automatically shrinks the file size for black-and-white images without any loss in quality. Perfect for logos and scans.",
      oxipngCompression:
        "Optimizes PNG filters for minimum file size. Process is slower but results are lossless.",
      progressiveInterlaced:
        "Makes the image appear faster on websites by showing a blurry version first. Recommended for web use, though it increases file size by 5-10%.",
    },
    icoSizeSelector: {
      generateWebToolkit:
        "Generates favicon.ico, Apple/Android PNGs, webmanifest, and HTML tags ready to paste.",
      optimizeInternalPngLayers:
        "Applies PNG optimization before ICO packaging to reduce output size.",
    },
    smartResize: {
      ratioLock: {
        lockCurrentRatio: "Lock current ratio",
        unlockRatio: "Unlock ratio",
      },
      fitMode: {
        fill: "May distort image when target ratio differs from source ratio.",
        cover: "Fills the target frame completely by center-cropping extra edges.",
        contain: "Fits inside target frame and leaves letterboxing area when needed.",
      },
    },
  },
} as const
