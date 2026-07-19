import React from "react"
import { Maximize2 } from "lucide-react"
import {
  DEFAULT_RESAMPLING_ALGORITHM,
  RESAMPLING_ALGORITHM_OPTIONS,
  normalizeResizeResamplingAlgorithm
} from "@imify/core/resize-resampling"
import type { ResizeResamplingAlgorithm, ResizeApplyTo } from "@imify/core/types"
import { SmartResizeModule } from "@/options/components/smart-resize-module"
import { PaperConfig } from "@/options/components/paper-config"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { useTranslation } from "@imify/i18n"

export type ResizeCardProps = {
  resizeMode: string
  resizeValue?: number
  resizeApplyTo?: ResizeApplyTo
  resizeWidth?: number
  resizeHeight?: number
  resizeAspectMode?: string
  resizeAspectRatio?: number | string
  resizeFitMode?: string
  resizeContainBackground?: string
  resamplingAlgorithm?: ResizeResamplingAlgorithm
  resizeSourceWidth?: number
  resizeSourceHeight?: number
  resizeSyncVersion?: number
  paperSize?: string
  dpi?: number
  onResizeModeChange?: (mode: string) => void
  onResizeValueChange?: (value: number) => void
  onResizeApplyToChange?: (value: ResizeApplyTo) => void
  onResizeWidthChange?: (value: number) => void
  onResizeHeightChange?: (value: number) => void
  onResizeAspectModeChange?: (mode: string) => void
  onResizeAspectRatioChange?: (ratio: string | number) => void
  onResizeFitModeChange?: (mode: string) => void
  onResizeContainBackgroundChange?: (color: string) => void
  onResamplingAlgorithmChange?: (algorithm: ResizeResamplingAlgorithm) => void
  onPaperSizeChange?: (size: string) => void
  onDpiChange?: (dpi: number) => void
  disabled?: boolean
  availableModes?: string[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
}

function generateSublabel(
  mode: string,
  resizeValue: number,
  resizeApplyTo: string,
  resizeWidth: number,
  resizeHeight: number,
  paperSize: string,
  dpi: number,
  resamplingAlgorithm: ResizeResamplingAlgorithm
): string {
  const baseLabel = (() => {
    switch (mode) {
      case "none":
      case "inherit":
        return "No resize"
      case "fit_value":
        return `Fit ${resizeApplyTo} • ${resizeValue}px`
      case "zoom_min":
        return `Zoom min ${resizeApplyTo} • ${resizeValue}px`
      case "zoom_max":
        return `Zoom max ${resizeApplyTo} • ${resizeValue}px`
      case "set_size":
        return `Set size • ${resizeWidth}×${resizeHeight}`
      case "scale":
        return `Scale • ${resizeValue}%`
      case "paper_size":
      case "page_size":
        return `${paperSize} @ ${dpi}dpi`
      default:
        return "No resize"
    }
  })()

  if (mode === "none" || mode === "inherit" || resamplingAlgorithm === DEFAULT_RESAMPLING_ALGORITHM) {
    return baseLabel
  }

  const algorithmLabel =
    RESAMPLING_ALGORITHM_OPTIONS.find((option) => option.value === resamplingAlgorithm)?.label ??
    resamplingAlgorithm
  return `${baseLabel} • ${algorithmLabel}`
}

export function ResizeCard({
  resizeMode = "inherit",
  resizeValue = 1280,
  resizeApplyTo = "width",
  resizeWidth = 1280,
  resizeHeight = 960,
  resizeAspectMode = "original",
  resizeAspectRatio = "16:9",
  resizeFitMode = "fill",
  resizeContainBackground = "#000000",
  resamplingAlgorithm = DEFAULT_RESAMPLING_ALGORITHM,
  resizeSourceWidth = 0,
  resizeSourceHeight = 0,
  resizeSyncVersion = 0,
  paperSize = "A4",
  dpi = 300,
  onResizeModeChange,
  onResizeValueChange,
  onResizeApplyToChange,
  onResizeWidthChange,
  onResizeHeightChange,
  onResizeAspectModeChange,
  onResizeAspectRatioChange,
  onResizeFitModeChange,
  onResizeContainBackgroundChange,
  onResamplingAlgorithmChange,
  onPaperSizeChange,
  onDpiChange,
  disabled,
  availableModes,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId
}: ResizeCardProps) {
  const { t } = useTranslation("processor")

  const batchModeMap: Record<string, string> = {
    inherit: t("resizeNone"),
    fit_value: t("resizeFitValue"),
    zoom_min: t("resizeZoomMin"),
    zoom_max: t("resizeZoomMax"),
    set_size: t("resizeSetSize"),
    scale: t("resizeScale"),
    paper_size: t("resizePaperSize")
  }

  const modeOptions = availableModes
    ? availableModes.map((mode) => ({ value: mode, label: batchModeMap[mode] || mode }))
    : Object.entries(batchModeMap).map(([value, label]) => ({ value, label }))

  const applyToOptions = [
    { value: "width", label: t("applyToWidth") },
    { value: "height", label: t("applyToHeight") },
    { value: "shortest", label: t("applyToShortest") },
    { value: "longest", label: t("applyToLongest") }
  ]

  const safeResamplingAlgorithm = normalizeResizeResamplingAlgorithm(resamplingAlgorithm)
  const sublabel = generateSublabel(
    resizeMode,
    resizeValue,
    resizeApplyTo,
    resizeWidth,
    resizeHeight,
    paperSize,
    dpi,
    safeResamplingAlgorithm
  )

  const showResamplingAlgorithm = Boolean(onResamplingAlgorithmChange) && resizeMode !== "none" && resizeMode !== "inherit"

  const isLinearMode =
    resizeMode === "fit_value" ||
    resizeMode === "zoom_min" ||
    resizeMode === "zoom_max"

  return (
    <AccordionCard
      icon={<Maximize2 size={14} />}
      label={t("resize")}
      sublabel={sublabel}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
      colorTheme="purple"
    >
      <div className="space-y-3">
        <SelectInput
          label={t("resizeType")}
          value={resizeMode}
          disabled={disabled}
          options={modeOptions}
          onChange={(val) => onResizeModeChange?.(val)}
        />

        {isLinearMode && (
          <SelectInput
            label={t("resizeApplyTo")}
            value={resizeApplyTo}
            disabled={disabled}
            options={applyToOptions}
            onChange={(val) => onResizeApplyToChange?.(val as ResizeApplyTo)}
          />
        )}

        {(isLinearMode || resizeMode === "scale") && (
          <NumberInput
            label={resizeMode === "scale" ? t("scalePercent") : t("valuePx")}
            disabled={disabled}
            min={1}
            value={resizeValue}
            onChangeValue={(val) => onResizeValueChange?.(val)}
          />
        )}

        {resizeMode === "set_size" && (
          <SmartResizeModule
            containBackground={resizeContainBackground}
            disabled={disabled}
            fitMode={resizeFitMode as "fill" | "cover" | "contain"}
            height={resizeHeight}
            aspectMode={resizeAspectMode as "fixed" | "original" | "free"}
            aspectRatio={typeof resizeAspectRatio === "string" ? resizeAspectRatio : String(resizeAspectRatio)}
            onAspectModeChange={(mode) => onResizeAspectModeChange?.(mode)}
            onAspectRatioChange={(ratio) => onResizeAspectRatioChange?.(ratio)}
            onContainBackgroundChange={(color) => onResizeContainBackgroundChange?.(color)}
            onFitModeChange={(mode) => onResizeFitModeChange?.(mode)}
            onHeightChange={(height) => onResizeHeightChange?.(height)}
            onSizeAnchorChange={() => {}}
            onWidthChange={(width) => onResizeWidthChange?.(width)}
            originalHeight={resizeSourceHeight}
            originalWidth={resizeSourceWidth}
            lockSignal={resizeSyncVersion}
            width={resizeWidth}
          />
        )}

        {(resizeMode === "paper_size" || (resizeMode as any) === "page_size") && (
          <PaperConfig
            disabled={disabled}
            dpi={dpi as any}
            onDpiChange={(d) => onDpiChange?.(d)}
            onPaperSizeChange={(size) => onPaperSizeChange?.(size)}
            paperSize={paperSize as any}
          />
        )}

        {showResamplingAlgorithm && (
          <SelectInput
            label={t("resamplingAlgorithm")}
            value={safeResamplingAlgorithm}
            disabled={disabled}
            options={RESAMPLING_ALGORITHM_OPTIONS}
            onChange={(nextValue) =>
              onResamplingAlgorithmChange?.(normalizeResizeResamplingAlgorithm(nextValue))
            }
          />
        )}
      </div>
    </AccordionCard>
  )
}

export default ResizeCard
