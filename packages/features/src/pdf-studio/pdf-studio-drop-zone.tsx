"use client";

import React from "react";
import { FileOutput, Images } from "lucide-react";
import { EmptyDropCard } from "@imify/ui";
import {
  COMMON_IMAGE_ACCEPT,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { useTranslation } from "@imify/i18n";
import type { PdfStudioMode } from "./types";

interface PdfStudioDropZoneProps {
  mode: PdfStudioMode;
  onLoadImageFiles: (files: File[]) => void;
  onLoadPdfFile: (file: File) => void;
}

export function PdfStudioDropZone({
  mode,
  onLoadImageFiles,
  onLoadPdfFile,
}: PdfStudioDropZoneProps) {
  const { t } = useTranslation("pdfStudio");

  const isPdfMode = mode === "pdf-to-images";

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const pdfFile = fileList.find(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    const imageFiles = fileList.filter((f) => isCommonImageFile(f));

    if (isPdfMode) {
      // Prioritize PDF in PDF-to-images mode; auto-switch if images dropped
      if (pdfFile) {
        onLoadPdfFile(pdfFile);
        return;
      }
      if (imageFiles.length > 0) {
        onLoadImageFiles(imageFiles);
        return;
      }
    } else {
      // Prioritize images in Images-to-PDF mode; auto-switch if PDF dropped
      if (imageFiles.length > 0) {
        onLoadImageFiles(imageFiles);
        return;
      }
      if (pdfFile) {
        onLoadPdfFile(pdfFile);
        return;
      }
    }
  };

  const acceptPattern = isPdfMode
    ? ".pdf,application/pdf"
    : COMMON_IMAGE_ACCEPT;

  return (
    <EmptyDropCard
      icon={
        isPdfMode ? (
          <FileOutput size={34} className="text-red-500/80 dark:text-red-400" />
        ) : (
          <Images size={34} className="text-red-500/80 dark:text-red-400" />
        )
      }
      title={isPdfMode ? t("dropZone.pdfTitle") : t("dropZone.imagesTitle")}
      subtitle={
        isPdfMode ? t("dropZone.pdfSubtitle") : t("dropZone.imagesSubtitle")
      }
      onDropFiles={handleFiles}
      fileInput={{
        accept: acceptPattern,
        multiple: !isPdfMode,
        onInputFiles: handleFiles,
      }}
      onPasteFiles={(files) => {
        handleFiles(files as any);
      }}
      allowMultipleUrls={!isPdfMode}
    />
  );
}
