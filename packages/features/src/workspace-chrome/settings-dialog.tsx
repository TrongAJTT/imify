"use client"

import React from "react"
import { useEffect, useMemo, useState } from "react"
import { BarChart3, Gauge, Keyboard, ListTree, RotateCcw, ShieldAlert, X } from "lucide-react"
import { APP_CONFIG } from "@imify/core/config"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { DiscreteSlider, type DiscreteSliderOption } from "@imify/ui/ui/discrete-slider"
import { SelectInput } from "@imify/ui/ui/select-input"
import { ToggleSwitchLabel } from "@imify/ui/ui/toggle-switch-label"
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header"
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header"
import { Subheading } from "@imify/ui/ui/typography"
import {
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
import { SettingsShortcutsPanel } from "./settings-shortcuts-panel"

export type SettingsDialogTab = "general" | "shortcuts" | "performance" | "warnings" | "usage"

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
  enableUsageStatsTab = true
}: WorkspaceSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsDialogTab>(initialTab)

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

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="relative w-full max-w-3xl rounded-xl overflow-hidden h-[720px] max-h-[calc(100vh-4rem)] flex"
    >
      <div className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col pt-6 pb-4 shrink-0">
        <div className="px-5 mb-6">
          <Subheading className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</Subheading>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {[
            { id: "general" as const, label: "General", icon: ListTree },
            { id: "shortcuts" as const, label: "Shortkeys", icon: Keyboard },
            { id: "performance" as const, label: "Performance", icon: Gauge },
            { id: "warnings" as const, label: "Warnings", icon: ShieldAlert },
            { id: "usage" as const, label: "Usage Stats", icon: BarChart3, hidden: !enableUsageStatsTab }
          ]
            .filter((tab) => !tab.hidden)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
        </nav>
      </div>

      <div className="flex-1 min-w-0 flex flex-col relative bg-white dark:bg-slate-900">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
          aria-label="Close settings dialog"
        >
          <X size={18} />
        </Button>

        <div className="flex-1 min-w-0 overflow-y-auto p-8 pt-12">
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
                  valueFormatter={(option) => `${option.label} (${configurationWidthPx}px)`}
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
        </div>
      </div>
    </BaseDialog>
  )
}
