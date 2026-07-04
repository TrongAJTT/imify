"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "@imify/ui/ui/button";
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header";
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header";
import { useI18nStore } from "@imify/stores";
import {
  getAvailableLanguages,
  deleteRuntimeLanguage,
  useTranslation,
  type LanguageInfo,
} from "@imify/i18n";

interface LanguageSettingsTabProps {
  isMobile?: boolean;
}

export function LanguageSettingsTab({
  isMobile = false,
}: LanguageSettingsTabProps) {
  const activeLanguage = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);
  const { i18n } = useTranslation();

  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [expandedLangCode, setExpandedLangCode] = useState<string | null>(
    activeLanguage,
  );

  // Load languages info from i18n
  useEffect(() => {
    setLanguages(getAvailableLanguages());
  }, [activeLanguage, i18n.language]);

  // Ensure active language is auto-expanded by default when activeLanguage changes
  useEffect(() => {
    setExpandedLangCode(activeLanguage);
  }, [activeLanguage]);

  const handleToggleExpand = (code: string) => {
    setExpandedLangCode((prev) => (prev === code ? null : code));
  };

  const handleApplyLanguage = (code: string) => {
    setLanguage(code);
  };

  const handleDeleteLanguage = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteRuntimeLanguage(code);
      if (activeLanguage === code) {
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
          title="Language"
          description="Choose your display language for Imify, or manage custom runtime translations."
        />
      )}

      <section className="space-y-4">
        <SettingsItemHeader
          title="DISPLAY LANGUAGE"
          description="Select the interface language. Bundled languages fallback to English for missing keys."
        />

        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
          {languages.map((lang) => {
            const isActive = lang.code === activeLanguage;
            const isExpanded = expandedLangCode === lang.code;

            // Get completion rate details
            const totalKeys = lang.stats?.total ?? 0;
            const completedKeys = lang.stats?.completed ?? 0;
            const completionPercent = Math.round(lang.completionRate * 100);

            return (
              <div
                key={lang.code}
                className="border-b last:border-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
              >
                {/* Header row (Click to expand) */}
                <div
                  onClick={() => handleToggleExpand(lang.code)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-500">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {lang.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({lang.code})
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                            Active
                          </span>
                        )}
                        {lang.isRuntime && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                            Runtime Import
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-450 dark:text-slate-500">
                    {lang.isRuntime && (
                      <button
                        onClick={(e) => handleDeleteLanguage(lang.code, e)}
                        className="p-1 rounded hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors mr-1"
                        title="Delete custom language"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/50 space-y-4 animate-in slide-in-from-top-1 duration-150">
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-650 dark:text-slate-400">
                        <span>Completion Rate</span>
                        <span>
                          {completionPercent}% ({completedKeys}/{totalKeys}{" "}
                          keys)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>

                    {lang.maintainers && lang.maintainers.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                          Contributors & Maintainers
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {lang.maintainers.map((m, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                            >
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {m.name}
                                </span>{" "}
                                ({m.role}) -{" "}
                                <a
                                  href={m.github}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-500 hover:underline"
                                >
                                  {m.github}
                                </a>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isActive && (
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => handleApplyLanguage(lang.code)}
                          className="bg-sky-500 hover:bg-sky-600 text-white text-xs py-1.5 px-4"
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          <span>Apply Language</span>
                        </Button>
                      </div>
                    )}
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
