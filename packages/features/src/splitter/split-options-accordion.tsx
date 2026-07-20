import React, { useMemo } from "react";
import type { SplitterSplitSettings } from "./types";
import {
  Tooltip,
  TooltipTableContent,
  AccordionCard,
  ColorPickerPopover,
  NumberInput,
  SegmentedControl,
  SelectInput,
  LabelText,
} from "@imify/ui";
import { Scissors } from "lucide-react";
import { useTranslation } from "@imify/i18n";

interface SplitOptionsAccordionProps {
  settings: SplitterSplitSettings;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChange: (patch: Partial<SplitterSplitSettings>) => void;
}

export function SplitOptionsAccordion({
  settings,
  isOpen,
  onOpenChange,
  onChange,
}: SplitOptionsAccordionProps) {
  const { t } = useTranslation(["splitter", "common"]);

  const usesGrid = settings.direction === "grid";
  const isBasic = settings.mode === "basic";
  const isColorMatch =
    settings.mode === "advanced" && settings.advancedMethod === "color_match";
  const isSocialCarousel =
    settings.mode === "advanced" &&
    settings.advancedMethod === "social_carousel";
  const isGutterMarginGrid =
    settings.mode === "advanced" &&
    settings.advancedMethod === "gutter_margin_grid";
  const isAutoSprite =
    settings.mode === "advanced" && settings.advancedMethod === "auto_sprite";
  const isColorMatchGridFallback =
    isColorMatch && settings.direction === "grid";

  const showXAxisFields = settings.direction === "vertical" || usesGrid;
  const showYAxisFields = settings.direction === "horizontal" || usesGrid;

  const directionOptions = useMemo(
    () => [
      { value: "vertical", label: t("verticalSlices") },
      { value: "horizontal", label: t("horizontalSlices") },
      { value: "grid", label: t("grid") },
    ],
    [t],
  );

  const basicMethodOptions = useMemo(
    () => [
      { value: "count", label: t("count") },
      { value: "percent", label: t("percent") },
      { value: "pixel", label: t("pixel") },
    ],
    [t],
  );

  const advancedMethodOptions = useMemo(
    () => [
      { value: "pixel_pattern", label: t("pixelPattern") },
      { value: "percent_pattern", label: t("percentPattern") },
      { value: "custom_list", label: t("customList") },
      { value: "social_carousel", label: t("socialCarousel") },
      { value: "gutter_margin_grid", label: t("gutterMarginGrid") },
      { value: "auto_sprite", label: t("autoSprite") },
      { value: "color_match", label: t("colorMatch") },
    ],
    [t],
  );

  const socialTargetRatioOptions = useMemo(
    () => [
      { value: "1:1", label: `1:1 (${t("landscape")})` },
      { value: "4:5", label: `4:5 (${t("portrait")})` },
      { value: "3:4", label: `3:4 (${t("portrait")})` },
      { value: "2:3", label: `2:3 (${t("portrait")})` },
      { value: "5:4", label: `5:4 (${t("landscape")})` },
      { value: "16:9", label: `16:9 (${t("landscape")})` },
      { value: "9:16", label: `9:16 (${t("portrait")})` },
    ],
    [t],
  );

  const socialOverflowOptions = useMemo(
    () => [
      { value: "crop", label: t("cropRemainder") },
      { value: "stretch", label: t("stretchLastSlice") },
      { value: "pad", label: t("padLastSlice") },
    ],
    [t],
  );

  const safeZoneSelectionOptions = useMemo(
    () => [
      { value: "nearest", label: t("nearestSafeLine") },
      { value: "lowest_variance", label: t("lowestVarianceLine") },
    ],
    [t],
  );

  const gridRemainderOptions = useMemo(
    () => [
      { value: "trim", label: t("trimRemainder") },
      { value: "distribute", label: t("distributeRemainder") },
    ],
    [t],
  );

  const spriteConnectivityOptions = useMemo(
    () => [
      { value: "8", label: t("eightWay") },
      { value: "4", label: t("fourWay") },
    ],
    [t],
  );

  const spriteSortOptions = useMemo(
    () => [
      { value: "top_left", label: t("topToBottomThenLeft") },
      { value: "left_right", label: t("leftToRightThenTop") },
      { value: "size_desc", label: t("largestAreaFirst") },
    ],
    [t],
  );

  const basicMethodTableRows = t("tooltips.basicMethods", {
    returnObjects: true,
  }) as Array<{ method: string; description: string }>;
  const advancedMethodTableRows = t("tooltips.advancedMethods", {
    returnObjects: true,
  }) as Array<{ method: string; description: string }>;

  return (
    <AccordionCard
      icon={<Scissors size={14} />}
      label={t("splitOptions")}
      sublabel={`${settings.mode === "basic" ? t("basic") : t("advanced")} • ${
        settings.direction === "vertical"
          ? t("verticalSlices")
          : settings.direction === "horizontal"
            ? t("horizontalSlices")
            : t("grid")
      }`}
      colorTheme="sky"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <SegmentedControl
            value={settings.mode}
            options={[
              { value: "basic", label: t("basic") },
              { value: "advanced", label: t("advanced") },
            ]}
            onChange={(value) => onChange({ mode: value })}
            ariaLabel="Split mode"
            wrapperClassName="flex justify-center"
          />
        </div>

        {!isSocialCarousel && !isGutterMarginGrid && !isAutoSprite ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <LabelText className="text-xs">{t("direction")}</LabelText>
              {isColorMatchGridFallback ? (
                <Tooltip
                  content={t("tooltips.colorMatchGridFallback")}
                  variant="wide1"
                >
                  <span className="inline-flex h-6 items-center rounded-md border border-amber-300 bg-amber-50 px-2 text-[10px] font-semibold text-amber-700 dark:border-amber-700/70 dark:bg-amber-950/20 dark:text-amber-200">
                    {t("fallbackHorizontal")}
                  </span>
                </Tooltip>
              ) : null}
            </div>
            <select
              value={settings.direction}
              onChange={(event) =>
                onChange({
                  direction: event.target
                    .value as SplitterSplitSettings["direction"],
                })
              }
              className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 text-xs leading-5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all shadow-sm"
            >
              {directionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {isBasic ? (
          <>
            <SelectInput
              label={t("basicMethod")}
              tooltipContent={
                <TooltipTableContent
                  rows={
                    Array.isArray(basicMethodTableRows)
                      ? basicMethodTableRows
                      : []
                  }
                  firstColumnHeader={t("common:option")}
                  secondColumnHeader={t("common:whatItDoes")}
                />
              }
              value={settings.basicMethod}
              options={basicMethodOptions}
              onChange={(value) =>
                onChange({
                  basicMethod: value as SplitterSplitSettings["basicMethod"],
                })
              }
            />

            {settings.basicMethod === "count" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {showXAxisFields ? (
                  <NumberInput
                    label={t("columns")}
                    value={settings.countX}
                    min={1}
                    max={4096}
                    onChangeValue={(value) => onChange({ countX: value })}
                  />
                ) : null}
                {showYAxisFields ? (
                  <NumberInput
                    label={t("rows")}
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
                    label={t("columnSizePercent")}
                    value={settings.percentX}
                    min={1}
                    max={100}
                    onChangeValue={(value) => onChange({ percentX: value })}
                  />
                ) : null}
                {showYAxisFields ? (
                  <NumberInput
                    label={t("rowSizePercent")}
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
                    label={t("columnSizePx")}
                    value={settings.pixelX}
                    min={1}
                    max={100000}
                    onChangeValue={(value) => onChange({ pixelX: value })}
                  />
                ) : null}
                {showYAxisFields ? (
                  <NumberInput
                    label={t("rowSizePx")}
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
              label={t("advancedMethod")}
              tooltipContent={
                <TooltipTableContent
                  rows={
                    Array.isArray(advancedMethodTableRows)
                      ? advancedMethodTableRows
                      : []
                  }
                  firstColumnHeader={t("common:option")}
                  secondColumnHeader={t("common:whatItDoes")}
                />
              }
              value={settings.advancedMethod}
              options={advancedMethodOptions}
              onChange={(value) =>
                onChange({
                  advancedMethod:
                    value as SplitterSplitSettings["advancedMethod"],
                  ...(value === "gutter_margin_grid"
                    ? { direction: "grid" }
                    : {}),
                })
              }
            />

            {isColorMatch ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <NumberInput
                    label={t("offset")}
                    tooltipContent={t("tooltips.colorMatchOffset")}
                    value={settings.colorMatchOffset}
                    min={-10000}
                    max={10000}
                    onChangeValue={(value) =>
                      onChange({ colorMatchOffset: value })
                    }
                  />
                  <NumberInput
                    label={t("tolerance")}
                    tooltipContent={t("tooltips.colorMatchTolerance")}
                    value={settings.colorMatchTolerance}
                    min={0}
                    max={255}
                    onChangeValue={(value) =>
                      onChange({ colorMatchTolerance: value })
                    }
                  />
                  <NumberInput
                    label={t("skipBefore")}
                    tooltipContent={t("tooltips.colorMatchSkipBefore")}
                    value={settings.colorMatchSkipBefore}
                    min={0}
                    max={10000}
                    onChangeValue={(value) =>
                      onChange({ colorMatchSkipBefore: value })
                    }
                  />
                  <NumberInput
                    label={t("breakAfter")}
                    tooltipContent={t("tooltips.colorMatchBreakAfter")}
                    value={settings.colorMatchSkipPixels}
                    min={0}
                    max={10000}
                    onChangeValue={(value) =>
                      onChange({ colorMatchSkipPixels: value })
                    }
                  />
                </div>

                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500/20"
                    checked={settings.colorMatchSafeZoneEnabled}
                    onChange={(event) =>
                      onChange({
                        colorMatchSafeZoneEnabled: event.target.checked,
                      })
                    }
                  />
                  <span>{t("safeZoneLowVariance")}</span>
                </label>

                {settings.colorMatchSafeZoneEnabled ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <NumberInput
                      label={t("varianceThreshold")}
                      tooltipContent={t("tooltips.safeZoneVarianceThreshold")}
                      value={settings.colorMatchSafeVarianceThreshold}
                      min={0}
                      max={10000}
                      onChangeValue={(value) =>
                        onChange({ colorMatchSafeVarianceThreshold: value })
                      }
                    />
                    <NumberInput
                      label={t("searchRadius")}
                      tooltipContent={t("tooltips.safeZoneSearchRadius")}
                      value={settings.colorMatchSafeSearchRadius}
                      min={0}
                      max={1000}
                      onChangeValue={(value) =>
                        onChange({ colorMatchSafeSearchRadius: value })
                      }
                    />
                    <NumberInput
                      label={t("searchStep")}
                      tooltipContent={t("tooltips.safeZoneSearchStep")}
                      value={settings.colorMatchSafeSearchStep}
                      min={1}
                      max={128}
                      onChangeValue={(value) =>
                        onChange({ colorMatchSafeSearchStep: value })
                      }
                    />
                    <SelectInput
                      label={t("selectionMode")}
                      value={settings.colorMatchSafeSelectionMode}
                      options={safeZoneSelectionOptions}
                      onChange={(value) =>
                        onChange({
                          colorMatchSafeSelectionMode:
                            value as SplitterSplitSettings["colorMatchSafeSelectionMode"],
                        })
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {isSocialCarousel ? (
              <div className="space-y-2">
                <SelectInput
                  label={t("targetRatio")}
                  value={settings.socialTargetRatio}
                  options={socialTargetRatioOptions}
                  onChange={(value) =>
                    onChange({
                      socialTargetRatio:
                        value as SplitterSplitSettings["socialTargetRatio"],
                    })
                  }
                />
                <SelectInput
                  label={t("remainderHandling")}
                  tooltipContent={t("tooltips.remainderHandling")}
                  value={settings.socialOverflowMode}
                  options={socialOverflowOptions}
                  onChange={(value) =>
                    onChange({
                      socialOverflowMode:
                        value as SplitterSplitSettings["socialOverflowMode"],
                    })
                  }
                />
                {settings.socialOverflowMode === "pad" ? (
                  <ColorPickerPopover
                    label={t("padColor")}
                    value={settings.socialPadColor || "#ffffff"}
                    onChange={(value) => onChange({ socialPadColor: value })}
                    enableGradient={false}
                    outputMode="hex"
                  />
                ) : null}
              </div>
            ) : null}

            {isGutterMarginGrid ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <NumberInput
                    label={t("columns")}
                    value={settings.gridColumns}
                    min={1}
                    max={256}
                    onChangeValue={(value) => onChange({ gridColumns: value })}
                  />
                  <NumberInput
                    label={t("rows")}
                    value={settings.gridRows}
                    min={1}
                    max={256}
                    onChangeValue={(value) => onChange({ gridRows: value })}
                  />
                  <NumberInput
                    label={t("marginX")}
                    value={settings.gridMarginX}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridMarginX: value })}
                  />
                  <NumberInput
                    label={t("marginY")}
                    value={settings.gridMarginY}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridMarginY: value })}
                  />
                  <NumberInput
                    label={t("gutterX")}
                    value={settings.gridGutterX}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridGutterX: value })}
                  />
                  <NumberInput
                    label={t("gutterY")}
                    value={settings.gridGutterY}
                    min={0}
                    max={100000}
                    onChangeValue={(value) => onChange({ gridGutterY: value })}
                  />
                </div>
                <SelectInput
                  label={t("remainderHandling")}
                  value={settings.gridRemainderMode}
                  options={gridRemainderOptions}
                  onChange={(value) =>
                    onChange({
                      gridRemainderMode:
                        value as SplitterSplitSettings["gridRemainderMode"],
                    })
                  }
                />
              </div>
            ) : null}

            {isAutoSprite ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <NumberInput
                    label={t("alphaThreshold")}
                    tooltipContent={t("tooltips.spriteAlphaThreshold")}
                    value={settings.spriteAlphaThreshold}
                    min={0}
                    max={255}
                    onChangeValue={(value) =>
                      onChange({ spriteAlphaThreshold: value })
                    }
                  />
                  <NumberInput
                    label={t("minArea")}
                    tooltipContent={t("tooltips.spriteMinArea")}
                    value={settings.spriteMinArea}
                    min={1}
                    max={10000000}
                    onChangeValue={(value) =>
                      onChange({ spriteMinArea: value })
                    }
                  />
                  <NumberInput
                    label={t("boxPadding")}
                    tooltipContent={t("tooltips.spritePadding")}
                    value={settings.spritePadding}
                    min={0}
                    max={1000}
                    onChangeValue={(value) =>
                      onChange({ spritePadding: value })
                    }
                  />
                  <SelectInput
                    label={t("connectivity")}
                    value={String(settings.spriteConnectivity)}
                    options={spriteConnectivityOptions}
                    onChange={(value) =>
                      onChange({ spriteConnectivity: value === "4" ? 4 : 8 })
                    }
                  />
                </div>
                <SelectInput
                  label={t("sortOrder")}
                  value={settings.spriteSortMode}
                  options={spriteSortOptions}
                  onChange={(value) =>
                    onChange({
                      spriteSortMode:
                        value as SplitterSplitSettings["spriteSortMode"],
                    })
                  }
                />
              </div>
            ) : null}
          </>
        )}

        <ColorPickerPopover
          label={t("guideColor")}
          value={settings.guideColor || "#06b6d4"}
          onChange={(value) => onChange({ guideColor: value })}
          enableGradient={false}
          outputMode="hex"
        />
      </div>
    </AccordionCard>
  );
}
