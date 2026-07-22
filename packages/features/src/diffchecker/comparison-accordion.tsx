import React, { useMemo } from "react";
import type {
  DiffAlgorithm,
  DiffViewMode,
  MultiImageLayout2,
  MultiImageLayout3,
  MultiImageLayout4,
} from "./types";
import { Settings } from "lucide-react";
import {
  AccordionCard,
  GridIconSelector,
  MutedText,
  SelectInput,
  SliderInput,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export function Icon2Cols(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="4" width="8.5" height="16" rx="2" />
      <rect x="12.5" y="4" width="8.5" height="16" rx="2" />
    </svg>
  );
}

export function Icon2Rows(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="4" width="18" height="7.5" rx="2" />
      <rect x="3" y="12.5" width="18" height="7.5" rx="2" />
    </svg>
  );
}

export function Icon3Cols(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="16" rx="1.5" />
      <rect x="16" y="4" width="5" height="16" rx="1.5" />
    </svg>
  );
}

export function Icon3Rows(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="4" width="18" height="4.5" rx="1.5" />
      <rect x="3" y="9.75" width="18" height="4.5" rx="1.5" />
      <rect x="3" y="15.5" width="18" height="4.5" rx="1.5" />
    </svg>
  );
}

export function Icon2x2Grid(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="4" width="8.5" height="7.5" rx="2" />
      <rect x="12.5" y="4" width="8.5" height="7.5" rx="2" />
      <rect x="3" y="12.5" width="8.5" height="7.5" rx="2" />
      <rect x="12.5" y="12.5" width="8.5" height="7.5" rx="2" />
    </svg>
  );
}

export function Icon4Cols(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="4" width="3.5" height="16" rx="1" />
      <rect x="7.83" y="4" width="3.5" height="16" rx="1" />
      <rect x="12.66" y="4" width="3.5" height="16" rx="1" />
      <rect x="17.5" y="4" width="3.5" height="16" rx="1" />
    </svg>
  );
}

export function Icon4Rows(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="4" width="18" height="3.2" rx="1" />
      <rect x="3" y="8.2" width="18" height="3.2" rx="1" />
      <rect x="3" y="12.4" width="18" height="3.2" rx="1" />
      <rect x="3" y="16.6" width="18" height="3.2" rx="1" />
    </svg>
  );
}

interface ComparisonAccordionProps {
  viewMode: DiffViewMode;
  algorithm: DiffAlgorithm;
  overlayOpacity: number;
  diffThreshold: number;
  imageCount?: number;
  multiImageLayout2?: MultiImageLayout2;
  multiImageLayout3?: MultiImageLayout3;
  multiImageLayout4?: MultiImageLayout4;
  onAlgorithmChange: (algo: DiffAlgorithm) => void;
  onOverlayOpacityChange: (opacity: number) => void;
  onDiffThresholdChange: (threshold: number) => void;
  onMultiImageLayout2Change?: (layout: MultiImageLayout2) => void;
  onMultiImageLayout3Change?: (layout: MultiImageLayout3) => void;
  onMultiImageLayout4Change?: (layout: MultiImageLayout4) => void;
}

