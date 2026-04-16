import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, FolderOpen, ImagePlus, RotateCcw, Save, Sparkles, Stamp, Type, UploadCloud, X } from "lucide-react"

import { Button } from "@/options/components/ui/button"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { NumberInput } from "@/options/components/ui/number-input"
import { TextInput } from "@/options/components/ui/text-input"
import { BaseDialog } from "@/options/components/ui/base-dialog"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { Tooltip } from "@/options/components/tooltip"
import { LabelText } from "@/options/components/ui/typography"
import type { BatchWatermarkConfig } from "@/options/components/batch/types"
import {
  DEFAULT_BATCH_WATERMARK,
  WATERMARK_POSITION_OPTIONS,
  WATERMARK_PREVIEW_DATA_URL,
  applyWatermarkToImageBlob,
  toDataUrl
} from "@/options/components/batch/watermark"
import { watermarkStorage } from "@/core/indexed-db"
import { WatermarkOpenSavedDialog } from "@/options/components/batch/watermark-open-saved-dialog"
import { WatermarkSaveDialog, type WatermarkSaveAction } from "@/options/components/batch/watermark-save-dialog"
import {
  buildWatermarkSummary,
  cloneWatermarkConfig,
  findMatchingSavedWatermarkId,
  isWatermarkConfigEqual
} from "@/options/components/batch/watermark-config"
import { useWatermarkStore, type SavedWatermarkItem, type WatermarkContext } from "@/options/stores/watermark-store"

interface BatchWatermarkDialogProps {
  isOpen: boolean
  setupContext: WatermarkContext
  initialConfig: BatchWatermarkConfig
  onClose: () => void
  onSave: (next: BatchWatermarkConfig) => void
}

