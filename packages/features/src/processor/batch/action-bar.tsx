import React from "react";
import {
  Play,
  List,
  Clock,
  Check,
  X,
  Pause,
  Trash2,
  RotateCw,
} from "lucide-react";
import { Button, Tooltip } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { confirmDialog } from "@imify/stores";
import type { BatchRunMode } from "./types";

export interface QueueStats {
  queued: number;
  processing: number;
  success: number;
  error: number;
}

export function BatchActionBar({
  canRunAll,
  runAllLabel,
  canRetryFailed,
  isRunning,
  cancelRequested,
  paused,
  queueHasItems,
  queueStats,
  onRunAll,
  onRunFailed,
  onCancel,
  onTogglePause,
  onClear,
}: {
  canRunAll: boolean;
  runAllLabel: "Start Batch" | "Continue Batch";
  canRetryFailed: boolean;
  isRunning: boolean;
  cancelRequested: boolean;
  paused: boolean;
  queueHasItems: boolean;
  queueStats: QueueStats;
  onRunAll: (mode?: BatchRunMode) => void;
  onRunFailed: () => void;
  onCancel: () => void;
  onTogglePause: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation(["processor", "common"]);
  const shouldShowActionBar =
    queueHasItems ||
    queueStats.processing > 0 ||
    queueStats.success > 0 ||
    queueStats.error > 0;
  if (!shouldShowActionBar) return null;

  return (
    <div className="flex flex-wrap mb-4 items-center justify-center md:justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {canRunAll ? (
          <Button variant="default" onClick={() => onRunAll("all")}>
            <span className="flex items-center gap-2">
              <Play size={16} />
              {runAllLabel === "Start Batch"
                ? t("startBatch")
                : t("continueBatch")}
            </span>
          </Button>
        ) : null}
        {!isRunning && (queueStats.success > 0 || queueStats.error > 0) ? (
          <Button
            variant="secondary"
            onClick={async () => {
              const confirmed = await confirmDialog({
                title: t("batchConfirmRetryAll"),
                variant: "warning",
              });
              if (confirmed) {
                onRunAll("all_retry");
              }
            }}
          >
            <RotateCw size={16} />
            {t("common:retry")}
          </Button>
        ) : null}
        {canRetryFailed ? (
          <Button variant="warning" onClick={onRunFailed}>
            <RotateCw size={16} />
            {t("retryFailed")}
          </Button>
        ) : null}
        {isRunning ? (
          <Button variant="destructive" onClick={onCancel}>
            <X size={16} />
            {cancelRequested ? t("canceling") : t("cancel")}
          </Button>
        ) : null}
        {isRunning ? (
          <Button variant="info" onClick={onTogglePause}>
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? t("resume") : t("pause")}
          </Button>
        ) : null}
        {!isRunning && queueHasItems ? (
          <Button
            variant="secondary"
            onClick={async () => {
              const confirmed = await confirmDialog({
                title: t("batchConfirmClearAll"),
                variant: "destructive",
              });
              if (confirmed) {
                onClear();
              }
            }}
          >
            <Trash2 size={16} />
            {t("clear")}
          </Button>
        ) : null}
      </div>
      <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 px-1 py-2 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-medium divide-x divide-slate-200 dark:divide-slate-700 select-none">
        <Tooltip content={t("tooltipQueuedItems")}>
          <div className="flex items-center gap-1.5 px-2.5">
            <List size={14} className="text-slate-400" />
            <span className="text-slate-800 dark:text-slate-100">
              {queueStats.queued}
            </span>
          </div>
        </Tooltip>
        <Tooltip content={t("tooltipProcessingItems")}>
          <div className="flex items-center gap-1.5 px-2.5">
            <Clock size={14} className="text-sky-500 animate-pulse" />
            <span className="text-sky-600 dark:text-sky-400">
              {queueStats.processing}
            </span>
          </div>
        </Tooltip>
        <Tooltip content={t("tooltipSuccessfulItems")}>
          <div className="flex items-center gap-1.5 px-2.5">
            <Check size={14} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">
              {queueStats.success}
            </span>
          </div>
        </Tooltip>
        <Tooltip content={t("tooltipFailedItems")}>
          <div className="flex items-center gap-1.5 px-2.5">
            <X size={14} className="text-red-500" />
            <span className="text-red-600 dark:text-red-400">
              {queueStats.error}
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
