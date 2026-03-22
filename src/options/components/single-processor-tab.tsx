import { useEffect, useMemo, useRef, useState } from "react"
import { Download, ImagePlus, Loader2, Maximize2, Minimize2, Move, RefreshCcw,
  ZoomIn, ZoomOut } from "lucide-react"

import { toUserFacingConversionError } from "@/core/error-utils"
import type { FormatConfig } from "@/core/types"
import { convertImage } from "@/features/converter"
import { applyExifPolicy } from "@/features/converter/exif"
import { applyWatermarkToImageBlob } from "@/options/components/batch/watermark"
import { downloadWithFilename, formatBytes, withBatchResize } from "@/options/components/batch/utils"
import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Heading, MutedText } from "@/options/components/ui/typography"
import { useBatchStore } from "@/options/stores/batch-store"
import { Tooltip } from "./tooltip"

const PREVIEW_DEBOUNCE_MS = 420
const MIN_ZOOM = 1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.2

function toOutputFilenameWithExtension(nameOrBase: string, extension: string): string {
  const base = nameOrBase.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extension}`
}

function describeDeltaRatio(originalSize: number, outputSize: number): { label: string; className: string } {
  if (originalSize <= 0) {
    return {
      label: "0%",
      className: "text-slate-500 dark:text-slate-400"
    }
  }

  const ratio = ((outputSize - originalSize) / originalSize) * 100
  const absRatio = Math.abs(ratio).toFixed(1)

  if (ratio < 0) {
    return {
      label: `-${absRatio}%`,
      className: "text-emerald-600 dark:text-emerald-400"
    }
  }

  if (ratio > 0) {
    return {
      label: `+${absRatio}%`,
      className: "text-rose-600 dark:text-rose-400"
    }
  }

  return {
    label: "0%",
    className: "text-slate-500 dark:text-slate-400"
  }
}

interface ImageMeta {
  width: number
  height: number
  ratioLabel: string
}

function toAspectRatioLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return "-"
  }

  const gcd = (a: number, b: number): number => {
    if (!b) {
      return a
    }

    return gcd(b, a % b)
  }

  const divisor = gcd(width, height)
  const ratioW = Math.round(width / divisor)
  const ratioH = Math.round(height / divisor)

  return `${ratioW}:${ratioH}`
}

async function readImageMeta(blob: Blob): Promise<ImageMeta | null> {
  if (!blob.type.startsWith("image/")) {
    return null
  }

  const imageBitmap = await createImageBitmap(blob)

  try {
    return {
      width: imageBitmap.width,
      height: imageBitmap.height,
      ratioLabel: toAspectRatioLabel(imageBitmap.width, imageBitmap.height)
    }
  } finally {
    imageBitmap.close()
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function SingleProcessorTab() {
  const targetFormat = useBatchStore((state) => state.targetFormat)
  const quality = useBatchStore((state) => state.quality)
  const icoSizes = useBatchStore((state) => state.icoSizes)
  const icoGenerateWebIconKit = useBatchStore((state) => state.icoGenerateWebIconKit)
  const resizeMode = useBatchStore((state) => state.resizeMode)
  const resizeValue = useBatchStore((state) => state.resizeValue)
  const resizeWidth = useBatchStore((state) => state.resizeWidth)
  const resizeHeight = useBatchStore((state) => state.resizeHeight)
  const resizeAspectMode = useBatchStore((state) => state.resizeAspectMode)
  const resizeAspectRatio = useBatchStore((state) => state.resizeAspectRatio)
  const resizeAnchor = useBatchStore((state) => state.resizeAnchor)
  const resizeFitMode = useBatchStore((state) => state.resizeFitMode)
  const resizeContainBackground = useBatchStore((state) => state.resizeContainBackground)
  const paperSize = useBatchStore((state) => state.paperSize)
  const dpi = useBatchStore((state) => state.dpi)
  const stripExif = useBatchStore((state) => state.stripExif)
  const pngTinyMode = useBatchStore((state) => state.pngTinyMode)
  const watermark = useBatchStore((state) => state.watermark)

  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null)
  const [sourceMeta, setSourceMeta] = useState<ImageMeta | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null)
  const [resultMeta, setResultMeta] = useState<ImageMeta | null>(null)
  const [resultFileName, setResultFileName] = useState<string>("")
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [compareRatio, setCompareRatio] = useState(50)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  const requestSequenceRef = useRef(0)
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)

  const effectiveConfig = useMemo(() => {
    const baseConfig: FormatConfig = {
      id: `single_${targetFormat}`,
      name: `Single ${targetFormat.toUpperCase()}`,
      format: targetFormat,
      enabled: true,
      quality,
      pngTinyMode,
      resize: { mode: "none" }
    }

    return withBatchResize(
      baseConfig,
      resizeMode,
      quality,
      icoSizes,
      icoGenerateWebIconKit,
      resizeValue,
      resizeWidth,
      resizeHeight,
      resizeAspectMode,
      resizeAspectRatio,
      resizeAnchor,
      resizeFitMode,
      resizeContainBackground,
      paperSize,
      dpi
    )
  }, [
    targetFormat,
    resizeMode,
    quality,
    icoSizes,
    icoGenerateWebIconKit,
    resizeValue,
    resizeWidth,
    resizeHeight,
    resizeAspectMode,
    resizeAspectRatio,
    resizeAnchor,
    resizeFitMode,
    resizeContainBackground,
    paperSize,
    dpi,
    pngTinyMode
  ])

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) {
        URL.revokeObjectURL(sourcePreviewUrl)
      }

      if (resultPreviewUrl) {
        URL.revokeObjectURL(resultPreviewUrl)
      }
    }
  }, [resultPreviewUrl, sourcePreviewUrl])

  const updateSourcePreview = (next: string | null) => {
    setSourcePreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }

      return next
    })
  }

  const updateResultPreview = (next: string | null) => {
    setResultPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }

      return next
    })
  }

  const resetViewport = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const attachSingleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorText("Please choose an image file.")
      return
    }

    setSourceFile(file)
    setErrorText(null)
    setResultBlob(null)
    setResultMeta(null)
    setResultFileName("")
    resetViewport()

    updateResultPreview(null)
    updateSourcePreview(URL.createObjectURL(file))

    const meta = await readImageMeta(file)
    setSourceMeta(meta)
  }

  const onAppendFiles = (files: FileList | null) => {
    if (!files?.length) {
      return
    }

    void attachSingleFile(files[0])
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items
      if (!clipboardItems?.length) {
        return
      }

      const imageItem = Array.from(clipboardItems).find(
        (item) => item.kind === "file" && item.type.startsWith("image/")
      )

      if (!imageItem) {
        return
      }

      const blob = imageItem.getAsFile()
      if (!blob) {
        return
      }

      event.preventDefault()
      const extension = blob.type.split("/")[1] || "png"
      const namedFile = new File([blob], `pasted_${Date.now()}.${extension}`, {
        type: blob.type,
        lastModified: Date.now()
      })

      void attachSingleFile(namedFile)
    }

    window.addEventListener("paste", onPaste)
    return () => {
      window.removeEventListener("paste", onPaste)
    }
  }, [])

  useEffect(() => {
    if (!sourceFile) {
      setIsProcessing(false)
      return
    }

    const currentSequence = ++requestSequenceRef.current
    setIsProcessing(true)
    setErrorText(null)

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const sourceBlob = await applyWatermarkToImageBlob(sourceFile, watermark)

          const converted = await convertImage({
            sourceBlob,
            config: effectiveConfig
          })

          const normalizedBlob = await applyExifPolicy({
            sourceBlob: sourceFile,
            outputBlob: converted.blob,
            stripExif
          })

          if (requestSequenceRef.current !== currentSequence) {
            return
          }

          const outputExtension = converted.outputExtension ?? effectiveConfig.format
          setResultBlob(normalizedBlob)
          setResultFileName(
            outputExtension === "zip"
              ? "favicon_kit.zip"
              : toOutputFilenameWithExtension(sourceFile.name, outputExtension)
          )

          setResultMeta(await readImageMeta(normalizedBlob))

          if (normalizedBlob.type.startsWith("image/")) {
            updateResultPreview(URL.createObjectURL(normalizedBlob))
          } else {
            updateResultPreview(null)
          }
        } catch (error) {
          if (requestSequenceRef.current !== currentSequence) {
            return
          }

          setResultBlob(null)
          setResultMeta(null)
          setResultFileName("")
          updateResultPreview(null)
          setErrorText(toUserFacingConversionError(error, "Unable to process image"))
        } finally {
          if (requestSequenceRef.current === currentSequence) {
            setIsProcessing(false)
          }
        }
      })()
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [effectiveConfig, sourceFile, stripExif, watermark])

  const sourceBytes = sourceFile?.size || 0
  const resultBytes = resultBlob?.size || 0
  const delta = describeDeltaRatio(sourceBytes, resultBytes)

  const imageLayerTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
  // The split bar is a global percentage of the container width.
  // To make the image boundary match the split bar, we must account for the zoom and pan
  // so that the clip-path is effectively relative to the container, not the transformed image.
  // 
  // Formula: (SplitPercentage - PanX_as_Percentage) / Zoom
  const sourceClipPath = `inset(0 ${100 - compareRatio}% 0 0)`

  const sourceDimensionLabel = sourceMeta
    ? `${sourceMeta.width} x ${sourceMeta.height}`
    : "-"

  const resultDimensionLabel = resultMeta
    ? `${resultMeta.width} x ${resultMeta.height}`
    : isProcessing
      ? "Processing..."
      : "-"

  return (
    <div className="space-y-4">
      {!sourceFile ? (
        <SurfaceCard className="p-4">
          <label
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 px-4 py-14 text-center transition-colors group"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              onAppendFiles(event.dataTransfer.files)
            }}>
            <input
              className="hidden"
              onChange={(event) => onAppendFiles(event.target.files)}
              type="file"
            />
            <div className="bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4 group-hover:-translate-y-1 transition-transform border border-slate-100 dark:border-slate-700/50 p-4">
              <ImagePlus size={28} className="text-sky-500/80 dark:text-sky-400" />
            </div>
            <Heading className="text-base font-semibold">
              Drop one image here, click to browse, or paste from clipboard
            </Heading>
            <MutedText className="mt-1.5">Single Processor with live preview and debounce</MutedText>
          </label>
        </SurfaceCard>
      ) : (
        <>
          <SurfaceCard className="p-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <Heading className="text-base truncate">{sourceFile.name}</Heading>
                <MutedText className="text-xs">Live preview updates after {PREVIEW_DEBOUNCE_MS}ms idle.</MutedText>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSourceFile(null)
                    setSourceMeta(null)
                    setErrorText(null)
                    setResultBlob(null)
                    setResultMeta(null)
                    setResultFileName("")
                    updateSourcePreview(null)
                    updateResultPreview(null)
                    resetViewport()
                  }}
                  type="button">
                  Clear
                </Button>
                <Button
                  disabled={!resultBlob || !resultFileName}
                  onClick={async () => {
                    if (!resultBlob || !resultFileName) {
                      return
                    }

                    await downloadWithFilename(resultBlob, resultFileName)
                  }}
                  type="button"
                  variant="primary">
                  <Download size={16} />
                  Download
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/30">
                <MutedText className="text-[11px] uppercase tracking-wide">Original</MutedText>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatBytes(sourceBytes)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {sourceDimensionLabel} ({sourceMeta?.ratioLabel || "-"})
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/30">
                <MutedText className="text-[11px] uppercase tracking-wide">Result</MutedText>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {resultBlob ? formatBytes(resultBytes) : isProcessing ? "Processing..." : "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {resultDimensionLabel} ({resultMeta?.ratioLabel || "-"})
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/30">
                <MutedText className="text-[11px] uppercase tracking-wide">Delta</MutedText>
                <p className={`text-xl font-bold ${delta.className}`}>{resultBlob ? delta.label : "-"}</p>
              </div>
            </div>

            {errorText ? (
              <div className="rounded-lg border border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                {errorText}
              </div>
            ) : null}
          </div>
          </SurfaceCard>

          <SurfaceCard className={`p-4 ${isFullscreen ? "fixed inset-0 z-[9999] flex flex-col rounded-none h-screen w-screen overflow-hidden bg-white dark:bg-slate-950" : ""}`}>
            <div className={`space-y-3 flex flex-col ${isFullscreen ? "h-full" : "h-auto"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <MutedText className="text-xs">Before / After Split View</MutedText>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mr-2">
                    <Move size={12} />
                    Drag to pan
                  </span>
                  <Tooltip content="Zoom Out (Scroll wheel down)" variant="nowrap">
                    <Button
                      size="icon"
                      type="button"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => {
                        setZoom((current) => clamp(current - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))
                      }}>
                      <ZoomOut size={15} />
                    </Button>
                  </Tooltip>
                  <span className="w-14 text-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Tooltip content="Zoom In (Scroll wheel up)" variant="nowrap">
                    <Button
                      size="icon"
                      type="button"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => {
                        setZoom((current) => clamp(current + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))
                      }}>
                      <ZoomIn size={15} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Reset View (Zoom & Pan)" variant="nowrap">
                    <Button
                      size="icon"
                      type="button"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={resetViewport}>
                      <RefreshCcw size={15} />
                    </Button>
                  </Tooltip>
                  <Tooltip content={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} variant="nowrap">
                    <Button
                      size="icon"
                      type="button"
                      variant="secondary"
                      className="h-8 w-8 ml-1"
                      onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <div
                className={`relative ${isFullscreen ? "flex-1" : "h-[480px]"} min-h-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800/40 select-none ${zoom > 1 ? "cursor-grab" : "cursor-default"} ${isPanning ? "cursor-grabbing" : ""}`}
                onPointerDown={(event) => {
                  if (zoom <= 1) {
                    return
                  }

                  const container = event.currentTarget
                  container.setPointerCapture(event.pointerId)

                  panStartRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                    originX: pan.x,
                    originY: pan.y
                  }
                  setIsPanning(true)
                }}
                onPointerMove={(event) => {
                  if (!panStartRef.current || !isPanning) {
                    return
                  }

                  const dx = event.clientX - panStartRef.current.x
                  const dy = event.clientY - panStartRef.current.y

                  setPan({
                    x: panStartRef.current.originX + dx,
                    y: panStartRef.current.originY + dy
                  })
                }}
                onPointerUp={(event) => {
                  if (isPanning) {
                    event.currentTarget.releasePointerCapture(event.pointerId)
                    panStartRef.current = null
                    setIsPanning(false)
                  }
                }}
                onPointerCancel={(event) => {
                  if (isPanning) {
                    event.currentTarget.releasePointerCapture(event.pointerId)
                    panStartRef.current = null
                    setIsPanning(false)
                  }
                }}
                onWheel={(event) => {
                  const direction = event.deltaY > 0 ? -1 : 1
                  setZoom((current) => clamp(current + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))
                }}>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: imageLayerTransform,
                    transformOrigin: "center center"
                  }}
                >
                  {resultPreviewUrl ? (
                    <img
                      alt="Processed preview"
                      className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                      src={resultPreviewUrl}
                    />
                  ) : null}
                </div>

                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{
                    clipPath: sourceClipPath
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      transform: imageLayerTransform,
                      transformOrigin: "center center"
                    }}
                  >
                    {sourcePreviewUrl ? (
                      <img
                        alt="Original preview"
                        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                        src={sourcePreviewUrl}
                      />
                    ) : null}
                  </div>
                </div>

                {!resultPreviewUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                    <MutedText>
                      Result preview is unavailable for this output type. You can still download the processed file.
                    </MutedText>
                  </div>
                ) : null}

                <div className="pointer-events-none absolute left-3 top-3 rounded bg-slate-900/70 px-2 py-1 text-[11px] font-semibold text-white">
                  Original
                </div>
                <div className="pointer-events-none absolute right-3 top-3 rounded bg-slate-900/70 px-2 py-1 text-[11px] font-semibold text-white">
                  Result
                </div>

                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(15,23,42,0.25)]"
                  style={{ left: `${compareRatio}%` }}
                />

                {isProcessing ? (
                  <div className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded bg-sky-600/90 px-2 py-1 text-xs text-white">
                    <Loader2 size={13} className="animate-spin" />
                    Rendering preview...
                  </div>
                ) : null}
              </div>

              <input
                className="w-full"
                max={100}
                min={0}
                onChange={(event) => setCompareRatio(Number(event.target.value))}
                step={1}
                type="range"
                value={compareRatio}
              />
            </div>
          </SurfaceCard>
        </>
      )}
    </div>
  )
}
