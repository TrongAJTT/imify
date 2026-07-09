"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Terminal,
  ArrowLeft,
  ChevronRight,
  Download,
  PowerOff,
  X,
  Gauge,
  Languages,
  HelpCircle,
  Database,
} from "lucide-react";
import { useToast } from "@imify/core/hooks/use-toast";
import { ToastContainer } from "@imify/ui/components/toast-container";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import { ToggleSwitchLabel } from "@imify/ui/ui/toggle-switch-label";
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header";
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header";
import { Subheading, BodyText, MutedText } from "@imify/ui/ui/typography";
import { useDevModeEnabled } from "../dev-mode/dev-mode-storage";
import { useDevModeStore } from "../dev-mode/dev-mode-store";
import { I18nRuntimeImportDialog } from "../dev-mode/i18n-runtime-import-dialog";
import { I18nTemplateDialog } from "../dev-mode/i18n-template-dialog";
import { DevModeExportDialog } from "../dev-mode/dev-mode-export-dialog";
import { DevModeImportDialog } from "../dev-mode/dev-mode-import-dialog";
import { DevModeStateViewer } from "../dev-mode/dev-mode-state-viewer";
import { RuntimeConsoleMonitor } from "../dev-mode/runtime-console-monitor";
import { LocalStorageManager } from "../dev-mode/local-storage-manager";
import { BrowserCapabilitiesDashboard } from "../dev-mode/browser-capabilities";
import { setRuntimeLogCaptureEnabled } from "../dev-mode/runtime-log-collector";
import type { OptionsTab } from "../dev-mode/debug-shared";
import type { DevModeSettingsAdapter } from "../dev-mode/dev-mode-settings-adapter";
import type { WorkspaceLayoutPreferences } from "./layout-preferences";
import {
  normalizePerformancePreferences,
  type PerformancePreferences,
} from "../processor/performance-preferences";
import { SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX } from "./desktop-layout";
import { LanguageItemCard } from "./language-item-card";
import { useI18nStore } from "@imify/stores";
import {
  getAvailableLanguages,
  getAppI18nVersion,
  deleteRuntimeLanguage,
  exportLanguageAsZip,
  exportEnglishBundleAsZip,
  type LanguageInfo,
} from "@imify/i18n";

const DEFAULT_ACTIVE_CLASS =
  "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm ring-1 ring-slate-300 dark:ring-slate-700";
const DEFAULT_INACTIVE_CLASS =
  "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200";

export interface DevToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  devModeSettingsAdapter?: DevModeSettingsAdapter;
  devModeActiveTab?: OptionsTab | null;
  layoutPreferences: WorkspaceLayoutPreferences;
  performancePreferences: PerformancePreferences;
}

