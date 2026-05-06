"use client"

import React, { useState } from "react"
import { Download, ShieldCheck, ExternalLink, AlertTriangle } from "lucide-react"
import { BaseDialog, Subheading, BodyText, MutedText, Button } from "@imify/ui"
import { type AIModelMetadata } from "./models"

interface ModelDownloadDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  model: AIModelMetadata
}

export function ModelDownloadDialog({ isOpen, onClose, onConfirm, model }: ModelDownloadDialogProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full max-w-md p-0 overflow-hidden"
    >
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-pink-50 dark:bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500">
            <Download size={32} />
          </div>
          <div className="space-y-1">
            <Subheading className="text-xl font-bold">Download AI Model</Subheading>
            <MutedText className="text-sm">
              To use the Background Remover, you need to download the {model.name} model.
            </MutedText>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Model Source</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{model.source}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Download Size</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">~{model.size}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">License</span>
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              {model.license}
              <a href={model.licenseUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3 items-start p-3 rounded-lg border border-amber-100 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
            <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <BodyText className="text-[11px] font-semibold !text-amber-800 dark:!text-amber-400">
                Privacy & Data
              </BodyText>
              <MutedText className="text-[10px] leading-relaxed !text-amber-700/80 dark:!text-amber-400/80">
                This model runs locally in your browser. Your images never leave your device. By downloading, you agree to the author's terms of use.
              </MutedText>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-pink-500 checked:bg-pink-500 dark:border-slate-700 dark:bg-slate-900"
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
              I agree to the <a href={model.termsUrl} target="_blank" rel="noreferrer" className="text-pink-500 hover:underline">Terms of Use</a> and License.
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
          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
        >
          Download & Start
        </Button>
      </div>
    </BaseDialog>
  )
}
