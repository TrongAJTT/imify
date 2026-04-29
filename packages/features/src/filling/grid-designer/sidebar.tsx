"use client"

import React, { useCallback, useMemo } from "react"
import { LayoutGrid } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { ControlledPopover } from "@imify/ui/ui/controlled-popover"
import { NumberInput } from "@imify/ui/ui/number-input"
import { TextInput } from "@imify/ui/ui/text-input"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import type { FillingTemplate, GridDesignParams } from "../types"
import { DEFAULT_GRID_DESIGN_PARAMS } from "../types"
import { GRID_DESIGN_TOOLTIPS } from "./tooltips"
import { parseGridDesign } from "./generator"

interface GridDesignSidebarProps {
  template: FillingTemplate
}

interface GridTemplatePreset {
  id: string
  label: string
  rowDefinitions: [string, string, string]
}

const GRID_TEMPLATE_PRESETS: GridTemplatePreset[] = [
  {
    id: "horizontal-3",
    label: "3 horiz columns",
    rowDefinitions: ["1", "1", "1"],
  },
  {
    id: "vertical-3",
    label: "3 vertical columns",
    rowDefinitions: ["1a 1b 1c", "1a 1b 1c", "1a 1b 1c"],
  },
  {
    id: "row3-col2",
    label: "Left Rail + Right Stack",
    rowDefinitions: ["1a 2", "1a 1 1", "1"],
  },
  {
    id: "row3-col3",
    label: "Alternating Split",
    rowDefinitions: ["2 1", "1 2", "2 1"],
  },
  {
    id: "row3-col4",
    label: "Top-Right Merge",
    rowDefinitions: ["1 2a", "1 2a", "1 1 1"],
  },
  {
    id: "row3-col5",
    label: "Top-Left Merge",
    rowDefinitions: ["2a 1", "2a 1", "1 2"],
  },
]

const PRESET_ROWS = 3
const PRESET_OUTER_PADDING = 16
const PRESET_GAP = 16
const PREVIEW_CANVAS_SIZE = 240

function normalizeGridDesignParams(params: GridDesignParams): GridDesignParams {
  const rowCount = Math.max(1, Math.round(params.rowCount))
  const rowDefinitions = Array.from({ length: rowCount }, (_, index) => params.rowDefinitions[index] ?? "")
  const legacyGap = typeof params.gap === "number" ? params.gap : 0
  const gapX = Math.max(0, Math.round(typeof params.gapX === "number" ? params.gapX : legacyGap))
  const gapY = Math.max(0, Math.round(typeof params.gapY === "number" ? params.gapY : legacyGap))

  return {
    rowCount,
    outerPadding: Math.max(0, Math.round(params.outerPadding)),
    gap: legacyGap,
    gapX,
    gapY,
    rowDefinitions,
    uniformColumns: Boolean(params.uniformColumns),
    uniformColumnsDef: params.uniformColumnsDef ?? "",
  }
}

