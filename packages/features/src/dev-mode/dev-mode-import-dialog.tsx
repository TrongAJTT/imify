"use client"

import React from "react"
import { useRef, useState, type ChangeEvent } from "react"
import { AlertTriangle, Check, Upload } from "lucide-react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { getAppMetadata } from "@imify/core/app-metadata"
import { DEV_MODE_FEATURES } from "./dev-mode-registry"
import { buildDebugLog, downloadDebugLog, importDebugLog, type DebugLogPayload } from "./debug-log-builder"
import type { OptionsTab } from "./debug-shared"
import type { DevModeSettingsAdapter } from "./dev-mode-settings-adapter"

interface SchemaMigration {
  fromVersion: number
  toVersion: number
  migrate: (state: any) => any
}

const BATCH_SCHEMA_MIGRATIONS: SchemaMigration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (state: any) => {
      const cloneSetupState = (s: any) => {
        return s ? JSON.parse(JSON.stringify(s)) : {}
      }

      const unifiedConfig = cloneSetupState(state.contextConfigs?.single ?? state)
      const nextContextConfigs = {
        single: unifiedConfig,
        batch: unifiedConfig
      }

      // Deduplicate presets
      const uniquePresets: any[] = []
      const configHashes = new Set<string>()
      const presets = state.presets || []
      for (const preset of presets) {
        const configStr = JSON.stringify(preset.config)
        const hashKey = `${preset.name}_${configStr}`
        if (!configHashes.has(hashKey)) {
          configHashes.add(hashKey)
          uniquePresets.push(preset)
        }
      }

      return {
        ...state,
        ...unifiedConfig,
        contextConfigs: nextContextConfigs,
        presets: uniquePresets,
        schemaVersion: 2
      }
    }
  }
]

interface DevModeImportDialogProps {
  isOpen: boolean
  onClose: () => void
  activeTab: OptionsTab | null
  performancePreferences: unknown | null
  layoutPreferences: unknown | null
  settingsAdapter: DevModeSettingsAdapter
  onSuccess?: () => void
  title?: string
  description?: string
}

