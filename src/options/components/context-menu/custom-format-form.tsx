import type { CustomFormatInput } from "@/features/custom-formats"
import type { FormatCodecOptions, ImageFormat, PaperSize, SupportedDPI } from "@/core/types"
import { QUALITY_FORMATS } from "@/core/format-config"
import { TextInput } from "@/options/components/ui/text-input"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { Button } from "@/options/components/ui/button"
import { BodyText } from "@/options/components/ui/typography"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import { ResizeCard } from "@/options/components/shared/resize-card"
import { CustomPresetAdvancedSettings } from "@/options/components/context-menu/custom-preset-advanced-settings"
import { resolveEffectiveTargetFormat } from "@/options/shared/target-format-options"
import {
  buildTargetFormatQualityCardConfig,
  mergeCodecOptions,
  normalizeTargetCodecOptions,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode
} from "@/options/shared/target-format-state"
import { Check } from "lucide-react"

export function CustomFormatForm({
  value,
  onChange,
  submitLabel,
  onSubmit,
  onCancel,
  errorMessage
}: {
  value: CustomFormatInput
  onChange: (next: CustomFormatInput) => void
  submitLabel: string
  onSubmit: () => void
  onCancel?: () => void
  errorMessage: string | null
}) {
  const effectiveTargetFormat = resolveEffectiveTargetFormat(
    value.format as Exclude<ImageFormat, "pdf">,
    value.formatOptions
  )
  const normalizedOptions = normalizeTargetCodecOptions(value.formatOptions)
  const canSetQuality = supportsTargetFormatQuality(effectiveTargetFormat)
  const isIcoFormat = value.format === "ico"
  const supportsTinyMode = supportsTargetFormatTinyMode(effectiveTargetFormat)
  const targetCardConfig = buildTargetFormatQualityCardConfig(value.formatOptions)

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

  const buildFormatOptionsForTargetChange = (
    nextFormat: ImageFormat,
    nextTargetFormat: string
  ): FormatCodecOptions => {
    const current = value.formatOptions ?? {}

    return {
      ...current,
      avif: nextFormat === "avif" ? normalizedOptions.avif : current.avif,
      jxl: nextFormat === "jxl" ? normalizedOptions.jxl : current.jxl,
      webp: nextFormat === "webp" ? normalizedOptions.webp : current.webp,
      mozjpeg:
        nextFormat === "jpg"
          ? {
              enabled: nextTargetFormat === "mozjpeg",
              progressive: normalizedOptions.mozjpeg.progressive,
              chromaSubsampling: normalizedOptions.mozjpeg.chromaSubsampling
            }
          : current.mozjpeg,
      ico:
        nextFormat === "ico"
          ? {
              ...normalizedOptions.ico,
              sizes: [...normalizedOptions.ico.sizes]
            }
          : current.ico,
      png: nextFormat === "png" ? normalizedOptions.png : current.png,
      bmp: nextFormat === "bmp" ? normalizedOptions.bmp : current.bmp,
      tiff: nextFormat === "tiff" ? normalizedOptions.tiff : current.tiff
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-3">
          <TextInput
            label="Name"
            placeholder="e.g. My Custom Preset"
            value={value.name}
            onChange={(next) => onChange({ ...value, name: next })}
          />

          <TargetFormatQualityCard
            targetFormat={effectiveTargetFormat}
            quality={value.quality ?? 90}
            formatConfig={targetCardConfig}
            supportsQuality={canSetQuality}
            supportsTinyMode={supportsTinyMode}
            onToggleWebIconKit={(next) =>
              updateCodecOptions("ico", {
                ...normalizedOptions.ico,
                generateWebIconKit: next
              })
            }
            onIcoOptimizeInternalPngLayersChange={(next) =>
              updateCodecOptions("ico", {
                ...normalizedOptions.ico,
                optimizeInternalPngLayers: next
              })
            }
            onIcoSizesChange={(next) =>
              updateCodecOptions("ico", {
                ...normalizedOptions.ico,
                sizes: next
              })
            }
            onTargetFormatChange={(nextTargetFormat) => {
              const nextFormat =
                nextTargetFormat === "mozjpeg"
                  ? "jpg"
                  : (nextTargetFormat as ImageFormat)

              onChange({
                ...value,
                format: nextFormat,
                quality: QUALITY_FORMATS.includes(nextFormat) ? value.quality ?? 90 : value.quality,
                formatOptions: buildFormatOptionsForTargetChange(nextFormat, nextTargetFormat),
                resize:
                  value.resize.mode === "page_size"
                    ? { ...value.resize, dpi: value.resize.dpi ?? 72 }
                    : value.resize
              })
            }}
            onQualityChange={(next) => onChange({ ...value, quality: next })}
            onAvifSpeedChange={(next) => updateCodecOptions("avif", { ...normalizedOptions.avif, speed: next })}
            onJxlEffortChange={(next) => updateCodecOptions("jxl", { effort: next })}
            onWebpLosslessChange={(next) =>
              updateCodecOptions("webp", {
                ...normalizedOptions.webp,
                lossless: next
              })
            }
            onWebpNearLosslessChange={(next) =>
              updateCodecOptions("webp", {
                ...normalizedOptions.webp,
                nearLossless: next
              })
            }
            onWebpEffortChange={(next) =>
              updateCodecOptions("webp", {
                ...normalizedOptions.webp,
                effort: next
              })
            }
            onPngTinyModeChange={(next) =>
              updateCodecOptions("png", {
                ...normalizedOptions.png,
                tinyMode: next
              })
            }
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
            disabled={false}
            alwaysOpen
          />
        </div>

        <div className="space-y-3">
          <CustomPresetAdvancedSettings
            value={value}
            targetFormat={effectiveTargetFormat}
            normalizedOptions={normalizedOptions}
            onChange={onChange}
            showEmptyState
          />
        </div>

        {!isIcoFormat && (
          <div className="space-y-3">
            <ResizeCard
              resizeMode={value.resize.mode}
              resizeValue={typeof value.resize.value === "number" ? value.resize.value : 1280}
              resizeWidth={typeof value.resize.width === "number" ? value.resize.width : 1280}
              resizeHeight={typeof value.resize.height === "number" ? value.resize.height : 960}
              resizeAspectMode={value.resize.aspectMode ?? "free"}
              resizeAspectRatio={value.resize.aspectRatio ?? "16:9"}
              resizeFitMode={value.resize.fitMode ?? "fill"}
              resizeContainBackground={value.resize.containBackground ?? "#000000"}
              resamplingAlgorithm={value.resize.resamplingAlgorithm}
              resizeSourceWidth={1280}
              resizeSourceHeight={960}
              resizeSyncVersion={0}
              paperSize={(typeof value.resize.value === "string" ? value.resize.value : "A4") as PaperSize}
              dpi={(value.resize.dpi ?? 72) as number}
              onResizeModeChange={(next) => {
                if (next === "set_size") {
                  onChange({
                    ...value,
                    resize: {
                      mode: next,
                      width: typeof value.resize.width === "number" ? value.resize.width : 1280,
                      height: typeof value.resize.height === "number" ? value.resize.height : 960,
                      aspectMode: "free",
                      aspectRatio: value.resize.aspectRatio ?? "16:9",
                      sizeAnchor: value.resize.sizeAnchor ?? "width",
                      fitMode: value.resize.fitMode ?? "fill",
                      containBackground: value.resize.containBackground ?? "#000000",
                      resamplingAlgorithm:
                        value.resize.resamplingAlgorithm ?? "browser-default"
                    }
                  })
                  return
                }

                onChange({
                  ...value,
                  resize: {
                    mode: next as any,
                    value:
                      next === "page_size"
                        ? "A4"
                        : next === "none"
                          ? undefined
                          : next === "scale"
                            ? 100
                            : 1280,
                    dpi: next === "page_size" ? 72 : undefined,
                    resamplingAlgorithm:
                      next === "none"
                        ? undefined
                        : value.resize.resamplingAlgorithm ?? "browser-default"
                  }
                })
              }}
              onResizeValueChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    value: Math.max(1, next || 1)
                  }
                })
              }
              onResizeWidthChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    width: next
                  }
                })
              }
              onResizeHeightChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    height: next
                  }
                })
              }
              onResizeAspectModeChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    aspectMode: next as any
                  }
                })
              }
              onResizeAspectRatioChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    aspectRatio: String(next)
                  }
                })
              }
              onResizeFitModeChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    fitMode: next as any
                  }
                })
              }
              onResizeContainBackgroundChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    containBackground: next
                  }
                })
              }
              onResamplingAlgorithmChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    resamplingAlgorithm: next
                  }
                })
              }
              onPaperSizeChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    value: next as PaperSize
                  }
                })
              }
              onDpiChange={(next) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    dpi: next as SupportedDPI
                  }
                })
              }
              disabled={false}
              alwaysOpen
            />
          </div>
        )}
      </div>

      {errorMessage ? <BodyText className="text-red-600 dark:text-red-400">{errorMessage}</BodyText> : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onCancel ? (
          <SecondaryButton onClick={onCancel}>
            Cancel
          </SecondaryButton>
        ) : null}
        <Button
          variant="primary"
          onClick={onSubmit}
          type="button">
          <Check size={16} />
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
