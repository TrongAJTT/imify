"use client"

import React from "react"
import { useMemo, useState } from "react"
import { Check } from "lucide-react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { DEV_MODE_FEATURES } from "./dev-mode-registry"
import { buildDebugLog, downloadDebugLog } from "./debug-log-builder"
import type { OptionsTab } from "./debug-shared"
import type { DevModeSettingsAdapter } from "./dev-mode-settings-adapter"

interface DevModeExportDialogProps {
  isOpen: boolean
  onClose: () => void
  activeTab: OptionsTab | null
  performancePreferences: unknown | null
  layoutPreferences: unknown | null
  settingsAdapter: DevModeSettingsAdapter
}

export function DevModeExportDialog({
  isOpen,
  onClose,
  activeTab,
  performancePreferences,
  layoutPreferences,
  settingsAdapter
}: DevModeExportDialogProps) {
  const allFeatureIds = useMemo(() => DEV_MODE_FEATURES.map((feature) => feature.id), [])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(allFeatureIds)
  const [isExporting, setIsExporting] = useState(false)

  const toggleAll = () => {
    setSelectedFeatures((prev) => (prev.length === allFeatureIds.length ? [] : allFeatureIds))
  }

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    )
  }

  const handleExport = async () => {
    if (selectedFeatures.length === 0) return
    setIsExporting(true)
    try {
      const payload = await buildDebugLog({
        activeTab,
        performancePreferences,
        layoutPreferences,
        getStorageState: settingsAdapter.getSettingsState,
        exportType: "normal",
        exportedFeatures: selectedFeatures
      })
      downloadDebugLog(payload)
      onClose()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full"
      contentClassName="p-6 flex flex-col gap-6"
    >
      <div className="contents" onClick={(event) => event.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Export System Log</h2>
          <p className="text-sm text-slate-500 mt-1">
            Select the features you want to include in the export. Sensitive data will be automatically sanitized.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {selectedFeatures.length} of {allFeatureIds.length} selected
            </span>
            <Button variant="ghost" size="sm" onClick={toggleAll} className="h-8 text-xs">
              {selectedFeatures.length === allFeatureIds.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6" onClick={(event) => event.stopPropagation()}>
            {DEV_MODE_FEATURES.map((feature) => (
              <label
                key={feature.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => toggleFeature(feature.id)}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedFeatures.includes(feature.id) ? "bg-sky-500 border-sky-500 text-white" : "border-slate-300 dark:border-slate-600 bg-transparent"}`}>
                  {selectedFeatures.includes(feature.id) ? <Check size={14} /> : null}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 select-none">{feature.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFeatures.length === 0 || isExporting}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}
