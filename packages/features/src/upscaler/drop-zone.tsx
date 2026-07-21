import React from "react";
import { Maximize2 } from "lucide-react";
import { EmptyDropCard } from "@imify/ui";
import {
  COMMON_IMAGE_ACCEPT,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { useTranslation } from "@imify/i18n";

interface UpscalerDropZoneProps {
  onLoadFile: (file: File) => void;
}

export function UpscalerDropZone({ onLoadFile }: UpscalerDropZoneProps) {
  const { t } = useTranslation("upscaler");
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (isCommonImageFile(file)) onLoadFile(file);
  };

  return (
    <EmptyDropCard
      icon={
        <Maximize2
          size={32}
          className="text-indigo-500/80 dark:text-indigo-400"
        />
      }
      title={t("dropZone.title")}
      subtitle={t("dropZone.subtitle")}
      onDropFiles={handleFiles}
      fileInput={{ accept: COMMON_IMAGE_ACCEPT, onInputFiles: handleFiles }}
    />
  );
}
