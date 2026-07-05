import React from "react"
import { Search } from "lucide-react"
import { EmptyDropCard } from "@imify/ui"
import { COMMON_IMAGE_ACCEPT, isCommonImageFile } from "../shared/image-file-utils"
import { useTranslation } from "@imify/i18n"

interface InspectorDropZoneProps {
  onLoadFile: (file: File) => void
}

export function InspectorDropZone({ onLoadFile }: InspectorDropZoneProps) {
  const { t } = useTranslation("inspector")

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (isCommonImageFile(file)) onLoadFile(file)
  }

  return (
    <EmptyDropCard
      icon={<Search size={32} className="text-indigo-500/80 dark:text-indigo-400" />}
      title={t("dropImageTip")}
      subtitle={t("supportsFormatTip")}
      onDropFiles={handleFiles}
      fileInput={{ accept: COMMON_IMAGE_ACCEPT, onInputFiles: handleFiles }}
    />
  )
}

