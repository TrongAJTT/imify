"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@imify/ui/ui/button"
import { calculateLayout } from "@imify/features/splicing/layout-engine"
import { useSplicingPresetStore, type SplicingPresetConfig } from "@imify/stores/stores/splicing-preset-store"
import {
  useSplicingStore,
  resolveCanvasStyle,
  resolveImageStyle,
  resolveLayoutConfig
} from "@imify/stores/stores/splicing-store"

interface LocalSplicingImage {
  id: string
  file: File
  thumbnailUrl: string
  bitmap: ImageBitmap
}

const AUTO_SAVE_DELAY_MS = 450
const PREVIEW_MAX_WIDTH = 920

function drawPreviewCanvas(
  ctx: CanvasRenderingContext2D,
  sources: ImageBitmap[],
  layout: ReturnType<typeof calculateLayout>,
  backgroundColor: string,
  scale: number
): void {
  const canvasWidth = Math.max(1, Math.round(layout.canvasWidth * scale))
  const canvasHeight = Math.max(1, Math.round(layout.canvasHeight * scale))
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  for (const group of layout.groups) {
    for (const placement of group.placements) {
      const source = sources[placement.imageIndex]
      if (!source) continue
      const dx = placement.contentRect.x * scale
      const dy = placement.contentRect.y * scale
      const dw = placement.contentRect.width * scale
      const dh = placement.contentRect.height * scale
      if (dw <= 0 || dh <= 0) continue
      ctx.drawImage(source, dx, dy, dw, dh)
    }
  }
}

function toPresetConfig(state: ReturnType<typeof useSplicingStore.getState>): SplicingPresetConfig {
  return {
    primaryDirection: state.primaryDirection,
    secondaryDirection: state.secondaryDirection,
    gridCount: state.gridCount,
    flowMaxSize: state.flowMaxSize,
    alignment: state.alignment,
    imageAppearanceDirection: state.imageAppearanceDirection,
    canvasPadding: state.canvasPadding,
    mainSpacing: state.mainSpacing,
    crossSpacing: state.crossSpacing,
    canvasBorderRadius: state.canvasBorderRadius,
    canvasBorderWidth: state.canvasBorderWidth,
    canvasBorderColor: state.canvasBorderColor,
    backgroundColor: state.backgroundColor,
    imageResize: state.imageResize,
    imageFitValue: state.imageFitValue,
    imagePadding: state.imagePadding,
    imagePaddingColor: state.imagePaddingColor,
    imageBorderRadius: state.imageBorderRadius,
    imageBorderWidth: state.imageBorderWidth,
    imageBorderColor: state.imageBorderColor,
    exportFormat: state.exportFormat,
    exportQuality: state.exportQuality,
    exportJxlEffort: state.exportJxlEffort,
    exportJxlLossless: state.exportJxlLossless,
    exportJxlProgressive: state.exportJxlProgressive,
    exportJxlEpf: state.exportJxlEpf,
    exportWebpLossless: state.exportWebpLossless,
    exportWebpNearLossless: state.exportWebpNearLossless,
    exportBmpColorDepth: state.exportBmpColorDepth,
    exportBmpDithering: state.exportBmpDithering,
    exportBmpDitheringLevel: state.exportBmpDitheringLevel,
    exportTiffColorMode: state.exportTiffColorMode,
    exportMode: state.exportMode,
    exportTrimBackground: state.exportTrimBackground,
    exportConcurrency: state.exportConcurrency,
    exportFileNamePattern: state.exportFileNamePattern
  }
}

