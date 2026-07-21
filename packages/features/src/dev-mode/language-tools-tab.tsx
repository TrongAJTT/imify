"use client";

import React from "react";
import { Download, Languages } from "lucide-react";
import { Button, ToggleSwitch } from "@imify/ui";
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header";
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header";
import { LanguageItemCard } from "../workspace-chrome/language-item-card";
import type { LanguageInfo } from "@imify/i18n";

interface LanguageToolsTabProps {
  isMobileDialog: boolean;
  showI18nDebugKeys: boolean;
  setShowI18nDebugKeys: (checked: boolean) => void;
  setIsI18nTemplateDialogOpen: (open: boolean) => void;
  downloadEnglishBundle: () => void;
  setIsI18nImportDialogOpen: (open: boolean) => void;
  languages: LanguageInfo[];
  activeLanguage: string;
  appVersion: string;
  expandedLangCode: string | null;
  handleToggleExpand: (code: string) => void;
  handleRequestDelete: (
    lang: LanguageInfo,
    e: React.MouseEvent,
  ) => Promise<void>;
  handleExportLanguage: (
    lang: LanguageInfo,
    e: React.MouseEvent,
  ) => Promise<void>;
}

export function LanguageToolsTab({
  isMobileDialog,
  showI18nDebugKeys,
  setShowI18nDebugKeys,
  setIsI18nTemplateDialogOpen,
  downloadEnglishBundle,
  setIsI18nImportDialogOpen,
  languages,
  activeLanguage,
  appVersion,
  expandedLangCode,
  handleToggleExpand,
  handleRequestDelete,
  handleExportLanguage,
}: LanguageToolsTabProps) {
  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      {!isMobileDialog && (
        <SettingsSectionHeader
          title="LANGUAGE TOOLS"
          description="Developer tools for internationalization, testing localizations, and managing runtime translations."
        />
      )}

      <section className="space-y-4">
        <SettingsItemHeader
          title="TRANSLATION DEBUGGING"
          description="Toggle translation key decoration to locate text strings in locale bundles."
        />
        <ToggleSwitch
          label="Show i18n Debug Keys"
          description="Display translation keys next to strings in the UI to assist with localization."
          checked={showI18nDebugKeys}
          onChange={setShowI18nDebugKeys}
        />
      </section>

      <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
        <SettingsItemHeader
          title="CUSTOM LOCALES"
          description="Import new translation files or download a translation template JSON to contribute."
        />
        <div className="flex flex-col gap-3">
          <div className="flex-item grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <Button
              variant="outline"
              className="justify-start gap-2 rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              onClick={() => setIsI18nTemplateDialogOpen(true)}
            >
              <Download size={14} />
              New Empty Bundle
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2 rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              onClick={downloadEnglishBundle}
            >
              <Download size={14} />
              Download English Bundle
            </Button>
          </div>
          <Button
            variant="outline"
            className="flex-item justify-start gap-2 rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            onClick={() => setIsI18nImportDialogOpen(true)}
          >
            <Languages size={14} />
            Import Custom Language
          </Button>
        </div>

        {languages.filter((lang) => lang.isRuntime).length > 0 && (
          <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/20 mt-4">
            {languages
              .filter((lang) => lang.isRuntime)
              .map((lang) => (
                <LanguageItemCard
                  key={lang.code}
                  lang={lang}
                  isActive={lang.code === activeLanguage}
                  appVersion={appVersion}
                  isExpanded={expandedLangCode === lang.code}
                  onToggleExpand={handleToggleExpand}
                  mode="devtools"
                  onDelete={handleRequestDelete}
                  onExport={handleExportLanguage}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
