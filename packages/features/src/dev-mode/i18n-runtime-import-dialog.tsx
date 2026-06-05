"use client"

import React, { useState, useRef, type ChangeEvent } from "react"
import { ArrowLeft, Download, Upload, AlertCircle, Languages } from "lucide-react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import {
  generateEmptyLanguageTemplate,
  importLanguageAtRuntime,
  calculateCompletionDetails,
  type LanguageMeta
} from "@imify/i18n"
import i18n from "i18next"

interface I18nRuntimeImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (meta: LanguageMeta) => void
}

export function I18nRuntimeImportDialog({
  isOpen,
  onClose,
  onSuccess
}: I18nRuntimeImportDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 Form fields
  const [languageName, setLanguageName] = useState("")
  const [languageCode, setLanguageCode] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [authorGithub, setAuthorGithub] = useState("")
  const [metaError, setMetaError] = useState<string | null>(null)

  // Step 2 Form fields
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [completionStats, setCompletionStats] = useState<{
    completed: number
    total: number
    rate: number
  } | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = () => {
    if (!languageName.trim() || !languageCode.trim()) {
      setMetaError("Language Name and Language Code are required to download template.")
      return
    }
    setMetaError(null)

    const meta: LanguageMeta = {
      languageName: languageName.trim(),
      languageCode: languageCode.trim().toLowerCase(),
      version: "2.2.0",
      maintainers: authorName.trim()
        ? [
            {
              name: authorName.trim(),
              github: authorGithub.trim() || "https://github.com",
              role: "Contributor"
            }
          ]
        : []
    }

    try {
      const templateContent = generateEmptyLanguageTemplate(meta)
      const blob = new Blob([templateContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `imify_locale_${meta.languageCode}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setMetaError(err.message || "Failed to generate template.")
    }
  }

  const handleNextStep = () => {
    if (!languageName.trim() || !languageCode.trim()) {
      setMetaError("Language Name and Language Code are required.")
      return
    }
    setMetaError(null)
    setStep(2)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setUploadError(null)
    setParsedData(null)
    setCompletionStats(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)

        if (!parsed._meta) {
          throw new Error("Invalid format: Missing _meta block at root.")
        }
        if (!parsed._meta.languageCode || !parsed._meta.languageName) {
          throw new Error("Invalid format: _meta must contain languageCode and languageName.")
        }

        setParsedData(parsed)

        // Calculate preview completion rate based on English source bundles in i18n
        const namespaces = [
          "common", "workspace", "settings", "devMode", "about", "homepage",
          "processor", "splitter", "splicing", "filling", "pattern",
          "diffchecker", "inspector", "backgroundRemover", "upscaler",
          "qrGenerator", "qrReader"
        ]

        let totalKeys = 0
        let completedKeys = 0

        for (const ns of namespaces) {
          const baseNs = i18n.getResourceBundle("en", ns)
          const targetNs = parsed[ns]
          const details = calculateCompletionDetails(targetNs, baseNs)
          totalKeys += details.total
          completedKeys += details.completed
        }

        const rate = totalKeys === 0 ? 1.0 : completedKeys / totalKeys
        setCompletionStats({
          completed: completedKeys,
          total: totalKeys,
          rate
        })
      } catch (err: any) {
        setUploadError(err.message || "Failed to parse JSON file.")
        setSelectedFile(null)
      }
    }
    reader.readAsText(file)
  }

  const handleApply = async () => {
    if (!selectedFile) return
    setIsApplying(true)
    setUploadError(null)
    try {
      const meta = await importLanguageAtRuntime(selectedFile)
      onSuccess?.(meta)
      handleClose()
    } catch (err: any) {
      setUploadError(err.message || "Failed to import language bundle.")
    } finally {
      setIsApplying(false)
    }
  }

  const handleClose = () => {
    if (isApplying) return
    setStep(1)
    setLanguageName("")
    setLanguageCode("")
    setAuthorName("")
    setAuthorGithub("")
    setMetaError(null)
    setSelectedFile(null)
    setUploadError(null)
    setParsedData(null)
    setCompletionStats(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onClose()
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md w-full"
      contentClassName="p-6 flex flex-col gap-6"
    >
      <div className="contents" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Languages className="w-5 h-5 text-sky-500" />
            <span>Import Custom Translation</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1
              ? "Step 1: Set language metadata and download the template."
              : "Step 2: Upload your translated JSON file to apply."}
          </p>
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Language Name
              </label>
              <input
                type="text"
                placeholder="e.g. Français"
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Language Code
              </label>
              <input
                type="text"
                placeholder="e.g. fr"
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Author Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Jean Dupont"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                GitHub Profile URL (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. https://github.com/jeandupont"
                value={authorGithub}
                onChange={(e) => setAuthorGithub(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {metaError && (
              <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{metaError}</span>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="w-full gap-2 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Select Translation JSON
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 gap-2 border-slate-200 dark:border-slate-800"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose JSON</span>
                </Button>
                <span className="text-xs text-slate-500 truncate">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </span>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {uploadError && (
                <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {parsedData && completionStats && (
              <div className="mt-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 space-y-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {parsedData._meta.languageName} ({parsedData._meta.languageCode})
                  </span>
                  <span className="text-xs text-slate-500">
                    Version {parsedData._meta.version || "1.0.0"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span>Completion Progress</span>
                    <span>
                      {Math.round(completionStats.rate * 100)}% ({completionStats.completed}/
                      {completionStats.total} keys)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-350"
                      style={{ width: `${completionStats.rate * 100}%` }}
                    />
                  </div>
                </div>

                {parsedData._meta.maintainers && parsedData._meta.maintainers.length > 0 && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold block mb-0.5 text-slate-600 dark:text-slate-400">
                      Maintainers:
                    </span>
                    {parsedData._meta.maintainers.map((m: any, idx: number) => (
                      <div key={idx}>
                        • {m.name} ({m.role}) - <a href={m.github} target="_blank" rel="noreferrer" className="text-sky-500 hover:underline">{m.github}</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            onClick={step === 1 ? handleClose : () => setStep(1)}
            className="text-slate-600 dark:text-slate-400"
          >
            {step === 2 && <ArrowLeft className="w-4 h-4 mr-1.5" />}
            <span>{step === 1 ? "Cancel" : "Back"}</span>
          </Button>

          <div className="flex items-center gap-2">
            {step === 1 ? (
              <Button
                onClick={handleNextStep}
                disabled={!languageName.trim() || !languageCode.trim()}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                disabled={!selectedFile || isApplying}
                className="bg-sky-500 hover:bg-sky-600 text-white gap-2"
              >
                {isApplying && <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />}
                <span>Apply Language</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}
