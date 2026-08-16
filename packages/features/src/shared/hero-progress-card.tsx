"use client"

import React from "react"
import { Timer, X, Zap } from "lucide-react"
import { Button, AnimatingSpinner } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

export interface HeroProgressCardProps {
  /** Override title. Default: common.progressCard.title ("Đang xử lý") */
  title?: React.ReactNode
  /** Override description. Default: common.progressCard.description ("Vui lòng giữ tab này mở trong khi hệ thống đang xử lý") */
  description?: React.ReactNode
  /** Status line text above the progress bar. Default: common.progressCard.progress ("Tiến trình") */
  statusText?: React.ReactNode
  /** Percent completed (0 - 100) */
  percent: number
  /** Current completed count */
  current?: number
  /** Total count */
  total?: number
  /** Format or type badge (e.g. "ZIP", "PDF", "PNG") */
  badge?: React.ReactNode
  /** Concurrency thread count (if any) */
  concurrency?: number
  /** Elapsed seconds for timer display (if any) */
  elapsedSeconds?: number
  /** Callback to cancel operation */
  onCancel?: () => void
  /** Cancel button label. Default: common.progressCard.cancel */
  cancelLabel?: React.ReactNode
  /** Custom extra class names for container */
  className?: string
}

export function HeroProgressCard({
  title,
  description,
  statusText,
  percent,
  current,
  total,
  badge,
  concurrency,
  elapsedSeconds,
  onCancel,
  cancelLabel,
  className,
}: HeroProgressCardProps) {
  const { t } = useTranslation("common")

  const displayTitle = title ?? t("progressCard.title")
  const displayDesc = description ?? t("progressCard.description")
  const displayStatus = statusText ?? t("progressCard.progress")
  const displayCancel = cancelLabel ?? t("progressCard.cancel")

  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)))

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-slate-50 p-4 md:p-5 shadow-xs dark:border-sky-900/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-sky-950/20 animate-in fade-in zoom-in-95 duration-200 ${
        className ?? ""
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-sky-500 dark:text-sky-400 shrink-0">
              <AnimatingSpinner size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                <span>{displayTitle}</span>

                {badge && (
                  <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    {badge}
                  </span>
                )}

                {typeof concurrency === "number" && concurrency > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 cursor-help"
                    title={t("progressCard.concurrencyTooltip", { count: concurrency })}
                  >
                    <Zap size={11} className="text-amber-500 fill-amber-500" />
                    <span>{concurrency}</span>
                  </span>
                )}

                {typeof elapsedSeconds === "number" && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono"
                    title={t("progressCard.elapsedTooltip", { seconds: elapsedSeconds })}
                  >
                    <Timer size={11} className="text-slate-500 dark:text-slate-400" />
                    <span>
                      {Math.floor(elapsedSeconds / 60)}:
                      {(elapsedSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  </span>
                )}
              </h4>

              {displayDesc && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {displayDesc}
                </p>
              )}
            </div>
          </div>

          {onCancel && (
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="w-full sm:w-auto rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-red-400 text-xs font-semibold"
              >
                <X size={13} className="mr-1 inline" />
                {displayCancel}
              </Button>
            </div>
          )}
        </div>

        {/* Large Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="truncate">{displayStatus}</span>
            <span className="font-mono text-sky-600 dark:text-sky-400">
              {clampedPercent}%
              {typeof current === "number" && typeof total === "number"
                ? ` (${current}/${total})`
                : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300 ease-out shadow-xs"
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
