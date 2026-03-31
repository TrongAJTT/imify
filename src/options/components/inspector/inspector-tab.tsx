import { useCallback, useEffect, useRef, useState } from "react"
import { Trash2 } from "lucide-react"

import { inspectImage } from "@/features/inspector"
import type { InspectorResult } from "@/features/inspector"
import { useInspectorStore } from "@/options/stores/inspector-store"
import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import { InspectorDropZone } from "./inspector-drop-zone"
import { InspectorWorkspace } from "./inspector-workspace"
import { LoadingSpinner } from "@/options/components/loading-spinner"

export function InspectorTab() {
  const [file, setFile] = useState<File | null>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [result, setResult] = useState<InspectorResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paletteCount = useInspectorStore((s) => s.paletteCount)
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
      const [bmp, buf] = await Promise.all([
        createImageBitmap(newFile),
        newFile.arrayBuffer()
      ])

      const url = URL.createObjectURL(newFile)
      prevUrlRef.current = url

      setFile(newFile)
      setBitmap(bmp)
      setImageUrl(url)

      const inspectionResult = await inspectImage(newFile, bmp, buf)
      setResult(inspectionResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image")
      setFile(null)
      setBitmap(null)
      setImageUrl(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [cleanup])

  const handleClear = useCallback(() => {
    cleanup()
    setFile(null)
    setBitmap(null)
    setImageUrl(null)
    setResult(null)
    setError(null)
  }, [cleanup])

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [])

  const handleReanalyze = useCallback(async () => {
    if (!file || !bitmap) return
    setIsAnalyzing(true)
    try {
      const buf = await file.arrayBuffer()
      const inspectionResult = await inspectImage(file, bitmap, buf)
      setResult(inspectionResult)
    } catch {
      /* re-analysis failed, keep previous result */
    } finally {
      setIsAnalyzing(false)
    }
  }, [file, bitmap, paletteCount])

  useEffect(() => {
    if (file && bitmap && result) {
      handleReanalyze()
    }
  }, [paletteCount])

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Subheading>Image Inspector</Subheading>
          {file && result && !isAnalyzing && (
            <MutedText className="text-xs mt-0.5">
              {result.basic.format} &middot; {result.dimensions.width} x {result.dimensions.height} &middot; {result.exifEntries.length} metadata tags
            </MutedText>
          )}
        </div>
        {file && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={isAnalyzing}
          >
            <Trash2 size={14} />
            Clear
          </Button>
        )}
      </div>

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner />
          <MutedText className="mt-3">Analyzing image...</MutedText>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {!file && !isAnalyzing && !error && (
        <InspectorDropZone onLoadFile={handleLoadFile} />
      )}

      {result && bitmap && imageUrl && !isAnalyzing && (
        <InspectorWorkspace
          result={result}
          bitmap={bitmap}
          imageUrl={imageUrl}
        />
      )}
    </SurfaceCard>
  )
}
