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
import type { ConversionProgressPayload, FormatConfig } from "@imify/core/types"
import { convertImage } from "@imify/engine/converter"
import { downloadWithFilename, formatBytes } from "../processor/processor-utils"
import { buildFormatConfigFromPreset, VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils"
import { useBatchStore } from "@imify/stores/stores/batch-store"

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
  const { variantId, setVariantId } = useBackgroundRemoverStore()
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
  const [isDownloading, setIsDownloading] = useState(false)
  const [resultBlobSize, setResultBlobSize] = useState<number | null>(null)
  const [isEncodingPreview, setIsEncodingPreview] = useState(false)

  const {
    targetFormat,
    quality,
    codecOptions,
    outputFormat,
    backgroundColor,
    activePresetId
  } = useBackgroundRemoverStore()

  const { presets } = useBatchStore()
  const activePreset = presets.find(p => p.id === activePresetId) || VIRTUAL_DEFAULT_PNG_PRESET

  const { toasts, show, hide } = useToast()
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

  // Check if current model + variant is cached
  useEffect(() => {
    const checkModel = async () => {
      if (typeof window === 'undefined') return

      const selectedModel = BACKGROUND_REMOVAL_MODELS.find(m => m.id === modelId)
      if (!selectedModel) return

      const variant = selectedModel.variants.find(v => v.id === variantId) ?? selectedModel.variants[0]

      try {
        const cache = await caches.open("transformers-cache")
        const keys = await cache.keys()

        const isCached = keys.some(request => {
          const url = request.url.toLowerCase()

          // Must match the model ID and be an ONNX weight file
          const modelMatch = url.includes(modelId.toLowerCase())
          const isWeightFile = url.endsWith('.onnx') || url.includes('.onnx?')

          if (!modelMatch || !isWeightFile) return false

          if (variant.quantized) {
            return url.includes('quantized')
          } else if (variant.dtype === 'fp16') {
            return url.includes('fp16')
          } else {
            // Full precision: should NOT contain quantized or fp16 in the filename
            return !url.includes('quantized') && !url.includes('fp16')
          }
        })

        setHasAgreedToDownload(isCached)
      } catch (e) {
        setHasAgreedToDownload(false)
      }
    }
    checkModel()
  }, [modelId, variantId])

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

  // Background encoding to get file size and delta
  useEffect(() => {
    let isAborted = false;
    let debounceTimer: NodeJS.Timeout;

    const encodePreview = async () => {
      if (!resultImageData || isProcessing) {
        setResultBlobSize(null);
        return;
      }

      setIsEncodingPreview(true);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = resultImageData.width;
        canvas.height = resultImageData.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imageBitmap = await createImageBitmap(resultImageData);
        if (outputFormat === "color") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(imageBitmap, 0, 0);

        if (isAborted) return;

        // OPTIMIZATION: If we just need the size for preview, and target is WebP or JPEG,
        // use the browser's native fast encoder instead of the WASM worker.
        if (targetFormat === "webp" || targetFormat === "jpg") {
          const mime = targetFormat === "webp" ? "image/webp" : "image/jpeg";
          const nativeBlob = await new Promise<Blob | null>((resolve) => 
            canvas.toBlob(resolve, mime, quality / 100)
          );
          if (isAborted) return;
          if (nativeBlob) {
            setResultBlobSize(nativeBlob.size);
            return;
          }
        }

        // Fallback to worker for other formats or if native failed
        // Use a faster intermediate format (webp if supported, otherwise jpeg) instead of PNG
        const intermediateMime = "image/webp";
        const sourceBlob = await new Promise<Blob | null>((resolve) => 
          canvas.toBlob(resolve, intermediateMime, 0.9)
        );
        
        if (isAborted || !sourceBlob) return;

        const config: FormatConfig = buildFormatConfigFromPreset(activePreset);
        config.resize = { mode: "none" };

        const converted = await convertImage({
          sourceBlob,
          config
        });

        if (isAborted) return;
        setResultBlobSize(converted.blob.size);
      } catch (error) {
        console.error("Preview encoding failed:", error);
        if (!isAborted) setResultBlobSize(null);
      } finally {
        if (!isAborted) setIsEncodingPreview(false);
      }
    };

    debounceTimer = setTimeout(() => {
      encodePreview();
    }, 500);

    return () => {
      isAborted = true;
      clearTimeout(debounceTimer);
    };
  }, [resultImageData, activePreset, outputFormat, backgroundColor, isProcessing, targetFormat, quality]);

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

  const handleDownload = async () => {
    if (!resultImageData) return

    setIsDownloading(true)
    const toastId = show({
      title: "Encoding Image",
      message: `Preparing ${targetFormat.toUpperCase()} file...`,
      type: "notification",
      duration: 60000 // Show for up to 1 minute while encoding
    })

    try {
      const canvas = document.createElement("canvas")
      canvas.width = resultImageData.width
      canvas.height = resultImageData.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      // Use ImageBitmap for better performance and to respect alpha blending
      const imageBitmap = await createImageBitmap(resultImageData)

      if (outputFormat === "color") {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(imageBitmap, 0, 0)

      const extension = targetFormat === "jpg" ? "jpg" : targetFormat
      const baseName = sourceFile ? sourceFile.name.replace(/\.[^.]+$/, "") : "result"
      const fileName = `${baseName}_no_bg.${extension}`

      // FAST-PATH: If target is natively supported, encode directly from canvas to avoid 
      // the overhead of the shared conversion engine (which involves slow getImageData calls).
      if (targetFormat === "webp" || targetFormat === "jpg" || targetFormat === "png") {
        const mime = targetFormat === "webp" ? "image/webp" : targetFormat === "jpg" ? "image/jpeg" : "image/png"
        
        let finalCanvas = canvas
        
        // JPEG/JPG does not support transparency. If the output was transparent, 
        // we must composite it onto a solid background (default to white if not set) 
        // to avoid black backgrounds in the resulting JPEG.
        if (targetFormat === "jpg" && outputFormat === "transparent") {
          const bgCanvas = document.createElement("canvas")
          bgCanvas.width = canvas.width
          bgCanvas.height = canvas.height
          const bgCtx = bgCanvas.getContext("2d")
          if (bgCtx) {
            bgCtx.fillStyle = "#ffffff" // Default to white for JPG with transparency
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height)
            bgCtx.drawImage(canvas, 0, 0)
            finalCanvas = bgCanvas
          }
        }

        const finalBlob = await new Promise<Blob | null>((resolve) => 
          finalCanvas.toBlob(resolve, mime, quality / 100)
        )
        
        if (!finalBlob) throw new Error("Failed to encode image natively")
        await downloadWithFilename(finalBlob, fileName)
      } else {
        // Fallback to worker for advanced formats (AVIF, JXL, etc.)
        // Use a faster intermediate format (webp) instead of PNG to speed up the transfer to worker
        const sourceBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.95))
        if (!sourceBlob) throw new Error("Failed to create source blob")

        const config: FormatConfig = buildFormatConfigFromPreset(activePreset)
        config.resize = { mode: "none" }

        const converted = await convertImage({
          sourceBlob,
          config
        })

        await downloadWithFilename(converted.blob, fileName)
      }

      hide(toastId)
      show({
        title: "Download Ready",
        message: "Image exported successfully",
        type: "success"
      })
    } catch (error) {
      console.error("Download failed:", error)
      hide(toastId)
      show({
        title: "Download Failed",
        message: error instanceof Error ? error.message : "Unable to encode image",
        type: "error",
        duration: 5000
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {sourceFile.name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isProcessing ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Processing... ({timerSeconds.toFixed(1)}s)
              </span>
            ) : resultImageData && processTime !== null ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex flex-wrap items-center gap-1.5">
                <span>Processing completed in {processTime.toFixed(2)}s</span>
                {resultBlobSize !== null && (
                  <>
                    <span className="xs:inline opacity-40">•</span>
                    <span>{formatBytes(resultBlobSize)}</span>
                    <span className="xs:inline opacity-40">•</span>
                    <span className={((resultBlobSize - sourceFile.size) / sourceFile.size) > 0 ? "text-amber-600" : "text-emerald-600"}>
                      {((resultBlobSize - sourceFile.size) / sourceFile.size * 100).toFixed(1)}%
                    </span>
                  </>
                )}
                {isEncodingPreview && (
                  <span className="animate-pulse text-slate-400">...</span>
                )}
              </span>
            ) : (
              "Adjust settings in the sidebar then click Remove Background to process"
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={onClear} className="h-9 px-4 flex-1 sm:flex-none">
            Clear
          </Button>
          {resultImageData && (
            <Button
              variant="secondary"
              onClick={handleStartWithAgreement}
              disabled={isProcessing}
              className="h-9 px-4 flex-1 sm:flex-none"
            >
              Update
            </Button>
          )}
          {resultImageData ? (
            <Button
              variant="default"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-9 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-500/20 disabled:bg-pink-400 flex-[2] sm:flex-none"
            >
              {isDownloading ? "Encoding..." : "Download"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleStartWithAgreement}
              disabled={isProcessing}
              className="h-9 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-500/20 border-none flex-[2] sm:flex-none"
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
              bgColorB={outputFormat === "color" ? backgroundColor : null}
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
        variantId={variantId}
      />

      <ToastContainer toasts={[...toasts, ...conversionToasts]} onRemove={hide} />
    </div>
  )
}
