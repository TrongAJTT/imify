import type { FormatCodecOptions, FormatConfig, ImageFormat } from "@/core/types"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import {
  buildTargetFormatOptions,
  resolveEffectiveTargetFormat,
  type TargetFormatOptionValue
} from "@/options/shared/target-format-options"
import {
  buildTargetFormatQualityCardConfig,
  mergeCodecOptions,
  normalizeTargetCodecOptions,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode
} from "@/options/shared/target-format-state"

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
  const normalizedOptions = normalizeTargetCodecOptions(sourceOptions)

  const targetFormat = resolveEffectiveTargetFormat(cardFormat, sourceOptions)

  const formatOptions: Array<{ value: TargetFormatOptionValue; label: string }> =
    cardFormat === "jpg"
      ? buildTargetFormatOptions(["jpg", "mozjpeg"])
      : buildTargetFormatOptions([cardFormat])

  const supportsQuality = supportsTargetFormatQuality(targetFormat)
  const supportsTinyMode = supportsTargetFormatTinyMode(targetFormat)

  const updateCodecOptions = <K extends keyof FormatCodecOptions>(
    key: K,
    value: FormatCodecOptions[K]
  ) => {
    onChange({
      ...config,
      quality,
      format: cardFormat,
      formatOptions: mergeCodecOptions(sourceOptions, {
        [key]: value
      })
    })
  }

  return (
    <TargetFormatQualityCard
      cardLabel={cardFormat.toUpperCase() + " Options"}
      targetFormat={targetFormat}
      quality={quality}
      formatConfig={buildTargetFormatQualityCardConfig(sourceOptions)}
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
          progressive: normalizedOptions.mozjpeg.progressive,
          chromaSubsampling: normalizedOptions.mozjpeg.chromaSubsampling
        })
      }}
      onQualityChange={(next) => onChange({ ...config, quality: next, format: cardFormat })}
      onAvifSpeedChange={(next) => updateCodecOptions("avif", { ...normalizedOptions.avif, speed: next })}
      onJxlEffortChange={(next) => updateCodecOptions("jxl", { ...normalizedOptions.jxl, effort: next })}
      onJxlLosslessChange={(next) =>
        updateCodecOptions("jxl", {
          ...normalizedOptions.jxl,
          lossless: next
        })
      }
      onWebpLosslessChange={(next) =>
        updateCodecOptions("webp", { ...normalizedOptions.webp, lossless: next })
      }
      onWebpNearLosslessChange={(next) =>
        updateCodecOptions("webp", { ...normalizedOptions.webp, nearLossless: next })
      }
      onWebpEffortChange={(next) => updateCodecOptions("webp", { ...normalizedOptions.webp, effort: next })}
      onPngTinyModeChange={(next) => updateCodecOptions("png", { ...normalizedOptions.png, tinyMode: next })}
      onPngDitheringLevelChange={(next) =>
        updateCodecOptions("png", {
          ...normalizedOptions.png,
          ditheringLevel: next,
          dithering: next > 0
        })
      }
      onBmpColorDepthChange={(next) =>
        updateCodecOptions("bmp", {
          ...normalizedOptions.bmp,
          colorDepth: next,
          dithering: next === 1 ? normalizedOptions.bmp.dithering : false,
          ditheringLevel: next === 1 ? normalizedOptions.bmp.ditheringLevel : 0
        })
      }
      onBmpDitheringLevelChange={(next) =>
        updateCodecOptions("bmp", {
          ...normalizedOptions.bmp,
          ditheringLevel: next,
          dithering: next > 0
        })
      }
      onTiffColorModeChange={(next) => updateCodecOptions("tiff", { colorMode: next })}
      onIcoSizesChange={(next) => updateCodecOptions("ico", { ...normalizedOptions.ico, sizes: next })}
      onToggleWebIconKit={(next) =>
        updateCodecOptions("ico", { ...normalizedOptions.ico, generateWebIconKit: next })
      }
      onIcoOptimizeInternalPngLayersChange={(next) =>
        updateCodecOptions("ico", { ...normalizedOptions.ico, optimizeInternalPngLayers: next })
      }
      disabled={disabled}
      alwaysOpen={true}
    />
  )
}
