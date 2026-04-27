import React, { useEffect, useMemo, useState } from "react"
import { ImageOff, Layers } from "lucide-react"

import type { LayerFillState } from "@imify/features/filling/types"
import type { FillRuntimeItem } from "@imify/features/filling/fill-runtime-items"
import { SHAPE_LABELS } from "@imify/features/filling/shape-generators"
import { useFillingStore } from "@imify/stores/stores/filling-store"

interface FillLayerCardProps {
  item: FillRuntimeItem
  fillState: LayerFillState | undefined
}

const LAYER_PREVIEW_RESIZE_WIDTH = 100
const LAYER_PREVIEW_QUALITY = 0.6

async function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

async function generateLayerPreview(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    if (!blob.type.startsWith("image/")) return null

    const bitmap = await createImageBitmap(blob, {
      resizeWidth: LAYER_PREVIEW_RESIZE_WIDTH,
      resizeQuality: "low",
    })

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return null
    }

    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    const thumbnailBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: LAYER_PREVIEW_QUALITY,
    })
    return blobToDataUrl(thumbnailBlob)
  } catch {
    return null
  }
}

export function FillLayerCard({ item, fillState }: FillLayerCardProps) {
  const selectedLayerId = useFillingStore((s) => s.selectedLayerId)
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const selected = selectedLayerId === item.id
  const hasImage = Boolean(fillState?.imageUrl)

  useEffect(() => {
    let isMounted = true
    const loadPreview = async () => {
      if (!fillState?.imageUrl) {
        if (isMounted) setPreviewImageUrl(null)
        return
      }
      const preview = await generateLayerPreview(fillState.imageUrl)
      if (isMounted) setPreviewImageUrl(preview ?? fillState.imageUrl)
    }
    void loadPreview()
    return () => {
      isMounted = false
    }
  }, [fillState?.imageUrl])

  const sublabel = useMemo(() => {
    const baseTypeLabel = item.kind === "group" ? item.typeLabel : SHAPE_LABELS[item.layer.shapeType]
    return hasImage && fillState ? `Filled, ${baseTypeLabel}` : `Empty, ${baseTypeLabel}`
  }, [fillState, hasImage, item])

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "group relative rounded-md border px-2.5 py-2.5 transition-colors shadow-sm",
        selected
          ? hasImage
            ? "border-sky-300 bg-sky-50/30"
            : "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200/70"
          : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30",
      ].join(" ")}
      onClick={() => setSelectedLayerId(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setSelectedLayerId(item.id)
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-[32px] h-[32px] overflow-hidden bg-slate-50 dark:bg-slate-900/40 rounded-md border flex items-center justify-center shrink-0">
          {fillState?.imageUrl ? (
            <img
              src={previewImageUrl ?? fillState.imageUrl}
              alt={`${item.name || "Layer"} preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-400 dark:text-slate-500">
              {item.kind === "group" ? <Layers size={14} /> : <ImageOff size={14} />}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
            {item.kind === "group" && <Layers size={12} className="text-amber-500 shrink-0" />}
            <span className="truncate">{item.name || `Layer ${item.id.slice(-5)}`}</span>
          </div>
          <div className="truncate text-[10px] text-slate-400 mt-0.5">{sublabel}</div>
        </div>
      </div>
    </div>
  )
}
