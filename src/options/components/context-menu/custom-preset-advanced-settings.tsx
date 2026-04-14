import type { FormatCodecOptions } from "@/core/types"
import type { CustomFormatInput } from "@/features/custom-formats"
import { FormatOptionsEmptyState } from "@/options/components/shared/format-options-empty-state"
import { FormatAdvancedSettingsCard } from "@/options/components/shared/format-advanced-settings-card"
import {
  mergeCodecOptions,
  type NormalizedTargetCodecOptions,
  type TargetFormatStateValue
} from "@/options/shared/target-format-state"

interface CustomPresetAdvancedSettingsProps {
  value: CustomFormatInput
  targetFormat: TargetFormatStateValue
  normalizedOptions: NormalizedTargetCodecOptions
  onChange: (next: CustomFormatInput) => void
  showEmptyState?: boolean
}

export function CustomPresetAdvancedSettings({
  value,
  targetFormat,
  normalizedOptions,
  onChange,
  showEmptyState = false
}: CustomPresetAdvancedSettingsProps) {
  const hasAdvancedSettings =
    targetFormat === "avif" ||
    targetFormat === "png" ||
    targetFormat === "mozjpeg" ||
    targetFormat === "webp"

  const updateCodecOptions = <K extends keyof FormatCodecOptions>(
    key: K,
    codecOptions: FormatCodecOptions[K]
  ) => {
    onChange({
      ...value,
      formatOptions: mergeCodecOptions(value.formatOptions, {
        [key]: codecOptions
      })
    })
  }

  if (hasAdvancedSettings) {
    return (
      <FormatAdvancedSettingsCard
        targetFormat={targetFormat}
        avif={{
          qualityAlpha: normalizedOptions.avif.qualityAlpha,
          lossless: normalizedOptions.avif.lossless,
          subsample: normalizedOptions.avif.subsample,
          tune: normalizedOptions.avif.tune,
          highAlphaQuality: normalizedOptions.avif.highAlphaQuality,
          onQualityAlphaChange: (next) =>
            updateCodecOptions("avif", {
              ...normalizedOptions.avif,
              qualityAlpha: next
            }),
          onLosslessChange: (next) =>
            updateCodecOptions("avif", {
              ...normalizedOptions.avif,
              lossless: next
            }),
          onSubsampleChange: (next) =>
            updateCodecOptions("avif", {
              ...normalizedOptions.avif,
              subsample: next
            }),
          onTuneChange: (next) =>
            updateCodecOptions("avif", {
              ...normalizedOptions.avif,
              tune: next
            }),
          onHighAlphaQualityChange: (next) =>
            updateCodecOptions("avif", {
              ...normalizedOptions.avif,
              highAlphaQuality: next
            })
        }}
        mozjpeg={{
          progressive: normalizedOptions.mozjpeg.progressive,
          chromaSubsampling: normalizedOptions.mozjpeg.chromaSubsampling,
          onProgressiveChange: (next) =>
            updateCodecOptions("mozjpeg", {
              enabled: normalizedOptions.mozjpeg.enabled,
              progressive: next,
              chromaSubsampling: normalizedOptions.mozjpeg.chromaSubsampling
            }),
          onChromaSubsamplingChange: (next) =>
            updateCodecOptions("mozjpeg", {
              enabled: normalizedOptions.mozjpeg.enabled,
              progressive: normalizedOptions.mozjpeg.progressive,
              chromaSubsampling: next
            })
        }}
        png={{
          cleanTransparentPixels: normalizedOptions.png.cleanTransparentPixels,
          autoGrayscale: normalizedOptions.png.autoGrayscale,
          oxipngCompression: normalizedOptions.png.oxipngCompression,
          progressiveInterlaced: normalizedOptions.png.progressiveInterlaced,
          onCleanTransparentPixelsChange: (next) =>
            updateCodecOptions("png", {
              ...normalizedOptions.png,
              cleanTransparentPixels: next
            }),
          onAutoGrayscaleChange: (next) =>
            updateCodecOptions("png", {
              ...normalizedOptions.png,
              autoGrayscale: next
            }),
          onOxiPngCompressionChange: (next) =>
            updateCodecOptions("png", {
              ...normalizedOptions.png,
              oxipngCompression: next
            }),
          onProgressiveInterlacedChange: (next) =>
            updateCodecOptions("png", {
              ...normalizedOptions.png,
              progressiveInterlaced: next
            })
        }}
        webp={{
          sharpYuv: normalizedOptions.webp.sharpYuv,
          preserveExactAlpha: normalizedOptions.webp.preserveExactAlpha,
          onSharpYuvChange: (next) =>
            updateCodecOptions("webp", {
              ...normalizedOptions.webp,
              sharpYuv: next
            }),
          onPreserveExactAlphaChange: (next) =>
            updateCodecOptions("webp", {
              ...normalizedOptions.webp,
              preserveExactAlpha: next
            })
        }}
        alwaysOpen
      />
    )
  }

  if (!showEmptyState) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <FormatOptionsEmptyState />
    </div>
  )
}
