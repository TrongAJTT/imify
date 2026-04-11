import { useEffect, useMemo, useState } from "react"
import { useBatchStore } from "@/options/stores/batch-store"
import { APP_CONFIG } from "@/core/config"
import { Button } from "@/options/components/ui/button"
import {
  DiscreteSlider,
  type DiscreteSliderOption
} from "@/options/components/ui/discrete-slider"
import { SelectInput } from "@/options/components/ui/select-input"
import { NumberInput } from "@/options/components/ui/number-input"
import { Kicker, MutedText, Subheading } from "@/options/components/ui/typography"
import {
  BarChart3,
  Gauge,
  ListTree,
  RotateCcw,
  ShieldAlert,
  X
} from "lucide-react"
import { BaseDialog } from "@/options/components/ui/base-dialog"
import { TAB_ITEMS, type OptionsTab } from "@/options/shared"
import {
  CONFIGURATION_SIDEBAR_WIDTH_OPTIONS,
  NAVIGATION_SIDEBAR_WIDTH_OPTIONS,
  type SidebarWidthLevel,
  type WorkspaceLayoutPreferences
} from "@/options/shared/layout-preferences"
import {
  detectHardwareProfile,
  normalizePerformancePreferences,
  type PerformancePreferences
} from "@/options/shared/performance-preferences"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: SettingsDialogTab
  defaultOptionsTab: OptionsTab
  onChangeDefaultOptionsTab: (tab: OptionsTab) => void
  usageEntries: Array<{ id: string; name: string; count: number }>
  onResetUsageStats: () => void
  layoutPreferences: WorkspaceLayoutPreferences
  onChangeNavigationSidebarLevel: (level: SidebarWidthLevel) => void
  onChangeConfigurationSidebarLevel: (level: SidebarWidthLevel) => void
  performancePreferences: PerformancePreferences
  onChangePerformancePreferences: (value: PerformancePreferences) => void
}

export type SettingsDialogTab = "general" | "performance" | "warnings" | "usage"

