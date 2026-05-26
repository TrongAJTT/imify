"use client"

import React, { useCallback, useState, type ReactNode } from "react"
import { useImageUpscalerStore } from "@imify/stores"
import { useImageUpscaler } from "./use-image-upscaler"
import { decodeFileToImageData } from "@imify/engine/image-pipeline/decode-image-data"
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake"
import { useToast } from "@imify/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@imify/core/types"

export interface SharedImageUpscalerRenderProps {
  sourceFile: File | null
  sourceImageData: ImageData | null
  resultImageData: ImageData | null
  isProcessing: boolean
  progressPayload: ConversionProgressPayload | null
  onLoadFile: (file: File) => Promise<void>
  onClear: () => void
  onStartProcessing: () => void
  onResultUpdate: (data: ImageData | null) => void
  modelId: string
}

interface SharedImageUpscalerPageProps {
  renderWorkspace: (props: SharedImageUpscalerRenderProps) => ReactNode
}

export function SharedImageUpscalerPage({
  renderWorkspace
}: SharedImageUpscalerPageProps) {
  const setHasImage = useImageUpscalerStore((s) => s.setHasImage)
  const modelId = useImageUpscalerStore((s) => s.modelId)
  const variantId = useImageUpscalerStore((s) => s.variantId)
  const scaleFactor = useImageUpscalerStore((s) => s.scaleFactor)
  const denoiseLevel = useImageUpscalerStore((s) => s.denoiseLevel)
  const processingMode = useImageUpscalerStore((s) => s.processingMode)
  const unloadModelAfterProcess = useImageUpscalerStore((s) => s.unloadModelAfterProcess)

  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null)
  const [resultImageData, setResultImageData] = useState<ImageData | null>(null)
  
  const { error } = useToast()

  const {
    upscaleImage,
    isProcessing,
    progressPayload
  } = useImageUpscaler({
    modelId,
    variantId,
    scaleFactor,
    denoiseLevel,
    processingMode,
    unloadAfterSuccess: unloadModelAfterProcess,
    onSuccess: (outputImageData) => {
      setResultImageData(outputImageData)
    }
  })

  const handleLoadFile = useCallback(async (file: File) => {
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

  const handleClear = useCallback(() => {
    setSourceFile(null)
    setSourceImageData(null)
    setResultImageData(null)
    setHasImage(false)
  }, [setHasImage])

  const handleStartProcessing = useCallback(() => {
    if (!sourceFile) return
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        upscaleImage(reader.result)
      }
    }
    reader.readAsArrayBuffer(sourceFile)
  }, [upscaleImage, sourceFile])

  useClipboardImageIntake({
    onImages: (files) => { if (files[0]) void handleLoadFile(files[0]) },
    enabled: !sourceFile,
    mode: "single"
  })

  return (
    <>
      {renderWorkspace({
        sourceFile,
        sourceImageData,
        resultImageData,
        isProcessing,
        progressPayload,
        onLoadFile: handleLoadFile,
        onClear: handleClear,
        onStartProcessing: handleStartProcessing,
        onResultUpdate: setResultImageData,
        modelId
      })}
    </>
  )
}
