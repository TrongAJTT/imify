import React, { useState, useMemo } from "react"
import { Download, ShieldCheck, ExternalLink, Wifi, Info } from "lucide-react"
import { BaseDialog, Button } from "@imify/ui"
import { formatFileSize } from "@imify/core"
import { type AIModelMetadata } from "./models"

interface ModelDownloadDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  model: AIModelMetadata
  variantId: string
  confirmLabel?: string
}

export function ModelDownloadDialog({
  isOpen,
  onClose,
  onConfirm,
  model,
  variantId,
  confirmLabel = "Download & Start"
}: ModelDownloadDialogProps) {
  const [agreed, setAgreed] = useState(false)

  const selectedVariant = useMemo(() => 
    model.variants.find(v => v.id === variantId) || model.variants[0],
  [model.variants, variantId])

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md"
      contentClassName="w-full p-0 overflow-hidden rounded-xl"
    >
      <div className="p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500">
            <Download size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Download AI Model</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {model.name} — {selectedVariant.label}
            </p>
          </div>
        </div>

        {/* Variant Info */}
        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium tracking-tight">Model Source</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{model.source}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium tracking-tight">Download Size</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">~{formatFileSize(selectedVariant.sizeBytes)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium tracking-tight">License</span>
              <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                {model.license}
                <a href={model.licenseUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {selectedVariant.description && (
            <div className="flex items-start gap-2 px-1">
              <Info size={12} className="text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500 italic leading-relaxed">
                {selectedVariant.description}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex gap-3 items-start p-3 rounded-lg border border-amber-100 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
            <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 block">
                Privacy & Data
              </span>
              <p className="text-[10px] leading-relaxed text-amber-700/80 dark:text-amber-450">
                This model runs locally in your browser. Your images never leave your device. Imify provides the interface to run these models but is not the distributor.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-lg border border-sky-100 bg-sky-50/50 dark:border-sky-500/20 dark:bg-sky-500/5">
            <Wifi className="text-sky-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-400 block">
                Internet Connection
              </span>
              <p className="text-[10px] leading-relaxed text-sky-700/80 dark:text-sky-450">
                A stable internet connection is required for the initial download. Once cached, the model will be available for offline use.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-indigo-500 checked:bg-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <svg
                className="absolute left-1 top-1 h-3 w-3 fill-white opacity-0 transition-opacity peer-checked:opacity-100"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
              I agree to the <a href={model.termsUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Terms of Use and License</a>.
            </span>
          </label>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={onConfirm}
          disabled={!agreed}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {confirmLabel}
        </Button>
      </div>
    </BaseDialog>
  )
}
