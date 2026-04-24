"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Download, ImagePlus, Move } from "lucide-react"
import { toUserFacingConversionError } from "@imify/core/error-utils"
import { buildSmartOutputFileName, readImageDimensions } from "@imify/core/file-name-pattern"
import type { FormatConfig } from "@imify/core/types"
import { convertImage } from "@imify/engine/converter"
import { applyExifPolicy } from "@imify/engine/converter/exif"
import { fetchRemoteImageAsFile } from "@imify/engine/converter/remote-image-import"
import { decodeBlobToImageData, decodeFileToImageData } from "@imify/engine/image-pipeline/decode-image-data"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useWatermarkStore } from "@imify/stores/stores/watermark-store"
import { Button, EmptyDropCard, Heading, MutedText } from "@imify/ui"
import { PixelCompareWorkspace } from "../diffchecker/pixel-compare-workspace"
import { useClipboardPaste } from "../shared/use-clipboard-paste"
import { ImageUrlImportControl } from "./image-url-import-control"
import { withBatchResize, downloadWithFilename, formatBytes } from "./processor-utils"
import { buildActiveCodecOptionsForTarget } from "./target-format-state"
import { applyWatermarkToImageBlob } from "./watermark"

const PREVIEW_DEBOUNCE_MS = 420
const PREVIEW_MAX_DIMENSION = 3072

interface ImageMeta { width: number; height: number; ratioLabel: string }
interface NameDimensions { width: number; height: number }

function toOutputFilenameWithExtension(nameOrBase: string, extension: string): string {
  const base = nameOrBase.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extension}`
}

function isImageLikeFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true
  return /\.(png|jpe?g|webp|avif|bmp|gif|tiff?|jxl|ico)$/i.test(file.name)
}

function toAspectRatioLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "-"
  const gcd = (a: number, b: number): number => (!b ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`
}

function toImageMeta(width: number, height: number): ImageMeta {
  return { width, height, ratioLabel: toAspectRatioLabel(width, height) }
}

function describeDeltaRatio(originalSize: number, outputSize: number): { label: string; className: string } {
  if (originalSize <= 0) return { label: "0%", className: "text-slate-500 dark:text-slate-400" }
  const ratio = ((outputSize - originalSize) / originalSize) * 100
  const absRatio = Math.abs(ratio).toFixed(1)
  if (ratio < 0) return { label: `-${absRatio}%`, className: "text-emerald-600 dark:text-emerald-400" }
  if (ratio > 0) return { label: `+${absRatio}%`, className: "text-rose-600 dark:text-rose-400" }
  return { label: "0%", className: "text-slate-500 dark:text-slate-400" }
}