export function SettingsDialog({
  isOpen,
  onClose,
  initialTab = "general",
  defaultOptionsTab,
  onChangeDefaultOptionsTab,
  usageEntries,
  onResetUsageStats,
  layoutPreferences,
  onChangeNavigationSidebarLevel,
  onChangeConfigurationSidebarLevel,
  performancePreferences,
  onChangePerformancePreferences
}: SettingsDialogProps) {
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

  const [activeTab, setActiveTab] = useState<SettingsDialogTab>(initialTab)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setActiveTab(initialTab)
  }, [isOpen, initialTab])

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

  const updateHardwareProfile = (updates: Partial<PerformancePreferences["hardwareProfile"]>) => {
    updatePerformancePreferences({
      ...safePerformancePreferences,
      hardwareProfile: {
        ...safePerformancePreferences.hardwareProfile,
        ...updates,
        source: "manual"
      }
    })
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="relative w-full max-w-3xl rounded-xl overflow-hidden h-[720px] max-h-[calc(100vh-4rem)] flex"
    >
      <div className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col pt-6 pb-4 shrink-0">
        <div className="px-5 mb-6">
          <Subheading className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Settings
          </Subheading>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "general"
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ListTree size={16} />
            General
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "performance"
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Gauge size={16} />
            Performance
          </button>

          <button
            onClick={() => setActiveTab("warnings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "warnings"
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldAlert size={16} />
            Warnings
          </button>

          <button
            onClick={() => setActiveTab("usage")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "usage"
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 size={16} />
            Usage Stats
          </button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-900">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
          aria-label="Close settings dialog"
        >
          <X size={18} />
        </Button>

        <div className="flex-1 overflow-y-auto p-8 pt-12">
          {activeTab === "general" && (
            <div className="animate-in fade-in duration-300 space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
                  General
                </h2>
                <MutedText>
                  Control default behavior and workspace layout preferences.
                </MutedText>
              </div>

              <section className="space-y-4">
                <div>
                  <Kicker className="mb-1">DEFAULT OPEN SCREEN</Kicker>
                  <MutedText className="text-sm">
                    Choose which feature tab opens by default when you click the extension and navigate to this page.
                  </MutedText>
                </div>

                <SelectInput
                  label="Default feature"
                  value={defaultOptionsTab}
                  options={TAB_ITEMS.map((item) => ({
                    value: item.id,
                    label: item.label
                  }))}
                  onChange={(nextValue) => onChangeDefaultOptionsTab(nextValue as OptionsTab)}
                />
              </section>

              <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                <div>
                  <Kicker className="mb-1">WORKSPACE SIDEBAR WIDTHS</Kicker>
                  <MutedText className="text-sm">
                    Tune left and right sidebar width with preset steps.
                  </MutedText>
                </div>

                <DiscreteSlider
                  label="Navigation sidebar width"
                  value={layoutPreferences.navigationSidebarLevel}
                  options={navigationWidthSliderOptions}
                  onChange={(value) => onChangeNavigationSidebarLevel(value as SidebarWidthLevel)}
                  valueFormatter={(option) => `${option.label} (${navigationWidthPx}px)`}
                />

                <DiscreteSlider
                  label="Configuration sidebar width"
                  value={layoutPreferences.configurationSidebarLevel}
                  options={configurationWidthSliderOptions}
                  onChange={(value) => onChangeConfigurationSidebarLevel(value as SidebarWidthLevel)}
                  valueFormatter={(option) => `${option.label} (${configurationWidthPx}px)`}
                />
              </section>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="animate-in fade-in duration-300 space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
                  Performance
                </h2>
                <MutedText>
                  Smart Concurrency Advisor helps simulate safe worker counts using your hardware profile and active format settings.
                </MutedText>
              </div>

              <section className="space-y-4">
                <div>
                  <Kicker className="mb-1">SMART CONCURRENCY ADVISOR</Kicker>
                  <MutedText className="text-sm">
                    Modern encoders like AVIF and JXL can consume high CPU and memory in browser workers. Enable advisor to get dynamic recommendations based on machine profile and current format options.
                  </MutedText>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                  Privacy note: hardware data is only read and processed locally in your browser. No telemetry or external upload.
                </div>

                <label className="flex items-center justify-between gap-4 py-2 rounded-lg transition-colors cursor-pointer select-none group">
                  <div className="flex-1 pr-6">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                      Enable Smart Concurrency Advisor
                    </p>
                    <MutedText className="text-sm mt-0.5 leading-relaxed">
                      Keep manual concurrency free (1-90), but show contextual safe recommendations under Export Settings.
                    </MutedText>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={advisorEnabled}
                      onClick={() =>
                        updatePerformancePreferences({
                          ...safePerformancePreferences,
                          smartAdvisorEnabled: !advisorEnabled
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${
                        advisorEnabled ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          advisorEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </label>

                <label className="flex items-center justify-between gap-4 py-2 rounded-lg transition-colors cursor-pointer select-none group">
                  <div className="flex-1 pr-6">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                      Unlock max concurrency (Overclock)
                    </p>
                    <MutedText className="text-sm mt-0.5 leading-relaxed">
                      Allow values up to 90 and bypass Advisor hard lock. This can increase crash risk on heavy formats.
                    </MutedText>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={overclockEnabled}
                      onClick={() =>
                        updatePerformancePreferences({
                          ...safePerformancePreferences,
                          allowConcurrencyOverclock: !overclockEnabled
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${
                        overclockEnabled ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          overclockEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </label>

                {advisorEnabled && (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Hardware Profile
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Source: {hardwareProfile.source === "detected" ? "Auto-detected" : hardwareProfile.source === "manual" ? "Manual override" : "Fallback"}
                        </p>
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
                      Detected hardware: {hardwareProfile.detectedLogicalCores ?? hardwareProfile.cpuCores} threads, ~{hardwareProfile.detectedDeviceMemoryGb ?? "unknown"}GB device memory.
                    </div>
                  </div>
                )}

                {!advisorEnabled && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300">
                    Smart mode is off. Concurrency Advisor is running in static fallback mode using default profile (4 threads, 4GB RAM budget).
                  </div>
                )}

                {overclockEnabled ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    Danger mode: overclock is enabled. Heavy formats (AVIF/JXL/PNG tiny+OxiPNG) can hit OOM if you push concurrency too high.
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    Safe mode: concurrency max is hard-locked by Advisor calculations to reduce crash risk.
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "warnings" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
                  Warning Dialogs
                </h2>
                <MutedText>
                  Control how warning dialogs appear during batch processing.
                </MutedText>
              </div>

              <section className="space-y-4">
                <div>
                  <Kicker className="mb-1">PREFERENCES</Kicker>
                  <MutedText className="text-sm">
                    These preferences are saved automatically. Batch options apply across Single/Batch setup; Image Splicing uses the preview-quality warning here as well.
                  </MutedText>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-4 py-3 rounded-lg transition-colors cursor-pointer select-none group">
                    <div className="flex-1 pr-6">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                        Show download confirmation dialog
                      </p>
                      <MutedText className="text-sm mt-0.5 leading-relaxed">
                        Warn before downloading more than {APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD} images one by one to avoid overwhelming your browser.
                      </MutedText>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!skipDownloadConfirm}
                        onClick={() => setSkipDownloadConfirm(!skipDownloadConfirm)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${
                          !skipDownloadConfirm
                            ? "bg-sky-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            !skipDownloadConfirm ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </label>

                  <label className="flex items-center justify-between gap-4 py-3 rounded-lg transition-colors cursor-pointer select-none group">
                    <div className="flex-1 pr-6">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                        Show memory (OOM) warning dialog
                      </p>
                      <MutedText className="text-sm mt-0.5 leading-relaxed">
                        Warn when selected batch size exceeds ~{APP_CONFIG.BATCH.OOM_WARNING_MB} MB to prevent out-of-memory crashes.
                      </MutedText>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!skipOomWarning}
                        onClick={() => setSkipOomWarning(!skipOomWarning)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${
                          !skipOomWarning
                            ? "bg-sky-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            !skipOomWarning ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </label>

                  <label className="flex items-center justify-between gap-4 py-3 rounded-lg transition-colors cursor-pointer select-none group">
                    <div className="flex-1 pr-6">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                        Show Image Splicing high preview quality warning
                      </p>
                      <MutedText className="text-sm mt-0.5 leading-relaxed">
                        When choosing preview quality 50% or higher, warn if there are more than {" "}
                        {APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT} images or total area exceeds
                        ~{APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS / 1_000_000}M px².
                      </MutedText>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!skipSplicingHeavyPreviewQualityWarning}
                        onClick={() =>
                          setSkipSplicingHeavyPreviewQualityWarning(!skipSplicingHeavyPreviewQualityWarning)
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${
                          !skipSplicingHeavyPreviewQualityWarning
                            ? "bg-sky-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            !skipSplicingHeavyPreviewQualityWarning
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </label>
                </div>
              </section>
            </div>
          )}

          {activeTab === "usage" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
                  Usage Stats
                </h2>
                <MutedText>
                  Review how often each format/preset is used in the right-click context menu.
                </MutedText>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Kicker className="mb-1">FREQUENCY DATA</Kicker>
                    <MutedText className="text-sm">
                      These counters drive the "Most used (stable)" sorting mode.
                    </MutedText>
                  </div>

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
                    <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                      No usage data yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </BaseDialog>
  )
}
