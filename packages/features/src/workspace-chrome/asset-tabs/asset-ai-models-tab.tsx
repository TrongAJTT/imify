"use client"

import React, { useEffect, useState } from "react"
import { Trash2, HardDrive, AlertCircle, Image, Cpu, Sparkles, Download } from "lucide-react"
import { Button, BodyText, MutedText } from "@imify/ui"
import { BACKGROUND_REMOVAL_MODELS, type AIModelMetadata } from "../../background-removal/models"
import { ModelDownloadDialog } from "../../background-removal/model-download-dialog"
import { useToast } from "@imify/core/hooks/use-toast"
import { ToastContainer } from "@imify/ui/components/toast-container"

export function AssetAIModelsTab() {
  const [cachedModelIds, setCachedModelIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [modelToDownload, setModelToDownload] = useState<AIModelMetadata | null>(null)
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
        const isCached = keys.some(request => request.url.includes(model.id))
        if (isCached) {
          cachedIds.add(model.id)
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

  const handleDelete = async (model: AIModelMetadata) => {
    const shouldDelete = window.confirm(`Delete cached files for model "${model.name}"? You will need to download it again to use background removal.`)
    if (!shouldDelete) return

    try {
      const cache = await caches.open("transformers-cache")
      const keys = await cache.keys()

      // Delete all entries related to this model
      for (const request of keys) {
        if (request.url.includes(model.id)) {
          await cache.delete(request)
        }
      }

      await checkCache()

      success("Model deleted", `Successfully cleared cached files for ${model.name}.`)
    } catch (err) {
      console.error("Failed to delete model cache:", err)
      error("Delete failed", "Failed to delete model files. Please try again.")
    }
  }

  const handleDownloadConfirm = async () => {
    if (!modelToDownload) return
    const model = modelToDownload
    setModelToDownload(null)

    success("Download started", `Preparing to download ${model.name}.`)

    try {
      const worker = new Worker(new URL("../../background-removal/worker.ts", import.meta.url))

      worker.postMessage({
        action: "warm-up",
        payload: {
          options: { modelId: model.id }
        }
      })

      worker.onmessage = async (e) => {
        if (e.data.action === "warm-up-complete") {
          success("Model ready", `${model.name} has been cached for offline use.`)
          
          // Give the browser a moment to finalize cache writing
          setTimeout(async () => {
            await checkCache()
          }, 500)
          
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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-500/20">
            <AlertCircle className="text-blue-500 shrink-0" size={18} />
            <div className="space-y-1">
              <BodyText className="text-xs font-semibold !text-blue-800 dark:!text-blue-300">
                About AI Models
              </BodyText>
              <MutedText className="text-[11px] !text-blue-700/80 dark:!text-blue-400/80 leading-relaxed">
                Imify uses lightweight AI models that run 100% on your device. These models are downloaded once and cached in your browser for offline use.
              </MutedText>
            </div>
          </div>

          {MODEL_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2">
                {category.icon}
                <Subheading className="text-sm font-bold">{category.label}</Subheading>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.models.map((model) => {
                  const isCached = cachedModelIds.has(model.id)

                  return (
                    <div
                      key={model.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between gap-3 relative group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <BodyText className="font-bold truncate text-[13px]">{model.name}</BodyText>
                            {isCached && (
                              <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-tighter">
                                Cached
                              </span>
                            )}
                          </div>
                          <MutedText className="text-[11px] leading-snug line-clamp-2 mb-1 h-8">{model.description}</MutedText>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/50">
                            <MutedText className="text-[10px] whitespace-nowrap">
                              Size: ~{model.size}
                            </MutedText>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <MutedText className="text-[10px] truncate">
                              {model.license}
                            </MutedText>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (isCached) {
                            handleDelete(model)
                          } else {
                            setModelToDownload(model)
                          }
                        }}
                        className={`absolute top-2 right-2 h-7 w-7 transition-all ${isCached
                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          }`}
                      >
                        {isCached ? <Trash2 size={14} /> : <Download size={14} />}
                      </Button>
                    </div>
                  )
                })}
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
            confirmLabel="Download"
          />
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 flex justify-between items-center">
        <MutedText className="text-[11px] italic">
          Models are stored in browser's Cache Storage
        </MutedText>
        <Button variant="outline" size="sm" onClick={checkCache} className="h-8 text-xs">
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
