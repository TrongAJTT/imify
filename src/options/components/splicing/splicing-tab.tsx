import { useCallback, useMemo, useRef, useState } from "react"
import { Download, ImagePlus, Trash2 } from "lucide-react"

import { exportSplicedImage } from "@/features/splicing/canvas-renderer"
import type {
  SplicingImageItem,
  LayoutResult,
  SplicingExportConfig
} from "@/features/splicing/types"
import { CanvasPreview } from "@/options/components/splicing/canvas-preview"
import { ImageStrip } from "@/options/components/splicing/image-strip"
import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import {
  useSplicingStore,
  resolveLayoutConfig,
  resolveCanvasStyle,
  resolveImageStyle
} from "@/options/stores/splicing-store"
import { getCanonicalExtension } from "@/core/download-utils"

const THUMB_MAX = 256

async function generateThumbnail(
  file: File
): Promise<{ url: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, THUMB_MAX / Math.max(width, height))
  const tw = Math.max(1, Math.round(width * scale))
  const th = Math.max(1, Math.round(height * scale))

  const canvas = new OffscreenCanvas(tw, th)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    throw new Error("Cannot create thumbnail canvas context")
  }

  ctx.drawImage(bitmap, 0, 0, tw, th)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: "image/png" })
  const url = URL.createObjectURL(blob)

  return { url, width, height }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 500)
}

export function SplicingTab() {
  const [images, setImages] = useState<SplicingImageItem[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const preset = useSplicingStore((s) => s.preset)
  const primaryDirection = useSplicingStore((s) => s.primaryDirection)
  const secondaryDirection = useSplicingStore((s) => s.secondaryDirection)
  const gridCount = useSplicingStore((s) => s.gridCount)
  const flowMaxSize = useSplicingStore((s) => s.flowMaxSize)
  const alignment = useSplicingStore((s) => s.alignment)

  const canvasPadding = useSplicingStore((s) => s.canvasPadding)
  const mainSpacing = useSplicingStore((s) => s.mainSpacing)
  const crossSpacing = useSplicingStore((s) => s.crossSpacing)
  const canvasBorderRadius = useSplicingStore((s) => s.canvasBorderRadius)
  const canvasBorderWidth = useSplicingStore((s) => s.canvasBorderWidth)
  const canvasBorderColor = useSplicingStore((s) => s.canvasBorderColor)
  const backgroundColor = useSplicingStore((s) => s.backgroundColor)

  const imageResize = useSplicingStore((s) => s.imageResize)
  const imageFitValue = useSplicingStore((s) => s.imageFitValue)
  const imagePadding = useSplicingStore((s) => s.imagePadding)
  const imagePaddingColor = useSplicingStore((s) => s.imagePaddingColor)
  const imageBorderRadius = useSplicingStore((s) => s.imageBorderRadius)
  const imageBorderWidth = useSplicingStore((s) => s.imageBorderWidth)
  const imageBorderColor = useSplicingStore((s) => s.imageBorderColor)

  const exportFormat = useSplicingStore((s) => s.exportFormat)
  const exportQuality = useSplicingStore((s) => s.exportQuality)
  const exportPngTinyMode = useSplicingStore((s) => s.exportPngTinyMode)
  const exportMode = useSplicingStore((s) => s.exportMode)

  const storeState = useSplicingStore.getState()
  const layoutConfig = useMemo(
    () => resolveLayoutConfig(storeState),
    [preset, primaryDirection, secondaryDirection, gridCount, flowMaxSize, alignment]
  )
  const canvasStyle = useMemo(
    () => resolveCanvasStyle(storeState),
    [canvasPadding, mainSpacing, crossSpacing, canvasBorderRadius, canvasBorderWidth, canvasBorderColor, backgroundColor]
  )
  const imageStyle = useMemo(
    () => resolveImageStyle(storeState),
    [imagePadding, imagePaddingColor, imageBorderRadius, imageBorderWidth, imageBorderColor]
  )

  const addFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    const newItems: SplicingImageItem[] = []
    for (const file of imageFiles) {
      try {
        const thumb = await generateThumbnail(file)
        newItems.push({
          id: `splice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          thumbnailUrl: thumb.url,
          originalWidth: thumb.width,
          originalHeight: thumb.height
        })
      } catch {
        // Skip invalid files
      }
    }

    setImages((prev) => [...prev, ...newItems])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      void addFiles(files)
    },
    [addFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      void addFiles(files)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [addFiles]
  )

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id)
      if (removed) URL.revokeObjectURL(removed.thumbnailUrl)
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  const handleReorder = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    
    setImages((prev) => {
      const draggedIndex = prev.findIndex((img) => img.id === draggedId)
      const targetIndex = prev.findIndex((img) => img.id === targetId)

      if (draggedIndex < 0 || targetIndex < 0) return prev

      const next = [...prev]
      const [moved] = next.splice(draggedIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }, [])

  const handleAddMore = useCallback(() => {
    openFilePicker()
  }, [openFilePicker])

  const handleClearAll = useCallback(() => {
    for (const img of images) {
      URL.revokeObjectURL(img.thumbnailUrl)
    }
    setImages([])
    setLayoutResult(null)
  }, [images])

  const handleExport = useCallback(async () => {
    if (images.length === 0 || isExporting) return
    setIsExporting(true)

    try {
      const store = useSplicingStore.getState()
      const layout = resolveLayoutConfig(store)
      const canvas = resolveCanvasStyle(store)
      const imgStyle = resolveImageStyle(store)

      const config: SplicingExportConfig = {
        format: store.exportFormat,
        quality: store.exportQuality,
        pngTinyMode: store.exportPngTinyMode,
        exportMode: store.exportMode
      }

      const blobs = await exportSplicedImage(
        images,
        layout,
        canvas,
        imgStyle,
        store.imageResize,
        store.imageFitValue,
        config
      )

      const ext = getCanonicalExtension(store.exportFormat)
      for (let i = 0; i < blobs.length; i++) {
        const suffix = blobs.length > 1 ? `-${i + 1}` : ""
        downloadBlob(blobs[i], `spliced-image${suffix}.${ext}`)
      }
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }, [images, isExporting])

  const hasImages = images.length > 0
  const dimensionLabel = layoutResult
    ? `${layoutResult.canvasWidth} x ${layoutResult.canvasHeight} px`
    : null

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Subheading>Image Splicing</Subheading>
          {dimensionLabel && hasImages && (
            <MutedText className="text-xs mt-0.5">{dimensionLabel}</MutedText>
          )}
        </div>
        {hasImages && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              disabled={isExporting}
            >
              <Trash2 size={14} />
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download size={14} />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {!hasImages ? (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-16 cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-all"
          onClick={openFilePicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500">
            <ImagePlus size={28} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports JPG, PNG, WebP, AVIF, and more
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <CanvasPreview
              images={images}
              layoutConfig={layoutConfig}
              canvasStyle={canvasStyle}
              imageStyle={imageStyle}
              imageResize={imageResize}
              fitValue={imageFitValue}
              onLayoutComputed={setLayoutResult}
            />
          </div>

          <ImageStrip
            images={images}
            onRemove={handleRemove}
            onReorder={handleReorder}
            onAddMore={handleAddMore}
          />
        </div>
      )}
    </SurfaceCard>
  )
}
