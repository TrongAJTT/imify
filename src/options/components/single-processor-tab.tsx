import { useEffect, useMemo, useRef, useState } from "react"
import { Download, ImagePlus, Move } from "lucide-react"

import { toUserFacingConversionError } from "@/core/error-utils"
import type { FormatConfig } from "@/core/types"
import { convertImage } from "@/features/converter"
import { applyExifPolicy } from "@/features/converter/exif"
import { fetchRemoteImageAsFile } from "@/features/converter/remote-image-import"
import {
  decodeBlobToImageData,
  decodeFileToImageData
} from "@/features/image-pipeline/decode-image-data"
import { useClipboardPaste } from "@/options/hooks/use-clipboard-paste"
import { applyWatermarkToImageBlob } from "@/options/components/batch/watermark"
import { buildSmartOutputFileName, readImageDimensions } from "@/options/components/batch/pipeline"
import { downloadWithFilename, formatBytes, withBatchResize } from "@/options/components/batch/utils"
import { consumePendingInspectorOptimizeFile } from "@/options/shared/inspector-optimize-bridge"
import { buildActiveCodecOptionsForTarget } from "@/options/shared/target-format-state"
import { PixelCompareWorkspace } from "@/options/components/diffchecker/pixel-compare-workspace"
import { Button } from "@/options/components/ui/button"
import { EmptyDropCard } from "@/options/components/ui/empty-drop-card"
import { Heading, MutedText } from "@/options/components/ui/typography"
import { useBatchStore } from "@/options/stores/batch-store"
import { useWatermarkStore } from "@/options/stores/watermark-store"
import { ImageUrlImportControl } from "@/options/components/image-url-import-control"

const PREVIEW_DEBOUNCE_MS = 420
const PREVIEW_MAX_DIMENSION = 3072
const MIN_ZOOM = 10
const MAX_ZOOM = 800
const ZOOM_STEP = 10

