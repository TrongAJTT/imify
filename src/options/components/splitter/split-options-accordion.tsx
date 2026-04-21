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
  { value: "custom_list", label: "Custom List" },
  { value: "social_carousel", label: "Social Carousel Slicer" },
  { value: "gutter_margin_grid", label: "Gutter & Margin Grid" },
  { value: "color_match", label: "Color Match" }
]

const SOCIAL_TARGET_RATIO_OPTIONS = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:5", label: "4:5 (Portrait)" },
  { value: "3:4", label: "3:4 (Portrait)" },
  { value: "2:3", label: "2:3 (Portrait)" },
  { value: "5:4", label: "5:4 (Landscape)" },
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Story/Reel)" }
]

const SOCIAL_OVERFLOW_OPTIONS = [
  { value: "crop", label: "Crop remainder" },
  { value: "stretch", label: "Stretch last slice" },
  { value: "pad", label: "Pad last slice" }
]

const SAFE_ZONE_SELECTION_OPTIONS = [
  { value: "nearest", label: "Nearest safe line" },
  { value: "lowest_variance", label: "Lowest variance line" }
]

const GRID_REMAINDER_OPTIONS = [
  { value: "trim", label: "Trim remainder" },
  { value: "distribute", label: "Distribute remainder" }
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
  const isSocialCarousel =
    settings.mode === "advanced" && settings.advancedMethod === "social_carousel"
  const isGutterMarginGrid =
    settings.mode === "advanced" && settings.advancedMethod === "gutter_margin_grid"
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

        {!isSocialCarousel && !isGutterMarginGrid ? (
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
        ) : null}

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
                  advancedMethod: value as SplitterSplitSettings["advancedMethod"],
                  ...(value === "gutter_margin_grid" ? { direction: "grid" } : {})
                })
              }
            />

            {isColorMatch ? (
              <div className="space-y-2">
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

                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500/20"
                    checked={settings.colorMatchSafeZoneEnabled}
                    onChange={(event) => onChange({ colorMatchSafeZoneEnabled: event.target.checked })}
                  />
                  <span>Safe Zone (Low Variance)</span>
                </label>

                {settings.colorMatchSafeZoneEnabled ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <NumberInput
                      label="Variance Threshold"
                      tooltipContent="Lower values are stricter and avoid busy lines. Higher values accept more detail."
                      value={settings.colorMatchSafeVarianceThreshold}
                      min={0}
                      max={10000}
                      onChangeValue={(value) => onChange({ colorMatchSafeVarianceThreshold: value })}
                    />
                    <NumberInput
                      label="Search Radius (px)"
                      tooltipContent="How far to slide up/down (or left/right) from the detected line to find a safer cut."
                      value={settings.colorMatchSafeSearchRadius}
                      min={0}
                      max={1000}
                      onChangeValue={(value) => onChange({ colorMatchSafeSearchRadius: value })}
                    />
                    <NumberInput
                      label="Search Step (px)"
                      tooltipContent="Distance between candidate lines while searching for a safe zone."
                      value={settings.colorMatchSafeSearchStep}
                      min={1}
                      max={128}
                      onChangeValue={(value) => onChange({ colorMatchSafeSearchStep: value })}
                    />
                    <SelectInput
                      label="Selection Mode"
                      value={settings.colorMatchSafeSelectionMode}
                      options={SAFE_ZONE_SELECTION_OPTIONS}
                      onChange={(value) =>
                        onChange({ colorMatchSafeSelectionMode: value as SplitterSplitSettings["colorMatchSafeSelectionMode"] })
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {isSocialCarousel ? (
              <div className="space-y-2">
                <SelectInput
                  label="Target Ratio"
                  value={settings.socialTargetRatio}
                  options={SOCIAL_TARGET_RATIO_OPTIONS}
                  onChange={(value) =>
                    onChange({
                      socialTargetRatio: value as SplitterSplitSettings["socialTargetRatio"]
                    })
                  }
                />
                <SelectInput
                  label="Remainder Handling"
                  value={settings.socialOverflowMode}
                  options={SOCIAL_OVERFLOW_OPTIONS}
                  onChange={(value) =>
                    onChange({
                      socialOverflowMode: value as SplitterSplitSettings["socialOverflowMode"]
                    })
                  }
                />
                {settings.socialOverflowMode === "pad" ? (
                  <ColorPickerPopover
                    label="Pad Color"
                    value={settings.socialPadColor || "#ffffff"}
                    onChange={(value) => onChange({ socialPadColor: value })}
                    enableGradient={false}
                    outputMode="hex"
                  />
                ) : null}
              </div>
            ) : null}

            {isGutterMarginGrid ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <NumberInput
                    label="Columns"
                    value={settings.gridColumns}
                    min={1}
                    max={256}
                    onChangeValue={(value) => onChange({ gridColumns: value })}
                  />
                  <NumberInput
                    label="Rows"
                    value={settings.gridRows}
                    min={1}
                    max={256}
                    onChangeValue={(value) => onChange({ gridRows: value })}
                  />
                  <NumberInput
                    label="Margin X (px)"
                    value={settings.gridMarginX}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridMarginX: value })}
                  />
                  <NumberInput
                    label="Margin Y (px)"
                    value={settings.gridMarginY}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridMarginY: value })}
                  />
                  <NumberInput
                    label="Gutter X (px)"
                    value={settings.gridGutterX}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridGutterX: value })}
                  />
                  <NumberInput
                    label="Gutter Y (px)"
                    value={settings.gridGutterY}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridGutterY: value })}
                  />
                </div>
                <SelectInput
                  label="Remainder Handling"
                  value={settings.gridRemainderMode}
                  options={GRID_REMAINDER_OPTIONS}
                  onChange={(value) => onChange({ gridRemainderMode: value as SplitterSplitSettings["gridRemainderMode"] })}
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
