import { Maximize2 } from "lucide-react"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { SmartResizeModule } from "@/options/components/smart-resize-module"
import { PaperConfig } from "@/options/components/paper-config"

export type ResizeCardProps = {
  // Input values (flexible types to match various stores)
  resizeMode: string
  resizeValue: number
  resizeWidth: number
  resizeHeight: number
  resizeAspectMode: string
  resizeAspectRatio: number | string
  resizeFitMode: string
  resizeContainBackground: string
  resizeSourceWidth: number
  resizeSourceHeight: number
  resizeSyncVersion: number
  paperSize: string
  dpi: number

  // Callbacks
  onResizeModeChange: (mode: string) => void
  onResizeValueChange: (value: number) => void
  onResizeWidthChange: (value: number) => void
  onResizeHeightChange: (value: number) => void
  onResizeAspectModeChange: (mode: string) => void
  onResizeAspectRatioChange: (ratio: string | number) => void
  onResizeFitModeChange: (mode: string) => void
  onResizeContainBackgroundChange: (color: string) => void
  onPaperSizeChange: (size: string) => void
  onDpiChange: (dpi: number) => void

  disabled?: boolean
  availableModes?: string[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** If true, accordion is always open, chevron is hidden, and cannot be collapsed */
  alwaysOpen?: boolean
  /** Unique ID for mutually exclusive accordion group */
  groupId?: string
}

const getModeLabel = (mode: string): string => {
  switch (mode) {
    case "none":
    case "inherit":
      return "No resize"
    case "change_width":
    case "fit_width":
      return "Fit width"
    case "change_height":
    case "fit_height":
      return "Fit height"
    case "set_size":
      return "Set size"
    case "scale":
      return "Scale"
    case "page_size":
      return "Paper size"
    default:
      return mode
  }
}

function generateSublabel(
  mode: string,
  resizeValue: number,
  resizeWidth: number,
  resizeHeight: number,
  paperSize: string,
  dpi: number
): string {
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
  onPaperSizeChange,
  onDpiChange,
  disabled,
  availableModes,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
}: ResizeCardProps) {
  // Build mode options: batch modes by default, replace with availableModes if provided
  const getModeOptions = () => {
    const batchModeMap: Record<string, string> = {
      none: "No resize",
      change_width: "Fit width",
      change_height: "Fit height",
      set_size: "Set size",
      scale: "Scale",
      page_size: "Paper size"
    }

    if (availableModes) {
      const splicingModeMap: Record<string, string> = {
        none: "No resize",
        fit_width: "Fit width",
        fit_height: "Fit height"
      }
      return availableModes.map((mode) => ({
        value: mode,
        label: splicingModeMap[mode] || mode
      }))
    }

    return Object.entries(batchModeMap).map(([value, label]) => ({
      value,
      label
    }))
  }

  const modeOptions = getModeOptions()
  const modeLabel = modeOptions.find((m) => m.value === resizeMode)?.label || getModeLabel(resizeMode)
  const sublabel = generateSublabel(resizeMode, resizeValue, resizeWidth, resizeHeight, paperSize, dpi)
  const isSimpleMode = resizeMode === "change_width" || resizeMode === "fit_width" || resizeMode === "change_height" || resizeMode === "fit_height" || resizeMode === "scale"
  const isSetSize = resizeMode === "set_size"
  const isPageSize = resizeMode === "page_size"

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
        {/* Resize Mode Selector */}
        <div>
          <SelectInput
            label="Resize type"
            value={resizeMode}
            disabled={disabled}
            options={modeOptions}
            onChange={onResizeModeChange}
          />
        </div>

        {/* Resize Value for: change_width, change_height, scale */}
        {(resizeMode === "change_width" || resizeMode === "fit_width" || resizeMode === "change_height" || resizeMode === "fit_height" || resizeMode === "scale") && (
          <NumberInput
            label={resizeMode === "scale" ? "Scale (%)" : "Value (px)"}
            disabled={disabled}
            min={1}
            value={resizeValue}
            onChangeValue={onResizeValueChange}
          />
        )}

        {/* SmartResizeModule for: set_size */}
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

        {/* PaperConfig for: page_size */}
        {resizeMode === "page_size" && (
          <PaperConfig
            disabled={disabled}
            dpi={dpi as any}
            onDpiChange={onDpiChange}
            onPaperSizeChange={onPaperSizeChange}
            paperSize={paperSize as any}
          />
        )}
      </div>
    </AccordionCard>
  )
}

export default ResizeCard