function applyPresetConfigToSplicingStore(config: SplicingPresetConfig): void {
  useSplicingStore.setState({
    primaryDirection: config.primaryDirection,
    secondaryDirection: config.secondaryDirection,
    gridCount: config.gridCount,
    flowMaxSize: config.flowMaxSize,
    alignment: config.alignment,
    imageAppearanceDirection: config.imageAppearanceDirection,
    canvasPadding: config.canvasPadding,
    mainSpacing: config.mainSpacing,
    crossSpacing: config.crossSpacing,
    canvasBorderRadius: config.canvasBorderRadius,
    canvasBorderWidth: config.canvasBorderWidth,
    canvasBorderColor: config.canvasBorderColor,
    backgroundColor: config.backgroundColor,
    imageResize: config.imageResize,
    imageFitValue: config.imageFitValue,
    imagePadding: config.imagePadding,
    imagePaddingColor: config.imagePaddingColor,
    imageBorderRadius: config.imageBorderRadius,
    imageBorderWidth: config.imageBorderWidth,
    imageBorderColor: config.imageBorderColor,
    exportFormat: config.exportFormat,
    exportQuality: config.exportQuality,
    exportJxlEffort: config.exportJxlEffort,
    exportJxlLossless: config.exportJxlLossless,
    exportJxlProgressive: config.exportJxlProgressive,
    exportJxlEpf: config.exportJxlEpf,
    exportWebpLossless: config.exportWebpLossless,
    exportWebpNearLossless: config.exportWebpNearLossless,
    exportBmpColorDepth: config.exportBmpColorDepth,
    exportBmpDithering: config.exportBmpDithering,
    exportBmpDitheringLevel: config.exportBmpDitheringLevel,
    exportTiffColorMode: config.exportTiffColorMode,
    exportMode: config.exportMode,
    exportTrimBackground: config.exportTrimBackground,
    exportConcurrency: config.exportConcurrency,
    exportFileNamePattern: config.exportFileNamePattern
  })
}

