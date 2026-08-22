"use client";

import React from "react";
import { BaseDialog } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { Loader2 } from "lucide-react";

export interface ImportProgressDialogProps {
  isOpen: boolean;
  title?: React.ReactNode | null;
  subtitle?: React.ReactNode | null;
  totalCount?: number;
  processedCount?: number;
  currentFileName?: string | null;
}

export function ImportProgressDialog({
  isOpen,
  title,
  subtitle,
  totalCount = 0,
  processedCount = 0,
  currentFileName,
}: ImportProgressDialogProps) {
  const { t } = useTranslation("common");

  const hasTotal = totalCount > 0;
  const percent = hasTotal
    ? Math.min(100, Math.round((processedCount / totalCount) * 100))
    : 0;

  const displayTitle = title ?? t("importProgressDialog.title");
  const displaySubtitle =
    subtitle ??
    (hasTotal
      ? t("importProgressDialog.subtitle")
      : t("importProgressDialog.indeterminateSubtitle"));

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={() => {}}
      shouldBlockCloseAttempt={() => true}
      className="max-w-md"
      contentClassName="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150 select-none"
    >
      <div className="flex flex-col gap-4">
        {/* Header with icon */}
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-sky-500 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug truncate">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="flex flex-col gap-2 pt-1">
          {hasTotal ? (
            <>
              {/* Determinate progress bar */}
              <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Progress meta stats */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>
                  {t("importProgressDialog.progressCount", {
                    completed: processedCount,
                    total: totalCount,
                    percent,
                  })}
                </span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  {percent}%
                </span>
              </div>
            </>
          ) : (
            /* Indeterminate progress bar */
            <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-sky-500 dark:bg-sky-400 rounded-full animate-[indeterminate_1.5s_infinite_linear]" />
            </div>
          )}

          {/* Current file name indicator if available */}
          {currentFileName ? (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-1">
              {t("importProgressDialog.processingFile", {
                name: currentFileName,
              })}
            </div>
          ) : null}
        </div>
      </div>
    </BaseDialog>
  );
}
