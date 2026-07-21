import React from "react";
import { Search } from "lucide-react";
import { EmptyDropCard } from "@imify/ui";
import {
  COMMON_IMAGE_ACCEPT,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { useTranslation } from "@imify/i18n";
import { fetchRemoteImageAsFile } from "@imify/engine/converter/remote-image-import";

interface InspectorDropZoneProps {
  onLoadFile: (file: File) => void;
}

export function InspectorDropZone({ onLoadFile }: InspectorDropZoneProps) {
  const { t } = useTranslation("inspector");

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (isCommonImageFile(file)) onLoadFile(file);
  };

  return (
    <EmptyDropCard
      icon={
        <Search size={32} className="text-indigo-500/80 dark:text-indigo-400" />
      }
      title={t("dropImageTip")}
      subtitle={t("supportsFormatTip")}
      onDropFiles={handleFiles}
      fileInput={{ accept: COMMON_IMAGE_ACCEPT, onInputFiles: handleFiles }}
      onPasteFiles={(files) => {
        if (files[0]) onLoadFile(files[0]);
      }}
      onProcessUrls={async (urls) => {
        if (urls[0]) {
          const file = await fetchRemoteImageAsFile(urls[0]);
          if (file) onLoadFile(file);
        }
      }}
      allowMultipleUrls={false}
    />
  );
}
