"use client"

import React, { useState, useEffect } from "react"
import { Eraser, Download, LayoutGrid, Columns } from "lucide-react"
import {
  Button,
  ToastContainer
} from "@imify/ui"
import { useConversionToasts, useToast } from "@imify/core/hooks/use-toast"
import { useBackgroundRemoverStore } from "@imify/stores"
import { BACKGROUND_REMOVAL_MODELS } from "./models"
import { ModelDownloadDialog } from "./model-download-dialog"
import { PixelCompareWorkspace } from "../diffchecker/pixel-compare-workspace"
import type { ConversionProgressPayload } from "@imify/core/types"

interface BackgroundRemoverWorkspaceProps {
  sourceFile: File
  sourceImageData: ImageData
  resultImageData: ImageData | null
  isProcessing: boolean
  progressPayload: ConversionProgressPayload | null
  onClear: () => void
  onStartProcessing: () => void
}

export function BackgroundRemoverWorkspace({
  sourceFile,
  sourceImageData,
  resultImageData,
  isProcessing,
  progressPayload,
  onClear,
  onStartProcessing
}: BackgroundRemoverWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"split" | "side_by_side">("split")
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false)
  const [hasAgreedToDownload, setHasAgreedToDownload] = useState(false)

  const { toasts, hide } = useToast()
  const conversionToasts = useConversionToasts([progressPayload])

  // Memoize source blob URL to prevent creating a new one on every render
  const sourceFileUrl = React.useMemo(() => {
    if (!sourceFile) return ""
    return URL.createObjectURL(sourceFile)
  }, [sourceFile])

  // Cleanup blob URL when component unmounts or sourceFile changes
  useEffect(() => {
    return () => {
      if (sourceFileUrl) URL.revokeObjectURL(sourceFileUrl)
    }
  }, [sourceFileUrl])

  // Check if model is cached for the dialog logic
  useEffect(() => {
    const checkModel = async () => {
      if (typeof window === 'undefined') return
      try {
        const cache = await caches.open("transformers-cache")
        const keys = await cache.keys()
        const isCached = keys.some(request => request.url.includes(BACKGROUND_REMOVAL_MODELS[0].id))
        if (isCached) setHasAgreedToDownload(true)
      } catch (e) { }
    }
    checkModel()
  }, [])

  const handleStartWithAgreement = () => {
    if (!hasAgreedToDownload) {
      setIsDownloadDialogOpen(true)
      return
    }
    onStartProcessing()
  }

  const handleConfirmDownload = () => {
    setHasAgreedToDownload(true)
    setIsDownloadDialogOpen(false)
    onStartProcessing()
  }

  const handleDownload = () => {
    if (!resultImageData) return
    const canvas = document.createElement("canvas")
    canvas.width = resultImageData.width
    canvas.height = resultImageData.height
    canvas.getContext("2d")?.putImageData(resultImageData, 0, 0)

    const link = document.createElement("a")
    link.download = sourceFile ? `${sourceFile.name.replace(/\.[^.]+$/, "")}_no_bg.png` : "result.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Eraser size={18} className="text-pink-500" />
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {sourceFile.name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI-powered subject isolation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClear} className="h-9 px-4">
            Clear
          </Button>
          {!resultImageData && (
            <Button
              variant="default"
              onClick={handleStartWithAgreement}
              disabled={isProcessing}
              className="h-9 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-500/20"
            >
              {isProcessing ? "Processing..." : "Remove Background"}
            </Button>
          )}
        </div>
      </div>

      <div className="relative pt-2">
        {/* Floating View Controls (Only visible when processed) */}
        {resultImageData && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 shadow-lg">
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="rounded-full h-8 px-3 gap-2"
            >
              <Columns size={14} />
              <span className="text-xs font-medium">Slider</span>
            </Button>
            <Button
              variant={viewMode === "side_by_side" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("side_by_side")}
              className="rounded-full h-8 px-3 gap-2"
            >
              <LayoutGrid size={14} />
              <span className="text-xs font-medium">Side-by-side</span>
            </Button>
          </div>
        )}

        <div className="min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          {resultImageData ? (
            <PixelCompareWorkspace
              className="h-[520px]"
              mode={viewMode}
              imageDataA={sourceImageData}
              imageDataB={resultImageData}
              zoom={100}
              panX={0}
              panY={0}
              onZoomChange={() => { }}
              onPanChange={() => { }}
            />
          ) : (
            <div className="h-[520px] flex items-center justify-center p-12">
              <div className="relative group max-h-full">
                <img
                  src={sourceFileUrl}
                  alt="Source"
                  className="max-h-[440px] w-auto rounded-lg shadow-2xl border-4 border-white dark:border-slate-800 transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold text-pink-600">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {resultImageData && (
        <div className="pt-6 flex justify-center">
          <Button
            onClick={handleDownload}
            className="bg-pink-600 hover:bg-pink-700 text-white gap-2 px-10 py-7 text-lg font-black rounded-2xl shadow-xl shadow-pink-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Download size={24} />
            Download Isolated PNG
          </Button>
        </div>
      )}

      <ModelDownloadDialog
        isOpen={isDownloadDialogOpen}
        onClose={() => setIsDownloadDialogOpen(false)}
        onConfirm={handleConfirmDownload}
        model={BACKGROUND_REMOVAL_MODELS[0]}
      />

      <ToastContainer toasts={[...toasts, ...conversionToasts]} onRemove={hide} />
    </div>
  )
}