export function DevModeImportDialog({
  isOpen,
  onClose,
  activeTab,
  performancePreferences,
  layoutPreferences,
  settingsAdapter,
  onSuccess,
  title = "Import System Log",
  description = "Restore configuration from a previously exported JSON file."
}: DevModeImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [payload, setPayload] = useState<DebugLogPayload | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasOldSchema, setHasOldSchema] = useState(false)
  const [originalSchemaVersion, setOriginalSchemaVersion] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const appMetadata = getAppMetadata()
  const isVersionMismatch = payload
    ? payload.imify_version !== appMetadata.version ||
      payload.imify_version_type !== appMetadata.versionType
    : false

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setError(null)
    setPayload(null)
    setHasOldSchema(false)
    setOriginalSchemaVersion(null)

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      try {
        const text = loadEvent.target?.result as string
        const parsed = JSON.parse(text) as DebugLogPayload
        if (parsed.schema_version !== 1 || !parsed.metadata || !parsed.metadata.exportedFeatures) {
          throw new Error("Invalid or corrupted export file format.")
        }

        // Check schema version of batch store
        if (parsed.stores?.batch) {
          const batchStore = parsed.stores.batch as any
          const currentVersion = batchStore.schemaVersion ?? 1
          const TARGET_VERSION = 2

          if (currentVersion < TARGET_VERSION) {
            setHasOldSchema(true)
            setOriginalSchemaVersion(currentVersion)

            // Loop checking and migrating until no more migrations are possible or target version reached
            let tempVersion = currentVersion
            let tempBatch = { ...batchStore }
            let canMigrate = true

            while (tempVersion < TARGET_VERSION && canMigrate) {
              const migration = BATCH_SCHEMA_MIGRATIONS.find(
                (m) => m.fromVersion === tempVersion
              )
              if (migration) {
                tempBatch = migration.migrate(tempBatch)
                tempVersion = migration.toVersion
              } else {
                canMigrate = false
              }
            }

            parsed.stores.batch = tempBatch
          }
        }

        setPayload(parsed)
        setSelectedFeatures(parsed.metadata.exportedFeatures)
      } catch (err: any) {
        setError(err.message || "Failed to parse JSON file.")
      }
    }
    reader.readAsText(selected)
  }

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    )
  }

  const handleImport = async () => {
    if (!payload || selectedFeatures.length === 0) return

    if (isVersionMismatch) {
      const confirmed = window.confirm(
        `Version mismatch.\n\nImport from ${payload.imify_version} (${payload.imify_version_type}) into ${appMetadata.version} (${appMetadata.versionType}) may cause unexpected behavior.\n\nDo you want to continue?`
      )
      if (!confirmed) return
    }

    setIsImporting(true)
    try {
      if (payload.metadata.exportType === "normal") {
        const allFeatureIds = DEV_MODE_FEATURES.map((feature) => feature.id)
        const backupPayload = await buildDebugLog({
          activeTab,
          performancePreferences,
          layoutPreferences,
          getStorageState: settingsAdapter.getSettingsState,
          exportType: "backup",
          exportedFeatures: allFeatureIds
        })
        downloadDebugLog(backupPayload)
      }

      await importDebugLog(payload, selectedFeatures, {
        setStorageState: settingsAdapter.setSettingsState
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || "Import failed.")
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (isImporting) return
    setFile(null)
    setPayload(null)
    setError(null)
    setHasOldSchema(false)
    setOriginalSchemaVersion(null)
    setSelectedFeatures([])
    if (fileInputRef.current) fileInputRef.current.value = ""
    onClose()
  }

  const isNormalExport = payload?.metadata?.exportType === "normal"

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md w-full"
      contentClassName="p-6 flex flex-col gap-6"
    >
      <div className="contents" onClick={(event) => event.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Select File</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="shrink-0 gap-2">
                <Upload size={14} />
                Choose JSON
              </Button>
              <span className="text-xs text-slate-500 truncate">{file ? file.name : "No file selected"}</span>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {error ? <p className="text-xs text-red-500 mt-2">{error}</p> : null}
          </div>

          {payload ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Features to Import</span>
                <span className="text-xs text-slate-500">Only features included in this export are shown.</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-2">
                {payload.metadata.exportedFeatures.map((featureId) => {
                  const feature = DEV_MODE_FEATURES.find((entry) => entry.id === featureId)
                  const label = feature?.label ?? featureId
                  return (
                    <label
                      key={featureId}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => toggleFeature(featureId)}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedFeatures.includes(featureId) ? "bg-sky-500 border-sky-500 text-white" : "border-slate-300 dark:border-slate-600 bg-transparent"}`}>
                        {selectedFeatures.includes(featureId) ? <Check size={14} /> : null}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 select-none">{label}</span>
                    </label>
                  )
                })}
              </div>

              {(isNormalExport || hasOldSchema) && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                  {isNormalExport && (
                    <div
                      tabIndex={0}
                      className="relative group cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50 transition-colors hover:bg-amber-100 dark:hover:bg-amber-950/50 focus:outline-none focus:ring-1 focus:ring-amber-400 select-none animate-in fade-in zoom-in-95 duration-200"
                    >
                      <Upload size={12} className="rotate-180 text-amber-600 dark:text-amber-500" />
                      <span>Backup</span>

                      {/* Tooltip Popover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3.5 bg-slate-900 dark:bg-slate-950 text-slate-100 text-xs font-normal rounded-lg shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-focus:opacity-100 group-focus:scale-100 transition-all duration-200 z-50 text-left leading-relaxed border border-slate-800 dark:border-slate-850">
                        <p className="font-bold text-amber-450 dark:text-amber-400 mb-0.5">Auto-Backup Enabled</p>
                        This is a normal export. A full backup of your current state will be automatically downloaded before proceeding.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950" />
                      </div>
                    </div>
                  )}

                  {hasOldSchema && (
                    <div
                      tabIndex={0}
                      className="relative group cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800/50 transition-colors hover:bg-sky-100 dark:hover:bg-sky-950/50 focus:outline-none focus:ring-1 focus:ring-sky-400 select-none animate-in fade-in zoom-in-95 duration-200"
                    >
                      <AlertTriangle size={12} className="text-sky-600 dark:text-sky-500" />
                      <span>Migration (v{originalSchemaVersion}.0)</span>

                      {/* Tooltip Popover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3.5 bg-slate-900 dark:bg-slate-950 text-slate-100 text-xs font-normal rounded-lg shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-focus:opacity-100 group-focus:scale-100 transition-all duration-200 z-50 text-left leading-relaxed border border-slate-800 dark:border-slate-850">
                        <p className="font-bold text-sky-450 dark:text-sky-400 mb-0.5">Schema Migration</p>
                        Older database schema version detected. The imported presets will be automatically migrated to unified schema v2.0 before restoring.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            {isVersionMismatch ? (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 text-xs font-medium">
                <AlertTriangle size={14} />
                <span>Version Mismatch</span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!payload || selectedFeatures.length === 0 || isImporting}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {isImporting ? "Processing..." : "Proceed"}
            </Button>
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}
