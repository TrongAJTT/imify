"use client"

import React, { useEffect, useState } from "react"
import { Stamp, X, Brain, Library, ChevronRight, ArrowLeft } from "lucide-react"
import { BaseDialog, Subheading, BodyText, MutedText, Button } from "@imify/ui"
import { AssetWatermarkTab } from "./asset-tabs/asset-watermark-tab"
import { AssetAIModelsTab } from "./asset-tabs/asset-ai-models-tab"
import { useWatermarkStore } from "@imify/stores/stores/watermark-store"
import { formatFileSize } from "@imify/core"

interface AssetManagementDialogProps {
  isOpen: boolean
  onClose: () => void
}

const DEFAULT_INACTIVE_CLASS = "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"

type AssetTabId = "watermark" | "ai-models"

interface AssetTabDefinition {
  id: AssetTabId
  label: string
  description: string
  icon: React.ElementType
  colors: {
    activeBg: string
    activeText: string
    activeRing: string
    activeIcon: string
  }
}

const ASSET_TABS: AssetTabDefinition[] = [
  {
    id: "watermark",
    label: "Watermark",
    description: "Manage your saved watermark cards and patterns",
    icon: Stamp,
    colors: {
      activeBg: "bg-sky-50 dark:bg-sky-500/10",
      activeText: "text-sky-600 dark:text-sky-300",
      activeRing: "ring-sky-200 dark:ring-sky-800",
      activeIcon: "text-sky-600 dark:text-sky-400"
    }
  },
  {
    id: "ai-models",
    label: "AI Models",
    description: "Manage downloaded AI models for offline features",
    icon: Brain,
    colors: {
      activeBg: "bg-pink-50 dark:bg-pink-500/10",
      activeText: "text-pink-600 dark:text-pink-300",
      activeRing: "ring-pink-200 dark:ring-pink-800",
      activeIcon: "text-pink-600 dark:text-pink-400"
    }
  }
]

export function AssetManagementDialog({ isOpen, onClose }: AssetManagementDialogProps) {
  const [activeTab, setActiveTab] = useState<AssetTabId | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      if (isMobile) setActiveTab(null)
      return
    }

    // On desktop, we can default to the first tab, but the user wants "select section" first.
    // However, for consistency with Settings on desktop, we'll default to watermark if not mobile.
    if (!isMobile && activeTab === null) {
      setActiveTab("watermark")
    }
  }, [isOpen, isMobile])

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(max-width: 768px)")
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case "watermark":
        return <AssetWatermarkTab />
      case "ai-models":
        return <AssetAIModelsTab />
      default:
        return null
    }
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-6xl"
      contentClassName="w-full max-w-6xl h-[90vh] md:h-[85vh] max-h-[900px] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {isMobile && activeTab && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab(null)}
              className="rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <div className="flex flex-col min-w-0">
            <Subheading className="text-base font-bold leading-tight truncate">
              {isMobile && activeTab ? ASSET_TABS.find(t => t.id === activeTab)?.label : "Asset Management"}
            </Subheading>
            {isMobile && activeTab && (
              <MutedText className="text-[10px] leading-tight truncate pr-4">
                {ASSET_TABS.find(t => t.id === activeTab)?.description}
              </MutedText>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Close dialog"
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950/20">
        {/* Sidebar (Desktop) or List (Mobile Home) */}
        {(!isMobile || !activeTab) && (
          <div className={`${isMobile ? "w-full p-4" : "w-64 border-r border-slate-100 p-3"} bg-white dark:border-slate-800 dark:bg-slate-900`}>
            <div className={isMobile ? "space-y-3" : "space-y-1"}>
              {ASSET_TABS.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-start gap-3 rounded-lg transition-all !h-auto ${isMobile
                    ? "p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                    : `px-4 py-2.5 ${activeTab === tab.id
                      ? `${tab.colors.activeBg} ${tab.colors.activeText} shadow-sm ring-1 ${tab.colors.activeRing}`
                      : DEFAULT_INACTIVE_CLASS
                    }`
                    }`}
                >
                  <div className={`${isMobile ? `rounded-lg ${tab.colors.activeBg} p-2 shadow-sm ${tab.colors.activeText}` : tab.colors.activeIcon}`}>
                    <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 text-left">
                    <BodyText className={`font-semibold ${!isMobile && activeTab === tab.id ? tab.colors.activeText : "!text-slate-800 dark:!text-slate-100"}`}>
                      {tab.label}
                    </BodyText>
                    {isMobile && <MutedText className="text-[10px] leading-tight">{tab.description}</MutedText>}
                  </div>
                  {isMobile && <ChevronRight size={16} className="text-slate-300" />}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {(!isMobile || activeTab) && (
          <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-right-2 duration-300">
            {renderContent()}
          </div>
        )}
      </div>
    </BaseDialog>
  )
}

export interface AssetStatistics {
  watermarkCount: number
  cachedModelCount: number
  cacheSizeBytes: number
  totalSizeFormatted: string
}

export function useAssetStatistics(isOpen: boolean): AssetStatistics {
  const savedWatermarks = useWatermarkStore((state) => state.savedWatermarks)
  const [cachedModelCount, setCachedModelCount] = useState(0)
  const [cacheSizeBytes, setCacheSizeBytes] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    if (typeof window === "undefined" || !window.caches) return

    let active = true
    caches.open("transformers-cache")
      .then((cache) => {
        return cache.keys().then((keys) => {
          if (!active) return
          const onnxKeys = keys.filter((key) => key.url.toLowerCase().endsWith(".onnx"))
          setCachedModelCount(onnxKeys.length)

          let sizeSum = 0
          const promises = keys.map((request) =>
            cache.match(request).then((response) => {
              if (active && response) {
                const contentLength = response.headers.get("content-length")
                if (contentLength) {
                  sizeSum += parseInt(contentLength, 10)
                }
              }
            })
          )

          return Promise.all(promises).then(() => {
            if (!active) return
            setCacheSizeBytes(sizeSum)
          })
        })
      })
      .catch((err) => {
        console.error("Failed to read model cache statistics:", err)
      })

    return () => {
      active = false
    }
  }, [isOpen])

  return {
    watermarkCount: savedWatermarks.length,
    cachedModelCount,
    cacheSizeBytes,
    totalSizeFormatted: formatFileSize(cacheSizeBytes)
  }
}
