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
import { CompareViewModeToolbar } from "../shared/compare-view-mode-toolbar"
import type { ConversionProgressPayload } from "@imify/core/types"

interface BackgroundRemoverWorkspaceProps {
  sourceFile: File
  sourceImageData: ImageData
  resultImageData: ImageData | null
  isProcessing: boolean
  progressPayload: ConversionProgressPayload | null
  onClear: () => void
  onStartProcessing: () => void
  modelId: string
}

export function BackgroundRemoverWorkspace({
  sourceFile,
  sourceImageData,
  resultImageData,
  isProcessing,
  progressPayload,
  onClear,
  onStartProcessing,
  modelId
}: BackgroundRemoverWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"split" | "side_by_side">("split")
  const [splitPosition, setSplitPosition] = useState(50)
  const [zoom, setZoom] = useState(100)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false)
  const [hasAgreedToDownload, setHasAgreedToDownload] = useState(false)
  const [processTime, setProcessTime] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)

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

  // Check if current model is cached
  useEffect(() => {
    const checkModel = async () => {
      if (typeof window === 'undefined') return
      setHasAgreedToDownload(false) // Reset when model changes
      try {
        const cache = await caches.open("transformers-cache")
        const keys = await cache.keys()
        const isCached = keys.some(request => request.url.includes(modelId))
        if (isCached) setHasAgreedToDownload(true)
      } catch (e) { }
    }
    checkModel()
  }, [modelId])

  const selectedModel = BACKGROUND_REMOVAL_MODELS.find(m => m.id === modelId) ?? BACKGROUND_REMOVAL_MODELS[0]

  // Timer logic for processing feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      const start = performance.now();
      setStartTime(start);
      setProcessTime(null);
      setTimerSeconds(0);
      interval = setInterval(() => {
        setTimerSeconds((performance.now() - start) / 1000);
      }, 100);
    } else if (startTime !== null) {
      const end = performance.now();
      setProcessTime((end - startTime) / 1000);
      setStartTime(null);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

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
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {sourceFile.name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isProcessing ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Processing... ({timerSeconds.toFixed(1)}s)
              </span>
            ) : resultImageData && processTime !== null ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Processing completed in {processTime.toFixed(2)} seconds
              </span>
            ) : (
              "Adjust settings in the sidebar then click Remove Background to process"
            )}
          </p>
        </div>
        <div className="flex flex-row items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={onClear} className="h-9 px-4">
            Clear
          </Button>
          {resultImageData && (
            <Button
              variant="secondary"
              onClick={handleStartWithAgreement}
              disabled={isProcessing}
              className="h-9 px-4"
            >
              Update
            </Button>
          )}
          {resultImageData ? (
            <Button
              variant="default"
              onClick={handleDownload}
              className="h-9 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-500/20"
            >
              Download
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleStartWithAgreement}
              disabled={isProcessing}
              className="h-9 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-500/20 border-none"
            >
              {isProcessing ? "Processing..." : "Remove Background"}
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Toolbar (Centralized Component) */}
      {resultImageData && (
        <CompareViewModeToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showGuide={true}
        />
      )}

      <div className="relative">
        <div className="min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 relative">
          {resultImageData ? (
            <PixelCompareWorkspace
              className="h-[520px]"
              mode={viewMode}
              imageDataA={sourceImageData}
              imageDataB={resultImageData}
              splitPosition={splitPosition}
              onSplitChange={setSplitPosition}
              zoom={zoom}
              panX={panX}
              panY={panY}
              onZoomChange={setZoom}
              onPanChange={(x, y) => {
                setPanX(x)
                setPanY(y)
              }}
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

      <ModelDownloadDialog
        isOpen={isDownloadDialogOpen}
        onClose={() => setIsDownloadDialogOpen(false)}
        onConfirm={handleConfirmDownload}
        model={selectedModel}
      />

      <ToastContainer toasts={[...toasts, ...conversionToasts]} onRemove={hide} />
    </div>
  )
}
