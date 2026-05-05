"use client"

import React from "react"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BarChart3, ChevronRight, Code2, Download, Gauge, Keyboard, ListTree, PowerOff, RotateCcw, ShieldAlert, X } from "lucide-react"
import { APP_CONFIG } from "@imify/core/config"
import { useToast } from "@imify/core/hooks/use-toast"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { ToastContainer } from "@imify/ui/components/toast-container"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { DiscreteSlider, type DiscreteSliderOption } from "@imify/ui/ui/discrete-slider"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { ToggleSwitchLabel } from "@imify/ui/ui/toggle-switch-label"
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header"
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header"
import { Subheading, BodyText, MutedText } from "@imify/ui/ui/typography"
import {
  CONFIGURATION_SIDEBAR_MAX_PERCENT,
  CONFIGURATION_SIDEBAR_WIDTH_OPTIONS,
  NAVIGATION_SIDEBAR_WIDTH_OPTIONS,
  type SidebarWidthLevel,
  type WorkspaceLayoutPreferences
} from "./layout-preferences"
import {
  detectHardwareProfile,
  normalizePerformancePreferences,
  type PerformancePreferences
} from "../processor/performance-preferences"
import { useDevModeEnabled } from "../dev-mode/dev-mode-storage"
import { DevModeExportDialog } from "../dev-mode/dev-mode-export-dialog"
import { DevModeImportDialog } from "../dev-mode/dev-mode-import-dialog"
import { DevModeStateViewer } from "../dev-mode/dev-mode-state-viewer"
import { RuntimeConsoleMonitor } from "../dev-mode/runtime-console-monitor"
import { setRuntimeLogCaptureEnabled } from "../dev-mode/runtime-log-collector"
import type { OptionsTab } from "../dev-mode/debug-shared"
import type { DevModeSettingsAdapter } from "../dev-mode/dev-mode-settings-adapter"
import { SettingsShortcutsPanel } from "./settings-shortcuts-panel"

const DEFAULT_ACTIVE_CLASS = "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm ring-1 ring-slate-300 dark:ring-slate-700"
const DEFAULT_INACTIVE_CLASS = "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
import type { WorkspaceSettingsDialogTab } from "@imify/stores/stores/workspace-settings-dialog-store"
import { SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX } from "./desktop-layout"

export type SettingsDialogTab = WorkspaceSettingsDialogTab

export interface WorkspaceDefaultScreenOption {
  value: string
  label: string
}

