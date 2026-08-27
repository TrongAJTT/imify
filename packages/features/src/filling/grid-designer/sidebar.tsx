"use client";

import React, { useCallback, useMemo } from "react";
import {
  ArrowLeftRight,
  Columns3,
  Copy,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { AccordionCard } from "@imify/ui/ui/accordion-card";
import { CheckboxCard } from "@imify/ui/ui/checkbox-card";
import { ControlledPopover } from "@imify/ui/ui/controlled-popover";
import { NumberInput } from "@imify/ui/ui/number-input";
import { RadioCard } from "@imify/ui/ui/radio-card";
import { TextInput } from "@imify/ui/ui/text-input";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { useFillUiStore } from "@imify/stores/stores/fill-ui-store";
import type {
  FillingTemplate,
  GridDesignParams,
  GridPrimaryDirection,
} from "../types";
import { DEFAULT_GRID_DESIGN_PARAMS } from "../types";
import { GRID_TEMPLATE_PRESETS, type GridTemplatePreset } from "../config";
import { useTranslation } from "@imify/i18n";
import {
  canReverseDefinition,
  hasReversibleGridDefinition,
  parseGridDesign,
  reverseAllGridDefinitions,
  reverseSingleGridDefinition,
} from "./generator";
import { parseGridTemplateString } from "./grid-template-utils";
import { GRID_DESIGN_TOOLTIPS } from "./tooltips";
import { usePopoverTriggerBehavior } from "../../shared/use-popover-trigger-behavior";

interface GridDesignSidebarProps {
  template: FillingTemplate;
}

const PRESET_OUTER_PADDING = 16;
const PRESET_GAP = 16;
const PREVIEW_CANVAS_SIZE = 240;

function normalizeGridDesignParams(params: GridDesignParams): GridDesignParams {
  const direction: GridPrimaryDirection = params.direction ?? "rows";
  const rowCount = Math.max(1, Math.round(params.rowCount));
  const rowDefinitions = Array.from(
    { length: rowCount },
    (_, index) => params.rowDefinitions[index] ?? "",
  );
  const legacyGap = typeof params.gap === "number" ? params.gap : 0;
  const gapX = Math.max(
    0,
    Math.round(typeof params.gapX === "number" ? params.gapX : legacyGap),
  );
  const gapY = Math.max(
    0,
    Math.round(typeof params.gapY === "number" ? params.gapY : legacyGap),
  );

  return {
    direction,
    rowCount,
    outerPadding: Math.max(0, Math.round(params.outerPadding)),
    gap: legacyGap,
    gapX,
    gapY,
    rowDefinitions,
    uniformColumns: Boolean(params.uniformColumns),
    uniformColumnsDef: params.uniformColumnsDef ?? "",
  };
}

function GridTemplatePreview({ preset }: { preset: GridTemplatePreset }) {
  const { direction, definitions } = parseGridTemplateString(
    preset.templateString,
  );
  const previewParams: GridDesignParams = {
    ...DEFAULT_GRID_DESIGN_PARAMS,
    direction,
    rowCount: definitions.length,
    outerPadding: PRESET_OUTER_PADDING,
    gap: PRESET_GAP,
    gapX: PRESET_GAP,
    gapY: PRESET_GAP,
    uniformColumns: false,
    uniformColumnsDef: "",
    rowDefinitions: [...definitions],
  };
  const preview = parseGridDesign(
    previewParams,
    PREVIEW_CANVAS_SIZE,
    PREVIEW_CANVAS_SIZE,
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      {preview.layoutCells.map((cell) => {
        const clipPath =
          cell.points && cell.points.length > 4
            ? `polygon(${cell.points.map((p) => `${((p.x / cell.width) * 100).toFixed(1)}% ${((p.y / cell.height) * 100).toFixed(1)}%`).join(", ")})`
            : undefined;

        return (
          <div
            key={`${preset.id}-${cell.id}`}
            className="absolute rounded-[3px] border border-sky-300 bg-sky-200/65 dark:border-sky-500/70 dark:bg-sky-500/35"
            style={{
              left: `${(cell.x / PREVIEW_CANVAS_SIZE) * 100}%`,
              top: `${(cell.y / PREVIEW_CANVAS_SIZE) * 100}%`,
              width: `${(cell.width / PREVIEW_CANVAS_SIZE) * 100}%`,
              height: `${(cell.height / PREVIEW_CANVAS_SIZE) * 100}%`,
              clipPath,
            }}
          />
        );
      })}
    </div>
  );
}

export function GridDesignSidebar({ template }: GridDesignSidebarProps) {
  const { t } = useTranslation("filling");
  const storeParams = useFillingStore((state) => state.gridDesignParams);
  const layerCount = useFillingStore((state) => state.gridLayerCount);
  const setGridDesignParams = useFillingStore(
    (state) => state.setGridDesignParams,
  );
  const setHighlightedGridIndex = useFillUiStore(
    (state) => state.setHighlightedGridIndex,
  );
  const popoverBehavior = usePopoverTriggerBehavior();

  const params = useMemo(
    () =>
      normalizeGridDesignParams(
        storeParams ??
          template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS },
      ),
    [storeParams, template.gridDesignParams],
  );

  const isColsMode = params.direction === "cols";

  const update = useCallback(
    (partial: Partial<GridDesignParams>) => {
      const next = normalizeGridDesignParams({ ...params, ...partial });
      setGridDesignParams(next);
    },
    [params, setGridDesignParams],
  );

  const updateRowCount = useCallback(
    (value: number) => {
      const nextRowCount = Math.max(1, Math.round(value));
      const nextDefinitions = Array.from(
        { length: nextRowCount },
        (_, index) =>
          params.rowDefinitions[index] ?? params.uniformColumnsDef ?? "",
      );

      update({
        rowCount: nextRowCount,
        rowDefinitions: nextDefinitions,
      });
    },
    [params.rowDefinitions, params.uniformColumnsDef, update],
  );

  const updateRowDefinition = useCallback(
    (rowIndex: number, value: string) => {
      const nextDefinitions = [...params.rowDefinitions];
      nextDefinitions[rowIndex] = value;
      update({ rowDefinitions: nextDefinitions });
    },
    [params.rowDefinitions, update],
  );

  const applyTemplatePreset = useCallback(
    (preset: GridTemplatePreset) => {
      const { direction, definitions } = parseGridTemplateString(
        preset.templateString,
      );
      update({
        direction,
        rowCount: definitions.length,
        uniformColumns: false,
        uniformColumnsDef: "",
        rowDefinitions: definitions,
      });
    },
    [update],
  );

  const sublabel = isColsMode
    ? t("gridDesigner.sublabelCols", {
        count: params.rowCount,
        cells: layerCount,
      })
    : t("gridDesigner.sublabelRows", {
        count: params.rowCount,
        cells: layerCount,
      });

  const validation = useMemo(() => {
    const result = parseGridDesign(
      params,
      template.canvasWidth,
      template.canvasHeight,
    );
    const errorsByRow = new Map<number, string>();

    for (const row of result.cells) {
      for (const cell of row) {
        if (!cell.hasError) continue;
        const message = cell.errorMessage ?? t("gridDesigner.invalidSyntax");
        const idx = isColsMode ? cell.colIndex : cell.rowIndex;
        if (!errorsByRow.has(idx)) {
          errorsByRow.set(idx, message);
        }
      }
    }

    return {
      errorsByRow,
      sharedError: result.cells.some((row) => row.some((cell) => cell.hasError))
        ? result.cells.flat().find((cell) => cell.hasError)?.errorMessage ??
          t("gridDesigner.invalidSyntax")
        : null,
    };
  }, [params, template.canvasHeight, template.canvasWidth, t, isColsMode]);

  const handleReverseSingleDefinition = useCallback(
    (index: number) => {
      update(reverseSingleGridDefinition(params, index));
    },
    [params, update],
  );

  const handleReverseAllDefinitions = useCallback(() => {
    update(reverseAllGridDefinitions(params));
  }, [params, update]);

  const hasReversibleDefinition = useMemo(
    () => hasReversibleGridDefinition(params),
    [params],
  );

  const localizedPresets = useMemo(() => {
    return GRID_TEMPLATE_PRESETS.map((preset) => ({
      ...preset,
      label: t(`gridPresets.${preset.id}`, { defaultValue: preset.label }),
    }));
  }, [t]);

  return (
    <AccordionCard
      icon={<LayoutGrid size={16} />}
      label={t("dialog.gridTitle")}
      sublabel={sublabel}
      colorTheme="sky"
      alwaysOpen={true}
    >
      <div className="space-y-3">
        {/* Primary Direction Selector */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t("gridDesigner.primaryDirection")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <RadioCard
              title={t("gridDesigner.directionRows")}
              icon={<Rows3 size={14} />}
              value="rows"
              selectedValue={params.direction ?? "rows"}
              onChange={(val) =>
                update({ direction: val as GridPrimaryDirection })
              }
            />
            <RadioCard
              title={t("gridDesigner.directionCols")}
              icon={<Columns3 size={14} />}
              value="cols"
              selectedValue={params.direction ?? "rows"}
              onChange={(val) =>
                update({ direction: val as GridPrimaryDirection })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <NumberInput
            label={isColsMode ? t("gridDesigner.cols") : t("gridDesigner.rows")}
            value={params.rowCount}
            onChangeValue={updateRowCount}
            min={1}
            max={50}
            tooltipContent={t("tooltips.rowCount")}
          />
          <NumberInput
            label={t("gridDesigner.outerPadding")}
            value={params.outerPadding}
            onChangeValue={(value) => update({ outerPadding: value })}
            min={0}
            max={2000}
            tooltipContent={t("tooltips.outerPadding")}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("gridDesigner.gapX")}
            value={params.gapX}
            onChangeValue={(value) => update({ gapX: value, gap: value })}
            min={0}
            max={1000}
            tooltipContent={t("tooltips.gapX")}
          />
          <NumberInput
            label={t("gridDesigner.gapY")}
            value={params.gapY}
            onChangeValue={(value) => update({ gapY: value, gap: value })}
            min={0}
            max={1000}
            tooltipContent={t("tooltips.gapY")}
          />
        </div>

        <CheckboxCard
          title={
            isColsMode
              ? t("gridDesigner.uniformCols")
              : t("gridDesigner.uniformRows")
          }
          subtitle={
            isColsMode
              ? t("gridDesigner.uniformColsDesc")
              : t("gridDesigner.uniformRowsDesc")
          }
          icon={<Copy size={14} />}
          checked={params.uniformColumns}
          onChange={(checked) => update({ uniformColumns: checked })}
        />

        {params.uniformColumns ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isColsMode
                  ? t("gridDesigner.sharedColDef")
                  : t("gridDesigner.sharedRowDef")}
              </span>
              {canReverseDefinition(params.uniformColumnsDef) && (
                <button
                  type="button"
                  onClick={handleReverseAllDefinitions}
                  title={
                    isColsMode
                      ? t("gridDesigner.reverseCol")
                      : t("gridDesigner.reverseRow")
                  }
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors"
                >
                  <ArrowLeftRight size={12} />
                  <span>{t("gridDesigner.reverseAll")}</span>
                </button>
              )}
            </div>
            <TextInput
              label=""
              value={params.uniformColumnsDef}
              onChange={(value) => update({ uniformColumnsDef: value })}
              placeholder={t("gridDesigner.placeholderExamples")}
              errorMessage={validation.sharedError ?? undefined}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isColsMode
                  ? t("gridDesigner.colDefinitions")
                  : t("gridDesigner.rowDefinitions")}
              </div>
              {hasReversibleDefinition && (
                <button
                  type="button"
                  onClick={handleReverseAllDefinitions}
                  title={
                    isColsMode
                      ? t("gridDesigner.reverseAllCols")
                      : t("gridDesigner.reverseAllRows")
                  }
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors"
                >
                  <ArrowLeftRight size={12} />
                  <span>{t("gridDesigner.reverseAll")}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {params.rowDefinitions.map((definition, rowIndex) => (
                <div
                  key={`grid-def-${rowIndex}`}
                  className="space-y-1"
                  onMouseEnter={() => setHighlightedGridIndex(rowIndex)}
                  onMouseLeave={() => setHighlightedGridIndex(null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      {isColsMode
                        ? t("gridDesigner.colDefLabel", {
                            index: rowIndex + 1,
                          })
                        : t("gridDesigner.rowDefLabel", {
                            index: rowIndex + 1,
                          })}
                    </span>
                    {canReverseDefinition(definition) && (
                      <button
                        type="button"
                        onClick={() => handleReverseSingleDefinition(rowIndex)}
                        title={
                          isColsMode
                            ? t("gridDesigner.reverseCol")
                            : t("gridDesigner.reverseRow")
                        }
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors"
                      >
                        <ArrowLeftRight size={12} />
                      </button>
                    )}
                  </div>
                  <TextInput
                    label=""
                    value={definition}
                    onChange={(value) => updateRowDefinition(rowIndex, value)}
                    onFocus={() => setHighlightedGridIndex(rowIndex)}
                    onBlur={() => setHighlightedGridIndex(null)}
                    placeholder={t("gridDesigner.placeholderExamples")}
                    errorMessage={validation.errorsByRow.get(rowIndex)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <div className="font-medium text-slate-600 dark:text-slate-300">
            {t("tooltips.rowDefinitionTitle", {
              defaultValue: GRID_DESIGN_TOOLTIPS.rowDefinitionTitle,
            })}
          </div>
          <ul className="list-disc pl-3.5 space-y-0.5">
            {((): string[] => {
              const raw = t("tooltips.rowDefinitionTips", {
                returnObjects: true,
                defaultValue: GRID_DESIGN_TOOLTIPS.rowDefinitionTips,
              });
              return Array.isArray(raw)
                ? (raw as string[])
                : [...GRID_DESIGN_TOOLTIPS.rowDefinitionTips];
            })().map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>

        <ControlledPopover
          behavior={popoverBehavior}
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
              className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-sky-300 bg-sky-50 px-3 py-2 text-left transition-colors hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:hover:bg-sky-900/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <LayoutGrid
                  size={16}
                  className="shrink-0 text-sky-600 dark:text-sky-400"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-sky-700 dark:text-sky-300 truncate">
                    {t("gridDesigner.useTemplates")}
                  </div>
                  <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80 truncate">
                    {t("gridDesigner.useTemplatesDesc")}
                  </div>
                </div>
              </div>
            </button>
          }
          contentClassName="z-[9999] w-[min(420px,calc(100vw-24px))] rounded-lg border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-2.5">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("gridDesigner.quickTemplates")}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {t("gridDesigner.quickTemplatesDesc")}
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-0.5">
            <div className="grid grid-cols-3 justify-items-center gap-2">
              {localizedPresets.map((preset) => (
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
          </div>
        </ControlledPopover>
      </div>
    </AccordionCard>
  );
}
