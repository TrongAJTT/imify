import { Maximize2 } from "lucide-react"
import {
  DEFAULT_RESAMPLING_ALGORITHM,
  RESAMPLING_ALGORITHM_OPTIONS,
  normalizeResizeResamplingAlgorithm
} from "@/core/resize-resampling"
import type { ResizeResamplingAlgorithm } from "@/core/types"
import { SmartResizeModule } from "@/options/components/smart-resize-module"
import { PaperConfig } from "@/options/components/paper-config"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"

export type ResizeCardProps = {
  resizeMode: string
  resizeValue: number
  resizeWidth: number
  resizeHeight: number
  resizeAspectMode: string
  resizeAspectRatio: number | string
  resizeFitMode: string
  resizeContainBackground: string
  resamplingAlgorithm?: ResizeResamplingAlgorithm
  resizeSourceWidth: number
  resizeSourceHeight: number
  resizeSyncVersion: number
  paperSize: string
  dpi: number
  onResizeModeChange: (mode: string) => void
  onResizeValueChange: (value: number) => void
  onResizeWidthChange: (value: number) => void
  onResizeHeightChange: (value: number) => void
  onResizeAspectModeChange: (mode: string) => void
  onResizeAspectRatioChange: (ratio: string | number) => void
  onResizeFitModeChange: (mode: string) => void
  onResizeContainBackgroundChange: (color: string) => void
  onResamplingAlgorithmChange?: (algorithm: ResizeResamplingAlgorithm) => void
  onPaperSizeChange: (size: string) => void
  onDpiChange: (dpi: number) => void
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
      case "change_width":
      case "fit_width":
        return `Fit width • ${resizeValue}px`
      case "change_height":
      case "fit_height":
        return `Fit height • ${resizeValue}px`
      case "set_size":
        return `Set size • ${resizeWidth}×${resizeHeight}`
      case "scale":
        return `Scale • ${resizeValue}%`
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
  resizeMode,
  resizeValue,
  resizeWidth,
  resizeHeight,
  resizeAspectMode,
  resizeAspectRatio,
  resizeFitMode,
  resizeContainBackground,
  resamplingAlgorithm = DEFAULT_RESAMPLING_ALGORITHM,
  resizeSourceWidth,
  resizeSourceHeight,
  resizeSyncVersion,
  paperSize,
  dpi,
  onResizeModeChange,
  onResizeValueChange,
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
  groupId,
}: ResizeCardProps) {
  const batchModeMap: Record<string, string> = {
    none: "No resize",
    change_width: "Fit width",
    change_height: "Fit height",
    set_size: "Set size",
    scale: "Scale",
    page_size: "Paper size"
  }
  const splicingModeMap: Record<string, string> = {
    none: "No resize",
    fit_width: "Fit width",
    fit_height: "Fit height"
  }

  const modeOptions =
    availableModes
      ? availableModes.map((mode) => ({ value: mode, label: splicingModeMap[mode] || mode }))
      : Object.entries(batchModeMap).map(([value, label]) => ({ value, label }))

  const safeResamplingAlgorithm = normalizeResizeResamplingAlgorithm(resamplingAlgorithm)
  const sublabel = generateSublabel(
    resizeMode,
    resizeValue,
    resizeWidth,
    resizeHeight,
    paperSize,
    dpi,
    safeResamplingAlgorithm
  )
  const showResamplingAlgorithm = Boolean(onResamplingAlgorithmChange) && resizeMode !== "none" && resizeMode !== "inherit"

  return (
    <AccordionCard
      icon={<Maximize2 size={14} />}
      label="Resize"
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
          label="Resize type"
          value={resizeMode}
          disabled={disabled}
          options={modeOptions}
          onChange={onResizeModeChange}
        />

        {(resizeMode === "change_width" ||
          resizeMode === "fit_width" ||
          resizeMode === "change_height" ||
          resizeMode === "fit_height" ||
          resizeMode === "scale") && (
          <NumberInput
            label={resizeMode === "scale" ? "Scale (%)" : "Value (px)"}
            disabled={disabled}
            min={1}
            value={resizeValue}
            onChangeValue={onResizeValueChange}
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
            onAspectModeChange={onResizeAspectModeChange}
            onAspectRatioChange={onResizeAspectRatioChange}
            onContainBackgroundChange={onResizeContainBackgroundChange}
            onFitModeChange={onResizeFitModeChange}
            onHeightChange={onResizeHeightChange}
            onSizeAnchorChange={() => {}}
            onWidthChange={onResizeWidthChange}
            originalHeight={resizeSourceHeight}
            originalWidth={resizeSourceWidth}
            lockSignal={resizeSyncVersion}
            width={resizeWidth}
          />
        )}

        {resizeMode === "page_size" && (
          <PaperConfig
            disabled={disabled}
            dpi={dpi as any}
            onDpiChange={onDpiChange}
            onPaperSizeChange={onPaperSizeChange}
            paperSize={paperSize as any}
          />
        )}

        {showResamplingAlgorithm && (
          <SelectInput
            label="Resampling Algorithm"
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
