import React from "react"
import { PencilRuler, Maximize2 } from "lucide-react"
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats"
import {
  DEFAULT_RESAMPLING_ALGORITHM,
  RESAMPLING_ALGORITHM_OPTIONS,
  normalizeResizeResamplingAlgorithm
} from "@imify/core/resize-resampling"
import type { ResizeResamplingAlgorithm } from "@imify/core/types"
import { SmartResizeModule } from "./smart-resize-module"
import { PaperConfig } from "./paper-config"
import { AccordionCard, ControlledPopover, Kicker, LabelText, NumberInput, SelectInput } from "@imify/ui"

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
  resizeQuickStats?: ResizeQuickStats
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
  resizeQuickStats,
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
  const isFitWidthMode = resizeMode === "fit_width" || resizeMode === "change_width"
  const isFitHeightMode = resizeMode === "fit_height" || resizeMode === "change_height"
  const showQuickResizePopover = isFitWidthMode || isFitHeightMode
  const sourceEdge =
    isFitWidthMode
      ? resizeSourceWidth
      : isFitHeightMode
        ? resizeSourceHeight
        : 0
  const hasSourceEdge = sourceEdge > 0
  const quickStatsFromQueue = isFitWidthMode ? resizeQuickStats?.width : isFitHeightMode ? resizeQuickStats?.height : null
  const quickResizeValues = quickStatsFromQueue
    ? [
        { id: "min", label: "Min", value: Math.max(1, Math.round(quickStatsFromQueue.min)) },
        { id: "avg", label: "Avg", value: Math.max(1, Math.round(quickStatsFromQueue.avg)) },
        { id: "max", label: "Max", value: Math.max(1, Math.round(quickStatsFromQueue.max)) }
      ]
    : hasSourceEdge
    ? (() => {
        const safeSource = Math.max(1, Math.round(sourceEdge))
        return [
          { id: "min", label: "Min", value: safeSource },
          { id: "avg", label: "Avg", value: safeSource },
          { id: "max", label: "Max", value: safeSource }
        ]
      })()
    : (() => {
        const quickResizeBase = Math.max(1, Math.round(resizeValue))
        return [
          { id: "min", label: "Min", value: Math.max(1, Math.round(quickResizeBase * 0.5)) },
          { id: "avg", label: "Avg", value: Math.max(1, Math.round(quickResizeBase)) },
          { id: "max", label: "Max", value: Math.max(1, Math.round(quickResizeBase * 1.5)) }
        ]
      })()

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
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <LabelText className="text-xs">
                {resizeMode === "scale" ? "Scale (%)" : "Value (px)"}
              </LabelText>

              {showQuickResizePopover ? (
                <ControlledPopover
                  trigger={
                    <button
                      type="button"
                      aria-label="Open quick resize options"
                      disabled={disabled}
                      className="h-6 rounded-md border border-slate-200 dark:border-slate-700 px-2 text-[10px] font-medium text-slate-600 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <PencilRuler size={11} />
                      Quick Stats
                    </button>
                  }
                  preset="inspector"
                  behavior="hybrid"
                  side="bottom"
                  align="end"
                  closeOnContentClick
                  contentClassName="z-[9999] w-56 rounded-md border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <Kicker className="text-[11px] text-slate-600 dark:text-slate-300">
                    Queue-based presets.
                  </Kicker>
                  <div className="mt-1 grid grid-cols-3 gap-1.5">
                    {quickResizeValues.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onResizeValueChange(preset.value)}
                        className="inline-flex flex-col items-center justify-center rounded-md border border-slate-200 px-2 py-1.5 text-[11px] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{preset.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{preset.value}px</span>
                      </button>
                    ))}
                  </div>
                </ControlledPopover>
              ) : null}
            </div>

            <NumberInput
              disabled={disabled}
              min={1}
              value={resizeValue}
              onChangeValue={onResizeValueChange}
            />
          </div>
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

