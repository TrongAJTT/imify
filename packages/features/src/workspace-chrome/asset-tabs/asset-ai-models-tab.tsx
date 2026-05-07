"use client"

import React, { useEffect, useState } from "react"
import { Trash2, Image, Cpu, Download } from "lucide-react"
import { Button, BodyText, MutedText } from "@imify/ui"
import { formatFileSize } from "@imify/core"
import { BACKGROUND_REMOVAL_MODELS, type AIModelMetadata } from "../../background-removal/models"
import { ModelDownloadDialog } from "../../background-removal/model-download-dialog"
import { useToast } from "@imify/core/hooks/use-toast"
import { ToastContainer } from "@imify/ui/components/toast-container"

export function AssetAIModelsTab() {
  const [cachedModelIds, setCachedModelIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [modelToDownload, setModelToDownload] = useState<AIModelMetadata | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const { toasts, hide, success, error } = useToast()

  const MODEL_CATEGORIES = [
    {
      id: "background-remover",
      label: "Background Remover",
      icon: <Image size={16} className="text-pink-500" />,
      models: BACKGROUND_REMOVAL_MODELS
    },
    // Future categories can be added here easily:
    // {
    //   id: "upscaler",
    //   label: "Image Upscaler",
    //   icon: <Sparkles size={16} className="text-amber-500" />,
    //   models: UPSCALER_MODELS
    // }
  ]

  const allModels = MODEL_CATEGORIES.flatMap(cat => cat.models)

  const checkCache = async () => {
    setIsLoading(true)
    try {
      const cache = await caches.open("transformers-cache")
      const keys = await cache.keys()
      const cachedIds = new Set<string>()

      for (const model of allModels) {
        for (const variant of model.variants) {
          // A variant is considered cached if there's a request in cache containing the model ID 
          // AND specific characteristics of the variant if we can distinguish them.
          // For now, transformers.js caches by model path. 
          // If variants share the same path but different config (dtype/quantized), 
          // we might need more complex check, but usually they are different files.
          const isCached = keys.some(request => {
            const url = request.url.toLowerCase()
            const modelMatch = url.includes(model.id.toLowerCase())
            // Check for dtype or quantized in URL/filename
            if (variant.quantized) return modelMatch && url.includes('quantized')
            if (variant.dtype === 'fp16') return modelMatch && url.includes('fp16')
            return modelMatch
          })

          if (isCached) {
            cachedIds.add(`${model.id}:${variant.id}`)
          }
        }
      }

      setCachedModelIds(cachedIds)
    } catch (error) {
      console.error("Failed to check AI model cache:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkCache()
  }, [])

  const handleDelete = async (model: AIModelMetadata, variant: any) => {
    const shouldDelete = window.confirm(`Delete cached files for "${model.name} (${variant.label})"?`)
    if (!shouldDelete) return

    try {
      const cache = await caches.open("transformers-cache")
      const keys = await cache.keys()

      for (const request of keys) {
        const url = request.url.toLowerCase()
        const modelMatch = url.includes(model.id.toLowerCase())
        let variantMatch = false

        if (variant.quantized) variantMatch = url.includes('quantized')
        else if (variant.dtype === 'fp16') variantMatch = url.includes('fp16')
        else variantMatch = !url.includes('quantized') && !url.includes('fp16')

        if (modelMatch && variantMatch) {
          await cache.delete(request)
        }
      }

      await checkCache()
      success("Model deleted", `Successfully cleared ${variant.label} for ${model.name}.`)
    } catch (err) {
      console.error("Failed to delete model cache:", err)
      error("Delete failed", "Failed to delete model files.")
    }
  }

  const handleDownloadConfirm = async () => {
    if (!modelToDownload) return
    const model = modelToDownload
    const variantId = selectedVariantId
    setModelToDownload(null)

    const variant = model.variants.find(v => v.id === variantId) || model.variants[0]
    success("Download started", `Preparing to download ${model.name} (${variant.label}).`)

    try {
      const worker = new Worker(
        new URL("../../background-removal/background-removal.worker.ts", import.meta.url),
        { type: "module" }
      )

      worker.postMessage({
        action: "warm-up",
        payload: {
          options: {
            modelId: model.id,
            dtype: variant.dtype,
            quantized: variant.quantized
          }
        }
      })

      worker.onmessage = async (e) => {
        if (e.data.action === "warm-up-complete") {
          success("Model ready", `${model.name} ${variant.label} cached successfully.`)
          setTimeout(async () => { await checkCache() }, 500)
          worker.terminate()
        } else if (e.data.action === "error") {
          error("Download failed", `Failed to download ${model.name}.`)
          worker.terminate()
        }
      }
    } catch (err) {
      console.error("Failed to start download:", err)
      error("Download failed", "Failed to initialize background downloader.")
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/80 dark:bg-slate-950/40">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8">
          <div className="bg-white dark:bg-indigo-500/10 p-5 rounded-xl flex gap-4 border border-slate-200 dark:border-indigo-500/20 shadow-sm">
            <Cpu className="text-indigo-500 shrink-0" size={20} />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <BodyText className="text-sm font-bold text-slate-800 dark:text-indigo-300">
                  About AI Models & Engine
                </BodyText>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-700">
                  <div className={`w-1.5 h-1.5 rounded-full ${typeof SharedArrayBuffer !== 'undefined' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-tight">
                    {typeof SharedArrayBuffer !== 'undefined' ? 'Multi-thread Active' : 'Asyncify Fallback'}
                  </span>
                </div>
              </div>
              <MutedText className="text-xs text-slate-600 dark:text-indigo-400/80 leading-relaxed">
                Imify uses <strong>ONNX Runtime Web</strong> to run lightweight AI models 100% locally. These models are downloaded once and cached for offline use, ensuring your data never leaves your device.
              </MutedText>
            </div>
          </div>

          {MODEL_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-5">
              <div className="flex items-center gap-2.5 px-1">
                {category.icon}
                <Subheading className="text-sm font-extrabold tracking-tight uppercase text-slate-800 dark:text-slate-200">{category.label}</Subheading>
              </div>

              <div className="space-y-5">
                {category.models.map((model) => (
                  <div
                    key={model.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col gap-6"
                  >
                    {/* Header: Model Main Info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3">
                          <BodyText className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            {model.name}
                          </BodyText>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                            {model.source}
                          </span>
                        </div>
                        <MutedText className="text-sm leading-relaxed max-w-3xl text-slate-600 dark:text-slate-400">
                          {model.description}
                        </MutedText>
                        <div className="flex items-center gap-3 pt-1">
                          <a
                            href={model.authorUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-pink-500 hover:text-pink-600 font-bold transition-colors"
                          >
                            by {model.author}
                          </a>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <MutedText className="text-xs font-medium">{model.license} License</MutedText>
                        </div>
                      </div>
                    </div>

                    {/* Variant Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {model.variants.map((variant) => {
                        const isCached = cachedModelIds.has(`${model.id}:${variant.id}`)

                        return (
                          <div
                            key={variant.id}
                            className={`group relative p-4 rounded-xl border transition-all duration-300 flex flex-col justify-start gap-1.5 ${isCached
                              ? 'bg-emerald-50/20 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/30 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.12)]'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] hover:border-pink-300 dark:hover:border-pink-500/40'
                              }`}
                          >
                            {/* Absolute Action Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (isCached) {
                                  handleDelete(model, variant)
                                } else {
                                  setSelectedVariantId(variant.id)
                                  setModelToDownload(model)
                                }
                              }}
                              className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-xl shrink-0 border transition-all z-10 ${isCached
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-red-500/20 shadow-sm"
                                : "bg-slate-50 border-slate-100 text-slate-400 hover:text-pink-600 hover:bg-pink-50 hover:border-pink-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-pink-500/10 shadow-sm"
                                }`}
                            >
                              {isCached ? <Trash2 size={14} /> : <Download size={14} />}
                            </Button>

                            {/* Variant Header: Label & Size */}
                            <div className="flex items-start justify-between gap-3 pr-10">
                              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                                <BodyText className={`text-[13px] font-black whitespace-nowrap tracking-tight ${isCached ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {variant.label}
                                </BodyText>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${isCached
                                  ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                  : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                  }`}>
                                  {formatFileSize(variant.sizeBytes)}
                                </span>
                                {isCached && (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse shrink-0" />
                                )}
                              </div>
                            </div>

                            {/* Variant Footer: Description */}
                            {variant.description && (
                              <MutedText className="text-[12px] leading-relaxed italic font-medium opacity-80 text-slate-500 dark:text-slate-400 break-words">
                                {variant.description}
                              </MutedText>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {modelToDownload && (
          <ModelDownloadDialog
            isOpen={!!modelToDownload}
            onClose={() => setModelToDownload(null)}
            onConfirm={handleDownloadConfirm}
            model={modelToDownload}
            variantId={selectedVariantId}
            confirmLabel="Download"
          />
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <MutedText className="text-xs italic font-medium text-slate-500">
          AI models are stored securely in your browser's Cache Storage.
        </MutedText>
        <Button variant="outline" size="sm" onClick={checkCache} className="h-9 px-4 text-xs font-bold border-slate-200 hover:bg-slate-50 transition-colors">
          Refresh Status
        </Button>
      </div>

      <ToastContainer toasts={toasts} onRemove={hide} />
    </div>
  )
}
function Subheading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-slate-900 dark:text-slate-100 ${className}`}>{children}</h3>
}
