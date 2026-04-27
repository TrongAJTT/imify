import React from "react"
import { ImagePlus, Upload, X } from "lucide-react"
import type { DiffImageItem } from "./types"
import { MutedText, Tooltip } from "@imify/ui"
import { DIFFCHECKER_TOOLTIPS } from "./diffchecker-tooltips"
import { COMMON_IMAGE_ACCEPT, hasFileDragPayload, isCommonImageFile } from "../shared/image-file-utils"

interface ImageDropPairProps {
  imageA: DiffImageItem | null
  imageB: DiffImageItem | null
  onLoadA: (files: File[]) => void
  onLoadB: (files: File[]) => void
  onClearA: () => void
  onClearB: () => void
}

function openFilePicker(onFiles: (files: File[]) => void) {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = COMMON_IMAGE_ACCEPT
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) onFiles([file])
  }
  input.click()
}

function DropZone({ label, image, onLoad, onClear }: { label: string; image: DiffImageItem | null; onLoad: (files: File[]) => void; onClear: () => void }) {
  const handleDrop = (e: React.DragEvent) => {
    if (!hasFileDragPayload(e.dataTransfer)) {
      return
    }
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(isCommonImageFile)
    if (files.length) onLoad(files)
  }

  if (image) {
    return (
      <div className="relative min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
        <button type="button" onClick={onClear} className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-white"><X size={12} /></button>
        <div className="absolute top-9 right-2 z-10">
          <Tooltip content={DIFFCHECKER_TOOLTIPS.imageDropPair.replaceImage(label)} variant="nowrap">
            <button type="button" onClick={() => openFilePicker(onLoad)} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-white"><Upload size={13} /></button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3">
          <img src={image.url} alt={label} className="h-16 w-16 shrink-0 rounded object-cover border border-slate-200 dark:border-slate-700" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">{label}</span>
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{image.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{image.width} x {image.height}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-10 transition-all hover:border-sky-400 dark:border-slate-600 dark:bg-slate-800/30" onClick={() => openFilePicker(onLoad)} onDragOver={(e) => { if (hasFileDragPayload(e.dataTransfer)) e.preventDefault() }} onDrop={handleDrop}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-900/30"><ImagePlus size={20} /></div>
      <MutedText className="text-xs">Drop or click to browse</MutedText>
    </div>
  )
}

export function ImageDropPair({ imageA, imageB, onLoadA, onLoadB, onClearA, onClearB }: ImageDropPairProps) {
  return (
    <div className="flex gap-3">
      <DropZone label="Image A" image={imageA} onLoad={onLoadA} onClear={onClearA} />
      <DropZone label="Image B" image={imageB} onLoad={onLoadB} onClear={onClearB} />
    </div>
  )
}

