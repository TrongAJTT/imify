import { useState } from "react"
import type { CustomFormatInput } from "@/features/custom-formats"
import type { ImageFormat, PaperSize, SupportedDPI } from "@/core/types"
import { CUSTOM_FORMATS, DEFAULT_ICO_SIZES, FORMAT_LABELS, QUALITY_FORMATS } from "@/core/format-config"
import { TextInput } from "@/options/components/ui/text-input"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { Button } from "@/options/components/ui/button"
import { BodyText } from "@/options/components/ui/typography"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import { ResizeCard } from "@/options/components/shared/resize-card"
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
  const canSetQuality = QUALITY_FORMATS.includes(value.format)
  const isIcoFormat = value.format === "ico"
  const [isTargetFormatQualityOpen, setIsTargetFormatQualityOpen] = useState(false)
  const [isResizeOpen, setIsResizeOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Name Input */}
      <TextInput
        label="Name"
        placeholder="e.g. My Custom JPG"
        value={value.name}
        onChange={(next) => onChange({ ...value, name: next })}
      />

      {/* Format & Quality Card */}
      <TargetFormatQualityCard
        targetFormat={value.format}
        quality={value.quality ?? 90}
        pngTinyMode={false}
        formatOptions={CUSTOM_FORMATS.map((formatOption) => ({
          value: formatOption,
          label: FORMAT_LABELS[formatOption]
        }))}
        supportsQuality={canSetQuality}
        supportsTinyMode={false}
        icoSizes={value.icoOptions?.sizes ?? Array.from(DEFAULT_ICO_SIZES)}
        icoGenerateWebIconKit={value.icoOptions?.generateWebIconKit ?? false}
        onToggleWebIconKit={(next) =>
          onChange({
            ...value,
            icoOptions: {
              sizes: value.icoOptions?.sizes ?? Array.from(DEFAULT_ICO_SIZES),
              generateWebIconKit: next
            }
          })
        }
        onIcoSizesChange={(next) =>
          onChange({
            ...value,
            icoOptions: {
              sizes: next,
              generateWebIconKit: value.icoOptions?.generateWebIconKit ?? false
            }
          })
        }
        onTargetFormatChange={(nextFormat) =>
          onChange({
            ...value,
            format: nextFormat as ImageFormat,
            quality: QUALITY_FORMATS.includes(nextFormat as ImageFormat)
              ? value.quality ?? 90
              : value.quality,
            icoOptions:
              nextFormat === "ico"
                ? value.icoOptions ?? {
                    sizes: [...DEFAULT_ICO_SIZES],
                    generateWebIconKit: false
                  }
                : value.icoOptions,
            resize:
              value.resize.mode === "page_size"
                ? { ...value.resize, dpi: value.resize.dpi ?? 72 }
                : value.resize
          })
        }
        onQualityChange={(next) => onChange({ ...value, quality: next })}
        onPngTinyModeChange={() => {}}
        disabled={false}
        isOpen={isTargetFormatQualityOpen}
        onOpenChange={setIsTargetFormatQualityOpen}
      />

      {/* Resize Card - only show if not ICO */}
      {!isIcoFormat && (
        <ResizeCard
          resizeMode={value.resize.mode}
          resizeValue={typeof value.resize.value === "number" ? value.resize.value : 1280}
          resizeWidth={typeof value.resize.width === "number" ? value.resize.width : 1280}
          resizeHeight={typeof value.resize.height === "number" ? value.resize.height : 960}
          resizeAspectMode={value.resize.aspectMode ?? "free"}
          resizeAspectRatio={value.resize.aspectRatio ?? "16:9"}
          resizeFitMode={value.resize.fitMode ?? "fill"}
          resizeContainBackground={value.resize.containBackground ?? "#000000"}
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
                  containBackground: value.resize.containBackground ?? "#000000"
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
                dpi: next === "page_size" ? 72 : undefined
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
          isOpen={isResizeOpen}
          onOpenChange={setIsResizeOpen}
        />
      )}

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