function GridTemplatePreview({ preset }: { preset: GridTemplatePreset }) {
  const previewParams: GridDesignParams = {
    ...DEFAULT_GRID_DESIGN_PARAMS,
    rowCount: PRESET_ROWS,
    outerPadding: PRESET_OUTER_PADDING,
    gap: PRESET_GAP,
    gapX: PRESET_GAP,
    gapY: PRESET_GAP,
    uniformColumns: false,
    uniformColumnsDef: "",
    rowDefinitions: [...preset.rowDefinitions],
  }
  const preview = parseGridDesign(previewParams, PREVIEW_CANVAS_SIZE, PREVIEW_CANVAS_SIZE)

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      {preview.layoutCells.map((cell) => (
        <div
          key={`${preset.id}-${cell.id}`}
          className="absolute rounded-[3px] border border-sky-300 bg-sky-200/65 dark:border-sky-500/70 dark:bg-sky-500/35"
          style={{
            left: `${(cell.x / PREVIEW_CANVAS_SIZE) * 100}%`,
            top: `${(cell.y / PREVIEW_CANVAS_SIZE) * 100}%`,
            width: `${(cell.width / PREVIEW_CANVAS_SIZE) * 100}%`,
            height: `${(cell.height / PREVIEW_CANVAS_SIZE) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

export function GridDesignSidebar({ template }: GridDesignSidebarProps) {
  const storeParams = useFillingStore((state) => state.gridDesignParams)
  const layerCount = useFillingStore((state) => state.gridLayerCount)
  const setGridDesignParams = useFillingStore((state) => state.setGridDesignParams)

  const params = useMemo(
    () => normalizeGridDesignParams(storeParams ?? template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS }),
    [storeParams, template.gridDesignParams]
  )

  const update = useCallback(
    (partial: Partial<GridDesignParams>) => {
      const next = normalizeGridDesignParams({ ...params, ...partial })
      setGridDesignParams(next)
    },
    [params, setGridDesignParams]
  )

  const updateRowCount = useCallback(
    (value: number) => {
      const nextRowCount = Math.max(1, Math.round(value))
      const nextDefinitions = Array.from(
        { length: nextRowCount },
        (_, index) => params.rowDefinitions[index] ?? params.uniformColumnsDef ?? ""
      )

      update({
        rowCount: nextRowCount,
        rowDefinitions: nextDefinitions,
      })
    },
    [params.rowDefinitions, params.uniformColumnsDef, update]
  )

  const updateRowDefinition = useCallback(
    (rowIndex: number, value: string) => {
      const nextDefinitions = [...params.rowDefinitions]
      nextDefinitions[rowIndex] = value
      update({ rowDefinitions: nextDefinitions })
    },
    [params.rowDefinitions, update]
  )

  const applyTemplatePreset = useCallback(
    (preset: GridTemplatePreset) => {
      const rowDefinitions = [...preset.rowDefinitions]
      update({
        rowCount: PRESET_ROWS,
        outerPadding: PRESET_OUTER_PADDING,
        gap: PRESET_GAP,
        gapX: PRESET_GAP,
        gapY: PRESET_GAP,
        uniformColumns: false,
        uniformColumnsDef: "",
        rowDefinitions,
      })
    },
    [update]
  )

  const sublabel = `${params.rowCount} rows, ${layerCount} cells`

  const validation = useMemo(() => {
    const result = parseGridDesign(params, template.canvasWidth, template.canvasHeight)
    const errorsByRow = new Map<number, string>()

    for (const row of result.cells) {
      for (const cell of row) {
        if (!cell.hasError) continue
        const message = cell.errorMessage ?? "Invalid syntax."
        if (!errorsByRow.has(cell.rowIndex)) {
          errorsByRow.set(cell.rowIndex, message)
        }
      }
    }

    return {
      errorsByRow,
      sharedError: result.cells.some((row) => row.some((cell) => cell.hasError))
        ? result.cells.flat().find((cell) => cell.hasError)?.errorMessage ?? "Invalid syntax."
        : null,
    }
  }, [params, template.canvasHeight, template.canvasWidth])

  return (
    <AccordionCard
      icon={<LayoutGrid size={16} />}
      label="Grid Designer"
      sublabel={sublabel}
      colorTheme="sky"
      alwaysOpen={true}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <NumberInput
            label="Rows"
            value={params.rowCount}
            onChangeValue={updateRowCount}
            min={1}
            max={50}
            tooltipContent={GRID_DESIGN_TOOLTIPS.rowCount}
          />
          <NumberInput
            label="Outer Padding"
            value={params.outerPadding}
            onChangeValue={(value) => update({ outerPadding: value })}
            min={0}
            max={2000}
            tooltipContent={GRID_DESIGN_TOOLTIPS.outerPadding}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Horizontal Gap"
            value={params.gapX}
            onChangeValue={(value) => update({ gapX: value, gap: value })}
            min={0}
            max={1000}
            tooltipContent={GRID_DESIGN_TOOLTIPS.gapX}
          />
          <NumberInput
            label="Vertical Gap"
            value={params.gapY}
            onChangeValue={(value) => update({ gapY: value, gap: value })}
            min={0}
            max={1000}
            tooltipContent={GRID_DESIGN_TOOLTIPS.gapY}
          />
        </div>

        <CheckboxCard
          title="Use Same Columns For All Rows"
          subtitle="Apply one shared row definition to every row."
          checked={params.uniformColumns}
          onChange={(checked) => update({ uniformColumns: checked })}
          tooltipContent={GRID_DESIGN_TOOLTIPS.uniformColumns}
        />

        {params.uniformColumns ? (
          <TextInput
            label="Shared Row Definition"
            value={params.uniformColumnsDef}
            onChange={(value) => update({ uniformColumnsDef: value })}
            placeholder='Examples: "3", "2 1", "1# 1"'
            errorMessage={validation.sharedError ?? undefined}
          />
        ) : (
          <div className="space-y-2">
            {params.rowDefinitions.map((definition, rowIndex) => (
              <TextInput
                key={`grid-row-${rowIndex}`}
                label={`Row ${rowIndex + 1} Columns`}
                value={definition}
                onChange={(value) => updateRowDefinition(rowIndex, value)}
                placeholder='Examples: "3", "2 1", "1# 1"'
                errorMessage={validation.errorsByRow.get(rowIndex)}
              />
            ))}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {GRID_DESIGN_TOOLTIPS.rowDefinition}
        </p>

        <ControlledPopover
          behavior="hover"
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          openDelayMs={100}
          closeDelayMs={120}
          triggerWrapperClassName="block w-full"
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-sky-300 bg-sky-50 px-3 py-2 text-left text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50"
            >
              <LayoutGrid size={14} />
              Use templates
            </button>
          }
          contentClassName="z-[9999] w-[min(400px,calc(100vw-24px))] rounded-lg border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Quick templates</div>
          <div className="grid grid-cols-3 justify-items-center gap-2">
            {GRID_TEMPLATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="w-full max-w-28 aspect-[5/6] rounded-md border border-slate-200 p-2 text-left transition-colors hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:hover:border-sky-600 dark:hover:bg-sky-900/30"
                onClick={() => applyTemplatePreset(preset)}
              >
                <div className="flex h-full flex-col">
                  <div className="aspect-square w-full">
                    <GridTemplatePreview preset={preset} />
                  </div>
                  <div className="mt-1 line-clamp-1 text-[10px] font-medium leading-4 text-slate-700 dark:text-slate-200">
                    {preset.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Applies rows=3, outer padding=16, horizontal gap=16, vertical gap=16.
          </p>
        </ControlledPopover>
      </div>
    </AccordionCard>
  )
}
