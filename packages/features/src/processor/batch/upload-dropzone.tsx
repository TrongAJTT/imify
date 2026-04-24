import type { ReactNode } from "react"
import { Upload } from "lucide-react"
import { EmptyDropCard } from "@imify/ui"

interface BatchUploadDropzoneProps {
  onAppendFiles: (files: FileList | null) => void
  urlImportControl?: ReactNode
}

export function BatchUploadDropzone({ onAppendFiles, urlImportControl }: BatchUploadDropzoneProps) {
  return (
    <EmptyDropCard
      icon={<Upload size={32} className="text-indigo-500/80 dark:text-indigo-400" />}
      title="Drop images here, click to browse, or paste from clipboard"
      subtitle="Supports JPG, PNG, WebP, AVIF, JXL, BMP and image URLs"
      onDropFiles={onAppendFiles}
      fileInput={{ multiple: true, onInputFiles: onAppendFiles }}
      topRightSlot={urlImportControl}
    />
  )
}
