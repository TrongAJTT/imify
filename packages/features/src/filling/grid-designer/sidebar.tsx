import React, { useCallback, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  BookmarkPlus,
  Columns3,
  Copy,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { AccordionCard } from "@imify/ui/ui/accordion-card";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { CheckboxCard } from "@imify/ui/ui/checkbox-card";
import { NumberInput } from "@imify/ui/ui/number-input";
import { RadioCard } from "@imify/ui/ui/radio-card";
import { SidebarCard } from "@imify/ui/ui/sidebar-card";
import { TextInput } from "@imify/ui/ui/text-input";
import { toast } from "@imify/stores";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { useFillUiStore } from "@imify/stores/stores/fill-ui-store";
import { useCollagePresetStore } from "@imify/stores/stores/collage-preset-store";
import { PRESET_HIGHLIGHT_COLORS } from "@imify/stores/stores/preset-colors";
import type {
  FillingTemplate,
  GridDesignParams,
  GridPrimaryDirection,
} from "../types";
import { DEFAULT_GRID_DESIGN_PARAMS } from "../types";
import { useTranslation } from "@imify/i18n";
import {
  canReverseDefinition,
  hasReversibleGridDefinition,
  parseGridDesign,
  reverseAllGridDefinitions,
  reverseSingleGridDefinition,
} from "./generator";
import { CollagePresetGrid } from "../../collage-maker/collage-preset-grid";
import {
  MAX_COLLAGE_IMAGES,
  MIN_COLLAGE_IMAGES,
} from "../../collage-maker/config";
import { promptSavePreset } from "@imify/stores";
import { GRID_DESIGN_TOOLTIPS } from "./tooltips";

interface GridDesignSidebarProps {
  template: FillingTemplate;
}

function getDefaultCollageName(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `Collage #${d}/${m} ${hh}:${mm}`.slice(0, 20);
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

export function GridDesignSidebar({ template }: GridDesignSidebarProps) {
  const { t } = useTranslation([
    "filling",
    "common",
    "workspace",
    "collageMaker",
  ]);
  const storeParams = useFillingStore((state) => state.gridDesignParams);
  const layerCount = useFillingStore((state) => state.gridLayerCount);
  const setGridDesignParams = useFillingStore(
    (state) => state.setGridDesignParams,
  );
  const setHighlightedGridIndex = useFillUiStore(
    (state) => state.setHighlightedGridIndex,
  );

  const saveCollagePreset = useCollagePresetStore(
    (state) => state.saveCurrentPreset,
  );

  const [isUsePresetDialogOpen, setIsUsePresetDialogOpen] = useState(false);

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

  const handleSavePreset = (name: string, color: string) => {
    const finalName = name.trim() || getDefaultCollageName();
    const clampedCount = Math.min(
      MAX_COLLAGE_IMAGES,
      Math.max(MIN_COLLAGE_IMAGES, layerCount || 2),
    );

    saveCollagePreset({
      name: finalName.slice(0, 20),
      highlightColor: color,
      config: {
        imageCount: clampedCount,
        params: {
          ...params,
          rowDefinitions: [...params.rowDefinitions],
        },
      },
    });

    toast.success(
      t("gridDesigner.presetSaved", {
        name: finalName,
      }),
    );
  };

  const handleOpenSavePreset = async () => {
    const result = await promptSavePreset({
      defaultName: getDefaultCollageName(),
      highlightColors: PRESET_HIGHLIGHT_COLORS,
      title: t("gridDesigner.savePresetTitle"),
      featureKey: "collage",
    });
    if (result) {
      handleSavePreset(result.name, result.color);
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Grid Designer Parameters Card */}
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
              label={
                isColsMode ? t("gridDesigner.cols") : t("gridDesigner.rows")
              }
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
                          onClick={() =>
                            handleReverseSingleDefinition(rowIndex)
                          }
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

          {/* Preset Actions inside Grid Designer Accordion Card */}
          <div className="pt-1 space-y-2">
            <SidebarCard
              icon={<LayoutGrid size={16} />}
              label={t("gridDesigner.useTemplates")}
              sublabel={t("gridDesigner.useTemplatesDesc")}
              onClick={() => setIsUsePresetDialogOpen(true)}
              colorTheme="sky"
            />
            {layerCount >= MIN_COLLAGE_IMAGES &&
              layerCount <= MAX_COLLAGE_IMAGES && (
                <SidebarCard
                  icon={<BookmarkPlus size={16} />}
                  label={t("gridDesigner.savePresetTitle")}
                  sublabel={t("gridDesigner.savePresetSublabel", {
                    count: layerCount,
                  })}
                  onClick={handleOpenSavePreset}
                  colorTheme="sky"
                />
              )}
          </div>
        </div>
      </AccordionCard>

      {/* Use Preset Dialog */}
      <BaseDialog
        isOpen={isUsePresetDialogOpen}
        onClose={() => setIsUsePresetDialogOpen(false)}
        size="4xl"
        mobileFullscreen
        className="h-[calc(100dvh-4rem)]"
        contentClassName="w-full h-full max-h-none overflow-hidden flex flex-col p-4"
      >
        <div className="flex flex-col h-full space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {t("gridDesigner.usePresetModalTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("gridDesigner.usePresetModalDesc")}
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-2">
            <CollagePresetGrid
              onSelectLayout={(_, presetParams) => {
                update(presetParams);
                setIsUsePresetDialogOpen(false);
                toast.success(t("gridDesigner.presetApplied"));
              }}
              wideGrid={true}
            />
          </div>
        </div>
      </BaseDialog>
    </div>
  );
}
