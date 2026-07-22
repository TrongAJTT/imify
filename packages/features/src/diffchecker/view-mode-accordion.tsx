import React, { useMemo } from "react";
import type { DiffViewMode } from "./types";
import { Columns, Layers, Lock, Zap } from "lucide-react";
import { AccordionCard, RadioCard } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export function ViewModeAccordion({
  viewMode,
  onViewModeChange,
  imageCount = 0,
}: {
  viewMode: DiffViewMode;
  onViewModeChange: (mode: DiffViewMode) => void;
  imageCount?: number;
}) {
  const { t } = useTranslation("diffchecker");
  const isLocked = imageCount >= 3;

  const viewModes = useMemo(
    () => [
      {
        value: "split" as const,
        title: t("split"),
        subtitle: t("dragSliderToCompare"),
        icon: <Columns size={14} />,
      },
      {
        value: "side_by_side" as const,
        title: t("sideBySide"),
        subtitle: t("viewBothParallel"),
        icon: <Columns size={14} />,
      },
      {
        value: "overlay" as const,
        title: t("overlay"),
        subtitle: t("adjustOpacityBlend"),
        icon: <Layers size={14} />,
      },
      {
        value: "difference" as const,
        title: t("difference"),
        subtitle: t("pixelLevelAnalysis"),
        icon: <Zap size={14} />,
      },
    ],
    [t],
  );

  const activeModeLabel = isLocked
    ? t("lockedSideBySide")
    : viewModes.find((m) => m.value === viewMode)?.title || "Unknown";

  return (
    <AccordionCard
      icon={<Columns size={16} />}
      label={t("viewMode")}
      sublabel={activeModeLabel}
      colorTheme="blue"
      alwaysOpen
    >
      <div className="grid grid-cols-2 md:grid-cols-1 gap-3 pt-1">
        {isLocked && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
            <Lock size={14} className="shrink-0" />
            <span>{t("lockedSideBySide")}</span>
          </div>
        )}
        {viewModes.map((m) => {
          const isDisabled = isLocked && m.value !== "side_by_side";
          return (
            <div
              key={m.value}
              className={isDisabled ? "pointer-events-none opacity-40" : ""}
            >
              <RadioCard
                icon={m.icon}
                title={m.title}
                subtitle={m.subtitle}
                value={m.value}
                selectedValue={isLocked ? "side_by_side" : viewMode}
                onChange={(v) => {
                  if (!isLocked) onViewModeChange(v as DiffViewMode);
                }}
              />
            </div>
          );
        })}
      </div>
    </AccordionCard>
  );
}
