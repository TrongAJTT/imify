import { useCallback, useEffect, useRef, useState } from "react"
import { Download, Trash2 } from "lucide-react"

import type { DiffComputeResult, DiffImageItem } from "@/features/diffchecker/types"
import {
  computeFullDiff,
  exportCompositeView
} from "@/features/diffchecker/diff-engine"
import { useDiffcheckerStore } from "@/options/stores/diffchecker-store"
import { DiffcheckerWorkspace } from "@/options/components/diffchecker/diffchecker-workspace"
import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Subheading, MutedText } from "@/options/components/ui/typography"

async function createImageItemWithBitmap(file: File): Promise<{ item: DiffImageItem; bitmap: ImageBitmap }> {
  const bitmap = await createImageBitmap(file)
  const url = URL.createObjectURL(file)

  const item: DiffImageItem = {
    id: `diff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    file,
    url,
    width: bitmap.width,
    height: bitmap.height,
    name: file.name
  }

  return { item, bitmap }
}

export function DiffcheckerTab() {
  const [imageA, setImageA] = useState<DiffImageItem | null>(null)
  const [imageB, setImageB] = useState<DiffImageItem | null>(null)
  const [bitmapA, setBitmapA] = useState<ImageBitmap | null>(null)
  const [bitmapB, setBitmapB] = useState<ImageBitmap | null>(null)
  const [diffResult, setDiffResult] = useState<DiffComputeResult | null>(null)
  const [isComputing, setIsComputing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  const prevUrlsRef = useRef<string[]>([])

  const viewMode = useDiffcheckerStore((s) => s.viewMode)
  const algorithm = useDiffcheckerStore((s) => s.algorithm)
  const alignMode = useDiffcheckerStore((s) => s.alignMode)
  const alignAnchor = useDiffcheckerStore((s) => s.alignAnchor)
  const overlayOpacity = useDiffcheckerStore((s) => s.overlayOpacity)
  const splitPosition = useDiffcheckerStore((s) => s.splitPosition)
  const diffThreshold = useDiffcheckerStore((s) => s.diffThreshold)
  const setSplitPosition = useDiffcheckerStore((s) => s.setSplitPosition)

  const handleLoadFromSide = useCallback(
    async (side: "A" | "B", files: File[]) => {
      const validFiles = files.filter((f) => f.type.startsWith("image/"))
      if (validFiles.length === 0) return

      setDiffResult(null)

      const oldImageA = imageA
      const oldImageB = imageB
      const oldBitmapA = bitmapA
      const oldBitmapB = bitmapB

      const mainFile = validFiles[0]
      // "Overflow" strategy: first file goes to the drop side,
      // and all remaining files are collapsed into the opposite side (the last one wins).
      const overflowFile = validFiles.length > 1 ? validFiles[validFiles.length - 1] : null

      let nextA: { item: DiffImageItem; bitmap: ImageBitmap } | null = null
      let nextB: { item: DiffImageItem; bitmap: ImageBitmap } | null = null

      try {
        const created = await createImageItemWithBitmap(mainFile)
        if (side === "A") nextA = created
        else nextB = created
      } catch {
        // Invalid first file; no meaningful updates.
      }

      if (overflowFile) {
        try {
          const created = await createImageItemWithBitmap(overflowFile)
          if (side === "A") nextB = created
          else nextA = created
        } catch {
          // Skip invalid overflow file
        }
      }

      if (nextA) {
        if (oldImageA) URL.revokeObjectURL(oldImageA.url)
        if (oldBitmapA) oldBitmapA.close()
        setImageA(nextA.item)
        setBitmapA(nextA.bitmap)
      }

      if (nextB) {
        if (oldImageB) URL.revokeObjectURL(oldImageB.url)
        if (oldBitmapB) oldBitmapB.close()
        setImageB(nextB.item)
        setBitmapB(nextB.bitmap)
      }
    },
    [imageA, imageB, bitmapA, bitmapB]
  )

  const handleLoadA = useCallback(
    async (files: File[]) => {
      await handleLoadFromSide("A", files)
    },
    [handleLoadFromSide]
  )

  const handleLoadB = useCallback(
    async (files: File[]) => {
      await handleLoadFromSide("B", files)
    },
    [handleLoadFromSide]
  )

  const handleClearA = useCallback(() => {
    if (imageA) URL.revokeObjectURL(imageA.url)
    if (bitmapA) bitmapA.close()
    setImageA(null)
    setBitmapA(null)
    setDiffResult(null)
  }, [imageA, bitmapA])

  const handleClearB = useCallback(() => {
    if (imageB) URL.revokeObjectURL(imageB.url)
    if (bitmapB) bitmapB.close()
    setImageB(null)
    setBitmapB(null)
    setDiffResult(null)
  }, [imageB, bitmapB])

  const handleClearAll = useCallback(() => {
    handleClearA()
    handleClearB()
    setZoom(100)
    setPanX(0)
    setPanY(0)
  }, [handleClearA, handleClearB])

  useEffect(() => {
    if (!bitmapA || !bitmapB) {
      setDiffResult(null)
      return
    }

    let cancelled = false
    setIsComputing(true)

    const timer = setTimeout(async () => {
      try {
        const result = await computeFullDiff(
          bitmapA,
          bitmapB,
          algorithm,
          diffThreshold,
          alignMode,
          alignAnchor
        )
        if (cancelled) {
          URL.revokeObjectURL(result.alignedUrlA)
          URL.revokeObjectURL(result.alignedUrlB)
          URL.revokeObjectURL(result.diffImageUrl)
          return
        }
        for (const url of prevUrlsRef.current) URL.revokeObjectURL(url)
        prevUrlsRef.current = [
          result.alignedUrlA,
          result.alignedUrlB,
          result.diffImageUrl
        ]
        setDiffResult(result)
      } catch {
        if (!cancelled) setDiffResult(null)
      } finally {
        if (!cancelled) setIsComputing(false)
      }
    }, 50)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [bitmapA, bitmapB, algorithm, diffThreshold, alignMode, alignAnchor])

  useEffect(() => {
    return () => {
      for (const url of prevUrlsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  const handleExport = useCallback(async () => {
    if (!bitmapA || !bitmapB || isExporting) return
    setIsExporting(true)

    try {
      let blob: Blob | null = null

      if (viewMode === "difference" && diffResult?.diffImageUrl) {
        const resp = await fetch(diffResult.diffImageUrl)
        blob = await resp.blob()
      } else if (viewMode === "split" || viewMode === "overlay" || viewMode === "side_by_side") {
        blob = await exportCompositeView(
          bitmapA,
          bitmapB,
          viewMode,
          splitPosition,
          overlayOpacity,
          alignMode,
          alignAnchor
        )
      }

      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `imify-diff-${viewMode}-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      /* export failed */
    } finally {
      setIsExporting(false)
    }
  }, [
    bitmapA,
    bitmapB,
    viewMode,
    diffResult,
    splitPosition,
    overlayOpacity,
    alignMode,
    alignAnchor,
    isExporting
  ])

  const handlePanChange = useCallback((x: number, y: number) => {
    setPanX(x)
    setPanY(y)
  }, [])

  const hasBoth = imageA !== null && imageB !== null
  const dimensionLabel = hasBoth
    ? `${imageA.width} x ${imageA.height} vs ${imageB.width} x ${imageB.height}`
    : null

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Subheading>Difference Checker</Subheading>
          {dimensionLabel && (
            <MutedText className="text-xs mt-0.5">{dimensionLabel}</MutedText>
          )}
        </div>
        {hasBoth && (
          <div className="flex gap-3 items-center">
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
              disabled={isExporting || isComputing}
            >
              <Download size={14} />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        )}
      </div>

      <DiffcheckerWorkspace
        imageA={imageA}
        imageB={imageB}
        diffResult={diffResult}
        viewMode={viewMode}
        splitPosition={splitPosition}
        overlayOpacity={overlayOpacity}
        isComputing={isComputing}
        zoom={zoom}
        panX={panX}
        panY={panY}
        onLoadA={handleLoadA}
        onLoadB={handleLoadB}
        onClearA={handleClearA}
        onClearB={handleClearB}
        onSplitChange={setSplitPosition}
        onZoomChange={setZoom}
        onPanChange={handlePanChange}
      />
    </SurfaceCard>
  )
}
