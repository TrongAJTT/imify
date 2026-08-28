"use client";

import React, { useState } from "react";
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
import { CollagePresetGrid } from "./collage-preset-grid";
import { CollagePresetManageDialog } from "./collage-preset-manage-dialog";

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
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

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
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t("stage2.layoutsForImages", {
                  count: queueCount >= 2 ? queueCount : 2,
                })}
              </span>
              <button
                type="button"
                onClick={() => setIsManageDialogOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Sliders size={12} />
                <span>{t("presetGrid.manageButton", { defaultValue: "Manage" })}</span>
              </button>
            </div>

            <CollagePresetGrid
              targetImageCount={queueCount >= 2 ? queueCount : 2}
              selectedLayoutId={selectedLayoutId}
              onSelectLayout={onSelectLayout}
            />
          </div>
        </AccordionCard>
      ),
    },
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
      />
      <CollagePresetManageDialog
        isOpen={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
      />
    </>
  );
}