export function DevToolsDialog({
  isOpen,
  onClose,
  devModeSettingsAdapter,
  devModeActiveTab = null,
  layoutPreferences,
  performancePreferences,
}: DevToolsDialogProps) {
  const [devModeEnabled, setDevModeEnabled] = useDevModeEnabled();
  const [activeTab, setActiveTab] = useState<
    | "about"
    | "system"
    | "console"
    | "capabilities"
    | "language"
    | "storage"
    | null
  >("about");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isI18nImportDialogOpen, setIsI18nImportDialogOpen] = useState(false);
  const [isI18nTemplateDialogOpen, setIsI18nTemplateDialogOpen] =
    useState(false);
  const [isMobileDialog, setIsMobileDialog] = useState(false);

  const showI18nDebugKeys = useDevModeStore((state) => state.showI18nDebugKeys);
  const setShowI18nDebugKeys = useDevModeStore(
    (state) => state.setShowI18nDebugKeys,
  );
  const { toasts, hide, success, error } = useToast();

  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [expandedLangCode, setExpandedLangCode] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>("");
  const activeLanguage = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  useEffect(() => {
    if (isOpen) {
      setLanguages(getAvailableLanguages());
      setAppVersion(getAppI18nVersion());
    }
  }, [activeLanguage, isOpen]);

  const handleToggleExpand = (code: string) => {
    setExpandedLangCode((prev) => (prev === code ? null : code));
  };

  const handleRequestDelete = async (
    lang: LanguageInfo,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete custom language "${lang.name}"?` +
        "\n\n" +
        "This will permanently delete it from local storage.",
    );
    if (!confirmed) return;
    try {
      await deleteRuntimeLanguage(lang.code);
      if (activeLanguage === lang.code) {
        setLanguage("en");
      } else {
        setLanguages(getAvailableLanguages());
      }
      success("Language Deleted", `Successfully removed ${lang.name}.`);
    } catch (err) {
      console.error("Failed to delete custom language:", err);
    }
  };

  const handleExportLanguage = async (
    lang: LanguageInfo,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      const zipData = await exportLanguageAsZip(lang.code);
      if (!zipData) {
        error("Export Failed", "Language data not found.");
        return;
      }
      const blob = new Blob([zipData as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imify-locale-${lang.code}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      success(
        "Language Exported",
        `Successfully downloaded ${lang.name} zip file.`,
      );
    } catch (err) {
      console.error("Failed to export language:", err);
    }
  };

  const downloadEnglishBundle = () => {
    try {
      const zip = exportEnglishBundleAsZip();
      const blob = new Blob([zip as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imify-locale-en-v${appVersion}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      success(
        "Bundle Downloaded",
        "English locale bundle downloaded successfully.",
      );
    } catch (err) {
      console.error("Failed to export English bundle:", err);
      error("Export Failed", "Could not export the English bundle.");
    }
  };

  const safePerformancePreferences = normalizePerformancePreferences(
    performancePreferences,
  );

  useEffect(() => {
    if (!isOpen) {
      if (isMobileDialog) setActiveTab(null);
      return;
    }
    if (!isMobileDialog) {
      setActiveTab("about");
    } else {
      setActiveTab(null);
    }
  }, [isOpen, isMobileDialog]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(
      `(max-width: ${SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX}px)`,
    );
    const update = () => setIsMobileDialog(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setRuntimeLogCaptureEnabled(devModeEnabled);
  }, [devModeEnabled]);

  const handleDisableDevMode = async () => {
    await setDevModeEnabled(false);
    onClose();
  };

  if (!devModeEnabled) return null;

  const tabs = [
    {
      id: "about" as const,
      label: "About Dev Tools",
      description: "Information about developer settings and control switch",
      icon: HelpCircle,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-amber-600 dark:text-amber-400",
      bgClassName: "bg-amber-50 dark:bg-amber-900/40",
    },
    {
      id: "system" as const,
      label: "System Monitor",
      description: "Live state diagnostics and logs import/export",
      icon: Activity,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-violet-600 dark:text-violet-400",
      bgClassName: "bg-violet-50 dark:bg-violet-900/40",
    },
    {
      id: "console" as const,
      label: "Console Monitor",
      description: "Real-time console logging and debugger",
      icon: Terminal,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-indigo-650 dark:text-indigo-400",
      bgClassName: "bg-indigo-50 dark:bg-indigo-900/40",
    },
    {
      id: "storage" as const,
      label: "Storage Manager",
      description: "Direct Local Storage management and data editing",
      icon: Database,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-emerald-600 dark:text-emerald-400",
      bgClassName: "bg-emerald-50 dark:bg-emerald-900/40",
    },
    {
      id: "language" as const,
      label: "Language Tools",
      description: "i18n debugging and custom locales management",
      icon: Languages,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-teal-650 dark:text-teal-400",
      bgClassName: "bg-teal-50 dark:bg-teal-900/40",
    },
    {
      id: "capabilities" as const,
      label: "Capabilities",
      description: "Browser feature detection and API support",
      icon: Gauge,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-sky-600 dark:text-sky-400",
      bgClassName: "bg-sky-50 dark:bg-sky-900/40",
    },
  ];

  return (
    <>
      <BaseDialog
        isOpen={isOpen}
        onClose={onClose}
        contentClassName={
          isMobileDialog
            ? "relative flex h-[calc(100dvh-2rem)] w-full overflow-hidden rounded-xl flex-col"
            : "relative flex h-[720px] w-full min-h-0 overflow-hidden rounded-xl"
        }
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-20 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
          aria-label="Close developer tools dialog"
        >
          <X size={18} />
        </Button>

        <div
          className={`shrink-0 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
            isMobileDialog
              ? "w-full border-b border-r-0 pb-2 pt-2"
              : "w-56 border-r pt-6 pb-4"
          }`}
        >
          <div className={`px-4 ${isMobileDialog ? "mb-1" : "mb-6"}`}>
            {isMobileDialog && activeTab ? (
              <div className="flex items-center gap-3 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveTab(null)}
                  className="rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
                  aria-label="Back to tools list"
                >
                  <ArrowLeft size={20} />
                </Button>
                <div className="flex flex-col min-w-0">
                  <Subheading className="text-lg font-bold text-slate-850 dark:text-slate-100 leading-tight truncate">
                    {tabs.find((t) => t.id === activeTab)?.label}
                  </Subheading>
                  <MutedText className="text-[10px] leading-tight truncate pr-4">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </MutedText>
                </div>
              </div>
            ) : (
              <div className={isMobileDialog ? "h-10 flex items-center" : ""}>
                <Subheading className="text-xl font-bold text-slate-850 dark:text-slate-100">
                  Dev Tools
                </Subheading>
              </div>
            )}
          </div>

          {(!isMobileDialog || !activeTab) && (
            <nav
              className={`flex-1 px-3 ${
                isMobileDialog ? "space-y-3 pb-6 pt-2" : "space-y-1"
              }`}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center rounded-lg transition-all ${
                    isMobileDialog
                      ? "w-full gap-3 p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shadow-sm"
                      : "w-full gap-3 px-3 py-2"
                  } ${
                    activeTab === tab.id
                      ? tab.activeClassName
                      : tab.inactiveClassName
                  }`}
                >
                  <div
                    className={`${isMobileDialog ? `rounded-lg ${tab.bgClassName} p-2 shadow-sm ${tab.iconClassName}` : tab.iconClassName}`}
                  >
                    <tab.icon size={isMobileDialog ? 18 : 16} />
                  </div>
                  <div className="flex-1 text-left">
                    <BodyText
                      className={`font-semibold ${
                        activeTab === tab.id
                          ? isMobileDialog
                            ? ""
                            : "text-slate-900 dark:text-slate-50"
                          : "!text-slate-800 dark:!text-slate-100"
                      }`}
                    >
                      {tab.label}
                    </BodyText>
                    {isMobileDialog && (
                      <MutedText className="text-[10px] leading-tight">
                        {tab.description}
                      </MutedText>
                    )}
                  </div>
                  {isMobileDialog && (
                    <ChevronRight size={16} className="text-slate-300" />
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>

        {(!isMobileDialog || activeTab) && (
          <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-white dark:bg-slate-900">
            <div
              className={`flex-1 min-h-0 min-w-0 overflow-y-auto ${isMobileDialog ? "p-4 pt-5 pb-10" : "p-8 pt-12"}`}
            >
              {activeTab === "about" ? (
                <div className="animate-in fade-in duration-300 space-y-6">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="ABOUT DEVELOPER TOOLS"
                      description="Welcome to the developer console. Learn about features and toggle settings."
                    />
                  )}

                  <section className="space-y-4">
                    <SettingsItemHeader
                      title="What is Developer Mode?"
                      description="Developer Mode grants access to diagnostics, capabilities mapping, dynamic logs, and custom locale management tools."
                    />
                    <div className="prose dark:prose-invert text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                      <p>
                        This dashboard allows you to explore real-time reactive
                        Zustand stores, inspect live stdout/stderr console
                        prints, import/export system logs to facilitate
                        debugging, and test localization templates.
                      </p>
                      <p>
                        Imify handles all operations locally on your machine,
                        ensuring data privacy is preserved while providing these
                        developer monitors.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title="DISABLE DEVELOPER MODE"
                      description="Hide developer tools and disable debug features. Re-enable via the About dialog Easter Egg."
                    />
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 rounded-lg border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={handleDisableDevMode}
                    >
                      <PowerOff size={14} />
                      Disable Developer Mode
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === "system" ? (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="SYSTEM MONITOR"
                      description="Inspect reactive store state, monitor logs, and export/import runtime diagnostics."
                    />
                  )}

                  {devModeSettingsAdapter && (
                    <section className="space-y-4">
                      <SettingsItemHeader
                        title="STATE DIAGNOSTICS"
                        description="Explore real-time state parameters for active features."
                      />
                      <DevModeStateViewer
                        activeTab={devModeActiveTab}
                        settingsAdapter={devModeSettingsAdapter}
                      />

                      <SettingsItemHeader
                        title="BACKUP DIAGNOSTIC LOGS"
                        description="Export local settings and store states to a JSON file, or restore from a backup."
                      />
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <Button
                          variant="outline"
                          className="justify-start gap-2 rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          onClick={() => setIsExportDialogOpen(true)}
                        >
                          <Download size={14} />
                          Export System Log
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start gap-2 rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          onClick={() => setIsImportDialogOpen(true)}
                        >
                          <Download size={14} className="rotate-180" />
                          Import System Log
                        </Button>
                      </div>
                    </section>
                  )}
                </div>
              ) : null}

              {activeTab === "language" ? (
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
                    <ToggleSwitchLabel
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
              ) : null}

              {activeTab === "capabilities" ? (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="BROWSER CAPABILITIES"
                      description="Detected hardware and software feature support for the current environment."
                    />
                  )}

                  <BrowserCapabilitiesDashboard />
                </div>
              ) : null}

              {activeTab === "console" ? (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="CONSOLE MONITOR"
                      description="Real-time capture of the runtime console output for simplified debugging."
                    />
                  )}

                  <section className="space-y-4">
                    <SettingsItemHeader
                      title="RUNTIME CONSOLE LOGS"
                      description="Displays stdout/stderr console prints captured within the local context."
                    />
                    <RuntimeConsoleMonitor />
                  </section>
                </div>
              ) : null}

              {activeTab === "storage" ? (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="LOCALSTORAGE MANAGER"
                      description="Read, search, add, edit, and delete application settings saved directly in localStorage."
                    />
                  )}

                  <LocalStorageManager />
                </div>
              ) : null}
            </div>
          </div>
        )}
        <ToastContainer toasts={toasts} onRemove={hide} />
      </BaseDialog>

      {devModeSettingsAdapter && (
        <>
          <DevModeExportDialog
            isOpen={isExportDialogOpen}
            onClose={() => setIsExportDialogOpen(false)}
            activeTab={devModeActiveTab}
            performancePreferences={safePerformancePreferences}
            layoutPreferences={layoutPreferences}
            settingsAdapter={devModeSettingsAdapter}
            isDevMode={true}
          />
          <DevModeImportDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            activeTab={devModeActiveTab}
            performancePreferences={safePerformancePreferences}
            layoutPreferences={layoutPreferences}
            settingsAdapter={devModeSettingsAdapter}
            onSuccess={() =>
              success("Import successful", "State has been restored.", 3000)
            }
          />
          <I18nRuntimeImportDialog
            isOpen={isI18nImportDialogOpen}
            onClose={() => setIsI18nImportDialogOpen(false)}
            onSuccess={(meta) =>
              success(
                "Language loaded successfully",
                `Loaded custom language ${meta.languageName} (${meta.languageCode}) at runtime.`,
                3000,
              )
            }
          />
          <I18nTemplateDialog
            isOpen={isI18nTemplateDialogOpen}
            onClose={() => setIsI18nTemplateDialogOpen(false)}
            onSuccess={() =>
              success(
                "Template generated",
                "Empty translation JSON template has been downloaded.",
                3000,
              )
            }
          />
        </>
      )}
    </>
  );
}
