"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Database,
  Download,
  Gauge,
  Globe,
  History,
  Keyboard,
  ListTree,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { APP_CONFIG } from "@imify/core/config";
import { useToast } from "@imify/core/hooks/use-toast";
import { useBatchStore } from "@imify/stores/stores/batch-store";
import { useUnifiedPresetStats } from "../shared/unified-preset-manager";
import { useAssetStatistics } from "./asset-management-dialog";
import { ToastContainer } from "@imify/ui/components/toast-container";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import {
  CheckboxCard,
  DiscreteSlider,
  type DiscreteSliderOption,
  NumberInput,
  SelectInput,
  ToggleSwitch,
  SettingsItemHeader,
  SettingsSectionHeader,
  Subheading,
  BodyText,
  MutedText,
} from "@imify/ui";
import {
  CONFIGURATION_SIDEBAR_MAX_PERCENT,
  CONFIGURATION_SIDEBAR_WIDTH_OPTIONS,
  NAVIGATION_SIDEBAR_WIDTH_OPTIONS,
  type SidebarWidthLevel,
  type WorkspaceLayoutPreferences,
} from "./layout-preferences";
import {
  detectHardwareProfile,
  normalizePerformancePreferences,
  type PerformancePreferences,
} from "../processor/performance-preferences";
import { DevModeExportDialog } from "../dev-mode/dev-mode-export-dialog";
import { DevModeImportDialog } from "../dev-mode/dev-mode-import-dialog";
import type { DevModeSettingsAdapter } from "../dev-mode/dev-mode-settings-adapter";
import { SettingsShortcutsPanel } from "./settings-shortcuts-panel";
import { LanguageSettingsTab } from "./language-settings-tab";
import { useTranslation } from "@imify/i18n";

const DEFAULT_ACTIVE_CLASS =
  "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm ring-1 ring-slate-300 dark:ring-slate-700";
const DEFAULT_INACTIVE_CLASS =
  "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200";
import type { WorkspaceSettingsDialogTab } from "@imify/stores/stores/workspace-settings-dialog-store";
import { SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX } from "./desktop-layout";

export type SettingsDialogTab = WorkspaceSettingsDialogTab;

export interface WorkspaceDefaultScreenOption {
  value: string;
  label: string;
}

interface WorkspaceSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsDialogTab | null;
  defaultScreenValue: string;
  defaultScreenOptions: WorkspaceDefaultScreenOption[];
  onChangeDefaultScreenValue: (value: string) => void;
  showExtensionOnlyOptions?: boolean;
  preferRecentPresetEntry: boolean;
  onChangePreferRecentPresetEntry: (checked: boolean) => void;
  usageEntries: Array<{ id: string; name: string; count: number }>;
  onResetUsageStats: () => void;
  layoutPreferences: WorkspaceLayoutPreferences;
  onChangeNavigationSidebarLevel: (level: SidebarWidthLevel) => void;
  onChangeConfigurationSidebarLevel: (level: SidebarWidthLevel) => void;
  performancePreferences: PerformancePreferences;
  onChangePerformancePreferences: (value: PerformancePreferences) => void;
  enableUsageStatsTab?: boolean;
  devModeSettingsAdapter?: DevModeSettingsAdapter;
}

