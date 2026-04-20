export const TARGET_FORMAT_TOOLTIPS = {
  nearLossless:
    "Subtly adjusts pixels to reduce file size while maintaining near-perfect quality. Use 100 for true lossless.",
  webpEffort:
    `Higher effort uses slower but stronger compression search.
    - 1 is fastest
    - 5 is balanced
    - 9 is best compression (slowest)`,
  jxlEffort:
    `Effort controls compression algorithm complexity.
    - Higher values (7-9) produce smaller files but are slower.
    - Lower values (1-3) are faster but files are larger.
    - Default (7) is optimal for most images.`,
  jxlLossless:
    "Stores exact pixels without quantization. Great for archival assets and graphics with text, but files are larger and quality slider is disabled.",
  jxlProgressive:
    "Writes progressive codestreams so large images can preview earlier over slow networks. Useful for web delivery, with slight encode overhead.",
  jxlEpf:
    `EPF (Edge Preserving Filter) smooths encoding artifacts.
    - 0 disables smoothing for maximum detail
    - 1 is balanced (default)
    - 2-3 increase smoothing for noisy or photo-heavy content`,
  avifSpeed:
    `AVIF speed is inverse effort:
    - 0 = smallest file, best quality, slowest
    - 10 = fastest encode, larger file
    - Default 6 is balanced.`,
  bmpColorDepth:
    `BMP has no quality slider. File size and visual mode are controlled by bits per pixel.
    - 24-bit RGB: standard, full color.
    - 32-bit RGBA: keeps alpha channel.
    - 8-bit Grayscale: lightweight monochrome range.
    - 1-bit Monochrome: black/white for printers and embedded devices.`,
  bmpDithering:
    `Controls error-diffusion strength for monochrome conversion.
    - 0% disables dithering
    - Higher values preserve gradients with denser dot patterns.`,
  tiffColorMode:
    `TIFF output remains uncompressed in UTIF, but you can choose visual color rendering.
    - RGB keeps full color.
    - Grayscale converts the output image to black & white.`,
  tinyMode:
    `Use 8-bit quantization to reduce PNG size by up to 70% (TinyPNG-like). Best for web graphics and UI assets, not recommended for portrait photos.`,
  pngDithering:
    `Controls error-diffusion strength during PNG quantization.
    - 0% disables dithering
    - Higher values smooth gradients with stronger diffusion.`,
} as const
