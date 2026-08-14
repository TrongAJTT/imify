import React from "react";
import { LayoutGrid, Ruler, Sliders } from "lucide-react";
import { AccordionCard, NumberInput, SelectInput, LabelText } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import type {
  CanvasSizeUnit,
  GridDesignParams,
} from "@imify/features/filling/types";
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
}

const CANVAS_PRESETS = [
  { label: "FHD (1920x1080)", w: 1920, h: 1080 },
  { label: "Vuông (1080x1080)", w: 1080, h: 1080 },
  { label: "Dọc (1080x1350)", w: 1080, h: 1350 },
  { label: "4K (3840x2160)", w: 3840, h: 2160 },
];

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
}: CollageMakerStage2SidebarProps) {
  const { t } = useTranslation(["collageMaker", "common"]);

  const matchingPresets = COLLAGE_LAYOUT_PRESETS.filter(
    (p) => p.imageCount === (queueCount >= 2 ? queueCount : 2),
  );

  return (
    <div className="space-y-3">
      {/* CARD 1: CANVAS SIZE */}
      <AccordionCard
        icon={<Ruler size={16} />}
        label={t("stage2.imageSize", { defaultValue: "Kích thước ảnh đầu ra" })}
        sublabel={`${canvasWidth} x ${canvasHeight} ${canvasUnit}`}
        colorTheme="sky"
        defaultOpen
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Rộng (Width)"
              value={canvasWidth}
              onChangeValue={onCanvasWidthChange}
              min={100}
              max={10000}
            />
            <NumberInput
              label="Cao (Height)"
              value={canvasHeight}
              onChangeValue={onCanvasHeightChange}
              min={100}
              max={10000}
            />
          </div>

          <SelectInput
            label="Đơn vị"
            value={canvasUnit}
            options={[
              { value: "px", label: "Pixels (px)" },
              { value: "in", label: "Inches (in)" },
              { value: "cm", label: "Centimeters (cm)" },
              { value: "mm", label: "Millimeters (mm)" },
            ]}
            onChange={(val) => onCanvasUnitChange(val as CanvasSizeUnit)}
          />

          <div>
            <LabelText className="text-xs mb-1">Kích thước nhanh</LabelText>
            <div className="grid grid-cols-2 gap-1.5">
              {CANVAS_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    onCanvasWidthChange(p.w);
                    onCanvasHeightChange(p.h);
                  }}
                  className={`px-2 py-1 text-[11px] rounded border text-left transition-colors ${
                    canvasWidth === p.w && canvasHeight === p.h
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION: MARGIN & SPACING */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <NumberInput
            label={t("stage2.outerPadding")}
            value={gridParams.outerPadding}
            onChangeValue={(val) =>
              onGridParamsChange({ ...gridParams, outerPadding: val })
            }
            min={0}
            max={200}
          />
          <NumberInput
            label={t("stage2.gapX", { defaultValue: "Khoảng ngang (Gap X)" })}
            value={gridParams.gapX}
            onChangeValue={(val) =>
              onGridParamsChange({ ...gridParams, gapX: val })
            }
            min={0}
            max={100}
          />
          <NumberInput
            label={t("stage2.gapY", { defaultValue: "Khoảng dọc (Gap Y)" })}
            value={gridParams.gapY}
            onChangeValue={(val) =>
              onGridParamsChange({ ...gridParams, gapY: val })
            }
            min={0}
            max={100}
          />
        </div>
      </AccordionCard>

      {/* CARD 3: LAYOUT PRESETS */}
      <AccordionCard
        icon={<LayoutGrid size={16} />}
        label={t("stage2.layoutSelector", { defaultValue: "Mẫu layout ghép" })}
        sublabel={t("stage2.layoutsForImages", {
          count: queueCount >= 2 ? queueCount : 2,
          defaultValue: `Bố cục cho ${queueCount >= 2 ? queueCount : 2} ảnh`,
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
                className={`relative flex flex-col items-center p-2.5 rounded-lg border text-center transition-all ${
                  isSelected
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                }`}
              >
                <div className="w-full h-16 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 p-1 mb-2">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-slate-400"
                    dangerouslySetInnerHTML={{ __html: preset.svgPreview }}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </AccordionCard>
    </div>
  );
}
