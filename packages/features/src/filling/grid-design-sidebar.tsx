"use client"

import React, { useCallback, useMemo } from "react"
import { LayoutGrid } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { NumberInput } from "@imify/ui/ui/number-input"
import { TextInput } from "@imify/ui/ui/text-input"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import type { FillingTemplate, GridDesignParams } from "./types"
import { DEFAULT_GRID_DESIGN_PARAMS } from "./types"
import { GRID_DESIGN_TOOLTIPS } from "./grid-design-tooltips"
import { parseGridDesign } from "./grid-design-generator"

interface GridDesignSidebarProps {
  template: FillingTemplate
}

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
      </div>
    </AccordionCard>
  )
}
