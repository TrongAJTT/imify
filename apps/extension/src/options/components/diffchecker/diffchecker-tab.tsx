import { useCallback, useEffect, useRef, useState } from "react"
import { Download, Trash2 } from "lucide-react"
import { useClipboardPaste } from "@/options/hooks/use-clipboard-paste"

import type { DiffComputeResult, DiffImageItem } from "@imify/features/diffchecker/types"
import {
  computeFullDiff,
  exportCompositeView
} from "@imify/features/diffchecker/diff-engine"
import { decodeFileToImageData } from "@imify/engine/image-pipeline/decode-image-data"
import { renderImageDataPreview } from "@imify/engine/image-pipeline/render-image-data"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { DiffcheckerWorkspace } from "@/options/components/diffchecker/diffchecker-workspace"
import { Button } from "@imify/ui/ui/button"
import { Subheading, MutedText } from "@imify/ui/ui/typography"

function isImageLikeFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true
  }

  return /\.(png|jpe?g|webp|avif|bmp|gif|tiff?|jxl|ico)$/i.test(file.name)
}

async function createImageItemWithDecodedData(
  file: File
): Promise<{ item: DiffImageItem; imageData: ImageData }> {
  const decoded = await decodeFileToImageData(file)
  const rendered = await renderImageDataPreview(decoded.imageData, {
    preferredMimeType: file.type,
    maxDimension: 320
  })

  const item: DiffImageItem = {
    id: `diff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    file,
    url: rendered.objectUrl,
    width: decoded.width,
    height: decoded.height,
    name: file.name
  }

  return {
    item,
    imageData: decoded.imageData
  }
}

export function DiffcheckerTab() {
  const [imageA, setImageA] = useState<DiffImageItem | null>(null)
  const [imageB, setImageB] = useState<DiffImageItem | null>(null)
  const [imageDataA, setImageDataA] = useState<ImageData | null>(null)
  const [imageDataB, setImageDataB] = useState<ImageData | null>(null)
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
      const validFiles = files.filter(isImageLikeFile)
      if (validFiles.length === 0) return

      setDiffResult(null)

      const oldImageA = imageA
      const oldImageB = imageB

      const mainFile = validFiles[0]
      // "Overflow" strategy: first file goes to the drop side,
      // and all remaining files are collapsed into the opposite side (the last one wins).
      const overflowFile = validFiles.length > 1 ? validFiles[validFiles.length - 1] : null

      let nextA: { item: DiffImageItem; imageData: ImageData } | null = null
      let nextB: { item: DiffImageItem; imageData: ImageData } | null = null

      try {
        const created = await createImageItemWithDecodedData(mainFile)
        if (side === "A") nextA = created
        else nextB = created
      } catch {
        // Invalid first file; no meaningful updates.
      }

      if (overflowFile) {
        try {
          const created = await createImageItemWithDecodedData(overflowFile)
          if (side === "A") nextB = created
          else nextA = created
        } catch {
          // Skip invalid overflow file
        }
      }

      if (nextA) {
        if (oldImageA) URL.revokeObjectURL(oldImageA.url)
        setImageA(nextA.item)
        setImageDataA(nextA.imageData)
      }

      if (nextB) {
        if (oldImageB) URL.revokeObjectURL(oldImageB.url)
        setImageB(nextB.item)
        setImageDataB(nextB.imageData)
      }
    },
    [imageA, imageB]
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
    setImageA(null)
    setImageDataA(null)
    setDiffResult(null)
  }, [imageA])

  const handleClearB = useCallback(() => {
    if (imageB) URL.revokeObjectURL(imageB.url)
    setImageB(null)
    setImageDataB(null)
    setDiffResult(null)
  }, [imageB])

  const handleClearAll = useCallback(() => {
    handleClearA()
    handleClearB()
    setZoom(100)
    setPanX(0)
    setPanY(0)
  }, [handleClearA, handleClearB])

  useEffect(() => {
    if (!imageDataA || !imageDataB) {
      setDiffResult(null)
      return
    }

    let cancelled = false
    setIsComputing(true)

    const timer = setTimeout(async () => {
      try {
        const result = await computeFullDiff(
          imageDataA,
          imageDataB,
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
  }, [imageDataA, imageDataB, algorithm, diffThreshold, alignMode, alignAnchor])

  useEffect(() => {
    return () => {
      for (const url of prevUrlsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  const handleExport = useCallback(async () => {
    if (!imageDataA || !imageDataB || isExporting) return
    setIsExporting(true)

    try {
      let blob: Blob | null = null

      if (viewMode === "difference" && diffResult?.diffImageUrl) {
        const resp = await fetch(diffResult.diffImageUrl)
        blob = await resp.blob()
      } else if (viewMode === "split" || viewMode === "overlay" || viewMode === "side_by_side") {
        blob = await exportCompositeView(
          imageDataA,
          imageDataB,
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
    imageDataA,
    imageDataB,
    viewMode,
    diffResult,
    splitPosition,
    overlayOpacity,
    alignMode,
    alignAnchor,
    isExporting
  ])

  // Sequential paste slot: first paste fills A, second fills B, then cycles back to A.
  const pasteSlotRef = useRef<"A" | "B">("A")

  useClipboardPaste({
    onFiles: (files) => {
      const file = files[0]
      if (!file) return

      if (!imageA || pasteSlotRef.current === "A") {
        void handleLoadA([file])
        pasteSlotRef.current = "B"
      } else {
        void handleLoadB([file])
        pasteSlotRef.current = "A"
      }
    },
    enabled: !imageA || !imageB
  })

  const handlePanChange = useCallback((x: number, y: number) => {
    setPanX(x)
    setPanY(y)
  }, [])

  const hasBoth = imageA !== null && imageB !== null
  const dimensionLabel = hasBoth
    ? `${imageA.width} x ${imageA.height} vs ${imageB.width} x ${imageB.height}`
    : null

  return (
    <div className="p-6">
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
        imageDataA={imageDataA}
        imageDataB={imageDataB}
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
    </div>
  )
}
