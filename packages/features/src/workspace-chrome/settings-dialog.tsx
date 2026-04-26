"use client"

import React from "react"
import { useEffect, useMemo, useState } from "react"
import { BarChart3, Code2, Download, Gauge, Keyboard, ListTree, PowerOff, RotateCcw, ShieldAlert, X } from "lucide-react"
import { APP_CONFIG } from "@imify/core/config"
import { useToast } from "@imify/core/hooks/use-toast"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { ToastContainer } from "@imify/ui/components/toast-container"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { DiscreteSlider, type DiscreteSliderOption } from "@imify/ui/ui/discrete-slider"
import { SelectInput } from "@imify/ui/ui/select-input"
import { ToggleSwitchLabel } from "@imify/ui/ui/toggle-switch-label"
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header"
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header"
import { Subheading } from "@imify/ui/ui/typography"
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
import type { OptionsTab } from "../dev-mode/debug-shared"
import type { DevModeSettingsAdapter } from "../dev-mode/dev-mode-settings-adapter"
import { SettingsShortcutsPanel } from "./settings-shortcuts-panel"
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
  initialTab?: SettingsDialogTab
  defaultScreenValue: string
  defaultScreenOptions: WorkspaceDefaultScreenOption[]
  onChangeDefaultScreenValue: (value: string) => void
  usageEntries: Array<{ id: string; name: string; count: number }>
  onResetUsageStats: () => void
  layoutPreferences: WorkspaceLayoutPreferences
  onChangeNavigationSidebarLevel: (level: SidebarWidthLevel) => void
  onChangeConfigurationSidebarLevel: (level: SidebarWidthLevel) => void
  performancePreferences: PerformancePreferences
  onChangePerformancePreferences: (value: PerformancePreferences) => void
  showNavigationSidebarWidthControl?: boolean
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
  usageEntries,
  onResetUsageStats,
  layoutPreferences,
  onChangeNavigationSidebarLevel,
  onChangeConfigurationSidebarLevel,
  performancePreferences,
  onChangePerformancePreferences,
  showNavigationSidebarWidthControl = true,
  enableUsageStatsTab = true,
  devModeSettingsAdapter,
  devModeActiveTab = null
}: WorkspaceSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsDialogTab>(initialTab)
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
    if (!isOpen) return
    setActiveTab(initialTab)
  }, [initialTab, isOpen])

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia(`(max-width: ${SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX}px)`)
    const update = () => setIsMobileDialog(mediaQuery.matches)
    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

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

  const handleDisableDevMode = async () => {
    await setDevModeEnabled(false)
    setActiveTab("general")
  }
  const tabs = [
    { id: "general" as const, label: "General", icon: ListTree },
    { id: "shortcuts" as const, label: "Shortkeys", icon: Keyboard },
    { id: "performance" as const, label: "Performance", icon: Gauge },
    { id: "warnings" as const, label: "Warnings", icon: ShieldAlert },
    { id: "usage" as const, label: "Usage Stats", icon: BarChart3, hidden: !enableUsageStatsTab },
    { id: "developer" as const, label: "Developer", icon: Code2, hidden: !devModeEnabled }
  ].filter((tab) => !tab.hidden)

  return (
    <>
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName={
        isMobileDialog
          ? "relative flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-3xl min-h-0 overflow-hidden rounded-xl flex-col"
          : "relative flex h-[720px] max-h-[calc(100vh-4rem)] w-full max-w-3xl min-h-0 overflow-hidden rounded-xl"
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
        className={`shrink-0 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 ${
          isMobileDialog
            ? "w-full border-b border-r-0 pb-3 pt-4"
            : "w-56 border-r pt-6 pb-4"
        }`}
      >
        <div className={`px-5 ${isMobileDialog ? "mb-3" : "mb-6"}`}>
          <Subheading className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</Subheading>
        </div>
        <nav
          className={`flex-1 px-3 ${
            isMobileDialog
              ? "flex gap-1.5 overflow-x-auto pb-1 mr-5"
              : "space-y-1"
          }`}
        >
          {tabs.map((tab) => (
              <React.Fragment key={tab.id}>
                {tab.id === "developer" ? (
                  <div className={`my-2 border-t border-slate-200 dark:border-slate-700 ${isMobileDialog ? "hidden" : ""}`} />
                ) : null}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                    isMobileDialog
                      ? "w-auto shrink-0 whitespace-nowrap gap-2 px-2.5 text-[13px]"
                      : "w-full gap-3 px-3"
                  } ${
                    tab.id === "developer"
                      ? activeTab === tab.id
                        ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                        : "text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300"
                      : activeTab === tab.id
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              </React.Fragment>
            ))}
        </nav>
      </div>

      <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-white dark:bg-slate-900">
        <div className={`flex-1 min-h-0 min-w-0 overflow-y-auto ${isMobileDialog ? "p-4 pt-5 pr-10 pb-10" : "p-8 pt-12 pr-8"}`}>
          {activeTab === "general" ? (
            <div className="animate-in fade-in duration-300 space-y-5">
              <SettingsSectionHeader
                title="General"
                description="Control default behavior and workspace layout preferences."
              />
              <section className="space-y-4">
                <SettingsItemHeader
                  title="DEFAULT OPEN SCREEN"
                  description="Choose which workspace opens by default."
                />
                <SelectInput
                  label="Default workspace"
                  value={defaultScreenValue}
                  options={defaultScreenOptions}
                  onChange={onChangeDefaultScreenValue}
                />
              </section>

              <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                <SettingsItemHeader
                  title="WORKSPACE SIDEBAR WIDTHS"
                  description="Tune left and right sidebar width with preset steps."
                />
                {showNavigationSidebarWidthControl ? (
                  <DiscreteSlider
                    label="Navigation sidebar width"
                    value={layoutPreferences.navigationSidebarLevel}
                    options={navigationWidthSliderOptions}
                    onChange={(value) => onChangeNavigationSidebarLevel(value as SidebarWidthLevel)}
                    valueFormatter={(option) => `${option.label} (${navigationWidthPx}px)`}
                  />
                ) : null}
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

          {activeTab === "shortcuts" ? <SettingsShortcutsPanel /> : null}

          {activeTab === "performance" ? (
            <div className="animate-in fade-in duration-300 space-y-5">
              <SettingsSectionHeader
                title="Performance"
                description="Smart Concurrency Advisor helps simulate safe worker counts using your hardware profile and active format settings."
              />
              <section className="space-y-4">
                <SettingsItemHeader
                  title="SMART CONCURRENCY ADVISOR"
                  description="Enable advisor to get dynamic recommendations based on machine profile and current format options."
                />
                <ToggleSwitchLabel
                  label="Enable Smart Concurrency Advisor"
                  description="Keep manual concurrency free (1-90), but show contextual safe recommendations."
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
                  description="Allow values up to 90 and bypass Advisor hard lock."
                  checked={overclockEnabled}
                  onChange={(checked) =>
                    updatePerformancePreferences({
                      ...safePerformancePreferences,
                      allowConcurrencyOverclock: checked
                    })
                  }
                  colorWhenEnabled="amber"
                />
                {advisorEnabled ? (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Hardware Profile</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Source: {hardwareProfile.source === "detected" ? "Auto-detected" : hardwareProfile.source === "manual" ? "Manual override" : "Fallback"}
                    </p>
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
                ) : null}
              </section>
            </div>
          ) : null}

          {activeTab === "warnings" ? (
            <div className="animate-in fade-in duration-300">
              <SettingsSectionHeader
                title="Warning Dialogs"
                description="Control how warning dialogs appear during processing."
              />
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
          ) : null}

          {enableUsageStatsTab && activeTab === "usage" ? (
            <div className="animate-in fade-in duration-300">
              <SettingsSectionHeader
                title="Usage Stats"
                description="Review how often each format/preset is used."
              />
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
          ) : null}

          {activeTab === "developer" && devModeEnabled && devModeSettingsAdapter ? (
            <div className="animate-in fade-in duration-300 space-y-5">
              <SettingsSectionHeader
                title="Developer Tools"
                description="Real-time state monitor and debug log export. Only visible when Developer Mode is active."
              />

              <section className="space-y-4">
                <SettingsItemHeader
                  title="LIVE STATE MONITOR"
                  description="Inspect current state in real-time. Updates as you change settings."
                />
                <DevModeStateViewer activeTab={devModeActiveTab} settingsAdapter={devModeSettingsAdapter} />
              </section>

              <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <SettingsItemHeader
                  title="EXPORT DEBUG LOG"
                  description="Selectively export your configuration to JSON."
                />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-lg"
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  <Download size={14} />
                  Export System Log
                </Button>
              </section>

              <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <SettingsItemHeader
                  title="IMPORT DEBUG LOG"
                  description="Import a JSON debug file to restore selected state."
                />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-lg"
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  <Download size={14} className="rotate-180" />
                  Import System Log
                </Button>
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
          ) : null}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={hide} />
    </BaseDialog>
    {devModeSettingsAdapter ? (
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
    ) : null}
    </>
  )
}
