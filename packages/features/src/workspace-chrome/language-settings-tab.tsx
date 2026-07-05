"use client";

import React, { useState, useEffect } from "react";
import {
  ClockAlert,
  Check,
  ChevronDown,
  ChevronRight,
  User,
  Trash2,
  Upload,
} from "lucide-react";
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header";
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header";
import { useI18nStore } from "@imify/stores";
import {
  getAvailableLanguages,
  getAppI18nVersion,
  deleteRuntimeLanguage,
  useTranslation,
  type LanguageInfo,
} from "@imify/i18n";
import { Tooltip } from "@imify/ui/index";

interface LanguageSettingsTabProps {
  isMobile?: boolean;
}

export function LanguageSettingsTab({
  isMobile = false,
}: LanguageSettingsTabProps) {
  const activeLanguage = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);
  const { t, i18n } = useTranslation(["settings", "common"]);

  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [expandedLangCode, setExpandedLangCode] = useState<string | null>(
    activeLanguage,
  );
  const [hoveredLangCode, setHoveredLangCode] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>("");

  // Load languages info from i18n
  useEffect(() => {
    setLanguages(getAvailableLanguages());
    setAppVersion(getAppI18nVersion());
  }, [activeLanguage, i18n.language]);

  // Ensure active language is auto-expanded by default when activeLanguage changes
  useEffect(() => {
    setExpandedLangCode(activeLanguage);
  }, [activeLanguage]);

  const handleToggleExpand = (code: string) => {
    setExpandedLangCode((prev) => (prev === code ? null : code));
  };

  const handleApplyLanguage = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLanguage(code);
  };

  const handleRequestDelete = async (
    lang: LanguageInfo,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      t("language.deleteConfirm", { name: lang.name }) +
        "\n\n" +
        t("language.deleteConfirmDesc"),
    );
    if (!confirmed) return;
    try {
      await deleteRuntimeLanguage(lang.code);
      if (activeLanguage === lang.code) {
        setLanguage("en");
      } else {
        setLanguages(getAvailableLanguages());
      }
    } catch (err) {
      console.error("Failed to delete custom language:", err);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      {!isMobile && (
        <SettingsSectionHeader
          title={t("language.sectionTitle")}
          description={t("language.sectionDesc")}
        />
      )}

      <section className="space-y-4">
        <SettingsItemHeader
          title={t("language.displayLanguage")}
          description={t("language.displayLanguageDesc")}
        />

        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
          {languages.map((lang) => {
            const isActive = lang.code === activeLanguage;
            const isExpanded = expandedLangCode === lang.code;
            const isHovered = hoveredLangCode === lang.code;

            // Get completion rate details
            const totalKeys = lang.stats?.total ?? 0;
            const completedKeys = lang.stats?.completed ?? 0;
            const completionPercent = Math.round(lang.completionRate * 100);

            return (
              <div
                key={lang.code}
                className="border-b last:border-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
                onMouseEnter={() => setHoveredLangCode(lang.code)}
                onMouseLeave={() => setHoveredLangCode(null)}
              >
                {/* Header row (Click to expand) */}
                <div
                  onClick={() => handleToggleExpand(lang.code)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Language code badge instead of globe icon */}
                    <div className="flex items-center justify-center min-w-8 h-8 px-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[11px] font-bold uppercase tracking-wide font-mono">
                      {lang.code.length <= 3
                        ? lang.code
                        : lang.code.slice(0, 3)}
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
                        {appVersion &&
                          lang.version &&
                          lang.version !== appVersion && (
                            <Tooltip
                              content={t("language.tooltipDeprecated", {
                                langVersion: lang.version,
                                appVersion,
                              })}
                            >
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                                <ClockAlert
                                  className="w-3 h-3"
                                  strokeWidth={2.5}
                                />
                              </span>
                            </Tooltip>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Right-side actions */}
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    {/* Apply button: only for non-active, shown on hover (collapsed row) */}
                    {!isActive && !isExpanded && isHovered && (
                      <button
                        onClick={(e) => handleApplyLanguage(lang.code, e)}
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
                    <div className="pt-2 grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* Left: Completion Rate */}
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

                      {/* Right: Contributors */}
                      {lang.maintainers && lang.maintainers.length > 0 ? (
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
                                    <span className="text-slate-500">
                                      ({m.role})
                                    </span>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Bottom action row */}
                    <div className="flex justify-end items-center gap-2 pt-3">
                      {/* Delete button for runtime imports */}
                      {lang.isRuntime && (
                        <button
                          onClick={(e) => handleRequestDelete(lang, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 border border-transparent hover:border-red-100 dark:hover:border-red-900/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("language.deleteLanguage")}
                        </button>
                      )}

                      {/* Apply button in expanded panel for non-active languages */}
                      {!isActive && (
                        <button
                          onClick={(e) => handleApplyLanguage(lang.code, e)}
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
          })}
        </div>
      </section>
    </div>
  );
}
