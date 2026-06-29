import React from "react";
import { Eraser } from "lucide-react";
import { EmptyDropCard } from "@imify/ui";
import {
  COMMON_IMAGE_ACCEPT,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { useTranslation } from "@imify/i18n";

interface BackgroundRemoverDropZoneProps {
  onLoadFile: (file: File) => void;
}

export function BackgroundRemoverDropZone({
  onLoadFile,
}: BackgroundRemoverDropZoneProps) {
  const { t } = useTranslation("backgroundRemover");

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (isCommonImageFile(file)) onLoadFile(file);
  };

  return (
    <EmptyDropCard
      icon={
        <Eraser size={32} className="text-pink-500/80 dark:text-pink-400" />
      }
      title={t("dropZone.title")}
      subtitle={t("dropZone.description")}
      onDropFiles={handleFiles}
      fileInput={{ accept: COMMON_IMAGE_ACCEPT, onInputFiles: handleFiles }}
    />
  );
}
