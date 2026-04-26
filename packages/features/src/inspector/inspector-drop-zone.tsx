import React from "react"
import { Search } from "lucide-react"
import { EmptyDropCard } from "@imify/ui"
import { COMMON_IMAGE_ACCEPT, isCommonImageFile } from "../shared/image-file-input"

interface InspectorDropZoneProps {
  onLoadFile: (file: File) => void
}

export function InspectorDropZone({ onLoadFile }: InspectorDropZoneProps) {
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (isCommonImageFile(file)) onLoadFile(file)
  }

  return (
    <EmptyDropCard
      icon={<Search size={32} className="text-indigo-500/80 dark:text-indigo-400" />}
      title="Drop an image here or click to browse"
      subtitle="Supports JPG, PNG, WebP, AVIF, and more"
      onDropFiles={handleFiles}
      fileInput={{ accept: COMMON_IMAGE_ACCEPT, onInputFiles: handleFiles }}
    />
  )
}

