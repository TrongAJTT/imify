"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { inspectImage, type InspectorResult } from "./index"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { Button, MutedText, Subheading } from "@imify/ui"
import { useClipboardPaste } from "../shared/use-clipboard-paste"

export interface SharedInspectorRenderProps {
  file: File | null
  bitmap: ImageBitmap | null
  imageUrl: string | null
  result: InspectorResult | null
  isAnalyzing: boolean
  error: string | null
  onLoadFile: (file: File) => Promise<void>
  onClear: () => void
  onOptimizeNow: (recommendedFormat?: "mozjpeg" | "webp" | "avif") => void
}

interface SharedInspectorPageProps {
  onOptimizeIntent?: (file: File) => void
  onOpenSingleProcessor?: () => void
  renderWorkspace: (props: SharedInspectorRenderProps) => ReactNode
}

export function SharedInspectorPage({
  onOptimizeIntent,
  onOpenSingleProcessor,
  renderWorkspace
}: SharedInspectorPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [result, setResult] = useState<InspectorResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paletteCount = useInspectorStore((s) => s.paletteCount)
  const setTargetFormat = useBatchStore((s) => s.setTargetFormat)
  const prevUrlRef = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    if (bitmap) bitmap.close()
  }, [bitmap])

  const handleLoadFile = useCallback(async (newFile: File) => {
    cleanup()
    setError(null)
    setResult(null)
    setIsAnalyzing(true)
    try {
      const [bmp, buf] = await Promise.all([createImageBitmap(newFile), newFile.arrayBuffer()])
      const url = URL.createObjectURL(newFile)
      prevUrlRef.current = url
      setFile(newFile)
      setBitmap(bmp)
      setImageUrl(url)
      const inspectionResult = await inspectImage(newFile, bmp, buf, { paletteCount })
      setResult(inspectionResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image")
      setFile(null)
      setBitmap(null)
      setImageUrl(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [cleanup, paletteCount])

  const handleClear = useCallback(() => {
    cleanup()
    setFile(null); setBitmap(null); setImageUrl(null); setResult(null); setError(null)
  }, [cleanup])

  useEffect(() => () => { if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current) }, [])

  useClipboardPaste({
    onFiles: (files) => { if (files[0]) void handleLoadFile(files[0]) },
    onFetchStart: () => setIsAnalyzing(true),
    onFetchEnd: () => setIsAnalyzing(false),
    onError: (msg) => setError(msg),
    enabled: !file
  })

  useEffect(() => {
    const reanalyze = async () => {
      if (!file || !bitmap || !result) return
      setIsAnalyzing(true)
      try {
        const buf = await file.arrayBuffer()
        const inspectionResult = await inspectImage(file, bitmap, buf, { paletteCount })
        setResult(inspectionResult)
      } finally {
        setIsAnalyzing(false)
      }
    }
    void reanalyze()
  }, [paletteCount])

  const handleOptimizeNow = useCallback((recommendedFormat?: "mozjpeg" | "webp" | "avif") => {
    if (!file) return
    onOptimizeIntent?.(file)
    if (recommendedFormat) setTargetFormat(recommendedFormat)
    onOpenSingleProcessor?.()
  }, [file, onOpenSingleProcessor, onOptimizeIntent, setTargetFormat])

  return (
    <div className="p-3">
      {file ? (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Subheading>Image Inspector</Subheading>
            {result && !isAnalyzing ? (
              <MutedText className="mt-0.5 text-xs">
                {result.basic.format} &middot; {result.dimensions.width} x {result.dimensions.height} &middot; {result.exifEntries.length} metadata tags
              </MutedText>
            ) : null}
          </div>
          <Button variant="secondary" size="sm" onClick={handleClear} disabled={isAnalyzing}><Trash2 size={14} />Clear</Button>
        </div>
      ) : null}
      {renderWorkspace({
        file,
        bitmap,
        imageUrl,
        result,
        isAnalyzing,
        error,
        onLoadFile: handleLoadFile,
        onClear: handleClear,
        onOptimizeNow: handleOptimizeNow
      })}
    </div>
  )
}
