import { useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { Maximize2 } from "lucide-react"

import SidebarCard from "@/options/components/ui/sidebar-card"
import { SelectInput } from "@/options/components/ui/select-input"
import { NumberInput } from "@/options/components/ui/number-input"
import { SmartResizeModule } from "@/options/components/smart-resize-module"
import { PaperConfig } from "@/options/components/paper-config"

export type ResizePopoverProps = {
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
}

// Mapping from batch store modes to display labels
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
      return "No resize"
  }
}

// Generate sublabel based on current mode and values
const generateSublabel = (
  mode: string,
  resizeValue: number,
  resizeWidth: number,
  resizeHeight: number,
  paperSize: string,
  dpi: number
): string => {
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

export function ResizePopover({
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
  availableModes
}: ResizePopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Build available modes with mapping - support both batch and splicing mode names
  const ALL_MODES = [
    { value: "none", label: "No resize" },
    { value: "change_width", label: "Fit width" },     // batch store mode
    { value: "fit_width", label: "Fit width" },        // splicing mode (alias)
    { value: "change_height", label: "Fit height" },   // batch store mode
    { value: "fit_height", label: "Fit height" },      // splicing mode (alias)
    { value: "set_size", label: "Set size" },
    { value: "scale", label: "Scale" },
    { value: "page_size", label: "Paper size" }
  ]

  const modeOptions = availableModes
    ? ALL_MODES.filter((m) => availableModes.includes(m.value))
    : ALL_MODES

  const modeLabel = modeOptions.find((m) => m.value === resizeMode)?.label || getModeLabel(resizeMode)
  const sublabel = generateSublabel(resizeMode, resizeValue, resizeWidth, resizeHeight, paperSize, dpi)
  const isSimpleMode = resizeMode === "change_width" || resizeMode === "change_height" || resizeMode === "fit_width" || resizeMode === "fit_height" || resizeMode === "scale"
  const isSetSize = resizeMode === "set_size"
  const isPageSize = resizeMode === "page_size"

  // Parse aspect ratio to number if it's a string (e.g., "16:9" -> we'll keep it as string for display)
  const aspectRatioDisplay = typeof resizeAspectRatio === "string" ? resizeAspectRatio : resizeAspectRatio.toString()

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <div>
          <SidebarCard
            icon={<Maximize2 size={14} />}
            label="Resize"
            sublabel={sublabel}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
          />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-80 rounded-lg border border-slate-200 bg-white shadow-lg p-4 z-50 dark:border-slate-700 dark:bg-slate-900"
          sideOffset={12}
          align="start"
          side="bottom"
          style={{ maxWidth: "calc(100% - 2rem)", maxHeight: "calc(100vh - 2rem)", overflow: "auto" }}
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

          <Popover.Arrow className="fill-white dark:fill-slate-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default ResizePopover