export function SplicingWorkspacePage({ presetId }: { presetId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [images, setImages] = useState<LocalSplicingImage[]>([])
  const [errorText, setErrorText] = useState<string | null>(null)

  const presets = useSplicingPresetStore((state) => state.presets)
  const activePresetId = useSplicingPresetStore((state) => state.activePresetId)
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset)
  const setPresetViewMode = useSplicingPresetStore((state) => state.setPresetViewMode)
  const syncActivePresetConfig = useSplicingPresetStore((state) => state.syncActivePresetConfig)

  const preset = useMemo(() => presets.find((entry) => entry.id === presetId) ?? null, [presetId, presets])

  const splicingState = useSplicingStore()
  const setPresetType = useSplicingStore((state) => state.setPreset)
  const setGridCount = useSplicingStore((state) => state.setGridCount)
  const setMainSpacing = useSplicingStore((state) => state.setMainSpacing)
  const setCrossSpacing = useSplicingStore((state) => state.setCrossSpacing)
  const setBackgroundColor = useSplicingStore((state) => state.setBackgroundColor)

  useEffect(() => {
    if (!preset) {
      return
    }
    applyPreset(preset.id)
    setPresetViewMode("workspace")
    applyPresetConfigToSplicingStore(preset.config)
  }, [applyPreset, preset, setPresetViewMode])

  useEffect(() => {
    if (!activePresetId) {
      return
    }
    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(toPresetConfig(useSplicingStore.getState()))
    }, AUTO_SAVE_DELAY_MS)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePresetId, splicingState, syncActivePresetConfig])

  useEffect(() => {
    return () => {
      for (const item of images) {
        URL.revokeObjectURL(item.thumbnailUrl)
        item.bitmap.close()
      }
    }
  }, [images])

  const layoutConfig = useMemo(() => resolveLayoutConfig(splicingState), [splicingState])
  const canvasStyle = useMemo(() => resolveCanvasStyle(splicingState), [splicingState])
  const imageStyle = useMemo(() => resolveImageStyle(splicingState), [splicingState])

  const layout = useMemo(() => {
    if (!images.length) {
      return null
    }
    const sizes = images.map((entry) => ({
      width: entry.bitmap.width,
      height: entry.bitmap.height
    }))
    return calculateLayout(sizes, layoutConfig, canvasStyle, imageStyle, splicingState.imageResize, splicingState.imageFitValue)
  }, [canvasStyle, imageStyle, images, layoutConfig, splicingState.imageFitValue, splicingState.imageResize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout) {
      return
    }
    const scale = Math.min(1, PREVIEW_MAX_WIDTH / Math.max(1, layout.canvasWidth))
    canvas.width = Math.max(1, Math.round(layout.canvasWidth * scale))
    canvas.height = Math.max(1, Math.round(layout.canvasHeight * scale))
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }
    drawPreviewCanvas(ctx, images.map((entry) => entry.bitmap), layout, canvasStyle.backgroundColor, scale)
  }, [canvasStyle, imageStyle, images, layout, splicingState.previewShowImageNumber])

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return
    }
    setErrorText(null)
    const accepted = Array.from(fileList).filter((file) => file.type.startsWith("image/"))
    if (!accepted.length) {
      setErrorText("Please choose image files.")
      return
    }
    const next: LocalSplicingImage[] = []
    for (const file of accepted) {
      const bitmap = await createImageBitmap(file)
      next.push({
        id: `splicing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        bitmap,
        thumbnailUrl: URL.createObjectURL(file)
      })
    }
    setImages((prev) => [...prev, ...next])
  }

  const removeItem = (id: string) => {
    setImages((prev) => {
      const target = prev.find((entry) => entry.id === id)
      if (target) {
        URL.revokeObjectURL(target.thumbnailUrl)
        target.bitmap.close()
      }
      return prev.filter((entry) => entry.id !== id)
    })
  }

  const clearAll = () => {
    for (const item of images) {
      URL.revokeObjectURL(item.thumbnailUrl)
      item.bitmap.close()
    }
    setImages([])
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Image Splicing Workspace</h1>
          <p className="text-xs text-slate-500">{preset?.name ?? "Preset not found"}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm hover:border-sky-500 dark:border-slate-700">
            Add Images
            <input type="file" multiple accept="image/*" className="hidden" onChange={(event) => void addFiles(event.target.files)} />
          </label>
          <Button type="button" variant="secondary" onClick={clearAll} disabled={!images.length}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium">Quick controls</p>
          <label className="text-xs text-slate-500">
            Preset
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={splicingState.preset}
              onChange={(event) => setPresetType(event.target.value as typeof splicingState.preset)}
            >
              <option value="stitch_vertical">Stitch Vertical</option>
              <option value="stitch_horizontal">Stitch Horizontal</option>
              <option value="grid">Grid</option>
              <option value="bento">Bento</option>
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Grid Count
            <input
              type="number"
              min={1}
              max={24}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={splicingState.gridCount}
              onChange={(event) => setGridCount(Number(event.target.value || 1))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Main Spacing
            <input
              type="number"
              min={0}
              max={256}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={splicingState.mainSpacing}
              onChange={(event) => setMainSpacing(Number(event.target.value || 0))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Cross Spacing
            <input
              type="number"
              min={0}
              max={256}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={splicingState.crossSpacing}
              onChange={(event) => setCrossSpacing(Number(event.target.value || 0))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Background
            <input
              type="color"
              className="mt-1 h-9 w-full rounded border border-slate-300 bg-white px-1 dark:border-slate-700 dark:bg-slate-800"
              value={splicingState.backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
            />
          </label>
          <p className="text-xs text-slate-500">Images: {images.length}</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            {layout ? (
              <div className="overflow-auto">
                <canvas ref={canvasRef} className="max-w-full rounded border border-slate-200 dark:border-slate-700" />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Add images to render splicing preview.</p>
            )}
            {errorText ? <p className="mt-2 text-sm text-rose-500">{errorText}</p> : null}
          </div>

          {images.length ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
              {images.map((entry) => (
                <div key={entry.id} className="rounded border border-slate-200 p-2 dark:border-slate-700">
                  <img src={entry.thumbnailUrl} alt={entry.file.name} className="h-20 w-full rounded object-cover" />
                  <p className="mt-1 truncate text-[11px] text-slate-500">{entry.file.name}</p>
                  <button type="button" className="mt-1 text-xs text-rose-500" onClick={() => removeItem(entry.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