export function WorkspaceSettingsDialog({
  isOpen,
  onClose,
  initialTab = "general",
  defaultScreenValue,
  defaultScreenOptions,
  onChangeDefaultScreenValue,
  showExtensionOnlyOptions = false,
  preferRecentPresetEntry,
  onChangePreferRecentPresetEntry,
  usageEntries,
  onResetUsageStats,
  layoutPreferences,
  onChangeNavigationSidebarLevel,
  onChangeConfigurationSidebarLevel,
  performancePreferences,
  onChangePerformancePreferences,
  enableUsageStatsTab = true,
  devModeSettingsAdapter,
}: WorkspaceSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsDialogTab | null>(
    initialTab,
  );
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const unifiedPresetStats = useUnifiedPresetStats();

  const schemaVersion = useBatchStore((state) => state.schemaVersion ?? 1);
  const migrateSchemaToV2 = useBatchStore((state) => state.migrateSchemaToV2);
  const assetStats = useAssetStatistics(isOpen);

  const [stats, setStats] = useState({
    sizeKb: 0,
    storeCount: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let size = 0;
    let storeCount = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("imify-")) {
        size += (window.localStorage.getItem(key) ?? "").length * 2;
        storeCount++;
      }
    }

    setStats({
      sizeKb: Math.round((size / 1024) * 10) / 10,
      storeCount,
    });
  }, []);

  const handleMigrateSchema = () => {
    try {
      migrateSchemaToV2();
      success(
        t("data.migrateSuccessTitle"),
        t("data.migrateSuccessDesc"),
        3000,
      );
    } catch (err: any) {
      error(
        t("data.migrateErrorTitle"),
        err.message || t("data.migrateErrorDesc"),
        15000,
      );
    }
  };
  const [isMobileDialog, setIsMobileDialog] = useState(false);
  const { toasts, hide, success, error } = useToast();

  const skipDownloadConfirm = useBatchStore(
    (state) => state.skipDownloadConfirm,
  );
  const setSkipDownloadConfirm = useBatchStore(
    (state) => state.setSkipDownloadConfirm,
  );
  const skipOomWarning = useBatchStore((state) => state.skipOomWarning);
  const setSkipOomWarning = useBatchStore((state) => state.setSkipOomWarning);
  const skipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.skipSplicingHeavyPreviewQualityWarning,
  );
  const setSkipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.setSkipSplicingHeavyPreviewQualityWarning,
  );

  useEffect(() => {
    if (!isOpen) {
      if (isMobileDialog) setActiveTab(null);
      return;
    }
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (!isMobileDialog) {
      setActiveTab("general");
    } else {
      setActiveTab(null);
    }
  }, [initialTab, isOpen, isMobileDialog]);

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

  const { t } = useTranslation(["settings", "common"]);

  const navigationWidthSliderOptions = useMemo<DiscreteSliderOption[]>(
    () =>
      NAVIGATION_SIDEBAR_WIDTH_OPTIONS.map((option) => ({
        value: option.level,
        label: option.label,
      })),
    [],
  );
  const configurationWidthSliderOptions = useMemo<DiscreteSliderOption[]>(
    () =>
      CONFIGURATION_SIDEBAR_WIDTH_OPTIONS.map((option) => ({
        value: option.level,
        label: option.label,
      })),
    [],
  );

  const navigationWidthPx =
    NAVIGATION_SIDEBAR_WIDTH_OPTIONS.find(
      (option) => option.level === layoutPreferences.navigationSidebarLevel,
    )?.widthPx ?? NAVIGATION_SIDEBAR_WIDTH_OPTIONS[1].widthPx;
  const configurationWidthPx =
    CONFIGURATION_SIDEBAR_WIDTH_OPTIONS.find(
      (option) => option.level === layoutPreferences.configurationSidebarLevel,
    )?.widthPx ?? CONFIGURATION_SIDEBAR_WIDTH_OPTIONS[1].widthPx;

  const safePerformancePreferences = normalizePerformancePreferences(
    performancePreferences,
  );
  const advisorEnabled = safePerformancePreferences.smartAdvisorEnabled;
  const overclockEnabled = safePerformancePreferences.allowConcurrencyOverclock;
  const hardwareProfile = safePerformancePreferences.hardwareProfile;

  const updatePerformancePreferences = (next: PerformancePreferences) => {
    onChangePerformancePreferences(normalizePerformancePreferences(next));
  };

  const updateHardwareProfile = (
    updates: Partial<PerformancePreferences["hardwareProfile"]>,
  ) => {
    updatePerformancePreferences({
      ...safePerformancePreferences,
      hardwareProfile: {
        ...safePerformancePreferences.hardwareProfile,
        ...updates,
        source: "manual",
      },
    });
  };

  const tabs = [
    {
      id: "general" as const,
      label: t("tabs.general"),
      description: t("general.sectionDesc"),
      icon: ListTree,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-sky-600 dark:text-sky-400",
      bgClassName: "bg-sky-50 dark:bg-sky-500/10",
    },
    {
      id: "language" as const,
      label: t("tabs.language"),
      description: t("language.sectionDesc"),
      icon: Globe,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-teal-600 dark:text-teal-400",
      bgClassName: "bg-teal-50 dark:bg-teal-500/10",
    },
    {
      id: "shortcuts" as const,
      label: t("tabs.shortcuts"),
      description: t("shortcuts.sectionDesc"),
      icon: Keyboard,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-indigo-600 dark:text-indigo-400",
      bgClassName: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      id: "performance" as const,
      label: t("tabs.performance"),
      description: t("performance.sectionDesc"),
      icon: Gauge,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-emerald-600 dark:text-emerald-400",
      bgClassName: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      id: "warnings" as const,
      label: t("tabs.warnings"),
      description: t("warnings.sectionDesc"),
      icon: ShieldAlert,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-amber-600 dark:text-amber-400",
      bgClassName: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      id: "usage" as const,
      label: t("tabs.usage"),
      description: t("usage.sectionDesc"),
      icon: BarChart3,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-cyan-600 dark:text-cyan-400",
      bgClassName: "bg-cyan-50 dark:bg-cyan-500/10",
      hidden: !enableUsageStatsTab,
    },
    {
      id: "data" as const,
      label: t("tabs.data"),
      description: t("data.sectionDesc"),
      icon: Database,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-teal-600 dark:text-teal-400",
      bgClassName: "bg-teal-50 dark:bg-teal-900/40",
    },
  ].filter((tab) => !tab.hidden);

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
          aria-label="Close settings dialog"
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
                  aria-label={t("common:back")}
                >
                  <ArrowLeft size={20} />
                </Button>
                <div className="flex flex-col min-w-0">
                  <Subheading className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                    {tabs.find((t) => t.id === activeTab)?.label}
                  </Subheading>
                  <MutedText className="text-[10px] leading-tight truncate pr-4">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </MutedText>
                </div>
              </div>
            ) : (
              <div className={isMobileDialog ? "h-10 flex items-center" : ""}>
                <Subheading className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {t("title")}
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
                          : (tab as any).labelClassName ||
                            "!text-slate-800 dark:!text-slate-100"
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
              {activeTab === "general" ? (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title={t("general.sectionTitle")}
                      description={t("general.sectionDesc")}
                    />
                  )}
                  <section className="space-y-4">
                    <SettingsItemHeader
                      title={t("general.defaultScreen")}
                      description={t("general.defaultScreenDesc")}
                    />
                    <SelectInput
                      label={t("general.defaultScreenLabel")}
                      value={defaultScreenValue}
                      options={defaultScreenOptions}
                      onChange={onChangeDefaultScreenValue}
                      disabled={!showExtensionOnlyOptions}
                    />
                    <CheckboxCard
                      title={t("general.preferRecentPreset")}
                      subtitle={t("general.preferRecentPresetDesc")}
                      icon={<History size={14} />}
                      checked={preferRecentPresetEntry}
                      onChange={onChangePreferRecentPresetEntry}
                    />
                  </section>

                  <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title={t("general.layoutTitle")}
                      description={t("general.layoutDesc")}
                    />
                    {showExtensionOnlyOptions && (
                      <DiscreteSlider
                        label={t("general.navWidthLabel")}
                        value={layoutPreferences.navigationSidebarLevel}
                        options={navigationWidthSliderOptions}
                        onChange={(value) =>
                          onChangeNavigationSidebarLevel(
                            value as SidebarWidthLevel,
                          )
                        }
                        valueFormatter={(option) =>
                          `${option.label} (${navigationWidthPx}px)`
                        }
                        disabled={!showExtensionOnlyOptions}
                      />
                    )}
                    <DiscreteSlider
                      label={t("general.configWidthLabel")}
                      value={layoutPreferences.configurationSidebarLevel}
                      options={configurationWidthSliderOptions}
                      onChange={(value) =>
                        onChangeConfigurationSidebarLevel(
                          value as SidebarWidthLevel,
                        )
                      }
                      valueFormatter={(option) =>
                        isMobileDialog
                          ? t("general.configWidthFormatter", {
                              label: option.label,
                              width: configurationWidthPx,
                            })
                          : t("general.configWidthFormatterPercent", {
                              label: option.label,
                              width: configurationWidthPx,
                              percent: CONFIGURATION_SIDEBAR_MAX_PERCENT,
                            })
                      }
                    />
                  </section>
                </div>
              ) : null}

              {activeTab === "language" && (
                <LanguageSettingsTab isMobile={isMobileDialog} />
              )}

              {activeTab === "shortcuts" && (
                <SettingsShortcutsPanel isMobile={isMobileDialog} />
              )}

              {activeTab === "performance" && (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title={t("performance.sectionTitle", "Performance")}
                      description={t("performance.sectionDesc")}
                    />
                  )}
                  <section className="space-y-4">
                    <SettingsItemHeader
                      title={t("performance.advisorTitle")}
                      description={t("performance.advisorDesc")}
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      {t("performance.privacyNote")}
                    </div>
                    <ToggleSwitch
                      label={t("performance.enableAdvisor")}
                      description={t("performance.enableAdvisorDesc")}
                      checked={advisorEnabled}
                      onChange={(checked) =>
                        updatePerformancePreferences({
                          ...safePerformancePreferences,
                          smartAdvisorEnabled: checked,
                        })
                      }
                    />
                    <ToggleSwitch
                      label={t("performance.unlockConcurrency")}
                      description={t("performance.unlockConcurrencyDesc")}
                      checked={overclockEnabled}
                      onChange={(checked) =>
                        updatePerformancePreferences({
                          ...safePerformancePreferences,
                          allowConcurrencyOverclock: checked,
                        })
                      }
                      colorWhenEnabled="amber"
                    />
                    {advisorEnabled && (
                      <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <BodyText className="font-semibold text-slate-800 dark:text-slate-200">
                              {t("performance.hardwareProfile")}
                            </BodyText>
                            <MutedText className="text-xs">
                              {t("performance.sourceLabel", {
                                source:
                                  hardwareProfile.source === "detected"
                                    ? t("performance.sourceAuto")
                                    : hardwareProfile.source === "manual"
                                      ? t("performance.sourceManual")
                                      : t("performance.sourceFallback"),
                              })}
                            </MutedText>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const detected = detectHardwareProfile();
                              updatePerformancePreferences({
                                ...safePerformancePreferences,
                                hardwareProfile: detected,
                              });
                            }}
                          >
                            {t("performance.autoDetect")}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <NumberInput
                            label={t("performance.cpuCores")}
                            value={hardwareProfile.cpuCores}
                            min={1}
                            max={64}
                            step={1}
                            onChangeValue={(nextValue) => {
                              updateHardwareProfile({ cpuCores: nextValue });
                            }}
                          />

                          <NumberInput
                            label={t("performance.ramBudget")}
                            value={hardwareProfile.ramBudgetGb}
                            min={0.5}
                            max={64}
                            step={0.5}
                            onChangeValue={(nextValue) => {
                              updateHardwareProfile({ ramBudgetGb: nextValue });
                            }}
                          />
                        </div>

                        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                          {t("performance.detectedHardware", {
                            cores:
                              hardwareProfile.detectedLogicalCores ??
                              hardwareProfile.cpuCores,
                            ram:
                              hardwareProfile.detectedDeviceMemoryGb ??
                              t("performance.detectedHardwareUnknown"),
                          })}
                        </div>
                      </div>
                    )}

                    {!advisorEnabled && (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800 dark:border-sky-900/50 dark:bg-slate-950/30 dark:text-sky-300">
                        {t("performance.modeStatic")}
                      </div>
                    )}

                    {overclockEnabled ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-800 dark:border-rose-900/50 dark:bg-slate-950/30 dark:text-rose-300">
                        {t("performance.modeDanger")}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800 dark:border-emerald-900/50 dark:bg-slate-950/30 dark:text-emerald-300">
                        {t("performance.modeSafe")}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === "warnings" && (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title={t("warnings.sectionTitle", "Warnings")}
                      description={t("warnings.sectionDesc")}
                    />
                  )}
                  <section className="space-y-4">
                    <SettingsItemHeader
                      title={t("warnings.preferencesTitle", "PREFERENCES")}
                      description={t("warnings.preferencesDesc")}
                    />
                    <div className="space-y-2">
                      <ToggleSwitch
                        label={t("warnings.downloadConfirm")}
                        description={t("warnings.downloadConfirmDesc", {
                          threshold:
                            APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD,
                        })}
                        checked={!skipDownloadConfirm}
                        onChange={(checked) => setSkipDownloadConfirm(!checked)}
                      />
                      <ToggleSwitch
                        label={t("warnings.oomWarning")}
                        description={t("warnings.oomWarningDesc", {
                          threshold: APP_CONFIG.BATCH.OOM_WARNING_MB,
                        })}
                        checked={!skipOomWarning}
                        onChange={(checked) => setSkipOomWarning(!checked)}
                      />
                      <ToggleSwitch
                        label={t("warnings.heavyPreviewWarning")}
                        description={t("warnings.heavyPreviewWarningDesc", {
                          count:
                            APP_CONFIG.SPLICING
                              .HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT,
                          pixels:
                            APP_CONFIG.SPLICING
                              .HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS /
                            1_000_000,
                        })}
                        checked={!skipSplicingHeavyPreviewQualityWarning}
                        onChange={(checked) =>
                          setSkipSplicingHeavyPreviewQualityWarning(!checked)
                        }
                      />
                    </div>
                  </section>
                </div>
              )}

              {enableUsageStatsTab && activeTab === "usage" && (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title={t("usage.sectionTitle", "Usage Stats")}
                      description={t("usage.sectionDesc")}
                    />
                  )}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <SettingsItemHeader
                        title={t("usage.frequencyTitle", "FREQUENCY DATA")}
                        description={t("usage.frequencyDesc")}
                      />
                      <Button
                        variant="outline"
                        className="rounded-lg border-slate-200 dark:border-slate-700"
                        onClick={onResetUsageStats}
                      >
                        <RotateCcw size={14} />
                        {t("usage.reset", "Reset")}
                      </Button>
                    </div>
                    <div className="overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      {usageEntries.length ? (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                          {usageEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between px-4 py-3"
                            >
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate pr-3">
                                {entry.name}
                              </span>
                              <span className="text-xs font-semibold rounded-md px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                {entry.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                          {t("usage.noData", "No usage data yet.")}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "data" ? (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title={t("data.sectionTitle", "Data Management")}
                      description={t("data.sectionDesc")}
                    />
                  )}

                  <section className="space-y-4">
                    <SettingsItemHeader
                      title={t("data.statsTitle", "DATA STATISTICS")}
                      description={t("data.statsDesc")}
                    />
                    <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.totalPresets")}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {unifiedPresetStats.totalCount}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.persistedStores")}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {stats.storeCount}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.storageUsed")}
                        </span>
                        <span className="text-2xl font-bold text-slate-850 dark:text-slate-100">
                          {stats.sizeKb}{" "}
                          <span className="text-xs font-semibold text-slate-500">
                            KB
                          </span>
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title={t("data.assetStatsTitle")}
                      description={t("data.assetStatsDesc")}
                    />
                    <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.savedWatermarks")}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {assetStats.watermarkCount}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.cachedModels")}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {assetStats.cachedModelCount}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.storageOccupied")}
                        </span>
                        <span className="text-2xl font-bold text-slate-850 dark:text-slate-100">
                          {assetStats.totalSizeFormatted}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.googleFonts")}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {assetStats.googleFontCount}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.customFonts")}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {assetStats.customFontCount}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("data.storageOccupied")}
                        </span>
                        <span className="text-2xl font-bold text-slate-850 dark:text-slate-100">
                          {assetStats.fontSizeFormatted}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title={t("data.backupRestoreTitle", "BACKUP & RESTORE")}
                      description={t("data.backupRestoreDesc")}
                    />
                    {devModeSettingsAdapter && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <Button
                          variant="outline"
                          className="justify-start gap-2 rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          onClick={() => setIsExportDialogOpen(true)}
                        >
                          <Download size={14} />
                          {t("data.exportData", "Export Data")}
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start gap-2 rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          onClick={() => setIsImportDialogOpen(true)}
                        >
                          <Download size={14} className="rotate-180" />
                          {t("data.importData")}
                        </Button>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title={t("data.schemaTitle")}
                      description={t("data.schemaDesc")}
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-705 dark:bg-slate-900/40">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <BodyText className="font-semibold text-slate-800 dark:text-slate-200">
                            {t("data.dbVersion")}
                          </BodyText>
                          <MutedText className="text-xs">
                            {t("data.dbVersionDesc", {
                              version:
                                schemaVersion === 2
                                  ? t("data.dbVersionV2")
                                  : t("data.dbVersionV1"),
                            })}
                          </MutedText>
                        </div>
                        {schemaVersion === 1 ? (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4"
                            onClick={handleMigrateSchema}
                          >
                            {t("data.migrateBtn")}
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50">
                            {t("data.schemaUpToDate")}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>
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
            activeTab={null}
            performancePreferences={safePerformancePreferences}
            layoutPreferences={layoutPreferences}
            settingsAdapter={devModeSettingsAdapter}
            title={t("data.exportTitle")}
            description={t("data.exportDesc")}
          />
          <DevModeImportDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            activeTab={null}
            performancePreferences={safePerformancePreferences}
            layoutPreferences={layoutPreferences}
            settingsAdapter={devModeSettingsAdapter}
            onSuccess={() =>
              success(
                t("data.importSuccessTitle"),
                t("data.importSuccessDesc"),
                3000,
              )
            }
            title={t("data.importTitle")}
            description={t("data.importDesc")}
          />
        </>
      )}
    </>
  );
}