export function ComparisonAccordion({
  viewMode,
  algorithm,
  overlayOpacity,
  diffThreshold,
  imageCount = 0,
  multiImageLayout2 = "2_cols",
  multiImageLayout3 = "3_cols",
  multiImageLayout4 = "2x2_grid",
  onAlgorithmChange,
  onOverlayOpacityChange,
  onDiffThresholdChange,
  onMultiImageLayout2Change,
  onMultiImageLayout3Change,
  onMultiImageLayout4Change,
}: ComparisonAccordionProps) {
  const { t } = useTranslation("diffchecker");

  const algorithmOptions = useMemo(
    () => [
      { value: "heatmap", label: t("heatmap") },
      { value: "binary", label: t("binary") },
      { value: "ssim", label: t("ssim") },
    ],
    [t],
  );

  const options2 = useMemo(
    () => [
      {
        value: "2_cols" as const,
        label: t("layout2Cols"),
        icon: <Icon2Cols />,
      },
      {
        value: "2_rows" as const,
        label: t("layout2Rows"),
        icon: <Icon2Rows />,
      },
    ],
    [t],
  );

  const options3 = useMemo(
    () => [
      {
        value: "3_cols" as const,
        label: t("layout3Cols"),
        icon: <Icon3Cols />,
      },
      {
        value: "3_rows" as const,
        label: t("layout3Rows"),
        icon: <Icon3Rows />,
      },
    ],
    [t],
  );

  const options4 = useMemo(
    () => [
      {
        value: "2x2_grid" as const,
        label: t("layout2x2Grid"),
        icon: <Icon2x2Grid />,
      },
      {
        value: "4_cols" as const,
        label: t("layout4Cols"),
        icon: <Icon4Cols />,
      },
      {
        value: "4_rows" as const,
        label: t("layout4Rows"),
        icon: <Icon4Rows />,
      },
    ],
    [t],
  );

  const sublabel =
    imageCount >= 3
      ? `${t("multiImageLayout")}: ${
          imageCount === 3
            ? options3.find((o) => o.value === multiImageLayout3)?.label
            : options4.find((o) => o.value === multiImageLayout4)?.label
        }`
      : viewMode === "side_by_side" && imageCount === 2
        ? `${t("multiImageLayout")}: ${options2.find((o) => o.value === multiImageLayout2)?.label}`
        : viewMode === "overlay"
          ? `${t("opacityLabel")}: ${overlayOpacity}%`
          : viewMode === "difference"
            ? `${t("algorithmLabel")}: ${algorithm}`
            : t("comparison");

  return (
    <AccordionCard
      icon={<Settings size={16} />}
      label={t("comparison")}
      sublabel={sublabel}
      colorTheme="purple"
      alwaysOpen
    >
      <div className="space-y-3">
        {viewMode === "side_by_side" && imageCount === 2 ? (
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("multiImageLayout")}
            </span>
            <GridIconSelector
              value={multiImageLayout2}
              options={options2}
              onChange={(v) => onMultiImageLayout2Change?.(v)}
              colorTheme="purple"
              columns={4}
            />
          </div>
        ) : imageCount === 3 ? (
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("multiImageLayout")}
            </span>
            <GridIconSelector
              value={multiImageLayout3}
              options={options3}
              onChange={(v) => onMultiImageLayout3Change?.(v)}
              colorTheme="purple"
              columns={4}
            />
          </div>
        ) : imageCount >= 4 ? (
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("multiImageLayout")}
            </span>
            <GridIconSelector
              value={multiImageLayout4}
              options={options4}
              onChange={(v) => onMultiImageLayout4Change?.(v)}
              colorTheme="purple"
              columns={4}
            />
          </div>
        ) : (
          <>
            {viewMode === "overlay" ? (
              <SliderInput
                label={t("opacityLabel")}
                value={overlayOpacity}
                onChange={onOverlayOpacityChange}
                min={0}
                max={100}
                suffix="%"
              />
            ) : null}
            {viewMode === "difference" ? (
              <>
                <SelectInput
                  label={t("algorithmLabel")}
                  value={algorithm}
                  options={algorithmOptions}
                  onChange={(v) => onAlgorithmChange(v as DiffAlgorithm)}
                />
                {algorithm === "binary" ? (
                  <SliderInput
                    label={t("thresholdLabel")}
                    value={diffThreshold}
                    onChange={onDiffThresholdChange}
                    min={0}
                    max={128}
                  />
                ) : null}
              </>
            ) : null}
            {viewMode === "split" ? (
              <MutedText className="text-xs">
                {t("dragSliderSplitPos")}
              </MutedText>
            ) : null}
          </>
        )}
      </div>
    </AccordionCard>
  );
}
