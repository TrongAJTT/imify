import React from "react"
import { Eraser } from "lucide-react"
import { EmptyDropCard } from "@imify/ui"
import { COMMON_IMAGE_ACCEPT, isCommonImageFile } from "../shared/image-file-utils"

interface BackgroundRemoverDropZoneProps {
  onLoadFile: (file: File) => void
}

export function BackgroundRemoverDropZone({ onLoadFile }: BackgroundRemoverDropZoneProps) {
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (isCommonImageFile(file)) onLoadFile(file)
  }

  return (
    <EmptyDropCard
      icon={<Eraser size={32} className="text-pink-500/80 dark:text-pink-400" />}
      title="Background Remover"
      subtitle="Drop an image to isolate the subject using AI"
      onDropFiles={handleFiles}
      fileInput={{ accept: COMMON_IMAGE_ACCEPT, onInputFiles: handleFiles }}
    />
  )
}
