import React from "react"
import { Maximize2 } from "lucide-react"
import { EmptyDropCard } from "@imify/ui"
import { COMMON_IMAGE_ACCEPT, isCommonImageFile } from "../shared/image-file-utils"

interface ImageUpscalerDropZoneProps {
  onLoadFile: (file: File) => void
}

export function ImageUpscalerDropZone({ onLoadFile }: ImageUpscalerDropZoneProps) {
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (isCommonImageFile(file)) onLoadFile(file)
  }

  return (
    <EmptyDropCard
      icon={<Maximize2 size={32} className="text-indigo-500/80 dark:text-indigo-400" />}
      title="Image Upscaler"
      subtitle="Drop an image to upscale it using super-resolution AI"
      onDropFiles={handleFiles}
      fileInput={{ accept: COMMON_IMAGE_ACCEPT, onInputFiles: handleFiles }}
    />
  )
}