function toOutputFilenameWithExtension(nameOrBase: string, extension: string): string {
  const base = nameOrBase.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extension}`
}

function isImageLikeFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true
  }

  return /\.(png|jpe?g|webp|avif|bmp|gif|tiff?|jxl|ico)$/i.test(file.name)
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

interface NameDimensions {
  width: number
  height: number
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

function toImageMeta(width: number, height: number): ImageMeta {
  return {
    width,
    height,
    ratioLabel: toAspectRatioLabel(width, height)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function SingleProcessorTab() {
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
  const [resultFileName, setResultFileName] = useState<string>("")
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
      baseConfig,
      resizeMode,
      quality,
      formatOptions,
      resizeValue,
      resizeWidth,
      resizeHeight,
      resizeAspectMode,
      resizeAspectRatio,
      resizeAnchor,
      resizeFitMode,
      resizeContainBackground,
      resizeResamplingAlgorithm,
      paperSize,
      dpi
    )
  }, [
    targetFormat,
    resizeMode,
    quality,
    formatOptions,
    resizeValue,
    resizeWidth,
    resizeHeight,
    resizeAspectMode,
    resizeAspectRatio,
    resizeAnchor,
    resizeFitMode,
    resizeContainBackground,
    resizeResamplingAlgorithm,
    paperSize,
    dpi
  ])

  const resetViewport = () => {
    setZoom(100)
    setPanX(0)
    setPanY(0)
  }

  const attachSingleFile = async (file: File) => {
    const attachSequence = ++attachSequenceRef.current

    if (!isImageLikeFile(file)) {
      setErrorText("Please choose an image file.")
      return
    }

    setSourceFile(file)
    setErrorText(null)
    setSourceImageData(null)
    setSourceMeta(null)
    setResultBlob(null)
    setResultImageData(null)
    setResultMeta(null)
    setResultOutputExtension(null)
    setResultNameDimensions(null)
    setResultFileName("")
    resetViewport()

    try {
      const decodedSource = await decodeFileToImageData(file)

      if (attachSequenceRef.current !== attachSequence) {
        return
      }

      setSourceImageData(decodedSource.imageData)

      const meta = toImageMeta(decodedSource.width, decodedSource.height)
      setSourceMeta(meta)
      syncResizeToSource(meta.width, meta.height)
    } catch (error) {
      if (attachSequenceRef.current !== attachSequence) {
        return
      }

      setSourceFile(null)
      setSourceImageData(null)
      setSourceMeta(null)
      setErrorText(toUserFacingConversionError(error, "Unable to decode source image"))
    }
  }

  const onAppendFiles = (files: FileList | null) => {
    if (!files?.length) {
      return
    }

    void attachSingleFile(files[0])
  }

  const importFromImageUrls = async (urls: string[]) => {
    const firstUrl = urls[0]
    if (!firstUrl) {
      return
    }

    setIsImportingUrl(true)
    setErrorText(null)

    try {
      const file = await fetchRemoteImageAsFile(firstUrl)
      await attachSingleFile(file)
    } catch (error) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : "Unable to import image URL"
      setErrorText(message)
    } finally {
      setIsImportingUrl(false)
    }
  }

  useClipboardPaste({
    onFiles: (files) => { if (files[0]) void attachSingleFile(files[0]) },
    onUrls: importFromImageUrls,
    enabled: !sourceFile
  })

  useEffect(() => {
    const pendingInspectorFile = consumePendingInspectorOptimizeFile()
    if (pendingInspectorFile) {
      void attachSingleFile(pendingInspectorFile)
    }
  }, [])

  useEffect(() => {
    if (!sourceFile || !resultBlob || !resultOutputExtension) {
      setResultFileName("")
      return
    }

    const smartName = buildSmartOutputFileName({
      pattern: fileNamePattern,
      originalFileName: sourceFile.name,
      outputExtension: resultOutputExtension,
      index: 1,
      totalFiles: 1,
      dimensions: resultNameDimensions,
      now: new Date()
    })

    setResultFileName(
      resultOutputExtension === "zip"
        ? smartName || "favicon_kit.zip"
        : smartName || toOutputFilenameWithExtension(sourceFile.name, resultOutputExtension)
    )
  }, [fileNamePattern, resultBlob, resultNameDimensions, resultOutputExtension, sourceFile])

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
          const dimensions =
            (await readImageDimensions(normalizedBlob)) ||
            (await readImageDimensions(sourceFile))
          const smartName = buildSmartOutputFileName({
            pattern: fileNamePattern,
            originalFileName: sourceFile.name,
            outputExtension,
            index: 1,
            totalFiles: 1,
            dimensions,
            now: new Date()
          })

          setResultBlob(normalizedBlob)
          setResultOutputExtension(outputExtension)
          setResultNameDimensions(dimensions)
          setResultFileName(
            outputExtension === "zip"
              ? smartName || "favicon_kit.zip"
              : smartName || toOutputFilenameWithExtension(sourceFile.name, outputExtension)
          )

          if (normalizedBlob.type.startsWith("image/")) {
            try {
              const decodedResult = await decodeBlobToImageData(normalizedBlob, {
                fileNameHint: `${sourceFile.name}.${outputExtension}`
              })

              if (requestSequenceRef.current !== currentSequence) {
                return
              }

              setResultImageData(decodedResult.imageData)
              setResultMeta(toImageMeta(decodedResult.width, decodedResult.height))
            } catch (error) {
              if (requestSequenceRef.current !== currentSequence) {
                return
              }

              setResultImageData(null)
              setResultMeta(null)
              console.warn("Result preview decode failed, keeping download output:", error)
            }
          } else {
            setResultImageData(null)
            setResultMeta(null)
          }
        } catch (error) {
          if (requestSequenceRef.current !== currentSequence) {
            return
          }

          setResultBlob(null)
          setResultImageData(null)
          setResultMeta(null)
          setResultOutputExtension(null)
          setResultNameDimensions(null)
          setResultFileName("")
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
  }, [effectiveConfig, fileNamePattern, sourceFile, stripExif, watermark])

  const sourceBytes = sourceFile?.size || 0
  const resultBytes = resultBlob?.size || 0
  const delta = describeDeltaRatio(sourceBytes, resultBytes)

  const sourceDimensionLabel = sourceMeta
    ? `${sourceMeta.width} x ${sourceMeta.height}`
    : "-"

  const resultDimensionLabel = resultMeta
    ? `${resultMeta.width} x ${resultMeta.height}`
    : isProcessing
      ? "Processing..."
      : "-"

  return (
    <div className="space-y-0">
      {!sourceFile ? (
        <div className="p-6">
          <EmptyDropCard
            icon={<ImagePlus size={28} className="text-sky-500/80 dark:text-sky-400" />}
            title="Drop one image here, click to browse, or paste from clipboard"
            subtitle="Single Processor with live preview, debounce, and image URL import"
            onDropFiles={onAppendFiles}
            fileInput={{
              onInputFiles: onAppendFiles
            }}
            topRightSlot={
              <ImageUrlImportControl
                allowMultiple={false}
                disabled={isImportingUrl}
                onProcessUrls={importFromImageUrls}
              />
            }
          />
        </div>
      ) : (
        <>
          <div className="p-4">
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
                    setSourceImageData(null)
                    setSourceMeta(null)
                    setErrorText(null)
                    setResultBlob(null)
                    setResultImageData(null)
                    setResultMeta(null)
                    setResultOutputExtension(null)
                    setResultNameDimensions(null)
                    setResultFileName("")
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

            <div className="flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
              <div className="flex-1 w-full p-4 flex flex-col items-center sm:items-start text-center sm:text-left transition-colors hover:bg-white dark:hover:bg-slate-900">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Original</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {formatBytes(sourceBytes)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-500 leading-none">
                  <span className="bg-slate-200/50 dark:bg-slate-800 px-1 rounded uppercase">{sourceDimensionLabel}</span>
                  <span className="bg-slate-200/50 dark:bg-slate-800 px-1 rounded opacity-70">{sourceMeta?.ratioLabel || "-"}</span>
                </div>
              </div>

              <div className="flex-1 w-full p-4 flex flex-col items-center sm:items-start text-center sm:text-left transition-colors hover:bg-white dark:hover:bg-slate-900 border-t sm:border-t-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-amber-400 animate-pulse" : "bg-blue-500"}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Result</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {resultBlob ? formatBytes(resultBytes) : isProcessing ? (
                      <span className="animate-pulse">...</span>
                    ) : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-500 leading-none">
                  <span className="bg-slate-200/50 dark:bg-slate-800 px-1 rounded uppercase">{resultDimensionLabel}</span>
                  <span className="bg-slate-200/50 dark:bg-slate-800 px-1 rounded opacity-70">{resultMeta?.ratioLabel || "-"}</span>
                </div>
              </div>

              <div className="flex-none w-full sm:w-auto p-4 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/30 border-t sm:border-t-0 min-w-[120px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Impact</span>
                <div className={`text-2xl font-black tabular-nums tracking-tight ${delta.className}`}>
                  {resultBlob ? delta.label : "-"}
                </div>
                <div className="mt-1 flex items-center gap-1">
                   {resultBlob && (
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${
                        resultBytes < sourceBytes 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                          : resultBytes > sourceBytes 
                            ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800"
                      }`}>
                        {resultBytes < sourceBytes ? "Optimized" : resultBytes > sourceBytes ? "Larger" : "Same Size"}
                      </div>
                   )}
                </div>
              </div>
            </div>

            {errorText ? (
              <div className="rounded-lg border border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                {errorText}
              </div>
            ) : null}
          </div>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={compareViewMode === "split" ? "primary" : "ghost"}
                    className="h-8"
                    onClick={() => setCompareViewMode("split")}
                  >
                    Split View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={compareViewMode === "side_by_side" ? "primary" : "ghost"}
                    className="h-8"
                    onClick={() => setCompareViewMode("side_by_side")}
                  >
                    Side by Side
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Move size={12} />
                    Drag to pan
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    • Scroll to zoom
                  </span>
                </div>
              </div>

              <PixelCompareWorkspace
                className="h-[480px]"
                mode={compareViewMode}
                imageDataA={sourceImageData}
                imageDataB={resultImageData}
                labelA="Original"
                labelB="Result"
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
                preferredMimeTypeA={sourceFile?.type}
                preferredMimeTypeB={resultBlob?.type}
                maxPreviewDimension={PREVIEW_MAX_DIMENSION}
                isProcessing={isProcessing}
                emptyFallback={(
                  <MutedText>
                    Result preview is unavailable for this output type. You can still download the processed file.
                  </MutedText>
                )}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
