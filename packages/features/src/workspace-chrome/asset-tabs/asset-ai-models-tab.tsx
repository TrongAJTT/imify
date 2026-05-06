"use client"

import React, { useEffect, useState } from "react"
import { Trash2, HardDrive, AlertCircle } from "lucide-react"
import { Button, BodyText, MutedText } from "@imify/ui"
import { BACKGROUND_REMOVAL_MODELS, type AIModelMetadata } from "../../background-removal/models"

export function AssetAIModelsTab() {
  const [cachedModelIds, setCachedModelIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const checkCache = async () => {
    setIsLoading(true)
    try {
      const cache = await caches.open("transformers-cache")
      const keys = await cache.keys()
      const cachedIds = new Set<string>()
      
      // Check which models are in the cache
      // This is a simple heuristic: if the model path is in any request URL
      for (const model of BACKGROUND_REMOVAL_MODELS) {
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
    } catch (error) {
      console.error("Failed to delete model cache:", error)
      alert("Failed to delete model files. Please try again.")
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

          <div className="space-y-4">
            <Subheading className="text-sm font-bold">Available Models</Subheading>
            
            <div className="grid grid-cols-1 gap-4">
              {BACKGROUND_REMOVAL_MODELS.map((model) => {
                const isCached = cachedModelIds.has(model.id)
                
                return (
                  <div 
                    key={model.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-lg ${isCached ? "bg-green-50 dark:bg-green-500/10 text-green-600" : "bg-slate-50 dark:bg-slate-800 text-slate-400"}`}>
                        <HardDrive size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <BodyText className="font-bold truncate">{model.name}</BodyText>
                          {isCached && (
                            <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-tight">
                              Cached
                            </span>
                          )}
                        </div>
                        <MutedText className="text-xs truncate">{model.description}</MutedText>
                        <MutedText className="text-[10px] mt-0.5">
                          Size: ~{model.size} • License: {model.license}
                        </MutedText>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(model)}
                      disabled={!isCached}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 flex justify-between items-center">
        <MutedText className="text-[11px] italic">
          Models are stored in browser's Cache Storage
        </MutedText>
        <Button variant="outline" size="sm" onClick={checkCache} className="h-8 text-xs">
          Refresh Status
        </Button>
      </div>
    </div>
  )
}

function Subheading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-slate-900 dark:text-slate-100 ${className}`}>{children}</h3>
}
