"use client";

import React from "react";
import { LayoutGrid, Ruler, Sliders } from "lucide-react";
import {
  AccordionCard,
  NumberInput,
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import type {
  CanvasSizeUnit,
  GridDesignParams,
} from "@imify/features/filling/types";
import { CanvasDimensionControls } from "@imify/features/shared/canvas-dimension-controls";
import { COLLAGE_LAYOUT_PRESETS } from "./config";

interface CollageMakerStage2SidebarProps {
  queueCount: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasUnit: CanvasSizeUnit;
  selectedLayoutId: string;
  gridParams: GridDesignParams;
  onCanvasWidthChange: (w: number) => void;
  onCanvasHeightChange: (h: number) => void;
  onCanvasUnitChange: (unit: CanvasSizeUnit) => void;
  onGridParamsChange: (params: GridDesignParams) => void;
  onSelectLayout: (presetId: string, params: GridDesignParams) => void;
  enableWideSidebarGrid?: boolean;
}

export function CollageMakerStage2Sidebar({
  queueCount,
  canvasWidth,
  canvasHeight,
  canvasUnit,
  selectedLayoutId,
  gridParams,
  onCanvasWidthChange,
  onCanvasHeightChange,
  onCanvasUnitChange,
  onGridParamsChange,
  onSelectLayout,
  enableWideSidebarGrid = false,
}: CollageMakerStage2SidebarProps) {
  const { t } = useTranslation(["collageMaker", "filling", "common"]);

  const matchingPresets = COLLAGE_LAYOUT_PRESETS.filter(
    (p) => p.imageCount === (queueCount >= 2 ? queueCount : 2),
  );

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "canvas-size",
      content: (
        <AccordionCard
          icon={<Ruler size={16} />}
          label={t("stage2.imageSize")}
          sublabel={`${canvasWidth} x ${canvasHeight} ${canvasUnit}`}
          colorTheme="amber"
          defaultOpen
        >
          <CanvasDimensionControls
            width={canvasWidth}
            height={canvasHeight}
            unit={canvasUnit}
            onSizeChange={(w, h) => {
              onCanvasWidthChange(w);
              onCanvasHeightChange(h);
            }}
            onUnitChange={onCanvasUnitChange}
          />
        </AccordionCard>
      ),
    },
    {
      id: "spacing-margin",
      content: (
        <AccordionCard
          icon={<Sliders size={16} />}
          label={t("stage2.spacingPadding")}
          sublabel={`Pad: ${gridParams.outerPadding}px • Gap: ${gridParams.gapX}x${gridParams.gapY}px`}
          colorTheme="amber"
          defaultOpen
        >
          <div className="space-y-3">
            <NumberInput
              label={t("stage2.outerPadding")}
              value={gridParams.outerPadding}
              onChangeValue={(val) =>
                onGridParamsChange({
                  ...gridParams,
                  outerPadding: Math.max(0, Math.round(val)),
                })
              }
              min={0}
              max={200}
            />
            <div className="flex gap-2">
              <NumberInput
                label={t("stage2.gapX")}
                value={gridParams.gapX ?? 0}
                onChangeValue={(val) =>
                  onGridParamsChange({
                    ...gridParams,
                    gapX: Math.max(0, Math.round(val)),
                  })
                }
                min={0}
                max={200}
              />
              <NumberInput
                label={t("stage2.gapY")}
                value={gridParams.gapY ?? 0}
                onChangeValue={(val) =>
                  onGridParamsChange({
                    ...gridParams,
                    gapY: Math.max(0, Math.round(val)),
                  })
                }
                min={0}
                max={200}
              />
            </div>
          </div>
        </AccordionCard>
      ),
    },
    {
      id: "layout-presets",
      content: (
        <AccordionCard
          icon={<LayoutGrid size={16} />}
          label={t("stage2.layoutSelector")}
          sublabel={t("stage2.layoutsForImages", {
            count: queueCount >= 2 ? queueCount : 2,
          })}
          colorTheme="amber"
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-2">
            {matchingPresets.map((preset) => {
              const isSelected = selectedLayoutId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectLayout(preset.id, preset.params)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-2.5 transition-all text-left ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-400 dark:border-amber-500 dark:bg-amber-900/20"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="h-16 w-full rounded border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    dangerouslySetInnerHTML={{ __html: preset.svgPreview }}
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </AccordionCard>
      ),
    },
  ];

  return (
    <WorkspaceConfigSidebarPanel
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
    />
  );
}
