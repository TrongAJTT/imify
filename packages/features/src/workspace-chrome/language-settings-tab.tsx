"use client";

import React, { useState, useEffect } from "react";
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
import { LanguageItemCard } from "./language-item-card";

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
          {languages.map((lang) => (
            <LanguageItemCard
              key={lang.code}
              lang={lang}
              isActive={lang.code === activeLanguage}
              appVersion={appVersion}
              isExpanded={expandedLangCode === lang.code}
              onToggleExpand={handleToggleExpand}
              mode="settings"
              onApply={handleApplyLanguage}
              onDelete={handleRequestDelete}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