interface WorkspaceSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: SettingsDialogTab | null
  defaultScreenValue: string
  defaultScreenOptions: WorkspaceDefaultScreenOption[]
  onChangeDefaultScreenValue: (value: string) => void
  showExtensionOnlyOptions?: boolean
  preferRecentPresetEntry: boolean
  onChangePreferRecentPresetEntry: (checked: boolean) => void
  usageEntries: Array<{ id: string; name: string; count: number }>
  onResetUsageStats: () => void
  layoutPreferences: WorkspaceLayoutPreferences
  onChangeNavigationSidebarLevel: (level: SidebarWidthLevel) => void
  onChangeConfigurationSidebarLevel: (level: SidebarWidthLevel) => void
  performancePreferences: PerformancePreferences
  onChangePerformancePreferences: (value: PerformancePreferences) => void
  enableUsageStatsTab?: boolean
  devModeSettingsAdapter?: DevModeSettingsAdapter
  devModeActiveTab?: OptionsTab | null
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
  devModeActiveTab = null
}: WorkspaceSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsDialogTab | null>(initialTab)
  const [devModeEnabled, setDevModeEnabled] = useDevModeEnabled()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isMobileDialog, setIsMobileDialog] = useState(false)
  const { toasts, hide, success } = useToast()

  const skipDownloadConfirm = useBatchStore((state) => state.skipDownloadConfirm)
  const setSkipDownloadConfirm = useBatchStore((state) => state.setSkipDownloadConfirm)
  const skipOomWarning = useBatchStore((state) => state.skipOomWarning)
  const setSkipOomWarning = useBatchStore((state) => state.setSkipOomWarning)
  const skipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.skipSplicingHeavyPreviewQualityWarning
  )
  const setSkipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.setSkipSplicingHeavyPreviewQualityWarning
  )

  useEffect(() => {
    if (!isOpen) {
      if (isMobileDialog) setActiveTab(null)
      return
    }
    if (initialTab) {
      setActiveTab(initialTab)
    } else if (!isMobileDialog) {
      setActiveTab("general")
    } else {
      setActiveTab(null)
    }
  }, [initialTab, isOpen, isMobileDialog])

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia(`(max-width: ${SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX}px)`)
    const update = () => setIsMobileDialog(mediaQuery.matches)
    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    setRuntimeLogCaptureEnabled(devModeEnabled)
  }, [devModeEnabled])

  const navigationWidthSliderOptions = useMemo<DiscreteSliderOption[]>(
    () =>
      NAVIGATION_SIDEBAR_WIDTH_OPTIONS.map((option) => ({
        value: option.level,
        label: option.label
      })),
    []
  )
  const configurationWidthSliderOptions = useMemo<DiscreteSliderOption[]>(
    () =>
      CONFIGURATION_SIDEBAR_WIDTH_OPTIONS.map((option) => ({
        value: option.level,
        label: option.label
      })),
    []
  )

  const navigationWidthPx =
    NAVIGATION_SIDEBAR_WIDTH_OPTIONS.find(
      (option) => option.level === layoutPreferences.navigationSidebarLevel
    )?.widthPx ?? NAVIGATION_SIDEBAR_WIDTH_OPTIONS[1].widthPx
  const configurationWidthPx =
    CONFIGURATION_SIDEBAR_WIDTH_OPTIONS.find(
      (option) => option.level === layoutPreferences.configurationSidebarLevel
    )?.widthPx ?? CONFIGURATION_SIDEBAR_WIDTH_OPTIONS[1].widthPx

  const safePerformancePreferences = normalizePerformancePreferences(performancePreferences)
  const advisorEnabled = safePerformancePreferences.smartAdvisorEnabled
  const overclockEnabled = safePerformancePreferences.allowConcurrencyOverclock
  const hardwareProfile = safePerformancePreferences.hardwareProfile

  const updatePerformancePreferences = (next: PerformancePreferences) => {
    onChangePerformancePreferences(normalizePerformancePreferences(next))
  }

  const updateHardwareProfile = (
    updates: Partial<PerformancePreferences["hardwareProfile"]>
  ) => {
    updatePerformancePreferences({
      ...safePerformancePreferences,
      hardwareProfile: {
        ...safePerformancePreferences.hardwareProfile,
        ...updates,
        source: "manual"
      }
    })
  }

  const handleDisableDevMode = async () => {
    await setDevModeEnabled(false)
    setActiveTab(isMobileDialog ? null : "general")
  }
  const tabs = [
    {
      id: "general" as const,
      label: "General",
      description: "Core application behavior and interface defaults",
      icon: ListTree,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-sky-600 dark:text-sky-400",
      bgClassName: "bg-sky-50 dark:bg-sky-500/10"
    },
    {
      id: "shortcuts" as const,
      label: "Shortkeys",
      description: "Keyboard shortcuts for faster navigation",
      icon: Keyboard,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-indigo-600 dark:text-indigo-400",
      bgClassName: "bg-indigo-50 dark:bg-indigo-500/10"
    },
    {
      id: "performance" as const,
      label: "Performance",
      description: "Engine configuration and hardware utilization",
      icon: Gauge,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-emerald-600 dark:text-emerald-400",
      bgClassName: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      id: "warnings" as const,
      label: "Warnings",
      description: "Notification and error reporting preferences",
      icon: ShieldAlert,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-amber-600 dark:text-amber-400",
      bgClassName: "bg-amber-50 dark:bg-amber-500/10"
    },
    {
      id: "usage" as const,
      label: "Usage Stats",
      description: "Anonymous data collection for improvements",
      icon: BarChart3,
      activeClassName: DEFAULT_ACTIVE_CLASS,
      inactiveClassName: DEFAULT_INACTIVE_CLASS,
      iconClassName: "text-cyan-600 dark:text-cyan-400",
      bgClassName: "bg-cyan-50 dark:bg-cyan-500/10",
      hidden: !enableUsageStatsTab
    },
    {
      id: "developer" as const,
      label: "Developer",
      description: "Advanced debugging and integration tools",
      icon: Code2,
      activeClassName: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm ring-1 ring-violet-200 dark:ring-violet-800",
      inactiveClassName: "text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300",
      labelClassName: "text-violet-700 dark:text-violet-300",
      iconClassName: "text-violet-600 dark:text-violet-400",
      bgClassName: "bg-violet-50 dark:bg-violet-900/40"
    }
  ].filter((tab) => !tab.hidden)

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
          className={`shrink-0 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${isMobileDialog
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
                aria-label="Back to settings list"
              >
                <ArrowLeft size={20} />
              </Button>
                <div className="flex flex-col min-w-0">
                  <Subheading className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </Subheading>
                  <MutedText className="text-[10px] leading-tight truncate pr-4">
                    {tabs.find(t => t.id === activeTab)?.description}
                  </MutedText>
                </div>
              </div>
            ) : (
              <div className={isMobileDialog ? "h-10 flex items-center" : ""}>
                <Subheading className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</Subheading>
              </div>
            )}
          </div>

          {(!isMobileDialog || !activeTab) && (
            <nav
              className={`flex-1 px-3 ${isMobileDialog
                  ? "space-y-3 pb-6 pt-2"
                  : "space-y-1"
                }`}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center rounded-lg transition-all ${isMobileDialog
                      ? "w-full gap-3 p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shadow-sm"
                      : "w-full gap-3 px-3 py-2"
                    } ${activeTab === tab.id ? tab.activeClassName : tab.inactiveClassName
                    }`}
                >
                  <div className={`${isMobileDialog ? `rounded-lg ${tab.bgClassName} p-2 shadow-sm ${tab.iconClassName}` : tab.iconClassName}`}>
                    <tab.icon size={isMobileDialog ? 18 : 16} />
                  </div>
                  <div className="flex-1 text-left">
                    <BodyText className={`font-semibold ${activeTab === tab.id
                        ? isMobileDialog ? "" : "text-slate-900 dark:text-slate-50"
                        : (tab as any).labelClassName || "!text-slate-800 dark:!text-slate-100"
                      }`}>
                      {tab.label}
                    </BodyText>
                    {isMobileDialog && (
                      <MutedText className="text-[10px] leading-tight">
                        {tab.description}
                      </MutedText>
                    )}
                  </div>
                  {isMobileDialog && <ChevronRight size={16} className="text-slate-300" />}
                </button>
              ))}
            </nav>
          )}
        </div>

        {(!isMobileDialog || activeTab) && (
          <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-white dark:bg-slate-900">
            <div className={`flex-1 min-h-0 min-w-0 overflow-y-auto ${isMobileDialog ? "p-4 pt-5 pb-10" : "p-8 pt-12"}`}>
              {activeTab === "general" ? (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="General"
                      description="Control default behavior and workspace layout preferences."
                    />
                  )}
                  <section className="space-y-4">
                    <SettingsItemHeader
                      title="DEFAULT OPEN SCREEN"
                      description="Choose which workspace opens by default."
                    />
                    <SelectInput
                      label="Default workspace (Ext only)"
                      value={defaultScreenValue}
                      options={defaultScreenOptions}
                      onChange={onChangeDefaultScreenValue}
                      disabled={!showExtensionOnlyOptions}
                    />
                    <CheckboxCard
                      title="Prefer recently used preset"
                      subtitle="Open the most recently used preset when entering preset-based tools, if available."
                      checked={preferRecentPresetEntry}
                      onChange={onChangePreferRecentPresetEntry}
                    />
                  </section>

                  <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title="WORKSPACE SIDEBAR WIDTHS"
                      description="Tune left and right sidebar width with preset steps."
                    />
                    {showExtensionOnlyOptions && (
                      <DiscreteSlider
                        label="Navigation sidebar width (Ext only)"
                        value={layoutPreferences.navigationSidebarLevel}
                        options={navigationWidthSliderOptions}
                        onChange={(value) => onChangeNavigationSidebarLevel(value as SidebarWidthLevel)}
                        valueFormatter={(option) => `${option.label} (${navigationWidthPx}px)`}
                        disabled={!showExtensionOnlyOptions}
                      />
                    )}
                    <DiscreteSlider
                      label="Configuration sidebar width"
                      value={layoutPreferences.configurationSidebarLevel}
                      options={configurationWidthSliderOptions}
                      onChange={(value) => onChangeConfigurationSidebarLevel(value as SidebarWidthLevel)}
                      valueFormatter={(option) =>
                        isMobileDialog
                          ? `${option.label} (${configurationWidthPx}px)`
                          : `${option.label} (${configurationWidthPx}px, ${CONFIGURATION_SIDEBAR_MAX_PERCENT}%)`
                      }
                    />
                  </section>
                </div>
              ) : null}

              {activeTab === "shortcuts" && <SettingsShortcutsPanel isMobile={isMobileDialog} />}

              {activeTab === "performance" && (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="Performance"
                      description="Smart Concurrency Advisor helps simulate safe worker counts using your hardware profile and active format settings."
                    />
                  )}
                  <section className="space-y-4">
                    <SettingsItemHeader
                      title="SMART CONCURRENCY ADVISOR"
                      description="Modern encoders like AVIF and JXL can consume high CPU and memory in browser workers. Enable advisor to get dynamic recommendations based on machine profile and current format options."
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      Privacy note: hardware data is only read and processed locally in your browser. No telemetry or external upload.
                    </div>
                    <ToggleSwitchLabel
                      label="Enable Smart Concurrency Advisor"
                      description="Keep manual concurrency free (1-90), but show contextual safe recommendations under Export Settings."
                      checked={advisorEnabled}
                      onChange={(checked) =>
                        updatePerformancePreferences({
                          ...safePerformancePreferences,
                          smartAdvisorEnabled: checked
                        })
                      }
                    />
                    <ToggleSwitchLabel
                      label="Unlock max concurrency (Overclock)"
                      description="Allow values up to 90 and bypass Advisor hard lock. This can increase crash risk on heavy formats."
                      checked={overclockEnabled}
                      onChange={(checked) =>
                        updatePerformancePreferences({
                          ...safePerformancePreferences,
                          allowConcurrencyOverclock: checked
                        })
                      }
                      colorWhenEnabled="amber"
                    />
                    {advisorEnabled && (
                      <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <BodyText className="font-semibold text-slate-800 dark:text-slate-200">Hardware Profile</BodyText>
                            <MutedText className="text-xs">
                              Source:{" "}
                              {hardwareProfile.source === "detected"
                                ? "Auto-detected"
                                : hardwareProfile.source === "manual"
                                  ? "Manual override"
                                  : "Fallback"}
                            </MutedText>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const detected = detectHardwareProfile()
                              updatePerformancePreferences({
                                ...safePerformancePreferences,
                                hardwareProfile: detected
                              })
                            }}
                          >
                            Auto-Detect Hardware
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <NumberInput
                            label="CPU Cores (logical threads)"
                            value={hardwareProfile.cpuCores}
                            min={1}
                            max={64}
                            step={1}
                            onChangeValue={(nextValue) => {
                              updateHardwareProfile({ cpuCores: nextValue })
                            }}
                          />

                          <NumberInput
                            label="RAM Budget (GB)"
                            value={hardwareProfile.ramBudgetGb}
                            min={0.5}
                            max={64}
                            step={0.5}
                            onChangeValue={(nextValue) => {
                              updateHardwareProfile({ ramBudgetGb: nextValue })
                            }}
                          />
                        </div>

                        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                          Detected hardware:{" "}
                          {hardwareProfile.detectedLogicalCores ?? hardwareProfile.cpuCores} threads, ~
                          {hardwareProfile.detectedDeviceMemoryGb ?? "unknown"}GB device memory.
                        </div>
                      </div>
                    )}

                    {!advisorEnabled && (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800 dark:border-sky-900/50 dark:bg-slate-950/30 dark:text-sky-300">
                        Smart mode is off. Concurrency Advisor is running in static fallback mode using default profile (4 threads, 4GB RAM budget).
                      </div>
                    )}

                    {overclockEnabled ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-800 dark:border-rose-900/50 dark:bg-slate-950/30 dark:text-rose-300">
                        Danger mode: overclock is enabled. Heavy formats (AVIF/JXL/PNG tiny+OxiPNG) can hit OOM if you push concurrency too high.
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800 dark:border-emerald-900/50 dark:bg-slate-950/30 dark:text-emerald-300">
                        Safe mode: concurrency max is hard-locked by Advisor calculations to reduce crash risk.
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === "warnings" && (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="Warnings"
                      description="Customize which validation warnings and confirmation dialogs appear during workspace transitions."
                    />
                  )}
                  <section className="space-y-4">
                    <SettingsItemHeader
                      title="PREFERENCES"
                      description="These preferences are saved automatically."
                    />
                    <div className="space-y-2">
                      <ToggleSwitchLabel
                        label="Show download confirmation dialog"
                        description={`Warn before downloading more than ${APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD} images one by one.`}
                        checked={!skipDownloadConfirm}
                        onChange={(checked) => setSkipDownloadConfirm(!checked)}
                      />
                      <ToggleSwitchLabel
                        label="Show memory (OOM) warning dialog"
                        description={`Warn when selected batch size exceeds ~${APP_CONFIG.BATCH.OOM_WARNING_MB} MB.`}
                        checked={!skipOomWarning}
                        onChange={(checked) => setSkipOomWarning(!checked)}
                      />
                      <ToggleSwitchLabel
                        label="Show Image Splicing high preview quality warning"
                        description={`Warn if there are more than ${APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT} images or total area exceeds ~${APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS / 1_000_000}M px².`}
                        checked={!skipSplicingHeavyPreviewQualityWarning}
                        onChange={(checked) => setSkipSplicingHeavyPreviewQualityWarning(!checked)}
                      />
                    </div>
                  </section>
                </div>
              )}

              {enableUsageStatsTab && activeTab === "usage" && (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="Usage Stats"
                      description="Help us improve Imify by allowing anonymous performance metrics and error reporting."
                    />
                  )}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <SettingsItemHeader
                        title="FREQUENCY DATA"
                        description='These counters drive the "Most used (stable)" sorting mode.'
                      />
                      <Button
                        variant="outline"
                        className="rounded-lg border-slate-200 dark:border-slate-700"
                        onClick={onResetUsageStats}
                      >
                        <RotateCcw size={14} />
                        Reset
                      </Button>
                    </div>
                    <div className="overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      {usageEntries.length ? (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                          {usageEntries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between px-4 py-3">
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
                        <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No usage data yet.</div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "developer" && devModeEnabled && devModeSettingsAdapter && (
                <div className="animate-in fade-in duration-300 space-y-5">
                  {!isMobileDialog && (
                    <SettingsSectionHeader
                      title="Developer Tools"
                      description="Real-time state monitor and debug log export. Only visible when Developer Mode is active."
                    />
                  )}

                  <section className="space-y-4">
                    <SettingsItemHeader
                      title="SYSTEM MONITOR & LOG TOOLS"
                      description="Inspect live state, then export/import full system snapshots for debugging."
                    />
                    <DevModeStateViewer activeTab={devModeActiveTab} settingsAdapter={devModeSettingsAdapter} />
                    <div className="flex flex-col gap-3 pt-1">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 rounded-lg"
                        onClick={() => setIsExportDialogOpen(true)}
                      >
                        <Download size={14} />
                        Export System Log
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 rounded-lg"
                        onClick={() => setIsImportDialogOpen(true)}
                      >
                        <Download size={14} className="rotate-180" />
                        Import System Log
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title="RUNTIME CONSOLE MONITOR"
                      description="Capture runtime console output for quick debugging on desktop and mobile."
                    />
                    <RuntimeConsoleMonitor />
                  </section>

                  <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <SettingsItemHeader
                      title="DISABLE DEVELOPER MODE"
                      description="Hide this tab and disable debug features. You can re-enable from About dialog Easter Egg."
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
              )}
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
          />
          <DevModeImportDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            activeTab={devModeActiveTab}
            performancePreferences={safePerformancePreferences}
            layoutPreferences={layoutPreferences}
            settingsAdapter={devModeSettingsAdapter}
            onSuccess={() => success("Import successful", "State has been restored.", 3000)}
          />
        </>
      )}
    </>
  )
}
