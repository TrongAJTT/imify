"use client"

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useBackgroundRemoverStore } from "@imify/stores"
import { useBackgroundRemoval } from "./use-background-removal"
import { BACKGROUND_REMOVAL_MODELS } from "./models"
import { decodeFileToImageData } from "@imify/engine/image-pipeline/decode-image-data"
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake"
import { useToast } from "@imify/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@imify/core/types"

export interface SharedBackgroundRemoverRenderProps {
  sourceFile: File | null
  sourceImageData: ImageData | null
  resultImageData: ImageData | null
  isProcessing: boolean
  progressPayload: ConversionProgressPayload | null
  onLoadFile: (file: File) => Promise<void>
  onClear: () => void
  onStartProcessing: () => void
  onResultUpdate: (data: ImageData | null) => void
}

interface SharedBackgroundRemoverPageProps {
  renderWorkspace: (props: SharedBackgroundRemoverRenderProps) => ReactNode
}

export function SharedBackgroundRemoverPage({
  renderWorkspace
}: SharedBackgroundRemoverPageProps) {
  const setHasImage = useBackgroundRemoverStore((s) => s.setHasImage)
  const edgeSmoothing = useBackgroundRemoverStore((s) => s.edgeSmoothing)
  const outputFormat = useBackgroundRemoverStore((s) => s.outputFormat)

  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null)
  const [resultImageData, setResultImageData] = useState<ImageData | null>(null)
  
  const [hasAgreedToDownload, setHasAgreedToDownload] = useState(false)
  const { error, success } = useToast()

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

    for (let i = 0; i < resultData.data.length; i += 4) {
      const alpha = finalMaskData.data[i] / 255
      if (outputFormat === "color") {
        resultData.data[i] = resultData.data[i] * alpha + 255 * (1 - alpha)
        resultData.data[i + 1] = resultData.data[i + 1] * alpha + 255 * (1 - alpha)
        resultData.data[i + 2] = resultData.data[i + 2] * alpha + 255 * (1 - alpha)
        resultData.data[i + 3] = 255
      } else {
        resultData.data[i + 3] = finalMaskData.data[i]
      }
    }

    setResultImageData(resultData)
  }, [sourceImageData, edgeSmoothing, outputFormat])

  const {
    removeBackground,
    isProcessing,
    progressPayload
  } = useBackgroundRemoval({
    onSuccess: (output) => {
      processOutput(output)
    }
  })

  // Check if model is cached
  useEffect(() => {
    const checkModel = async () => {
      if (typeof window === 'undefined') return
      try {
        const cache = await caches.open("transformers-cache")
        const keys = await cache.keys()
        const isCached = keys.some(request => request.url.includes(BACKGROUND_REMOVAL_MODELS[0].id))
        if (isCached) setHasAgreedToDownload(true)
      } catch (e) {
        // Ignore cache errors
      }
    }
    checkModel()
  }, [])

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
        removeBackground(reader.result)
      }
    }
    reader.readAsArrayBuffer(sourceFile)
  }, [removeBackground, sourceFile])

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
        onResultUpdate: setResultImageData
      })}
    </>
  )
}
