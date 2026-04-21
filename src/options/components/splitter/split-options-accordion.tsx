import { Scissors } from "lucide-react"

import type {
  SplitterSplitSettings
} from "@/features/splitter/types"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SegmentedControl } from "@/options/components/ui/segmented-control"
import { SelectInput } from "@/options/components/ui/select-input"
import { TextInput } from "@/options/components/ui/text-input"

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

const ORDER_X_OPTIONS = [
  { value: "left_to_right", label: "Left to right" },
  { value: "right_to_left", label: "Right to left" }
]

const ORDER_Y_OPTIONS = [
  { value: "top_to_bottom", label: "Top to bottom" },
  { value: "bottom_to_top", label: "Bottom to top" }
]

const GRID_TRAVERSAL_OPTIONS = [
  { value: "row_first", label: "Rows first" },
  { value: "column_first", label: "Columns first" }
]

export function SplitOptionsAccordion({
  settings,
  isOpen,
  onOpenChange,
  onChange
}: SplitOptionsAccordionProps) {
  const usesGrid = settings.direction === "grid"
  const isBasic = settings.mode === "basic"
  const isColorMatch = settings.mode === "advanced" && settings.advancedMethod === "color_match"

  const showXAxisFields = settings.direction === "vertical" || usesGrid
  const showYAxisFields = settings.direction === "horizontal" || usesGrid

  return (
    <AccordionCard
      icon={<Scissors size={14} />}
      label="Split Options"
      sublabel={`${settings.mode === "basic" ? "Basic" : "Advanced"} • ${settings.direction}`}
      colorTheme="sky"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
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

        <SelectInput
          label="Direction"
          value={settings.direction}
          options={DIRECTION_OPTIONS}
          onChange={(value) => onChange({ direction: value as SplitterSplitSettings["direction"] })}
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SelectInput
            label="Horizontal Order"
            value={settings.horizontalOrder}
            options={ORDER_X_OPTIONS}
            onChange={(value) =>
              onChange({ horizontalOrder: value as SplitterSplitSettings["horizontalOrder"] })
            }
          />
          <SelectInput
            label="Vertical Order"
            value={settings.verticalOrder}
            options={ORDER_Y_OPTIONS}
            onChange={(value) =>
              onChange({ verticalOrder: value as SplitterSplitSettings["verticalOrder"] })
            }
          />
        </div>

        {usesGrid ? (
          <SelectInput
            label="Grid Traversal"
            value={settings.gridTraversal}
            options={GRID_TRAVERSAL_OPTIONS}
            onChange={(value) =>
              onChange({ gridTraversal: value as SplitterSplitSettings["gridTraversal"] })
            }
          />
        ) : null}

        {isBasic ? (
          <>
            <SelectInput
              label="Basic Method"
              value={settings.basicMethod}
              options={BASIC_METHOD_OPTIONS}
              onChange={(value) =>
                onChange({ basicMethod: value as SplitterSplitSettings["basicMethod"] })
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
                onChange({ advancedMethod: value as SplitterSplitSettings["advancedMethod"] })
              }
            />

            {settings.advancedMethod === "pixel_pattern" ? (
              <div className="space-y-2">
                {showXAxisFields ? (
                  <TextInput
                    label="Column Pattern (px)"
                    value={settings.pixelPatternX}
                    onChange={(value) => onChange({ pixelPatternX: value })}
                    placeholder="e.g. 300,500,100"
                  />
                ) : null}
                {showYAxisFields ? (
                  <TextInput
                    label="Row Pattern (px)"
                    value={settings.pixelPatternY}
                    onChange={(value) => onChange({ pixelPatternY: value })}
                    placeholder="e.g. 240,480"
                  />
                ) : null}
              </div>
            ) : null}

            {settings.advancedMethod === "percent_pattern" ? (
              <div className="space-y-2">
                {showXAxisFields ? (
                  <TextInput
                    label="Column Pattern (%)"
                    value={settings.percentPatternX}
                    onChange={(value) => onChange({ percentPatternX: value })}
                    placeholder="e.g. 20,30,50"
                  />
                ) : null}
                {showYAxisFields ? (
                  <TextInput
                    label="Row Pattern (%)"
                    value={settings.percentPatternY}
                    onChange={(value) => onChange({ percentPatternY: value })}
                    placeholder="e.g. 25,25,50"
                  />
                ) : null}
              </div>
            ) : null}

            {isColorMatch ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <NumberInput
                  label="Offset (px)"
                  value={settings.colorMatchOffset}
                  min={-10000}
                  max={10000}
                  onChangeValue={(value) => onChange({ colorMatchOffset: value })}
                />
                <NumberInput
                  label="Skip (px)"
                  value={settings.colorMatchSkipPixels}
                  min={0}
                  max={10000}
                  onChangeValue={(value) => onChange({ colorMatchSkipPixels: value })}
                />
                <NumberInput
                  label="Tolerance"
                  value={settings.colorMatchTolerance}
                  min={0}
                  max={255}
                  onChangeValue={(value) => onChange({ colorMatchTolerance: value })}
                />
              </div>
            ) : null}
          </>
        )}

      </div>
    </AccordionCard>
  )
}
