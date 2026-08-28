import React, { useMemo } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  MoveHorizontal,
  MoveVertical,
  X,
} from "lucide-react";

import type { SplitterSplitSettings } from "./types";
import { SPLITTER_TOOLTIPS } from "./splitter-tooltips";
import { BaseDialog, Button, SelectInput, Tooltip } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

interface SplitterOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Pick<
    SplitterSplitSettings,
    "horizontalOrder" | "verticalOrder" | "gridTraversal"
  >;
  onChange: (patch: Partial<SplitterSplitSettings>) => void;
}

type AxisItem = {
  id: "horizontal" | "vertical";
  label: string;
  icon: React.ReactNode;
};

function formatHorizontalOrder(
  value: SplitterSplitSettings["horizontalOrder"],
  t: (key: string) => string,
): string {
  return value === "left_to_right" ? t("leftArrowRight") : t("rightArrowLeft");
}

function formatVerticalOrder(
  value: SplitterSplitSettings["verticalOrder"],
  t: (key: string) => string,
): string {
  return value === "top_to_bottom" ? t("topArrowBottom") : t("bottomArrowTop");
}

function buildGridOrderPreview(args: {
  horizontalOrder: SplitterSplitSettings["horizontalOrder"];
  verticalOrder: SplitterSplitSettings["verticalOrder"];
  gridTraversal: SplitterSplitSettings["gridTraversal"];
}): number[] {
  const x = args.horizontalOrder === "left_to_right" ? [0, 1, 2] : [2, 1, 0];
  const y = args.verticalOrder === "top_to_bottom" ? [0, 1, 2] : [2, 1, 0];
  const order: number[] = [];

  if (args.gridTraversal === "column_first") {
    x.forEach((xi) => {
      y.forEach((yi) => {
        order.push(yi * 3 + xi + 1);
      });
    });
    return order;
  }

  y.forEach((yi) => {
    x.forEach((xi) => {
      order.push(yi * 3 + xi + 1);
    });
  });
  return order;
}

export function SplitterOrderDialog({
  isOpen,
  onClose,
  settings,
  onChange,
}: SplitterOrderDialogProps) {
  const { t } = useTranslation("splitter");

  const horizontalOrderOptions = useMemo(
    () => [
      { value: "left_to_right", label: t("leftToRight") },
      { value: "right_to_left", label: t("rightToLeft") },
    ],
    [t],
  );

  const verticalOrderOptions = useMemo(
    () => [
      { value: "top_to_bottom", label: t("topToBottom") },
      { value: "bottom_to_top", label: t("bottomToTop") },
    ],
    [t],
  );

  const axisItems = useMemo<AxisItem[]>(
    () =>
      settings.gridTraversal === "column_first"
        ? [
            {
              id: "vertical",
              label: t("verticalPriority"),
              icon: <MoveVertical size={14} />,
            },
            {
              id: "horizontal",
              label: t("horizontalPriority"),
              icon: <MoveHorizontal size={14} />,
            },
          ]
        : [
            {
              id: "horizontal",
              label: t("horizontalPriority"),
              icon: <MoveHorizontal size={14} />,
            },
            {
              id: "vertical",
              label: t("verticalPriority"),
              icon: <MoveVertical size={14} />,
            },
          ],
    [settings.gridTraversal, t],
  );

  const liveSummary =
    settings.gridTraversal === "column_first"
      ? `(${formatVerticalOrder(settings.verticalOrder, t)}) -> (${formatHorizontalOrder(settings.horizontalOrder, t)})`
      : `(${formatHorizontalOrder(settings.horizontalOrder, t)}) -> (${formatVerticalOrder(settings.verticalOrder, t)})`;

  const previewSequence = useMemo(
    () =>
      buildGridOrderPreview({
        horizontalOrder: settings.horizontalOrder,
        verticalOrder: settings.verticalOrder,
        gridTraversal: settings.gridTraversal,
      }),
    [settings.gridTraversal, settings.horizontalOrder, settings.verticalOrder],
  );

  const orderedNumbers = useMemo(() => {
    const entries = Array.from({ length: 9 }, (_, index) => index + 1);
    const rankMap = new Map(
      previewSequence.map((value, index) => [value, index + 1]),
    );
    return entries.map((value) => rankMap.get(value) ?? value);
  }, [previewSequence]);

  const togglePriority = () => {
    onChange({
      gridTraversal:
        settings.gridTraversal === "column_first"
          ? "row_first"
          : "column_first",
    });
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      mobileFullscreen
      contentClassName="w-full"
    >
      <div className="select-none">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/30 pr-12">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-sky-600 dark:text-sky-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {t("splitOrderDialogTitle")}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("previewOrder3x3")}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {orderedNumbers.map((value, index) => (
                  <div
                    key={`preview_${index + 1}`}
                    className="flex h-16 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
            <Tooltip
              label={t("liveSequence")}
              content={SPLITTER_TOOLTIPS.orderDialogLiveSequence}
              variant="wide1"
            >
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300">
                {liveSummary}
              </div>
            </Tooltip>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <SelectInput
              label={t("horizontalOrder")}
              value={settings.horizontalOrder}
              options={horizontalOrderOptions}
              onChange={(value) =>
                onChange({
                  horizontalOrder:
                    value as SplitterSplitSettings["horizontalOrder"],
                })
              }
            />
            <SelectInput
              label={t("verticalOrder")}
              value={settings.verticalOrder}
              options={verticalOrderOptions}
              onChange={(value) =>
                onChange({
                  verticalOrder:
                    value as SplitterSplitSettings["verticalOrder"],
                })
              }
            />

            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("priorityAxis")}
              </div>
              <div className="space-y-2">
                {axisItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {index === 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={togglePriority}
                        className="h-7 gap-1 px-2 text-[10px] font-bold"
                      >
                        <ChevronDown size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
}
