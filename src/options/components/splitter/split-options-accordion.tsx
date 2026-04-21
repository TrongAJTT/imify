import type { SplitterSplitSettings } from "@/features/splitter/types"
import { Tooltip } from "@/options/components/tooltip"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { NumberInput } from "@/options/components/ui/number-input"
import { SegmentedControl } from "@/options/components/ui/segmented-control"
import { SelectInput } from "@/options/components/ui/select-input"
import { LabelText } from "@/options/components/ui/typography"
import { Scissors } from "lucide-react"

interface SplitOptionsAccordionProps {
  settings: SplitterSplitSettings
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onChange: (patch: Partial<SplitterSplitSettings>) => void
}

const DIRECTION_OPTIONS = [
  { value: "vertical", label: "Vertical Slices" },
  { value: "horizontal", label: "Horizontal Slices" },
  { value: "grid", label: "Grid" }
]

const BASIC_METHOD_OPTIONS = [
  { value: "count", label: "By Count" },
  { value: "percent", label: "By Percent" },
  { value: "pixel", label: "By Pixel" }
]

const ADVANCED_METHOD_OPTIONS = [
  { value: "pixel_pattern", label: "Pixel Pattern" },
  { value: "percent_pattern", label: "Percent Pattern" },
  { value: "color_match", label: "Color Match" }
]

export function SplitOptionsAccordion({
  settings,
  isOpen,
  onOpenChange,
  onChange
}: SplitOptionsAccordionProps) {
  const usesGrid = settings.direction === "grid"
  const isBasic = settings.mode === "basic"
  const isColorMatch =
    settings.mode === "advanced" && settings.advancedMethod === "color_match"
  const isColorMatchGridFallback = isColorMatch && settings.direction === "grid"

  const showXAxisFields = settings.direction === "vertical" || usesGrid
  const showYAxisFields = settings.direction === "horizontal" || usesGrid

  return (
    <AccordionCard
      icon={<Scissors size={14} />}
      label="Split Options"
      sublabel={`${settings.mode === "basic" ? "Basic" : "Advanced"} • ${settings.direction}`}
      colorTheme="sky"
      isOpen={isOpen}
      onOpenChange={onOpenChange}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <SegmentedControl
            value={settings.mode}
            options={[
              { value: "basic", label: "Basic" },
              { value: "advanced", label: "Advanced" }
            ]}
            onChange={(value) => onChange({ mode: value })}
            ariaLabel="Split mode"
            wrapperClassName="flex justify-center"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <LabelText className="text-xs">Direction</LabelText>
            {isColorMatchGridFallback ? (
              <Tooltip
                content="Color Match only works with a single axis. Grid is currently treated as vertical splitting."
                variant="wide1">
                <span className="inline-flex h-6 items-center rounded-md border border-amber-300 bg-amber-50 px-2 text-[10px] font-semibold text-amber-700 dark:border-amber-700/70 dark:bg-amber-950/20 dark:text-amber-200">
                  Fallback: Vertical
                </span>
              </Tooltip>
            ) : null}
          </div>
          <select
            value={settings.direction}
            onChange={(event) =>
              onChange({
                direction: event.target
                  .value as SplitterSplitSettings["direction"]
              })
            }
            className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 text-xs leading-5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all shadow-sm">
            {DIRECTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isBasic ? (
          <>
            <SelectInput
              label="Basic Method"
              value={settings.basicMethod}
              options={BASIC_METHOD_OPTIONS}
              onChange={(value) =>
                onChange({
                  basicMethod: value as SplitterSplitSettings["basicMethod"]
                })
              }
            />

            {settings.basicMethod === "count" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {showXAxisFields ? (
                  <NumberInput
                    label="Columns"
                    value={settings.countX}
                    min={1}
                    max={4096}
                    onChangeValue={(value) => onChange({ countX: value })}
                  />
                ) : null}
                {showYAxisFields ? (
                  <NumberInput
                    label="Rows"
                    value={settings.countY}
                    min={1}
                    max={4096}
                    onChangeValue={(value) => onChange({ countY: value })}
                  />
                ) : null}
              </div>
            ) : null}

            {settings.basicMethod === "percent" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {showXAxisFields ? (
                  <NumberInput
                    label="Column Size (%)"
                    value={settings.percentX}
                    min={1}
                    max={100}
                    onChangeValue={(value) => onChange({ percentX: value })}
                  />
                ) : null}
                {showYAxisFields ? (
                  <NumberInput
                    label="Row Size (%)"
                    value={settings.percentY}
                    min={1}
                    max={100}
                    onChangeValue={(value) => onChange({ percentY: value })}
                  />
                ) : null}
              </div>
            ) : null}

            {settings.basicMethod === "pixel" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {showXAxisFields ? (
                  <NumberInput
                    label="Column Size (px)"
                    value={settings.pixelX}
                    min={1}
                    max={100000}
                    onChangeValue={(value) => onChange({ pixelX: value })}
                  />
                ) : null}
                {showYAxisFields ? (
                  <NumberInput
                    label="Row Size (px)"
                    value={settings.pixelY}
                    min={1}
                    max={100000}
                    onChangeValue={(value) => onChange({ pixelY: value })}
                  />
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <SelectInput
              label="Advanced Method"
              value={settings.advancedMethod}
              options={ADVANCED_METHOD_OPTIONS}
              onChange={(value) =>
                onChange({
                  advancedMethod:
                    value as SplitterSplitSettings["advancedMethod"]
                })
              }
            />

            {isColorMatch ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <NumberInput
                  label="Offset (px)"
                  tooltipContent="Moves the cut position away from the detected matching line/column. Positive values cut later, negative values cut earlier."
                  value={settings.colorMatchOffset}
                  min={-10000}
                  max={10000}
                  onChangeValue={(value) =>
                    onChange({ colorMatchOffset: value })
                  }
                />
                <NumberInput
                  label="Tolerance"
                  tooltipContent="How close a pixel color must be to your rule color to count as a match. Higher values are more lenient."
                  value={settings.colorMatchTolerance}
                  min={0}
                  max={255}
                  onChangeValue={(value) =>
                    onChange({ colorMatchTolerance: value })
                  }
                />
                <NumberInput
                  label="Skip Before (px)"
                  tooltipContent="Requires this many consecutive matching lines/columns before the current one before a cut is allowed."
                  value={settings.colorMatchSkipBefore}
                  min={0}
                  max={10000}
                  onChangeValue={(value) =>
                    onChange({ colorMatchSkipBefore: value })
                  }
                />
                <NumberInput
                  label="Break After (px)"
                  tooltipContent="After a cut is created, skip this many lines/columns before checking for the next cut."
                  value={settings.colorMatchSkipPixels}
                  min={0}
                  max={10000}
                  onChangeValue={(value) =>
                    onChange({ colorMatchSkipPixels: value })
                  }
                />
              </div>
            ) : null}
          </>
        )}

        <ColorPickerPopover
          label="Guide Color"
          value={settings.guideColor || "#06b6d4"}
          onChange={(value) => onChange({ guideColor: value })}
          enableGradient={false}
          outputMode="hex"
        />
      </div>
    </AccordionCard>
  )
}
