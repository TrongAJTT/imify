"use client"

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "@imify/i18n"
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake"
import { sanitizeFile } from "../shared/image-file-utils"
import { PdfStudioModeSwitcher } from "./pdf-studio-mode-switcher"
import { PdfStudioDropZone } from "./pdf-studio-drop-zone"
import { ImagesToPdfWorkspace } from "./images-to-pdf-workspace"
import { PdfToImagesWorkspace } from "./pdf-to-images-workspace"
import type {
  ImagesToPdfConfig,
  PdfStudioImageItem,
  PdfStudioMode,
  PdfToImagesConfig
} from "./types"

export interface SharedPdfStudioRenderProps {
  mode: PdfStudioMode
  hasContent: boolean
  imageItems: PdfStudioImageItem[]
  pdfFile: File | null
  imagesToPdfConfig: ImagesToPdfConfig
  pdfToImagesConfig: PdfToImagesConfig
  onModeChange: (mode: PdfStudioMode) => void
  onImagesToPdfConfigChange: (config: ImagesToPdfConfig) => void
  onPdfToImagesConfigChange: (config: PdfToImagesConfig) => void
}

interface SharedPdfStudioPageProps {
  renderWorkspace: (props: SharedPdfStudioRenderProps) => ReactNode
}

export function SharedPdfStudioPage({ renderWorkspace }: SharedPdfStudioPageProps) {
  const { t } = useTranslation("pdfStudio")
  const [mode, setMode] = useState<PdfStudioMode>("images-to-pdf")
  const [imageItems, setImageItems] = useState<PdfStudioImageItem[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const [imagesToPdfConfig, setImagesToPdfConfig] = useState<ImagesToPdfConfig>({
    resizeMode: "inherit",
    paperSize: "A4",
    dpi: 300,
    resamplingAlgorithm: "lanczos3",
    margin: 0
  })

  const [pdfToImagesConfig, setPdfToImagesConfig] = useState<PdfToImagesConfig>({
    dpi: 150,
    format: "png",
    quality: 92,
    pageSelectionMode: "all",
    customPageRange: ""
  })

  const previewUrlsRef = useRef<string[]>([])

  const cleanupImagePreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrlsRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      cleanupImagePreviews()
    }
  }, [cleanupImagePreviews])

  const handleLoadImageFiles = useCallback(
    async (files: File[]) => {
      setMode("images-to-pdf")
      const newItems: PdfStudioImageItem[] = []

      for (const rawFile of files) {
        try {
          const sanitized = await sanitizeFile(rawFile)
          const url = URL.createObjectURL(sanitized)
          previewUrlsRef.current.push(url)

          newItems.push({
            id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            file: sanitized,
            previewUrl: url,
            name: sanitized.name,
            size: sanitized.size
          })
        } catch (e) {
          console.error("Failed to load file:", rawFile.name, e)
        }
      }

      if (newItems.length > 0) {
        setImageItems((prev) => [...prev, ...newItems])
      }
    },
    []
  )

  const handleLoadPdfFile = useCallback((file: File) => {
    setMode("pdf-to-images")
    setPdfFile(file)
  }, [])

  const handleRemoveImageItem = useCallback((id: string) => {
    setImageItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }, [])

  const handleReorderImageItems = useCallback((fromIndex: number, toIndex: number) => {
    setImageItems((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(fromIndex, 1)
      if (moved) copy.splice(toIndex, 0, moved)
      return copy
    })
  }, [])

  const handleClearImages = useCallback(() => {
    cleanupImagePreviews()
    setImageItems([])
  }, [cleanupImagePreviews])

  const handleClearPdf = useCallback(() => {
    setPdfFile(null)
  }, [])

  // Clipboard image intake
  useClipboardImageIntake({
    mode: "multiple",
    onImages: (files) => {
      if (files.length > 0) void handleLoadImageFiles(files)
    },
    enabled: true
  })

  const hasContent = mode === "images-to-pdf" ? imageItems.length > 0 : pdfFile !== null

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header / Mode Switcher */}
      <div className="flex items-center justify-between">
        <PdfStudioModeSwitcher
          mode={mode}
          onModeChange={setMode}
        />
      </div>

      {/* Main Workspace Body */}
      {!hasContent ? (
        <PdfStudioDropZone
          mode={mode}
          onLoadImageFiles={handleLoadImageFiles}
          onLoadPdfFile={handleLoadPdfFile}
        />
      ) : mode === "images-to-pdf" ? (
        <ImagesToPdfWorkspace
          items={imageItems}
          config={imagesToPdfConfig}
          onRemoveItem={handleRemoveImageItem}
          onReorderItems={handleReorderImageItems}
          onAddMoreFiles={handleLoadImageFiles}
          onClearAll={handleClearImages}
        />
      ) : pdfFile ? (
        <PdfToImagesWorkspace
          pdfFile={pdfFile}
          config={pdfToImagesConfig}
          onClear={handleClearPdf}
        />
      ) : null}

      {/* Expose state for external sidebar rendering */}
      {renderWorkspace({
        mode,
        hasContent,
        imageItems,
        pdfFile,
        imagesToPdfConfig,
        pdfToImagesConfig,
        onModeChange: setMode,
        onImagesToPdfConfigChange: setImagesToPdfConfig,
        onPdfToImagesConfigChange: setPdfToImagesConfig
      })}
    </div>
  )
}
