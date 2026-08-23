import React from "react";
import { PencilRuler, Maximize2 } from "lucide-react";
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats";
import {
  DEFAULT_RESAMPLING_ALGORITHM,
  RESAMPLING_ALGORITHM_OPTIONS,
  normalizeResizeResamplingAlgorithm,
} from "@imify/core/resize-resampling";
import type {
  ResizeResamplingAlgorithm,
  ResizeApplyTo,
} from "@imify/core/types";
import { SmartResizeModule } from "./smart-resize-module";
import { PaperConfig } from "./paper-config";
import { usePopoverTriggerBehavior } from "./use-popover-trigger-behavior";
import {
  AccordionCard,
  ControlledPopover,
  LabelText,
  NumberInput,
  SelectInput,
  TooltipTableContent,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export type ResizeCardContentProps = {
  resizeMode: string;
  resizeValue?: number;
  resizeApplyTo?: ResizeApplyTo;
  resizeWidth?: number;
  resizeHeight?: number;
  resizeAspectMode?: string;
  resizeAspectRatio?: number | string;
  resizeFitMode?: string;
  resizeContainBackground?: string;
  resamplingAlgorithm?: ResizeResamplingAlgorithm;
  resizeSourceWidth?: number;
  resizeSourceHeight?: number;
  resizeSyncVersion?: number;
  resizeQuickStats?: ResizeQuickStats;
  paperSize?: string;
  dpi?: number;
  onResizeModeChange?: (mode: string) => void;
  onResizeValueChange?: (value: number) => void;
  onResizeApplyToChange?: (value: ResizeApplyTo) => void;
  onResizeWidthChange?: (value: number) => void;
  onResizeHeightChange?: (value: number) => void;
  onResizeAspectModeChange?: (mode: string) => void;
  onResizeAspectRatioChange?: (ratio: string | number) => void;
  onResizeFitModeChange?: (mode: string) => void;
  onResizeContainBackgroundChange?: (color: string) => void;
  onResamplingAlgorithmChange?: (algorithm: ResizeResamplingAlgorithm) => void;
  onPaperSizeChange?: (size: string) => void;
  onDpiChange?: (dpi: number) => void;
  disabled?: boolean;
  availableModes?: string[];
};

export type ResizeCardProps = ResizeCardContentProps & {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  alwaysOpen?: boolean;
  groupId?: string;
};

function generateSublabel(
  mode: string,
  resizeValue: number,
  resizeApplyTo: string,
  resizeWidth: number,
  resizeHeight: number,
  paperSize: string,
  dpi: number,
  resamplingAlgorithm: ResizeResamplingAlgorithm,
): string {
  const baseLabel = (() => {
    switch (mode) {
      case "none":
      case "inherit":
        return "No resize";
      case "fit_value":
        return `Fit ${resizeApplyTo} • ${resizeValue}px`;
      case "zoom_min":
        return `Zoom Min • ${resizeValue}px`;
      case "zoom_max":
        return `Zoom Max • ${resizeValue}px`;
      case "set_size":
        return `${resizeWidth} × ${resizeHeight}px`;
      case "scale":
        return `Scale • ${resizeValue}%`;
      case "paper_size":
      case "page_size":
        return `${paperSize.toUpperCase()} • ${dpi} DPI`;
      default:
        return "Custom";
    }
  })();

  if (mode === "none" || mode === "inherit") {
    return baseLabel;
  }

  const algorithmLabel =
    RESAMPLING_ALGORITHM_OPTIONS.find(
      (option) => option.value === resamplingAlgorithm,
    )?.label ?? resamplingAlgorithm;
  return `${baseLabel} • ${algorithmLabel}`;
}

export function ResizeCardContent({
  resizeMode = "inherit",
  resizeValue = 1280,
  resizeApplyTo = "width",
  resizeWidth = 1280,
  resizeHeight = 960,
  resizeAspectMode = "original",
  resizeAspectRatio = "16:9",
  resizeFitMode = "fill",
  resizeContainBackground = "#000000",
  resamplingAlgorithm = DEFAULT_RESAMPLING_ALGORITHM,
  resizeSourceWidth = 0,
  resizeSourceHeight = 0,
  resizeSyncVersion = 0,
  resizeQuickStats,
  paperSize = "A4",
  dpi = 300,
  onResizeModeChange,
  onResizeValueChange,
  onResizeApplyToChange,
  onResizeWidthChange,
  onResizeHeightChange,
  onResizeAspectModeChange,
  onResizeAspectRatioChange,
  onResizeFitModeChange,
  onResizeContainBackgroundChange,
  onResamplingAlgorithmChange,
  onPaperSizeChange,
  onDpiChange,
  disabled,
  availableModes,
}: ResizeCardContentProps) {
  const { t } = useTranslation(["processor", "common"]);
  const quickStatsPopoverBehavior = usePopoverTriggerBehavior();

  const batchModeMap: Record<string, string> = {
    inherit: t("resizeNone"),
    fit_value: t("resizeFitValue"),
    zoom_min: t("resizeZoomMin"),
    zoom_max: t("resizeZoomMax"),
    set_size: t("resizeSetSize"),
    scale: t("resizeScale"),
    paper_size: t("resizePaperSize"),
  };

  const modeOptions = availableModes
    ? availableModes.map((mode) => ({
        value: mode,
        label: batchModeMap[mode] || mode,
      }))
    : Object.entries(batchModeMap).map(([value, label]) => ({ value, label }));

  const applyToOptions = [
    { value: "width", label: t("applyToWidth") },
    { value: "height", label: t("applyToHeight") },
    { value: "shortest", label: t("applyToShortest") },
    { value: "longest", label: t("applyToLongest") },
  ];

  const safeResamplingAlgorithm =
    normalizeResizeResamplingAlgorithm(resamplingAlgorithm);

  const showResamplingAlgorithm =
    Boolean(onResamplingAlgorithmChange) &&
    resizeMode !== "none" &&
    resizeMode !== "inherit";

  const isLinearMode =
    resizeMode === "fit_value" ||
    resizeMode === "zoom_min" ||
    resizeMode === "zoom_max";

  const showQuickResizePopover = isLinearMode;

  const quickStatsFromQueue = (() => {
    switch (resizeApplyTo) {
      case "width":
        return resizeQuickStats?.width ?? null;
      case "height":
        return resizeQuickStats?.height ?? null;
      case "shortest":
        return resizeQuickStats?.shortest ?? null;
      case "longest":
        return resizeQuickStats?.longest ?? null;
      default:
        return resizeQuickStats?.width ?? null;
    }
  })();

  const sourceEdge = (() => {
    const sw = resizeSourceWidth ?? 0;
    const sh = resizeSourceHeight ?? 0;
    switch (resizeApplyTo) {
      case "width":
        return sw;
      case "height":
        return sh;
      case "shortest":
        return sw > 0 && sh > 0 ? Math.min(sw, sh) : sw || sh;
      case "longest":
        return sw > 0 && sh > 0 ? Math.max(sw, sh) : sw || sh;
      default:
        return sw;
    }
  })();
  const hasSourceEdge = sourceEdge > 0;

  const quickResizeValues = quickStatsFromQueue
    ? [
        {
          id: "min",
          label: "Min",
          value: Math.max(1, Math.round(quickStatsFromQueue.min)),
        },
        {
          id: "avg",
          label: "Avg",
          value: Math.max(1, Math.round(quickStatsFromQueue.avg)),
        },
        {
          id: "max",
          label: "Max",
          value: Math.max(1, Math.round(quickStatsFromQueue.max)),
        },
      ]
    : hasSourceEdge
      ? (() => {
          const safeSource = Math.max(1, Math.round(sourceEdge));
          return [
            { id: "min", label: "Min", value: safeSource },
            { id: "avg", label: "Avg", value: safeSource },
            { id: "max", label: "Max", value: safeSource },
          ];
        })()
      : (() => {
          const quickResizeBase = Math.max(1, Math.round(resizeValue));
          return [
            {
              id: "min",
              label: "Min",
              value: Math.max(1, Math.round(quickResizeBase * 0.5)),
            },
            {
              id: "avg",
              label: "Avg",
              value: Math.max(1, Math.round(quickResizeBase)),
            },
            {
              id: "max",
              label: "Max",
              value: Math.max(1, Math.round(quickResizeBase * 1.5)),
            },
          ];
        })();

  return (
    <div className="space-y-3">
      <SelectInput
        label={t("resizeType")}
        value={resizeMode}
        disabled={disabled}
        options={modeOptions}
        onChange={(val) => onResizeModeChange?.(val)}
        tooltipContent={
          <TooltipTableContent
            rows={
              t("tooltipResizeTypes", { returnObjects: true }) as Array<{
                method: string;
                description: string;
              }>
            }
            firstColumnHeader={t("common:option")}
            secondColumnHeader={t("common:whatItDoes")}
          />
        }
      />

      {isLinearMode && (
        <SelectInput
          label={t("resizeApplyTo")}
          value={resizeApplyTo}
          disabled={disabled}
          options={applyToOptions}
          onChange={(val) => onResizeApplyToChange?.(val as ResizeApplyTo)}
        />
      )}

      {(isLinearMode || resizeMode === "scale") && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <LabelText className="text-xs">
              {resizeMode === "scale" ? t("scalePercent") : t("valuePx")}
            </LabelText>

            {showQuickResizePopover && onResizeValueChange ? (
              <ControlledPopover
                trigger={
                  <button
                    type="button"
                    aria-label="Open quick resize options"
                    disabled={disabled}
                    className="h-6 rounded-md border border-slate-200 dark:border-slate-700 px-2 text-[10px] font-medium text-slate-600 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PencilRuler size={11} />
                    {t("quickStats")}
                  </button>
                }
                preset="inspector"
                behavior={quickStatsPopoverBehavior}
                side="bottom"
                align="end"
                closeOnContentClick
                contentClassName="z-[9999] w-56 rounded-md border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {quickResizeValues.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onResizeValueChange(preset.value)}
                      className="inline-flex flex-col items-center justify-center rounded-md border border-slate-200 px-2 py-1.5 text-[11px] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {preset.value}px
                      </span>
                    </button>
                  ))}
                </div>
              </ControlledPopover>
            ) : null}
          </div>

          <NumberInput
            disabled={disabled}
            min={1}
            value={resizeValue}
            onChangeValue={(val) => onResizeValueChange?.(val)}
          />
        </div>
      )}

      {resizeMode === "set_size" && (
        <SmartResizeModule
          containBackground={resizeContainBackground}
          disabled={disabled}
          fitMode={resizeFitMode as "fill" | "cover" | "contain"}
          height={resizeHeight}
          aspectMode={resizeAspectMode as "fixed" | "original" | "free"}
          aspectRatio={
            typeof resizeAspectRatio === "string"
              ? resizeAspectRatio
              : String(resizeAspectRatio)
          }
          onAspectModeChange={(mode) => onResizeAspectModeChange?.(mode)}
          onAspectRatioChange={(ratio) => onResizeAspectRatioChange?.(ratio)}
          onContainBackgroundChange={(color) =>
            onResizeContainBackgroundChange?.(color)
          }
          onFitModeChange={(mode) => onResizeFitModeChange?.(mode)}
          onHeightChange={(height) => onResizeHeightChange?.(height)}
          onSizeAnchorChange={() => {}}
          onWidthChange={(width) => onResizeWidthChange?.(width)}
          originalHeight={resizeSourceHeight}
          originalWidth={resizeSourceWidth}
          lockSignal={resizeSyncVersion}
          width={resizeWidth}
        />
      )}

      {(resizeMode === "paper_size" || (resizeMode as any) === "page_size") && (
        <PaperConfig
          disabled={disabled}
          dpi={dpi as any}
          onDpiChange={(d) => onDpiChange?.(d)}
          onPaperSizeChange={(size) => onPaperSizeChange?.(size)}
          paperSize={paperSize as any}
        />
      )}

      {showResamplingAlgorithm && (
        <SelectInput
          label={t("resamplingAlgorithm")}
          value={safeResamplingAlgorithm}
          disabled={disabled}
          options={RESAMPLING_ALGORITHM_OPTIONS}
          onChange={(nextValue) =>
            onResamplingAlgorithmChange?.(
              normalizeResizeResamplingAlgorithm(nextValue),
            )
          }
        />
      )}
    </div>
  );
}

export function ResizeCard({
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
  disabled,
  ...contentProps
}: ResizeCardProps) {
  const { t } = useTranslation(["processor", "common"]);
  const safeResamplingAlgorithm = normalizeResizeResamplingAlgorithm(
    contentProps.resamplingAlgorithm,
  );
  const sublabel = generateSublabel(
    contentProps.resizeMode ?? "inherit",
    contentProps.resizeValue ?? 1280,
    contentProps.resizeApplyTo ?? "width",
    contentProps.resizeWidth ?? 1280,
    contentProps.resizeHeight ?? 960,
    contentProps.paperSize ?? "A4",
    contentProps.dpi ?? 300,
    safeResamplingAlgorithm,
  );

  return (
    <AccordionCard
      icon={<Maximize2 size={14} />}
      label={t("resize")}
      sublabel={sublabel}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
      colorTheme="purple"
    >
      <ResizeCardContent {...contentProps} disabled={disabled} />
    </AccordionCard>
  );
}

export default ResizeCard;