export function SingleProcessorWorkspace({ consumePendingOptimizeFile }: { consumePendingOptimizeFile?: () => File | null } = {}) {
  const targetFormat = useBatchStore((state) => state.targetFormat)
  const quality = useBatchStore((state) => state.quality)
  const formatOptions = useBatchStore((state) => state.formatOptions)
  const resizeMode = useBatchStore((state) => state.resizeMode)
  const resizeValue = useBatchStore((state) => state.resizeValue)
  const resizeWidth = useBatchStore((state) => state.resizeWidth)
  const resizeHeight = useBatchStore((state) => state.resizeHeight)
  const resizeAspectMode = useBatchStore((state) => state.resizeAspectMode)
  const resizeAspectRatio = useBatchStore((state) => state.resizeAspectRatio)
  const resizeAnchor = useBatchStore((state) => state.resizeAnchor)
  const resizeFitMode = useBatchStore((state) => state.resizeFitMode)
  const resizeContainBackground = useBatchStore((state) => state.resizeContainBackground)
  const resizeResamplingAlgorithm = useBatchStore((state) => state.resizeResamplingAlgorithm)
  const paperSize = useBatchStore((state) => state.paperSize)
  const dpi = useBatchStore((state) => state.dpi)
  const stripExif = useBatchStore((state) => state.stripExif)
  const fileNamePattern = useBatchStore((state) => state.fileNamePattern)
  const watermark = useWatermarkStore((state) => state.contextWatermarks.single)
  const syncResizeToSource = useBatchStore((state) => state.syncResizeToSource)

  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null)
  const [sourceMeta, setSourceMeta] = useState<ImageMeta | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultImageData, setResultImageData] = useState<ImageData | null>(null)
  const [resultMeta, setResultMeta] = useState<ImageMeta | null>(null)
  const [resultOutputExtension, setResultOutputExtension] = useState<string | null>(null)
  const [resultNameDimensions, setResultNameDimensions] = useState<NameDimensions | null>(null)
  const [resultFileName, setResultFileName] = useState("")
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isImportingUrl, setIsImportingUrl] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [compareViewMode, setCompareViewMode] = useState<"split" | "side_by_side">("split")
  const [splitPosition, setSplitPosition] = useState(50)
  const [zoom, setZoom] = useState(100)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const requestSequenceRef = useRef(0)
  const attachSequenceRef = useRef(0)

  const effectiveConfig = useMemo(() => {
    const isMozJpegTarget = targetFormat === "mozjpeg"
    const baseConfig: FormatConfig = {
      id: `single_${targetFormat}`,
      name: `Single ${isMozJpegTarget ? "MOZJPEG" : targetFormat.toUpperCase()}`,
      format: isMozJpegTarget ? "jpg" : targetFormat,
      enabled: true,
      quality,
      formatOptions: buildActiveCodecOptionsForTarget(targetFormat, formatOptions),
      resize: { mode: "none" }
    }
    return withBatchResize(
      baseConfig, resizeMode, quality, formatOptions, resizeValue, resizeWidth, resizeHeight, resizeAspectMode, resizeAspectRatio, resizeAnchor, resizeFitMode, resizeContainBackground, resizeResamplingAlgorithm, paperSize, dpi
    )
  }, [targetFormat, resizeMode, quality, formatOptions, resizeValue, resizeWidth, resizeHeight, resizeAspectMode, resizeAspectRatio, resizeAnchor, resizeFitMode, resizeContainBackground, resizeResamplingAlgorithm, paperSize, dpi])

  const resetViewport = () => { setZoom(100); setPanX(0); setPanY(0) }
  const clearAll = () => {
    setSourceFile(null); setSourceImageData(null); setSourceMeta(null); setErrorText(null); setResultBlob(null); setResultImageData(null); setResultMeta(null); setResultOutputExtension(null); setResultNameDimensions(null); setResultFileName(""); resetViewport()
  }

  const attachSingleFile = async (file: File) => {
    const attachSequence = ++attachSequenceRef.current
    if (!isImageLikeFile(file)) { setErrorText("Please choose an image file."); return }
    clearAll()
    setSourceFile(file)
    try {
      const decodedSource = await decodeFileToImageData(file)
      if (attachSequenceRef.current !== attachSequence) return
      setSourceImageData(decodedSource.imageData)
      const meta = toImageMeta(decodedSource.width, decodedSource.height)
      setSourceMeta(meta)
      syncResizeToSource(meta.width, meta.height)
    } catch (error) {
      if (attachSequenceRef.current !== attachSequence) return
      clearAll()
      setErrorText(toUserFacingConversionError(error, "Unable to decode source image"))
    }
  }

  const onAppendFiles = (files: FileList | null) => { if (files?.length) void attachSingleFile(files[0]) }
  const importFromImageUrls = async (urls: string[]) => {
    const firstUrl = urls[0]
    if (!firstUrl) return
    setIsImportingUrl(true); setErrorText(null)
    try { await attachSingleFile(await fetchRemoteImageAsFile(firstUrl)) } catch (error) { setErrorText(error instanceof Error && error.message.trim() ? error.message : "Unable to import image URL") } finally { setIsImportingUrl(false) }
  }

  useClipboardPaste({ onFiles: (files) => { if (files[0]) void attachSingleFile(files[0]) }, onUrls: importFromImageUrls, enabled: !sourceFile })

  useEffect(() => {
    const file = consumePendingOptimizeFile?.()
    if (file) void attachSingleFile(file)
  }, [consumePendingOptimizeFile])

  useEffect(() => {
    if (!sourceFile || !resultBlob || !resultOutputExtension) { setResultFileName(""); return }
    const smartName = buildSmartOutputFileName({ pattern: fileNamePattern, originalFileName: sourceFile.name, outputExtension: resultOutputExtension, index: 1, totalFiles: 1, dimensions: resultNameDimensions, now: new Date() })
    setResultFileName(resultOutputExtension === "zip" ? smartName || "favicon_kit.zip" : smartName || toOutputFilenameWithExtension(sourceFile.name, resultOutputExtension))
  }, [fileNamePattern, resultBlob, resultNameDimensions, resultOutputExtension, sourceFile])

  useEffect(() => {
    if (!sourceFile) { setIsProcessing(false); return }
    const currentSequence = ++requestSequenceRef.current
    setIsProcessing(true); setErrorText(null)
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const sourceBlob = await applyWatermarkToImageBlob(sourceFile, watermark)
          const converted = await convertImage({ sourceBlob, config: effectiveConfig })
          const normalizedBlob = await applyExifPolicy({ sourceBlob: sourceFile, outputBlob: converted.blob, stripExif })
          if (requestSequenceRef.current !== currentSequence) return
          const outputExtension = converted.outputExtension ?? effectiveConfig.format
          const dimensions = (await readImageDimensions(normalizedBlob)) || (await readImageDimensions(sourceFile))
          const smartName = buildSmartOutputFileName({ pattern: fileNamePattern, originalFileName: sourceFile.name, outputExtension, index: 1, totalFiles: 1, dimensions, now: new Date() })
          setResultBlob(normalizedBlob); setResultOutputExtension(outputExtension); setResultNameDimensions(dimensions); setResultFileName(outputExtension === "zip" ? smartName || "favicon_kit.zip" : smartName || toOutputFilenameWithExtension(sourceFile.name, outputExtension))
          if (normalizedBlob.type.startsWith("image/")) {
            try {
              const decodedResult = await decodeBlobToImageData(normalizedBlob, { fileNameHint: `${sourceFile.name}.${outputExtension}` })
              if (requestSequenceRef.current !== currentSequence) return
              setResultImageData(decodedResult.imageData); setResultMeta(toImageMeta(decodedResult.width, decodedResult.height))
            } catch {
              if (requestSequenceRef.current !== currentSequence) return
              setResultImageData(null); setResultMeta(null)
            }
          } else { setResultImageData(null); setResultMeta(null) }
        } catch (error) {
          if (requestSequenceRef.current !== currentSequence) return
          setResultBlob(null); setResultImageData(null); setResultMeta(null); setResultOutputExtension(null); setResultNameDimensions(null); setResultFileName("")
          setErrorText(toUserFacingConversionError(error, "Unable to process image"))
        } finally {
          if (requestSequenceRef.current === currentSequence) setIsProcessing(false)
        }
      })()
    }, PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [effectiveConfig, fileNamePattern, sourceFile, stripExif, watermark])

  const sourceBytes = sourceFile?.size || 0
  const resultBytes = resultBlob?.size || 0
  const delta = describeDeltaRatio(sourceBytes, resultBytes)
  const sourceDimensionLabel = sourceMeta ? `${sourceMeta.width} x ${sourceMeta.height}` : "-"
  const resultDimensionLabel = resultMeta ? `${resultMeta.width} x ${resultMeta.height}` : isProcessing ? "Processing..." : "-"

  return (
    <div className="space-y-0">
      {!sourceFile ? (
        <div className="p-6">
          <EmptyDropCard icon={<ImagePlus size={28} className="text-sky-500/80 dark:text-sky-400" />} title="Drop one image here, click to browse, or paste from clipboard" subtitle="Single Processor with live preview, debounce, and image URL import" onDropFiles={onAppendFiles} fileInput={{ onInputFiles: onAppendFiles }} topRightSlot={<ImageUrlImportControl allowMultiple={false} disabled={isImportingUrl} onProcessUrls={importFromImageUrls} />} />
        </div>
      ) : (
        <>
          <div className="p-4"><div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><Heading className="truncate text-base">{sourceFile.name}</Heading><MutedText className="text-xs">Live preview updates after {PREVIEW_DEBOUNCE_MS}ms idle.</MutedText></div><div className="flex gap-2"><Button variant="secondary" onClick={clearAll} type="button">Clear</Button><Button disabled={!resultBlob || !resultFileName} onClick={async () => { if (resultBlob && resultFileName) await downloadWithFilename(resultBlob, resultFileName) }} type="button" variant="primary"><Download size={16} />Download</Button></div></div>
          <div className="flex flex-col items-center divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex w-full flex-1 flex-col items-center p-4 text-center transition-colors hover:bg-white sm:items-start sm:text-left dark:hover:bg-slate-900">
              <div className="mb-1 flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-slate-400" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Original</span></div>
              <div className="flex items-baseline gap-1.5"><span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">{formatBytes(sourceBytes)}</span></div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium leading-none text-slate-500 dark:text-slate-500"><span className="rounded bg-slate-200/50 px-1 uppercase dark:bg-slate-800">{sourceDimensionLabel}</span><span className="rounded bg-slate-200/50 px-1 opacity-70 dark:bg-slate-800">{sourceMeta?.ratioLabel || "-"}</span></div>
            </div>
            <div className="flex w-full flex-1 flex-col items-center border-t p-4 text-center transition-colors hover:bg-white sm:items-start sm:text-left dark:hover:bg-slate-900 sm:border-t-0">
              <div className="mb-1 flex items-center gap-1.5"><div className={`h-1.5 w-1.5 rounded-full ${isProcessing ? "animate-pulse bg-amber-400" : "bg-blue-500"}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Result</span></div>
              <div className="flex items-baseline gap-1.5"><span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">{resultBlob ? formatBytes(resultBytes) : isProcessing ? <span className="animate-pulse">...</span> : "-"}</span></div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium leading-none text-slate-500 dark:text-slate-500"><span className="rounded bg-slate-200/50 px-1 uppercase dark:bg-slate-800">{resultDimensionLabel}</span><span className="rounded bg-slate-200/50 px-1 opacity-70 dark:bg-slate-800">{resultMeta?.ratioLabel || "-"}</span></div>
            </div>
            <div className="flex w-full min-w-[120px] flex-none flex-col items-center justify-center border-t bg-white/50 p-4 text-center sm:w-auto sm:border-t-0 dark:bg-slate-900/30">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Impact</span>
              <div className={`text-2xl font-black tracking-tight tabular-nums ${delta.className}`}>{resultBlob ? delta.label : "-"}</div>
            </div>
          </div>
          {errorText ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{errorText}</div> : null}</div></div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                  <Button type="button" size="sm" variant={compareViewMode === "split" ? "primary" : "ghost"} className="h-8" onClick={() => setCompareViewMode("split")}>Split View</Button>
                  <Button type="button" size="sm" variant={compareViewMode === "side_by_side" ? "primary" : "ghost"} className="h-8" onClick={() => setCompareViewMode("side_by_side")}>Side by Side</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Move size={12} />Drag to pan</span><span className="text-xs text-slate-500 dark:text-slate-400">• Scroll to zoom</span></div>
              </div>
              <PixelCompareWorkspace className="h-[480px]" mode={compareViewMode} imageDataA={sourceImageData} imageDataB={resultImageData} labelA="Original" labelB="Result" splitPosition={splitPosition} onSplitChange={setSplitPosition} zoom={zoom} panX={panX} panY={panY} onZoomChange={setZoom} onPanChange={(x, y) => { setPanX(x); setPanY(y) }} preferredMimeTypeA={sourceFile?.type} preferredMimeTypeB={resultBlob?.type} maxPreviewDimension={PREVIEW_MAX_DIMENSION} isProcessing={isProcessing} emptyFallback={<MutedText>Result preview is unavailable for this output type. You can still download the processed file.</MutedText>} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

