import type { CustomFormatInput } from "@/features/custom-formats"
import type { BmpColorDepth, ImageFormat, PaperSize, SupportedDPI } from "@/core/types"
import { DEFAULT_ICO_SIZES, QUALITY_FORMATS } from "@/core/format-config"
import { TextInput } from "@/options/components/ui/text-input"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { Button } from "@/options/components/ui/button"
import { BodyText } from "@/options/components/ui/typography"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import { FormatAdvancedSettingsCard } from "@/options/components/shared/format-advanced-settings-card"
import { ResizeCard } from "@/options/components/shared/resize-card"
import { resolveEffectiveTargetFormat } from "@/options/shared/target-format-options"
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
  const canSetQuality =
    effectiveTargetFormat === "mozjpeg" || QUALITY_FORMATS.includes(effectiveTargetFormat as ImageFormat)
  const isIcoFormat = value.format === "ico"
  const supportsTinyMode = effectiveTargetFormat === "png"
  const normalizedPngDitheringLevel =
    typeof value.formatOptions?.png?.ditheringLevel === "number"
      ? Math.max(0, Math.min(100, Math.round(value.formatOptions.png.ditheringLevel)))
      : value.formatOptions?.png?.dithering
      ? 100
      : 0
  const pngOptions = {
    tinyMode: Boolean(value.formatOptions?.png?.tinyMode),
    cleanTransparentPixels: Boolean(value.formatOptions?.png?.cleanTransparentPixels),
    autoGrayscale: Boolean(value.formatOptions?.png?.autoGrayscale),
    dithering: normalizedPngDitheringLevel > 0,
    ditheringLevel: normalizedPngDitheringLevel,
    progressiveInterlaced: Boolean(value.formatOptions?.png?.progressiveInterlaced),
    oxipngCompression: Boolean(value.formatOptions?.png?.oxipngCompression)
  }
  const webpOptions = {
    lossless: Boolean(value.formatOptions?.webp?.lossless),
    nearLossless:
      typeof value.formatOptions?.webp?.nearLossless === "number"
        ? Math.max(0, Math.min(100, Math.round(value.formatOptions.webp.nearLossless)))
        : 100,
    effort:
      typeof value.formatOptions?.webp?.effort === "number"
        ? Math.max(1, Math.min(9, Math.round(value.formatOptions.webp.effort)))
        : 5,
    sharpYuv: Boolean(value.formatOptions?.webp?.sharpYuv),
    preserveExactAlpha: Boolean(value.formatOptions?.webp?.preserveExactAlpha)
  }
  const avifOptions = {
    speed:
      typeof value.formatOptions?.avif?.speed === "number"
        ? Math.max(0, Math.min(10, Math.round(value.formatOptions.avif.speed)))
        : 6,
    qualityAlpha:
      typeof value.formatOptions?.avif?.qualityAlpha === "number"
        ? Math.max(0, Math.min(100, Math.round(value.formatOptions.avif.qualityAlpha)))
        : undefined,
    lossless: Boolean(value.formatOptions?.avif?.lossless),
    subsample:
      value.formatOptions?.avif?.subsample === 2 || value.formatOptions?.avif?.subsample === 3
        ? value.formatOptions.avif.subsample
        : 1,
    tune:
      value.formatOptions?.avif?.tune === "ssim" || value.formatOptions?.avif?.tune === "psnr"
        ? value.formatOptions.avif.tune
        : "auto",
    highAlphaQuality: Boolean(value.formatOptions?.avif?.highAlphaQuality)
  } as const
  const tiffOptions: { colorMode: "color" | "grayscale" } = {
    colorMode: value.formatOptions?.tiff?.colorMode === "grayscale" ? "grayscale" : "color"
  }
  const mozjpegOptions = {
    enabled: Boolean(value.formatOptions?.mozjpeg?.enabled),
    progressive: value.formatOptions?.mozjpeg?.progressive ?? true,
    chromaSubsampling: value.formatOptions?.mozjpeg?.chromaSubsampling ?? 2
  } as const
  const rawBmpColorDepth = value.formatOptions?.bmp?.colorDepth
  const bmpColorDepth: BmpColorDepth =
    rawBmpColorDepth === 1 || rawBmpColorDepth === 8 || rawBmpColorDepth === 32
      ? rawBmpColorDepth
      : 24
  const normalizedBmpDitheringLevel =
    typeof value.formatOptions?.bmp?.ditheringLevel === "number"
      ? Math.max(0, Math.min(100, Math.round(value.formatOptions.bmp.ditheringLevel)))
      : value.formatOptions?.bmp?.dithering
      ? 100
      : 0
  const bmpOptions = {
    colorDepth: bmpColorDepth,
    dithering: bmpColorDepth === 1 && normalizedBmpDitheringLevel > 0,
    ditheringLevel: bmpColorDepth === 1 ? normalizedBmpDitheringLevel : 0
  }

  return (
    <div className="space-y-4">
      {/* 2-Column Layout: Name + Format/Quality (left) | Resize (right) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left Column: Name + Target Format & Quality */}
        <div className="space-y-3">
          {/* Name Input */}
          <TextInput
            label="Name"
            placeholder="e.g. My Custom Preset"
            value={value.name}
            onChange={(next) => onChange({ ...value, name: next })}
          />

          {/* Format & Quality Card - Always Open */}
          <TargetFormatQualityCard
            targetFormat={effectiveTargetFormat}
            quality={value.quality ?? 90}
            formatConfig={{
              avif: avifOptions,
              webp: {
                lossless: webpOptions.lossless,
                nearLossless: webpOptions.nearLossless,
                effort: webpOptions.effort
              },
              png: pngOptions,
              jxl: {
                effort: value.formatOptions?.jxl?.effort ?? 7
              },
              bmp: bmpOptions,
              tiff: tiffOptions,
              mozjpeg: {
                progressive: mozjpegOptions.progressive,
                chromaSubsampling: mozjpegOptions.chromaSubsampling
              },
              ico: {
                sizes: value.formatOptions?.ico?.sizes ?? Array.from(DEFAULT_ICO_SIZES),
                generateWebIconKit: value.formatOptions?.ico?.generateWebIconKit ?? false,
                optimizeInternalPngLayers: value.formatOptions?.ico?.optimizeInternalPngLayers ?? false
              }
            }}
            supportsQuality={canSetQuality}
            supportsTinyMode={supportsTinyMode}
            onToggleWebIconKit={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  ico: {
                    sizes: value.formatOptions?.ico?.sizes ?? Array.from(DEFAULT_ICO_SIZES),
                    generateWebIconKit: next,
                    optimizeInternalPngLayers:
                      value.formatOptions?.ico?.optimizeInternalPngLayers ?? false
                  }
                }
              })
            }
            onIcoOptimizeInternalPngLayersChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  ico: {
                    sizes: value.formatOptions?.ico?.sizes ?? Array.from(DEFAULT_ICO_SIZES),
                    generateWebIconKit: value.formatOptions?.ico?.generateWebIconKit ?? false,
                    optimizeInternalPngLayers: next
                  }
                }
              })
            }
            onIcoSizesChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  ico: {
                    sizes: next,
                    generateWebIconKit: value.formatOptions?.ico?.generateWebIconKit ?? false,
                    optimizeInternalPngLayers:
                      value.formatOptions?.ico?.optimizeInternalPngLayers ?? false
                  }
                }
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
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  avif:
                    nextFormat === "avif"
                      ? {
                          ...avifOptions
                        }
                      : value.formatOptions?.avif,
                  jxl:
                    nextFormat === "jxl"
                      ? {
                          effort: value.formatOptions?.jxl?.effort ?? 7
                        }
                      : value.formatOptions?.jxl,
                  webp:
                    nextFormat === "webp"
                      ? {
                          lossless: webpOptions.lossless,
                          nearLossless: webpOptions.nearLossless,
                          effort: webpOptions.effort,
                          sharpYuv: webpOptions.sharpYuv,
                          preserveExactAlpha: webpOptions.preserveExactAlpha
                        }
                      : value.formatOptions?.webp,
                  mozjpeg:
                    nextFormat === "jpg"
                      ? {
                          enabled: nextTargetFormat === "mozjpeg",
                          progressive: mozjpegOptions.progressive,
                          chromaSubsampling: mozjpegOptions.chromaSubsampling
                        }
                      : value.formatOptions?.mozjpeg,
                  ico:
                    nextFormat === "ico"
                      ? value.formatOptions?.ico ?? {
                          sizes: [...DEFAULT_ICO_SIZES],
                          generateWebIconKit: false,
                          optimizeInternalPngLayers: false
                        }
                      : value.formatOptions?.ico,
                  png:
                    nextFormat === "png"
                      ? {
                          ...pngOptions
                        }
                      : value.formatOptions?.png,
                  bmp:
                    nextFormat === "bmp"
                      ? {
                          ...bmpOptions
                        }
                      : value.formatOptions?.bmp,
                  tiff:
                    nextFormat === "tiff"
                      ? {
                          colorMode: tiffOptions.colorMode
                        }
                      : value.formatOptions?.tiff
                },
                resize:
                  value.resize.mode === "page_size"
                    ? { ...value.resize, dpi: value.resize.dpi ?? 72 }
                    : value.resize
              })
            }}
            onQualityChange={(next) => onChange({ ...value, quality: next })}
            onAvifSpeedChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  avif: {
                    ...avifOptions,
                    speed: next
                  }
                }
              })
            }
            onJxlEffortChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  jxl: {
                    effort: next
                  }
                }
              })
            }
            onWebpLosslessChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  webp: {
                    ...webpOptions,
                    lossless: next
                  }
                }
              })
            }
            onWebpNearLosslessChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  webp: {
                    ...webpOptions,
                    nearLossless: next
                  }
                }
              })
            }
            onWebpEffortChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  webp: {
                    ...webpOptions,
                    effort: next
                  }
                }
              })
            }
            onPngTinyModeChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  png: {
                    ...pngOptions,
                    tinyMode: next
                  }
                }
              })
            }
            onPngDitheringLevelChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  png: {
                    ...pngOptions,
                    ditheringLevel: next,
                    dithering: next > 0
                  }
                }
              })
            }
            onBmpColorDepthChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  bmp: {
                    ...bmpOptions,
                    colorDepth: next,
                    dithering: next === 1 ? bmpOptions.dithering : false,
                    ditheringLevel: next === 1 ? bmpOptions.ditheringLevel : 0
                  }
                }
              })
            }
            onBmpDitheringLevelChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  bmp: {
                    ...bmpOptions,
                    ditheringLevel: next,
                    dithering: next > 0
                  }
                }
              })
            }
            onTiffColorModeChange={(next) =>
              onChange({
                ...value,
                formatOptions: {
                  ...(value.formatOptions ?? {}),
                  tiff: {
                    colorMode: next
                  }
                }
              })
            }
            disabled={false}
            alwaysOpen
          />

          <FormatAdvancedSettingsCard
            targetFormat={effectiveTargetFormat}
            avif={{
              qualityAlpha: avifOptions.qualityAlpha,
              lossless: avifOptions.lossless,
              subsample: avifOptions.subsample,
              tune: avifOptions.tune,
              highAlphaQuality: avifOptions.highAlphaQuality,
              onQualityAlphaChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    avif: {
                      ...avifOptions,
                      qualityAlpha: next
                    }
                  }
                }),
              onLosslessChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    avif: {
                      ...avifOptions,
                      lossless: next
                    }
                  }
                }),
              onSubsampleChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    avif: {
                      ...avifOptions,
                      subsample: next
                    }
                  }
                }),
              onTuneChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    avif: {
                      ...avifOptions,
                      tune: next
                    }
                  }
                }),
              onHighAlphaQualityChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    avif: {
                      ...avifOptions,
                      highAlphaQuality: next
                    }
                  }
                })
            }}
            mozjpeg={{
              progressive: mozjpegOptions.progressive,
              chromaSubsampling: mozjpegOptions.chromaSubsampling,
              onProgressiveChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    mozjpeg: {
                      enabled: Boolean(value.formatOptions?.mozjpeg?.enabled),
                      progressive: next,
                      chromaSubsampling: mozjpegOptions.chromaSubsampling
                    }
                  }
                }),
              onChromaSubsamplingChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    mozjpeg: {
                      enabled: Boolean(value.formatOptions?.mozjpeg?.enabled),
                      progressive: mozjpegOptions.progressive,
                      chromaSubsampling: next
                    }
                  }
                })
            }}
            png={{
              cleanTransparentPixels: pngOptions.cleanTransparentPixels,
              autoGrayscale: pngOptions.autoGrayscale,
              oxipngCompression: pngOptions.oxipngCompression,
              progressiveInterlaced: pngOptions.progressiveInterlaced,
              onCleanTransparentPixelsChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    png: {
                      ...pngOptions,
                      cleanTransparentPixels: next
                    }
                  }
                }),
              onAutoGrayscaleChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    png: {
                      ...pngOptions,
                      autoGrayscale: next
                    }
                  }
                }),
              onOxiPngCompressionChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    png: {
                      ...pngOptions,
                      oxipngCompression: next
                    }
                  }
                }),
              onProgressiveInterlacedChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    png: {
                      ...pngOptions,
                      progressiveInterlaced: next
                    }
                  }
                })
            }}
            webp={{
              sharpYuv: webpOptions.sharpYuv,
              preserveExactAlpha: webpOptions.preserveExactAlpha,
              onSharpYuvChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    webp: {
                      ...webpOptions,
                      sharpYuv: next
                    }
                  }
                }),
              onPreserveExactAlphaChange: (next) =>
                onChange({
                  ...value,
                  formatOptions: {
                    ...(value.formatOptions ?? {}),
                    webp: {
                      ...webpOptions,
                      preserveExactAlpha: next
                    }
                  }
                })
            }}
            alwaysOpen
          />
        </div>

        {/* Right Column: Resize (if not ICO format) */}
        {!isIcoFormat && (
          <div className="mt-5">
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
