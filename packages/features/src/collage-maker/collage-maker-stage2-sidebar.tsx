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
  canvasDpi?: number;
  selectedLayoutId: string;
  gridParams: GridDesignParams;
  onCanvasWidthChange: (w: number) => void;
  onCanvasHeightChange: (h: number) => void;
  onCanvasUnitChange: (unit: CanvasSizeUnit) => void;
  onCanvasDpiChange?: (dpi: number) => void;
  onGridParamsChange: (params: GridDesignParams) => void;
  onSelectLayout: (presetId: string, params: GridDesignParams) => void;
  enableWideSidebarGrid?: boolean;
}

export function CollageMakerStage2Sidebar({
  queueCount,
  canvasWidth,
  canvasHeight,
  canvasUnit,
  canvasDpi,
  selectedLayoutId,
  gridParams,
  onCanvasWidthChange,
  onCanvasHeightChange,
  onCanvasUnitChange,
  onCanvasDpiChange,
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
            dpi={canvasDpi}
            onSizeChange={(w, h) => {
              onCanvasWidthChange(w);
              onCanvasHeightChange(h);
            }}
            onUnitChange={onCanvasUnitChange}
            onDpiChange={onCanvasDpiChange}
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
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2 items-end">
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
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
            {matchingPresets.map((preset) => {
              const isSelected = selectedLayoutId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectLayout(preset.id, preset.params)}
                  title={preset.name || preset.id}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-400 dark:border-amber-500 dark:bg-amber-900/20"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="aspect-square w-full rounded border border-slate-200/80 bg-slate-100 dark:border-slate-700/80 dark:bg-slate-800"
                    dangerouslySetInnerHTML={{ __html: preset.svgPreview }}
                  />
                  {preset.name ? (
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate w-full text-center">
                      {preset.name}
                    </span>
                  ) : null}
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
