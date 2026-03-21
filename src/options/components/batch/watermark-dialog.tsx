import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Save, Stamp, Type, X } from "lucide-react"

import { Button } from "@/options/components/ui/button"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { QualityInput } from "@/options/components/quality-input"
import { NumberInput } from "@/options/components/ui/number-input"
import type { BatchWatermarkConfig } from "@/options/components/batch/types"
import {
  DEFAULT_BATCH_WATERMARK,
  WATERMARK_POSITION_OPTIONS,
  WATERMARK_PREVIEW_DATA_URL,
  applyWatermarkToImageBlob,
  toDataUrl
} from "@/options/components/batch/watermark"

interface BatchWatermarkDialogProps {
  isOpen: boolean
  initialConfig: BatchWatermarkConfig
  onClose: () => void
  onSave: (next: BatchWatermarkConfig) => void
}

function toBlobFromDataUrl(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((response) => response.blob())
}

export function BatchWatermarkDialog({
  isOpen,
  initialConfig,
  onClose,
  onSave
}: BatchWatermarkDialogProps) {
  const [draft, setDraft] = useState<BatchWatermarkConfig>(initialConfig)
  const [previewUrl, setPreviewUrl] = useState<string>(WATERMARK_PREVIEW_DATA_URL)

  const summary = useMemo(() => {
    if (draft.type === "none") {
      return "None"
    }

    const typeLabel = draft.type === "text" ? "Text" : "Logo"
    const posLabel = WATERMARK_POSITION_OPTIONS.find((option) => option.value === draft.position)?.label || "Bottom-Right"
    return `${typeLabel} - ${posLabel}`
  }, [draft.position, draft.type])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let active = true

    const renderPreview = async () => {
      try {
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

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 dark:bg-sky-500/10 rounded-xl">
              <Stamp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Watermarking</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{summary}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-0">
          <div className="p-5 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-100/30 dark:bg-slate-950/20">
            <div className="relative w-full group overflow-hidden">
              <img
                src={previewUrl}
                alt="Watermark preview"
                className="w-full aspect-[3/2] object-contain rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 pointer-events-none transition-all duration-300"
              />

              {/* Position Overlays - Only show if not 'none' */}
              {draft.type !== "none" && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {WATERMARK_POSITION_OPTIONS.map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => setDraft((c) => ({ ...c, position: pos.value }))}
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

          <div className="p-5 space-y-4 bg-slate-50/40 dark:bg-slate-800/20">
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

            {draft.type !== "none" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <QualityInput
                    label="Opacity (%)"
                    value={draft.opacity}
                    onChange={v => setDraft(c => ({ ...c, opacity: v }))}
                  />

                  <NumberInput
                    label="Padding (px)"
                    min={0}
                    value={draft.paddingPx}
                    onChangeValue={(value) => setDraft((current) => ({ ...current, paddingPx: Math.max(0, value || 0) }))}
                  />
                </div>

                {draft.type === "text" && (
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="block text-xs font-medium">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Watermark text</span>
                      <input
                        type="text"
                        value={draft.text}
                        onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))}
                        className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                        placeholder="Your brand name"
                      />
                    </label>
                    <label className="block text-xs font-medium">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Text color</span>
                      <input
                        type="color"
                        value={draft.textColor}
                        onChange={(event) => setDraft((current) => ({ ...current, textColor: event.target.value }))}
                        className="mt-1 h-[38px] w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all focus:ring-2 focus:ring-sky-500/20"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {draft.type === "text" ? (
              <div className="pt-2">
                <NumberInput
                  label="Text scale (%)"
                  min={2}
                  max={20}
                  value={draft.textScalePercent}
                  onChangeValue={(value) =>
                    setDraft((current) => ({ ...current, textScalePercent: Math.max(2, Math.min(20, value || 2)) }))
                  }
                />
              </div>
            ) : null}

            {draft.type === "logo" ? (
              <div className="pt-2 animate-in fade-in duration-200">
                <label className="block text-xs font-medium">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Logo Image (PNG)</span>
                  <div className="mt-1 flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <input
                      type="file"
                      id="watermark-logo-upload"
                      accept="image/png"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        void toDataUrl(file).then((dataUrl) => {
                          setDraft((current) => ({ ...current, logoDataUrl: dataUrl }))
                        })
                      }}
                      className="hidden"
                    />
                    <label 
                      htmlFor="watermark-logo-upload"
                      className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      Choose file
                    </label>
                    <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                      {draft.logoDataUrl ? "Logo updated" : "No file selected"}
                    </span>
                  </div>
                </label>
                <div className="mt-4">
                  <NumberInput
                    label="Logo width (%)"
                    min={2}
                    max={40}
                    value={draft.logoScalePercent}
                    onChangeValue={(value) =>
                      setDraft((current) => ({ ...current, logoScalePercent: Math.max(2, Math.min(40, value || 2)) }))
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_BATCH_WATERMARK)}
            className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-500 hover:border-red-500/30 hover:bg-red-50 transition-all dark:text-slate-400 dark:hover:bg-red-500/10"
          >
            Reset to defaults
          </button>

          <div className="flex gap-3">
            <SecondaryButton onClick={onClose} className="px-6 font-semibold">Cancel</SecondaryButton>
            <Button
              onClick={() => {
                onSave(draft)
                onClose()
              }}
              className="px-6 flex items-center gap-2 shadow-lg shadow-sky-500/10 font-semibold"
            >
              <Save className="w-4 h-4 text-white" />
              Apply Pattern
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
