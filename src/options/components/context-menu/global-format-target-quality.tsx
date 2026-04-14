import { DEFAULT_ICO_SIZES, QUALITY_FORMATS } from "@/core/format-config"
import type {
  BmpColorDepth,
  FormatCodecOptions,
  FormatConfig,
  ImageFormat,
  TiffColorMode
} from "@/core/types"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import {
  buildTargetFormatOptions,
  resolveEffectiveTargetFormat,
  type TargetFormatOptionValue
} from "@/options/shared/target-format-options"

function normalizeQuality(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 90
  }

  return Math.max(1, Math.min(100, Math.round(value)))
}

interface GlobalFormatTargetQualityProps {
  config: FormatConfig
  cardFormat: Exclude<ImageFormat, "pdf">
  disabled?: boolean
  onChange: (next: FormatConfig) => void
}

export function GlobalFormatTargetQuality({
  config,
  cardFormat,
  disabled,
  onChange
}: GlobalFormatTargetQualityProps) {
  const quality = normalizeQuality(config.quality)
  const sourceOptions = config.formatOptions ?? {}

  const avifOptions = {
    speed: typeof sourceOptions.avif?.speed === "number" ? sourceOptions.avif.speed : 6
  }

  const jxlOptions = {
    effort: typeof sourceOptions.jxl?.effort === "number" ? sourceOptions.jxl.effort : 7
  }

  const webpOptions = {
    lossless: Boolean(sourceOptions.webp?.lossless),
    nearLossless:
      typeof sourceOptions.webp?.nearLossless === "number"
        ? Math.max(0, Math.min(100, Math.round(sourceOptions.webp.nearLossless)))
        : 100,
    effort:
      typeof sourceOptions.webp?.effort === "number"
        ? Math.max(1, Math.min(9, Math.round(sourceOptions.webp.effort)))
        : 5,
    sharpYuv: Boolean(sourceOptions.webp?.sharpYuv),
    preserveExactAlpha: Boolean(sourceOptions.webp?.preserveExactAlpha)
  }

  const pngOptions = {
    tinyMode: Boolean(sourceOptions.png?.tinyMode),
    cleanTransparentPixels: Boolean(sourceOptions.png?.cleanTransparentPixels),
    autoGrayscale: Boolean(sourceOptions.png?.autoGrayscale),
    dithering: Boolean(sourceOptions.png?.dithering),
    ditheringLevel:
      typeof sourceOptions.png?.ditheringLevel === "number"
        ? Math.max(0, Math.min(100, Math.round(sourceOptions.png.ditheringLevel)))
        : 0,
    progressiveInterlaced: Boolean(sourceOptions.png?.progressiveInterlaced),
    oxipngCompression: Boolean(sourceOptions.png?.oxipngCompression)
  }

  const rawBmpColorDepth = sourceOptions.bmp?.colorDepth
  const bmpColorDepth: BmpColorDepth =
    rawBmpColorDepth === 1 || rawBmpColorDepth === 8 || rawBmpColorDepth === 32
      ? rawBmpColorDepth
      : 24

  const bmpOptions = {
    colorDepth: bmpColorDepth,
    dithering: Boolean(sourceOptions.bmp?.dithering),
    ditheringLevel:
      typeof sourceOptions.bmp?.ditheringLevel === "number"
        ? Math.max(0, Math.min(100, Math.round(sourceOptions.bmp.ditheringLevel)))
        : 0
  }

  const tiffOptions = {
    colorMode: sourceOptions.tiff?.colorMode === "grayscale" ? "grayscale" : "color"
  } satisfies { colorMode: TiffColorMode }

  const mozjpegOptions = {
    enabled: Boolean(sourceOptions.mozjpeg?.enabled),
    progressive: sourceOptions.mozjpeg?.progressive ?? true,
    chromaSubsampling: sourceOptions.mozjpeg?.chromaSubsampling ?? 2
  } as const

  const icoOptions = {
    sizes: sourceOptions.ico?.sizes?.length ? sourceOptions.ico.sizes : [...DEFAULT_ICO_SIZES],
    generateWebIconKit: Boolean(sourceOptions.ico?.generateWebIconKit),
    optimizeInternalPngLayers: Boolean(sourceOptions.ico?.optimizeInternalPngLayers)
  }

  const targetFormat = resolveEffectiveTargetFormat(cardFormat, sourceOptions)

  const formatOptions: Array<{ value: TargetFormatOptionValue; label: string }> =
    cardFormat === "jpg"
      ? buildTargetFormatOptions(["jpg", "mozjpeg"])
      : buildTargetFormatOptions([cardFormat])

  const supportsQuality = targetFormat === "mozjpeg" || QUALITY_FORMATS.includes(targetFormat as ImageFormat)
  const supportsTinyMode = targetFormat === "png"

  const updateCodecOptions = <K extends keyof FormatCodecOptions>(
    key: K,
    value: FormatCodecOptions[K]
  ) => {
    onChange({
      ...config,
      quality,
      format: cardFormat,
      formatOptions: {
        ...sourceOptions,
        [key]: value
      }
    })
  }

  return (
    <TargetFormatQualityCard
      cardLabel="Format & Quality Settings"
      targetFormat={targetFormat}
      quality={quality}
      formatConfig={{
        avif: avifOptions,
        jxl: jxlOptions,
        webp: webpOptions,
        png: pngOptions,
        bmp: bmpOptions,
        tiff: tiffOptions,
        mozjpeg: mozjpegOptions,
        ico: icoOptions
      }}
      formatOptions={formatOptions}
      supportsQuality={supportsQuality}
      supportsTinyMode={supportsTinyMode}
      onTargetFormatChange={(next) => {
        if (cardFormat !== "jpg") {
          return
        }

        const nextIsMozjpeg = next === "mozjpeg"

        updateCodecOptions("mozjpeg", {
          enabled: nextIsMozjpeg,
          progressive: mozjpegOptions.progressive,
          chromaSubsampling: mozjpegOptions.chromaSubsampling
        })
      }}
      onQualityChange={(next) => onChange({ ...config, quality: next, format: cardFormat })}
      onAvifSpeedChange={(next) => updateCodecOptions("avif", { speed: next })}
      onJxlEffortChange={(next) => updateCodecOptions("jxl", { effort: next })}
      onWebpLosslessChange={(next) => updateCodecOptions("webp", { ...webpOptions, lossless: next })}
      onWebpNearLosslessChange={(next) =>
        updateCodecOptions("webp", { ...webpOptions, nearLossless: next })
      }
      onWebpEffortChange={(next) => updateCodecOptions("webp", { ...webpOptions, effort: next })}
      onPngTinyModeChange={(next) => updateCodecOptions("png", { ...pngOptions, tinyMode: next })}
      onPngDitheringLevelChange={(next) =>
        updateCodecOptions("png", {
          ...pngOptions,
          ditheringLevel: next,
          dithering: next > 0
        })
      }
      onBmpColorDepthChange={(next) =>
        updateCodecOptions("bmp", {
          ...bmpOptions,
          colorDepth: next,
          dithering: next === 1 ? bmpOptions.dithering : false,
          ditheringLevel: next === 1 ? bmpOptions.ditheringLevel : 0
        })
      }
      onBmpDitheringLevelChange={(next) =>
        updateCodecOptions("bmp", {
          ...bmpOptions,
          ditheringLevel: next,
          dithering: next > 0
        })
      }
      onTiffColorModeChange={(next) => updateCodecOptions("tiff", { colorMode: next })}
      onIcoSizesChange={(next) => updateCodecOptions("ico", { ...icoOptions, sizes: next })}
      onToggleWebIconKit={(next) =>
        updateCodecOptions("ico", { ...icoOptions, generateWebIconKit: next })
      }
      onIcoOptimizeInternalPngLayersChange={(next) =>
        updateCodecOptions("ico", { ...icoOptions, optimizeInternalPngLayers: next })
      }
      disabled={disabled}
      alwaysOpen={true}
    />
  )
}
