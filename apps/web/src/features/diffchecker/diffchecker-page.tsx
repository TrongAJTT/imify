"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { computeFullDiff } from "@imify/features/diffchecker/diff-engine"
import type { DiffComputeResult } from "@imify/features/diffchecker/types"
import { decodeFileToImageData } from "@imify/engine/image-pipeline/decode-image-data"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { useClipboardPaste } from "@/hooks/use-clipboard-paste"

interface LoadedImage {
  file: File
  imageData: ImageData
  previewUrl: string
}

async function loadImage(file: File): Promise<LoadedImage> {
  const decoded = await decodeFileToImageData(file)
  return {
    file,
    imageData: decoded.imageData,
    previewUrl: URL.createObjectURL(file)
  }
}

export function DiffcheckerPage() {
  const [imageA, setImageA] = useState<LoadedImage | null>(null)
  const [imageB, setImageB] = useState<LoadedImage | null>(null)
  const [result, setResult] = useState<DiffComputeResult | null>(null)
  const [isComputing, setIsComputing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousUrlsRef = useRef<string[]>([])
  const pasteSlotRef = useRef<"A" | "B">("A")

  const algorithm = useDiffcheckerStore((s) => s.algorithm)
  const alignMode = useDiffcheckerStore((s) => s.alignMode)
  const alignAnchor = useDiffcheckerStore((s) => s.alignAnchor)
  const diffThreshold = useDiffcheckerStore((s) => s.diffThreshold)

  const clearResult = useCallback(() => {
    if (result) {
      URL.revokeObjectURL(result.alignedUrlA)
      URL.revokeObjectURL(result.alignedUrlB)
      URL.revokeObjectURL(result.diffImageUrl)
    }
    setResult(null)
  }, [result])

  const setLoadedImage = useCallback(
    async (slot: "A" | "B", file: File) => {
      setError(null)
      clearResult()
      try {
        const loaded = await loadImage(file)
        if (slot === "A") {
          if (imageA) URL.revokeObjectURL(imageA.previewUrl)
          setImageA(loaded)
        } else {
          if (imageB) URL.revokeObjectURL(imageB.previewUrl)
          setImageB(loaded)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to decode image")
      }
    },
    [clearResult, imageA, imageB]
  )

  useClipboardPaste({
    enabled: !imageA || !imageB,
    onFiles: (files) => {
      const file = files[0]
      if (!file) return
      if (!imageA || pasteSlotRef.current === "A") {
        void setLoadedImage("A", file)
        pasteSlotRef.current = "B"
      } else {
        void setLoadedImage("B", file)
        pasteSlotRef.current = "A"
      }
    }
  })

  useEffect(() => {
    if (!imageA || !imageB) return
    let cancelled = false
    setIsComputing(true)
    void computeFullDiff(
      imageA.imageData,
      imageB.imageData,
      algorithm,
      diffThreshold,
      alignMode,
      alignAnchor
    )
      .then((nextResult) => {
        if (cancelled) {
          URL.revokeObjectURL(nextResult.alignedUrlA)
          URL.revokeObjectURL(nextResult.alignedUrlB)
          URL.revokeObjectURL(nextResult.diffImageUrl)
          return
        }
        previousUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        previousUrlsRef.current = [
          nextResult.alignedUrlA,
          nextResult.alignedUrlB,
          nextResult.diffImageUrl
        ]
        setResult(nextResult)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Diff failed")
      })
      .finally(() => {
        if (!cancelled) setIsComputing(false)
      })
    return () => {
      cancelled = true
    }
  }, [alignAnchor, alignMode, algorithm, diffThreshold, imageA, imageB])

  useEffect(() => {
    return () => {
      previousUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      if (imageA) URL.revokeObjectURL(imageA.previewUrl)
      if (imageB) URL.revokeObjectURL(imageB.previewUrl)
    }
  }, [imageA, imageB])

  const summary = useMemo(() => {
    if (!result) return null
    return `Pixels changed: ${result.stats.changedPixels.toLocaleString()}`
  }, [result])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Diffchecker</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Paste or choose 2 images to compute a full diff.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="rounded-md border border-slate-300 p-3 text-sm">
          Image A
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-xs"
            onChange={(e) => e.target.files?.[0] && void setLoadedImage("A", e.target.files[0])}
          />
        </label>
        <label className="rounded-md border border-slate-300 p-3 text-sm">
          Image B
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-xs"
            onChange={(e) => e.target.files?.[0] && void setLoadedImage("B", e.target.files[0])}
          />
        </label>
      </div>
      {isComputing && <p className="text-sm text-sky-600">Computing diff...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && <p className="text-sm text-emerald-600">{summary}</p>}
      {result && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Difference Preview</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.diffImageUrl} alt="Difference" className="max-h-[480px] rounded border border-slate-300" />
        </div>
      )}
    </div>
  )
}
