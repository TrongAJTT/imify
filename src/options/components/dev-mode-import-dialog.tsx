import { useState, useMemo, useRef } from "react"
import { BaseDialog } from "@/options/components/ui/base-dialog"
import { Button } from "@/options/components/ui/button"
import { Check, Upload, AlertTriangle } from "lucide-react"
import { buildDebugLog, downloadDebugLog, importDebugLog, type DebugLogPayload } from "@/features/dev-mode/debug-log-builder"
import { EXPORTABLE_FEATURES } from "./dev-mode-export-dialog"
import { getAppMetadata } from "@/core/app-metadata"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import type { WorkspaceLayoutPreferences } from "@/options/shared/layout-preferences"
import type { OptionsTab } from "@/options/shared"

interface DevModeImportDialogProps {
  isOpen: boolean
  onClose: () => void
  activeTab: OptionsTab | null
  performancePreferences: PerformancePreferences | null
  layoutPreferences: WorkspaceLayoutPreferences | null
  onSuccess?: () => void
}

export function DevModeImportDialog({
  isOpen,
  onClose,
  activeTab,
  performancePreferences,
  layoutPreferences,
  onSuccess
}: DevModeImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [payload, setPayload] = useState<DebugLogPayload | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const appMetadata = getAppMetadata()
  const isVersionMismatch = payload 
    ? (payload.imify_version !== appMetadata.version || payload.imify_version_type !== appMetadata.versionType)
    : false

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setError(null)
    setPayload(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = JSON.parse(text) as DebugLogPayload
        if (parsed.schema_version !== 1 || !parsed.metadata || !parsed.metadata.exportedFeatures) {
          throw new Error("Invalid or corrupted export file format.")
        }
        setPayload(parsed)
        setSelectedFeatures(parsed.metadata.exportedFeatures)
      } catch (err: any) {
        setError(err.message || "Failed to parse JSON file.")
      }
    }
    reader.readAsText(selected)
  }

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const handleImport = async () => {
    if (!payload || selectedFeatures.length === 0) return

    if (isVersionMismatch) {
      const confirm = window.confirm(
        `Version Mismatch!\n\nImporting data from ${payload.imify_version} (${payload.imify_version_type}) to ${appMetadata.version} (${appMetadata.versionType}) may cause data corruption or unexpected behavior.\n\nAre you sure you want to proceed?`
      )
      if (!confirm) return
    }

    setIsImporting(true)
    try {
      if (payload.metadata.exportType === "normal") {
        // Force full backup
        const allFeatureIds = EXPORTABLE_FEATURES.map(f => f.id)
        const backupPayload = await buildDebugLog({
          activeTab,
          performancePreferences,
          layoutPreferences,
          exportType: "backup",
          exportedFeatures: allFeatureIds
        })
        downloadDebugLog(backupPayload)
      }

      await importDebugLog(payload, selectedFeatures)
      
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
      <div className="contents" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Import System Log</h2>
          <p className="text-sm text-slate-500 mt-1">Restore your configuration from a previously exported JSON file.</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* File Input */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Select File</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="shrink-0 gap-2">
                <Upload size={14} />
                Choose JSON
              </Button>
              <span className="text-xs text-slate-500 truncate">
                {file ? file.name : "No file selected"}
              </span>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>

          {/* Feature Selection */}
          {payload && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Features to Import</span>
                <span className="text-xs text-slate-500">Only features included in the export file are shown.</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-2">
                {payload.metadata.exportedFeatures.map(id => {
                  const feature = EXPORTABLE_FEATURES.find(f => f.id === id)
                  const label = feature ? feature.label : id
                  return (
                    <label 
                      key={id} 
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => toggleFeature(id)}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedFeatures.includes(id) ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}`}>
                        {selectedFeatures.includes(id) && <Check size={14} />}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 select-none">
                        {label}
                      </span>
                    </label>
                  )
                })}
              </div>

              {isNormalExport && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                  You are importing a normal export. A full backup of your current state will be automatically downloaded before applying the import.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            {isVersionMismatch && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 text-xs font-medium">
                <AlertTriangle size={14} />
                <span>Version Mismatch</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>Cancel</Button>
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
