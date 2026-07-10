"use client";

import React, { useState } from "react";
import {
  ClockAlert,
  Check,
  ChevronDown,
  ChevronRight,
  User,
  Trash2,
  Upload,
  Download,
} from "lucide-react";
import { useTranslation, type LanguageInfo } from "@imify/i18n";
import { Tooltip } from "@imify/ui";

interface LanguageItemCardProps {
  lang: LanguageInfo;
  isActive: boolean;
  appVersion: string;
  isExpanded: boolean;
  onToggleExpand: (code: string) => void;
  mode: "settings" | "devtools";
  onApply?: (code: string, e: React.MouseEvent) => void;
  onDelete?: (lang: LanguageInfo, e: React.MouseEvent) => void;
  onExport?: (lang: LanguageInfo, e: React.MouseEvent) => void;
}

export function LanguageItemCard({
  lang,
  isActive,
  appVersion,
  isExpanded,
  onToggleExpand,
  mode,
  onApply,
  onDelete,
  onExport,
}: LanguageItemCardProps) {
  const { t } = useTranslation(["settings", "common"]);
  const [isHovered, setIsHovered] = useState(false);

  // Get completion rate details
  const totalKeys = lang.stats?.total ?? 0;
  const completedKeys = lang.stats?.completed ?? 0;
  const completionPercent = Math.round(lang.completionRate * 100);

  return (
    <div
      className="border-b last:border-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header row (Click to expand) */}
      <div
        onClick={() => onToggleExpand(lang.code)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Language code badge */}
          <div className="flex items-center justify-center min-w-8 h-8 px-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[11px] font-bold uppercase tracking-wide font-mono">
            {lang.code.length <= 3 ? lang.code : lang.code.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mr-1.5">
                {lang.name}
              </span>
              {/* Active icon with tooltip */}
              {isActive && (
                <Tooltip content={t("language.tooltipActive")}>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                </Tooltip>
              )}
              {/* Runtime import icon with tooltip */}
              {lang.isRuntime && (
                <Tooltip content={t("language.tooltipRuntime")}>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Upload className="w-3 h-3" strokeWidth={2.5} />
                  </span>
                </Tooltip>
              )}
              {/* Deprecated version badge */}
              {appVersion && lang.version && lang.version !== appVersion && (
                <Tooltip
                  content={t("language.tooltipDeprecated", {
                    langVersion: lang.version,
                    appVersion,
                  })}
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                    <ClockAlert className="w-3 h-3" strokeWidth={2.5} />
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          {/* Apply button: only for settings mode, non-active, shown on hover (collapsed row) */}
          {mode === "settings" && !isActive && !isExpanded && isHovered && (
            <button
              onClick={(e) => onApply?.(lang.code, e)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-sky-500 hover:bg-sky-600 text-white transition-colors mr-0.5"
            >
              <Check className="w-3 h-3" strokeWidth={2.5} />
              {t("common:apply")}
            </button>
          )}

          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Accordion Expanded Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-top-1 duration-150">
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            {/* Contributors */}
            {lang.maintainers && lang.maintainers.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                  {t("language.contributors")}
                </span>
                <div className="flex flex-col gap-1">
                  {lang.maintainers.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                    >
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      {m.github ? (
                        <a
                          href={m.github}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-sky-600 dark:text-sky-400 hover:underline truncate"
                        >
                          {m.name}
                          <span className="font-normal text-slate-500 dark:text-slate-500">
                            {" "}
                            ({m.role})
                          </span>
                        </a>
                      ) : (
                        <span className="truncate">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {m.name}
                          </span>{" "}
                          <span className="text-slate-500">({m.role})</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Rate */}
            {completionPercent < 100 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
                  <span>{t("language.completionRate")}</span>
                  <span>
                    {completionPercent}% ({completedKeys}/{totalKeys})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom action row */}
          <div className="flex justify-end items-center gap-2 pt-3">
            {/* Delete button for runtime imports */}
            {lang.isRuntime && (
              <button
                onClick={(e) => onDelete?.(lang, e)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 border border-transparent hover:border-red-100 dark:hover:border-red-900/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("language.deleteLanguage")}
              </button>
            )}

            {/* Export button in expanded panel (for devtools mode) */}
            {mode === "devtools" && (
              <button
                onClick={(e) => onExport?.(lang, e)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {`${t("common:export")} (ZIP)`}
              </button>
            )}

            {/* Apply button in expanded panel (for settings mode, non-active languages) */}
            {mode === "settings" && !isActive && (
              <button
                onClick={(e) => onApply?.(lang.code, e)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white transition-colors"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                {t("common:apply")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
