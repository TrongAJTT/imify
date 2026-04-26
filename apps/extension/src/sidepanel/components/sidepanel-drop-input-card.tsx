import { ImagePlus } from "lucide-react"

import { EmptyDropCard } from "@imify/ui/ui/empty-drop-card"
import { COMMON_IMAGE_ACCEPT } from "@imify/features"

interface SidepanelDropInputCardProps {
  selectedFileName: string | null
  isAnalyzing: boolean
  onPickFile: (file: File | undefined) => void
}

export function SidepanelDropInputCard({
  selectedFileName,
  isAnalyzing,
  onPickFile
}: SidepanelDropInputCardProps) {
  return (
    <EmptyDropCard
      icon={<ImagePlus size={20} className="text-sky-600 dark:text-sky-400" />}
      title={isAnalyzing ? "Analyzing image..." : "Drop image here or click to choose"}
      subtitle={selectedFileName ?? "Supports JPG, PNG, WebP, AVIF, BMP, TIFF and more"}
      fileInput={{
        accept: COMMON_IMAGE_ACCEPT,
        multiple: false,
        onInputFiles: (files) => onPickFile(files?.[0])
      }}
      onDropFiles={(files) => onPickFile(files?.[0])}
      className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      iconWrapperClassName="bg-sky-50 dark:bg-sky-900/30"
      titleClassName="text-slate-900 dark:text-slate-100"
      subtitleClassName="text-xs text-slate-500 dark:text-slate-400"
    />
  )
}