export function BatchWatermarkDialog({
  isOpen,
  setupContext,
  initialConfig,
  onClose,
  onSave
}: BatchWatermarkDialogProps) {
  const [draft, setDraft] = useState<BatchWatermarkConfig>(cloneWatermarkConfig(initialConfig))
  const [previewUrl, setPreviewUrl] = useState<string>(WATERMARK_PREVIEW_DATA_URL)
  const [isLogoLoading, setIsLogoLoading] = useState(false)
  const [isFilePickerInteracting, setIsFilePickerInteracting] = useState(false)
  const [isOpenSavedDialogOpen, setIsOpenSavedDialogOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isOverwritePickerOpen, setIsOverwritePickerOpen] = useState(false)
  const [saveAction, setSaveAction] = useState<WatermarkSaveAction>("save_new")
  const [saveName, setSaveName] = useState("")
  const [overwriteTarget, setOverwriteTarget] = useState<SavedWatermarkItem | null>(null)

  const savedWatermarks = useWatermarkStore((state) => state.savedWatermarks)
  const saveNewWatermark = useWatermarkStore((state) => state.saveNewWatermark)
  const overwriteSavedWatermark = useWatermarkStore((state) => state.overwriteSavedWatermark)
  const deleteSavedWatermark = useWatermarkStore((state) => state.deleteSavedWatermark)

  const savedMatchId = useMemo(() => findMatchingSavedWatermarkId(savedWatermarks, draft), [savedWatermarks, draft])

  const isDirty = useMemo(() => !isWatermarkConfigEqual(draft, initialConfig), [draft, initialConfig])

  useEffect(() => {
    if (isOpen) {
      setDraft(cloneWatermarkConfig(initialConfig))
      setIsOpenSavedDialogOpen(false)
      setIsSaveDialogOpen(false)
      setIsOverwritePickerOpen(false)
    }
  }, [isOpen, initialConfig])

  useEffect(() => {
    if (!overwriteTarget) {
      return
    }

    const refreshedTarget = savedWatermarks.find((entry) => entry.id === overwriteTarget.id) ?? null
    if (!refreshedTarget) {
      setOverwriteTarget(null)
      return
    }

    if (refreshedTarget.updatedAt !== overwriteTarget.updatedAt || refreshedTarget.name !== overwriteTarget.name) {
      setOverwriteTarget(refreshedTarget)
    }
  }, [overwriteTarget, savedWatermarks])

  useEffect(() => {
    if (!isFilePickerInteracting) {
      return
    }

    const releaseInteraction = () => {
      window.setTimeout(() => {
        setIsFilePickerInteracting(false)
      }, 250)
    }

    window.addEventListener("focus", releaseInteraction)

    return () => {
      window.removeEventListener("focus", releaseInteraction)
    }
  }, [isFilePickerInteracting])

  const summary = useMemo(() => buildWatermarkSummary(draft), [draft])
  const summaryWithSavedState = savedMatchId ? `${summary} · Saved` : summary

  // Load logo from IndexedDB if it exists but DataURL is missing (after refresh)
  useEffect(() => {
    if (isOpen && draft.type === "logo" && draft.logoBlobId && !draft.logoDataUrl) {
      void (async () => {
        try {
          const blob = await watermarkStorage.get(draft.logoBlobId!)
          if (blob) {
            const dataUrl = await toDataUrl(blob as File)
            setDraft(c => ({ ...c, logoDataUrl: dataUrl }))
          }
        } catch (err) {
          console.error("Failed to load logo from storage", err)
        }
      })()
    }
  }, [isOpen, draft.type, draft.logoBlobId, draft.logoDataUrl])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let active = true

    const renderPreview = async () => {
      try {
        // We need a stable preview base. If draft has a logo but it's not loaded yet, 
        // wait for it unless we have the DataUrl.
        if (draft.type === "logo" && !draft.logoDataUrl) return

        // Create an Image object to handle SVG decoding safely
        const img = new Image()
        const ready = new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("SVG Decode Failed"))
        })
        img.src = WATERMARK_PREVIEW_DATA_URL
        await ready

        // Create canvas to get a clean bitmap from SVG
        const canvas = document.createElement("canvas")
        canvas.width = 1200
        canvas.height = 800
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("No context")
        ctx.drawImage(img, 0, 0)

        // Convert canvas to blob for processing
        const sampleBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"))
        
        const watermarked = await applyWatermarkToImageBlob(sampleBlob, draft)
        if (!active) return

        const nextUrl = URL.createObjectURL(watermarked)

        setPreviewUrl((current) => {
          if (current.startsWith("blob:")) {
            URL.revokeObjectURL(current)
          }
          return nextUrl
        })
      } catch (err) {
        console.error("Failed to render preview", err)
        if (!active) return
        setPreviewUrl(WATERMARK_PREVIEW_DATA_URL)
      }
    }

    // Small debounce to avoid rendering too many frames while moving sliders
    const timeout = setTimeout(() => {
      void renderPreview()
    }, 150)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [draft, isOpen])

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsFilePickerInteracting(false)
    const file = event.target.files?.[0]
    if (!file) return

    setIsLogoLoading(true)
    try {
      const blobId = `logo_${Date.now()}`
      await watermarkStorage.save(blobId, file)
      const dataUrl = await toDataUrl(file)
      
      setDraft(c => ({
        ...c,
        logoDataUrl: dataUrl,
        logoBlobId: blobId
      }))
    } catch (err) {
      console.error("Failed to upload logo", err)
    } finally {
      setIsLogoLoading(false)
    }
  }

  const markFilePickerInteraction = () => {
    setIsFilePickerInteracting(true)
  }

  const defaultSaveName = useMemo(() => {
    const linkedEntry = savedWatermarks.find((entry) => entry.id === savedMatchId)
    if (linkedEntry) {
      return linkedEntry.name
    }

    const contextLabel = setupContext === "single" ? "Single" : "Batch"
    return `${contextLabel} Watermark ${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })}`
  }, [savedMatchId, savedWatermarks, setupContext])

  const openSaveDialog = () => {
    setSaveAction("save_new")
    setSaveName(defaultSaveName)
    setOverwriteTarget(null)
    setIsSaveDialogOpen(true)
  }

  const handleSaveActionChange = (nextAction: WatermarkSaveAction) => {
    if (nextAction === "overwrite" && !savedWatermarks.length) {
      return
    }

    setSaveAction(nextAction)
    if (nextAction === "overwrite") {
      setOverwriteTarget(null)
      setSaveName("")
      return
    }

    setSaveName(defaultSaveName)
  }

  const handleSaveWatermark = () => {
    const trimmedName = saveName.trim()
    if (!trimmedName) {
      return
    }

    if (saveAction === "save_new") {
      saveNewWatermark(trimmedName, draft)
      setIsSaveDialogOpen(false)
      return
    }

    if (!overwriteTarget) {
      return
    }

    overwriteSavedWatermark(overwriteTarget.id, trimmedName, draft)
    setIsSaveDialogOpen(false)
  }

  const handleCloseMainDialog = () => {
    setIsSaveDialogOpen(false)
    setIsOpenSavedDialogOpen(false)
    setIsOverwritePickerOpen(false)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  if (typeof document === "undefined") {
    return null
  }

  return (
    <>
      <BaseDialog
        isOpen={isOpen}
        onClose={handleCloseMainDialog}
        isDirty={isDirty}
        shouldBlockCloseAttempt={(eventType) => eventType === "cancel" && isFilePickerInteracting}
        contentClassName="w-full max-w-3xl rounded-xl overflow-hidden flex flex-col"
      >
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 dark:bg-sky-500/10 rounded-xl">
              <Stamp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Watermarking</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{summaryWithSavedState}</p>
            </div>
          </div>
          <button
            onClick={handleCloseMainDialog}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Close watermark dialog"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-0 overflow-hidden flex-1">
          <div className="p-5 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-100/30 dark:bg-slate-950/20 overflow-y-auto">
            <div className="relative w-full group overflow-hidden">
              <img
                src={previewUrl}
                alt="Watermark preview"
                className="w-full aspect-[3/2] object-contain rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 pointer-events-none transition-all duration-300"
              />

              {draft.type !== "none" && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {WATERMARK_POSITION_OPTIONS.map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => setDraft((current) => ({ ...current, position: pos.value }))}
                      className={`pointer-events-auto rounded transition-all flex items-center justify-center
                        ${
                          draft.position === pos.value
                            ? "bg-sky-500/30 ring-2 ring-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                            : "bg-slate-900/10 hover:bg-white/20 hover:ring-1 hover:ring-white/40"
                        }`}
                      title={pos.label}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          draft.position === pos.value ? "bg-white scale-125" : "bg-white/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Preview Image (1200x800 px)</span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                Hover preview to change position
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4 bg-slate-50/40 dark:bg-slate-800/20 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, type: "none" }))}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                  draft.type === "none"
                    ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, type: "text" }))}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1 ${
                  draft.type === "text"
                    ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                <Type size={12} /> Text
              </button>
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, type: "logo" }))}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1 ${
                  draft.type === "logo"
                    ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                <ImagePlus size={12} /> Logo
              </button>
            </div>

            {draft.type === "none" ? (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 px-4 py-6 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                  <Sparkles size={16} />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No watermark applied</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Select Text or Logo tab to configure your watermark placeholder.
                </p>
              </div>
            ) : null}

            {draft.type === "logo" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Opacity (%)"
                    className="w-full"
                    min={1}
                    max={100}
                    step={1}
                    value={draft.opacity}
                    onChangeValue={(value) => setDraft((current) => ({ ...current, opacity: value }))}
                  />

                  <NumberInput
                    label="Padding (px)"
                    min={0}
                    value={draft.paddingPx}
                    onChangeValue={(value) => setDraft((current) => ({ ...current, paddingPx: Math.max(0, value || 0) }))}
                  />
                </div>
              </div>
            )}

            {draft.type === "text" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Watermark text"
                    value={draft.text}
                    onChange={(nextText) => setDraft((current) => ({ ...current, text: nextText }))}
                    placeholder="Your brand name"
                  />
                  <NumberInput
                    label="Padding (px)"
                    min={0}
                    value={draft.paddingPx}
                    onChangeValue={(value) => setDraft((current) => ({ ...current, paddingPx: Math.max(0, value || 0) }))}
                  />
                  <NumberInput
                    label="Text scale (%)"
                    min={2}
                    max={20}
                    value={draft.textScalePercent}
                    onChangeValue={(value) =>
                      setDraft((current) => ({ ...current, textScalePercent: Math.max(2, Math.min(20, value || 2)) }))
                    }
                  />
                  <NumberInput
                    label="Text rotation (deg)"
                    min={-180}
                    max={180}
                    value={draft.textRotationDeg ?? 0}
                    onChangeValue={(value) =>
                      setDraft((current) => ({ ...current, textRotationDeg: Math.max(-180, Math.min(180, value || 0)) }))
                    }
                  />
                </div>
                <ColorPickerPopover
                  label="Text color"
                  value={draft.textColor}
                  onChange={(nextColor) => setDraft((current) => ({ ...current, textColor: nextColor }))}
                  enableAlpha
                  enableGradient
                />
              </div>
            )}

            {draft.type === "logo" ? (
              <div className="pt-2 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div>
                    <LabelText className="text-xs">Logo image (PNG)</LabelText>
                    <div className="mt-1 flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <input
                        type="file"
                        id="watermark-logo-upload"
                        accept="image/png"
                        onChange={handleLogoUpload}
                        onClick={markFilePickerInteraction}
                        className="hidden"
                      />
                      <label
                        htmlFor="watermark-logo-upload"
                        onClick={markFilePickerInteraction}
                        className={`cursor-pointer px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-2
                        ${
                          isLogoLoading
                            ? "bg-slate-100 text-slate-400"
                            : "bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
                        }`}
                      >
                        {isLogoLoading ? (
                          <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud size={14} />
                        )}
                        {draft.logoDataUrl ? "Change logo" : "Upload logo"}
                      </label>
                      {draft.logoDataUrl && !isLogoLoading && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={12} />
                          READY
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Logo width (%)"
                      min={2}
                      max={40}
                      value={draft.logoScalePercent}
                      onChangeValue={(value) =>
                        setDraft((current) => ({ ...current, logoScalePercent: Math.max(2, Math.min(40, value || 2)) }))
                      }
                    />
                    <NumberInput
                      label="Logo rotation (deg)"
                      min={-180}
                      max={180}
                      value={draft.logoRotationDeg ?? 0}
                      onChangeValue={(value) =>
                        setDraft((current) => ({ ...current, logoRotationDeg: Math.max(-180, Math.min(180, value || 0)) }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-full grid-cols-[auto_1fr_1fr] gap-2 sm:flex sm:w-auto sm:items-center">
            <Tooltip content="Reset watermark settings to defaults">
              <button
                type="button"
                onClick={() => setDraft(cloneWatermarkConfig(DEFAULT_BATCH_WATERMARK))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-500/30 hover:bg-red-50 transition-all dark:text-slate-400 dark:hover:bg-red-500/10"
                aria-label="Reset watermark settings"
              >
                <RotateCcw size={15} />
              </button>
            </Tooltip>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsOpenSavedDialogOpen(true)}
              className="px-3 w-full sm:w-auto"
            >
              <FolderOpen size={14} />
              Open Saved
            </Button>

            <Button variant="secondary" size="sm" onClick={openSaveDialog} className="px-3 w-full sm:w-auto">
              <Save size={14} />
              Save
            </Button>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
            <SecondaryButton onClick={handleCloseMainDialog} className="px-6 font-semibold w-full sm:w-auto">Cancel</SecondaryButton>
            <Button
              onClick={() => {
                onSave(cloneWatermarkConfig(draft))
                handleCloseMainDialog()
              }}
              disabled={!isDirty}
              className="px-6 w-full sm:w-auto flex items-center gap-2 shadow-lg shadow-sky-500/10 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Apply Pattern
            </Button>
          </div>
        </div>
      </BaseDialog>

      <WatermarkOpenSavedDialog
        isOpen={isOpenSavedDialogOpen}
        onClose={() => setIsOpenSavedDialogOpen(false)}
        items={savedWatermarks}
        initialSelectedId={savedMatchId}
        onDelete={(id) => {
          deleteSavedWatermark(id)
        }}
        onConfirm={(item) => {
          setDraft(cloneWatermarkConfig(item.config))
          setIsOpenSavedDialogOpen(false)
        }}
        title="Open Saved Watermark"
        confirmLabel="Open"
      />

      <WatermarkSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        action={saveAction}
        onActionChange={handleSaveActionChange}
        name={saveName}
        onNameChange={setSaveName}
        overwriteTarget={overwriteTarget}
        hasSavedItems={savedWatermarks.length > 0}
        onChooseOverwriteTarget={() => {
          setIsSaveDialogOpen(false)
          setIsOverwritePickerOpen(true)
        }}
        onSave={handleSaveWatermark}
      />

      <WatermarkOpenSavedDialog
        isOpen={isOverwritePickerOpen}
        onClose={() => {
          setIsOverwritePickerOpen(false)
          setIsSaveDialogOpen(true)
        }}
        items={savedWatermarks}
        allowDelete={false}
        initialSelectedId={overwriteTarget?.id ?? null}
        onConfirm={(item) => {
          setOverwriteTarget(item)
          setSaveAction("overwrite")
          setSaveName(item.name)
          setIsOverwritePickerOpen(false)
          setIsSaveDialogOpen(true)
        }}
        title="Select Watermark to Overwrite"
        confirmLabel="Select"
      />
    </>
  )
}
