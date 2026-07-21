import React from "react";
import type { ReactNode } from "react";
import { Upload } from "lucide-react";
import { EmptyDropCard } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { COMMON_IMAGE_ACCEPT } from "../../shared/image-file-utils";

interface BatchUploadDropzoneProps {
  onAppendFiles: (files: FileList | null) => void;
  onProcessUrls: (urls: string[]) => Promise<void>;
  onPasteFiles: (files: File[]) => void;
}

export function BatchUploadDropzone({
  onAppendFiles,
  onProcessUrls,
  onPasteFiles,
}: BatchUploadDropzoneProps) {
  const { t } = useTranslation("processor");
  return (
    <EmptyDropCard
      icon={
        <Upload size={32} className="text-indigo-500/80 dark:text-indigo-400" />
      }
      title={t("batchDropzoneTitle")}
      subtitle={t("batchDropzoneSubtitle")}
      onDropFiles={onAppendFiles}
      fileInput={{
        accept: COMMON_IMAGE_ACCEPT,
        multiple: true,
        onInputFiles: onAppendFiles,
      }}
      onProcessUrls={onProcessUrls}
      onPasteFiles={onPasteFiles}
      allowMultipleUrls={true}
    />
  );
}
