"use client"

import React from "react"
import { Check, Cpu, Brain, Award, Info, Scale, Shield } from "lucide-react"
import { BaseDialog, Subheading, BodyText, MutedText, Button } from "@imify/ui"
import { BACKGROUND_REMOVAL_MODELS, type AIModelMetadata, type AIModelVariant } from "./models"
import { formatFileSize } from "@imify/core"

interface ModelVariantDialogProps {
  isOpen: boolean
  onClose: () => void
  modelId: string
  setModelId: (id: string) => void
  variantId: string
  setVariantId: (id: string) => void
}

export function ModelVariantDialog({
  isOpen,
  onClose,
  modelId,
  setModelId,
  variantId,
  setVariantId
}: ModelVariantDialogProps) {
  const selectedModel = BACKGROUND_REMOVAL_MODELS.find((m) => m.id === modelId) ?? BACKGROUND_REMOVAL_MODELS[0]
  const selectedVariant = selectedModel.variants.find(v => v.id === variantId) ?? selectedModel.variants[0]

  const handleModelSelect = (id: string) => {
    const model = BACKGROUND_REMOVAL_MODELS.find(m => m.id === id)
    if (!model) return
    setModelId(id)
    // Default to the first variant or standard variant of the new model
    setVariantId(model.defaultVariantId || model.variants[0]?.id)
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl w-full"
      contentClassName="p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto"
    >
      <div className="contents" onClick={(event) => event.stopPropagation()}>
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="text-pink-500" size={20} />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Engine Configuration</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose the neural network architecture and hardware precision variant optimized for your environment.
          </p>
        </div>

        {/* 1. Model Selection Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-pink-500" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Select AI Model</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BACKGROUND_REMOVAL_MODELS.map((model) => {
              const isActive = model.id === modelId
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelSelect(model.id)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 outline-none select-none relative group h-full ${
                    isActive
                      ? "border-pink-500 bg-pink-50/20 dark:bg-pink-950/10 shadow-md ring-1 ring-pink-500"
                      : "border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  }`}
                >
                  <div className="flex items-start justify-between w-full gap-2 mb-1.5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {model.name}
                    </h3>
                    {isActive ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white shrink-0 shadow-sm animate-in zoom-in-50 duration-150">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mb-3 flex-1">
                    {model.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 uppercase tracking-wider">
                      {model.usecase}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      By {model.author}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Variant Selection */}
        <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-pink-500" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Select Precision Variant</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedModel.variants.map((v) => {
              const isActive = v.id === variantId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all duration-200 outline-none select-none relative ${
                    isActive
                      ? "border-purple-500 bg-purple-50/20 dark:bg-purple-950/10 shadow-sm ring-1 ring-purple-500"
                      : "border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {v.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {formatFileSize(v.sizeBytes)}
                    </span>
                  </div>
                  {v.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      {v.description}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Current Selection & Information Details */}
        <div className="p-4 rounded-xl bg-pink-50/30 dark:bg-pink-950/10 border border-pink-100 dark:border-pink-900/30 shadow-inner space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="text-pink-500" size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Current Selection Details</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest">
              Ready to Load
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[90px] shrink-0">AI Model:</span>
                <span className="font-medium text-pink-600 dark:text-pink-400">{selectedModel.name}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[90px] shrink-0">Suitable for:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 lowercase italic">
                  {selectedModel.usecase}
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[90px] shrink-0">Description:</span>
                <span className="leading-relaxed">{selectedModel.description}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[90px] shrink-0">Precision:</span>
                <span>{selectedVariant.label}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[90px] shrink-0">Storage Size:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  ~{formatFileSize(selectedVariant.sizeBytes)}
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[90px] shrink-0">License:</span>
                <a
                  href={selectedModel.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pink-500 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <Scale size={12} />
                  {selectedModel.license}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center pt-2.5 border-t border-slate-100 dark:border-slate-850">
          <Button
            onClick={onClose}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-lg px-6 font-semibold shrink-0 shadow-md shadow-pink-500/10"
          >
            Apply & Close
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}
