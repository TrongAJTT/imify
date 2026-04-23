"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { inspectImage, type InspectorResult } from "@imify/features/inspector"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { useClipboardPaste } from "@/hooks/use-clipboard-paste"

export function InspectorPage() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [result, setResult] = useState<InspectorResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paletteCount = useInspectorStore((s) => s.paletteCount)

  const analyze = useCallback(
    async (nextFile: File) => {
      setIsLoading(true)
      setError(null)
      try {
        const [bitmap, buffer] = await Promise.all([
          createImageBitmap(nextFile),
          nextFile.arrayBuffer()
        ])
        const inspection = await inspectImage(nextFile, bitmap, buffer, { paletteCount })
        const url = URL.createObjectURL(nextFile)
        setFile(nextFile)
        setImageUrl(url)
        setResult(inspection)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to inspect image")
        setResult(null)
      } finally {
        setIsLoading(false)
      }
    },
    [paletteCount]
  )

  useClipboardPaste({
    enabled: !file,
    onFiles: (files) => {
      if (files[0]) void analyze(files[0])
    }
  })

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const basic = useMemo(() => result?.basic, [result])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Inspector</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Paste or choose an image to inspect metadata, palette and dimensions.
      </p>
      <label className="block rounded-md border border-slate-300 p-3 text-sm">
        Select image
        <input
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-xs"
          onChange={(e) => e.target.files?.[0] && void analyze(e.target.files[0])}
        />
      </label>
      {isLoading && <p className="text-sm text-sky-600">Analyzing image...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {basic && (
        <div className="rounded-md border border-slate-300 p-3 text-sm">
          <p>
            <strong>File:</strong> {basic.fileName}
          </p>
          <p>
            <strong>Format:</strong> {basic.format}
          </p>
          <p>
            <strong>Mime:</strong> {basic.mimeType}
          </p>
          <p>
            <strong>Size:</strong> {basic.fileSize}
          </p>
        </div>
      )}
      {imageUrl && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preview</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={file?.name ?? "selected image"} className="max-h-[480px] rounded border border-slate-300" />
        </div>
      )}
    </div>
  )
}
