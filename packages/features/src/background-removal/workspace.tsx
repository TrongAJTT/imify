"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Eraser, ImagePlus, Download, LayoutGrid, Columns } from "lucide-react"
import {
  Button,
  EmptyDropCard,
  BodyText,
  MutedText,
  ToastContainer
} from "@imify/ui"
import { useConversionToasts, useToast } from "@imify/core/hooks/use-toast"
import { useBackgroundRemoverStore } from "@imify/stores"
import { useBackgroundRemoval } from "./use-background-removal"
import { BACKGROUND_REMOVAL_MODELS } from "./models"
import { ModelDownloadDialog } from "./model-download-dialog"
import { PixelCompareWorkspace } from "../diffchecker/pixel-compare-workspace"
import { decodeFileToImageData } from "@imify/engine/image-pipeline/decode-image-data"
import { BACKGROUND_REMOVER_SIDEBAR_PANEL_ID } from "./sidebar"
import { COMMON_IMAGE_ACCEPT, isCommonImageFile } from "../shared/image-file-utils"
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake"

export function BackgroundRemoverWorkspace() {
  const modelId = useBackgroundRemoverStore((s) => s.modelId)
  const setHasImage = useBackgroundRemoverStore((s) => s.setHasImage)

  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null)
  const [resultImageData, setResultImageData] = useState<ImageData | null>(null)
  const [viewMode, setViewMode] = useState<"split" | "side_by_side">("split")

  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false)
  const [hasAgreedToDownload, setHasAgreedToDownload] = useState(false)

  const { toasts, hide, success, error } = useToast()

  const {
    removeBackground,
    isProcessing,
    progressPayload
  } = useBackgroundRemoval({
    onSuccess: (output) => {
      // output is usually an array of masks (for image-segmentation pipeline)
      // or the result image data if we customized the worker.
      // For RMBG-1.4, it returns a mask.
      processOutput(output)
    },
    onError: (err) => {
      error("Processing Failed", err)
    }
  })

  const conversionToasts = useConversionToasts([progressPayload])

  // Check if model is cached (simplified for UI logic)
  useEffect(() => {
    const checkModel = async () => {
      const cache = await caches.open("transformers-cache")
      const keys = await cache.keys()
      const isCached = keys.some(request => request.url.includes(BACKGROUND_REMOVAL_MODELS[0].id))
      if (isCached) {
        setHasAgreedToDownload(true)
      }
    }
    checkModel()
  }, [])

  const edgeSmoothing = useBackgroundRemoverStore((s) => s.edgeSmoothing)
  const outputFormat = useBackgroundRemoverStore((s) => s.outputFormat)

  const processOutput = useCallback(async (output: any) => {
    if (!sourceImageData) return

    const mask = output[0].mask
    const width = sourceImageData.width
    const height = sourceImageData.height

    const resultData = new ImageData(
      new Uint8ClampedArray(sourceImageData.data),
      width,
      height
    )

    const maskCanvas = document.createElement("canvas")
    maskCanvas.width = mask.width
    maskCanvas.height = mask.height
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    const maskImageData = new ImageData(mask.width, mask.height)
    for (let i = 0; i < mask.data.length; ++i) {
      const val = mask.data[i]
      const idx = i * 4
      maskImageData.data[idx] = val
      maskImageData.data[idx + 1] = val
      maskImageData.data[idx + 2] = val
      maskImageData.data[idx + 3] = 255
    }
    maskCtx.putImageData(maskImageData, 0, 0)

    const scaledMaskCanvas = document.createElement("canvas")
    scaledMaskCanvas.width = width
    scaledMaskCanvas.height = height
    const scaledMaskCtx = scaledMaskCanvas.getContext("2d")
    if (!scaledMaskCtx) return

    if (edgeSmoothing > 0) {
      scaledMaskCtx.filter = `blur(${edgeSmoothing}px)`
    }

    scaledMaskCtx.drawImage(maskCanvas, 0, 0, width, height)
    const finalMaskData = scaledMaskCtx.getImageData(0, 0, width, height)

    // Apply mask to source
    for (let i = 0; i < resultData.data.length; i += 4) {
      const alpha = finalMaskData.data[i] / 255

      if (outputFormat === "color") {
        // Blend with white background
        resultData.data[i] = resultData.data[i] * alpha + 255 * (1 - alpha)
        resultData.data[i + 1] = resultData.data[i + 1] * alpha + 255 * (1 - alpha)
        resultData.data[i + 2] = resultData.data[i + 2] * alpha + 255 * (1 - alpha)
        resultData.data[i + 3] = 255
      } else {
        // Keep transparency
        resultData.data[i + 3] = finalMaskData.data[i]
      }
    }

    setResultImageData(resultData)
    success("Background Removed", "Subject has been isolated.")
  }, [sourceImageData, success, edgeSmoothing, outputFormat])

  const handleFileDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    
    if (!isCommonImageFile(file)) {
      error("Unsupported Format", "Please drop a valid image file.")
      return
    }

    setSourceFile(file)
    setResultImageData(null)
    setHasImage(true)

    try {
      const result = await decodeFileToImageData(file)
      setSourceImageData(result.imageData)
    } catch (err) {
      error("Load Failed", "Could not read the image file.")
    }
  }, [error, setHasImage])

  useClipboardImageIntake({
    onImages: (files: File[]) => {
      void handleFileDrop(files as unknown as FileList)
    },
    enabled: !sourceImageData,
    mode: "single"
  })

  const handleStartProcessing = () => {
    if (!sourceFile) return

    if (!hasAgreedToDownload) {
      setIsDownloadDialogOpen(true)
      return
    }

    // Send file to worker
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        removeBackground(reader.result)
      }
    }
    reader.readAsArrayBuffer(sourceFile)
  }

  const handleConfirmDownload = () => {
    setHasAgreedToDownload(true)
    setIsDownloadDialogOpen(false)
    handleStartProcessing()
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950/20 overflow-hidden">
      {!sourceImageData ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <EmptyDropCard
            title="Background Remover"
            subtitle="Drop an image to isolate the subject using AI"
            icon={<Eraser />}
            onDropFiles={handleFileDrop}
            fileInput={{
              accept: COMMON_IMAGE_ACCEPT,
              onInputFiles: handleFileDrop
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 shadow-lg">
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="rounded-full h-8 px-3 gap-2"
            >
              <Columns size={14} />
              <span className="text-xs">Slider</span>
            </Button>
            <Button
              variant={viewMode === "side_by_side" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("side_by_side")}
              className="rounded-full h-8 px-3 gap-2"
            >
              <LayoutGrid size={14} />
              <span className="text-xs">Side-by-side</span>
            </Button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSourceImageData(null)
                setHasImage(false)
              }}
              className="rounded-full h-8 px-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ImagePlus size={14} className="mr-2" />
              <span className="text-xs">New</span>
            </Button>
          </div>

          <div className="flex-1 min-h-0">
            {resultImageData ? (
              <PixelCompareWorkspace
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
              <div className="h-full flex items-center justify-center p-12">
                <div className="relative group cursor-pointer" onClick={handleStartProcessing}>
                  <img
                    src={URL.createObjectURL(sourceFile!)}
                    alt="Source"
                    className="max-h-full max-w-full rounded-lg shadow-2xl border-4 border-white dark:border-slate-800"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      className="bg-white text-slate-900 hover:bg-white/90 font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartProcessing();
                      }}
                    >
                      {isProcessing ? "Processing..." : "Remove Background"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {resultImageData && (
            <div className="p-4 flex justify-center border-t border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800">
              <Button
                onClick={handleDownload}
                className="bg-pink-600 hover:bg-pink-700 text-white gap-2 px-8 py-6 text-base font-bold rounded-xl shadow-lg shadow-pink-500/20"
              >
                <Download size={20} />
                Download PNG
              </Button>
            </div>
          )}
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
