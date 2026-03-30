import { ImagePlus, X, Upload } from "lucide-react"
import type { DiffImageItem } from "@/features/diffchecker/types"
import { MutedText } from "@/options/components/ui/typography"
import { Tooltip } from "@/options/components/tooltip"

interface ImageDropPairProps {
  imageA: DiffImageItem | null
  imageB: DiffImageItem | null
  onLoadA: (files: File[]) => void
  onLoadB: (files: File[]) => void
  onClearA: () => void
  onClearB: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function openFilePicker(onFiles: (files: File[]) => void) {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "image/*"
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) onFiles([file])
  }
  input.click()
}

function DropZone({
  label,
  image,
  onLoad,
  onClear
}: {
  label: string
  image: DiffImageItem | null
  onLoad: (files: File[]) => void
  onClear: () => void
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (files.length > 0) onLoad(files)
  }

  if (image) {
    return (
      <div className="relative flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-3">
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 transition-colors"
          aria-label={`Remove ${label}`}
        >
          <X size={12} />
        </button>
        <div className="absolute top-9 right-2 z-10">
          <Tooltip content={`Replace ${label}`} variant="nowrap" position="top">
            <button
              type="button"
              onClick={() => openFilePicker(onLoad)}
              aria-label={`Replace ${label}`}
              className="h-6 w-6 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 transition-colors flex items-center justify-center"
            >
              <Upload size={13} />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3">
          <img
            src={image.url}
            alt={label}
            className="h-16 w-16 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
              {label}
            </span>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
              {image.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {image.width} x {image.height} · {formatFileSize(image.file.size)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-10 cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-all"
      onClick={() => openFilePicker(onLoad)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500">
        <ImagePlus size={20} />
      </div>
      <MutedText className="text-xs">Drop or click to browse</MutedText>
    </div>
  )
}

export function ImageDropPair({
  imageA,
  imageB,
  onLoadA,
  onLoadB,
  onClearA,
  onClearB
}: ImageDropPairProps) {
  return (
    <div className="flex gap-3">
      <DropZone label="Image A" image={imageA} onLoad={onLoadA} onClear={onClearA} />
      <DropZone label="Image B" image={imageB} onLoad={onLoadB} onClear={onClearB} />
    </div>
  )
}
