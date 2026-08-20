"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  usePdfStudioStore,
  toast,
  openImportProgress,
  closeImportProgress,
} from "@imify/stores";
import { useTranslation } from "@imify/i18n";
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake";
import { isCommonImageFile } from "../shared/image-file-utils";
import { PdfStudioModeSwitcher } from "./pdf-studio-mode-switcher";
import { PdfStudioDropZone } from "./pdf-studio-drop-zone";
import { ImagesToPdfWorkspace } from "./images-to-pdf-workspace";
import { PdfToImagesWorkspace } from "./pdf-to-images-workspace";
import type {
  ImagesToPdfConfig,
  PdfStudioImageItem,
  PdfStudioMode,
  PdfToImagesConfig,
} from "./types";

export interface SharedPdfStudioRenderProps {
  mode: PdfStudioMode;
  hasContent: boolean;
  imageItems: PdfStudioImageItem[];
  pdfFile: File | null;
  imagesToPdfConfig: ImagesToPdfConfig;
  pdfToImagesConfig: PdfToImagesConfig;
  onModeChange: (mode: PdfStudioMode) => void;
  onImagesToPdfConfigChange: (config: ImagesToPdfConfig) => void;
  onPdfToImagesConfigChange: (config: PdfToImagesConfig) => void;
}

interface SharedPdfStudioPageProps {
  renderWorkspace: (props: SharedPdfStudioRenderProps) => ReactNode;
}

export function SharedPdfStudioPage({
  renderWorkspace,
}: SharedPdfStudioPageProps) {
  const { t } = useTranslation("pdfStudio");
  const mode = usePdfStudioStore((s) => s.mode);
  const setMode = usePdfStudioStore((s) => s.setMode);
  const imagesToPdfConfig = usePdfStudioStore((s) => s.imagesToPdfConfig);
  const setImagesToPdfConfig = usePdfStudioStore(
    (s) => s.setImagesToPdfConfig,
  );
  const pdfToImagesConfig = usePdfStudioStore((s) => s.pdfToImagesConfig);
  const setPdfToImagesConfig = usePdfStudioStore(
    (s) => s.setPdfToImagesConfig,
  );

  const [imageItems, setImageItems] = useState<PdfStudioImageItem[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const previewUrlsRef = useRef<string[]>([]);

  const cleanupImagePreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanupImagePreviews();
    };
  }, [cleanupImagePreviews]);

  const handleLoadImageFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter(isCommonImageFile);
      if (imageFiles.length === 0) return;

      openImportProgress({ totalCount: imageFiles.length });
      try {
        setMode("images-to-pdf");
        const newItems: PdfStudioImageItem[] = imageFiles.map((file) => {
          const url = URL.createObjectURL(file);
          previewUrlsRef.current.push(url);

          return {
            id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            file,
            previewUrl: url,
            name: file.name,
            size: file.size,
          };
        });

        setImageItems((prev) => [...prev, ...newItems]);
        toast.success(
          t("common:countFiles", { count: newItems.length }) ||
            `Imported ${newItems.length} files`,
        );
      } finally {
        closeImportProgress();
      }
    },
    [setMode, t],
  );

  const handleLoadPdfFile = useCallback((file: File) => {
    setMode("pdf-to-images");
    setPdfFile(file);
  }, []);

  const handleRemoveImageItem = useCallback((id: string) => {
    setImageItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleReorderImageItems = useCallback(
    (fromIndex: number, toIndex: number) => {
      setImageItems((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(fromIndex, 1);
        if (moved) copy.splice(toIndex, 0, moved);
        return copy;
      });
    },
    [],
  );

  const handleClearImages = useCallback(() => {
    cleanupImagePreviews();
    setImageItems([]);
  }, [cleanupImagePreviews]);

  const handleClearPdf = useCallback(() => {
    setPdfFile(null);
  }, []);

  // Clipboard image intake
  useClipboardImageIntake({
    mode: "multiple",
    onImages: (files) => {
      if (files.length > 0) void handleLoadImageFiles(files);
    },
    enabled: true,
  });

  const hasContent =
    mode === "images-to-pdf" ? imageItems.length > 0 : pdfFile !== null;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header / Mode Switcher */}
      <div className="flex items-center justify-center">
        <PdfStudioModeSwitcher
          mode={mode}
          onModeChange={setMode}
          disabled={hasContent}
          disabledTooltip={t("modeSwitcher.switchDisabledTooltip")}
        />
      </div>

      {/* Main Workspace Body */}
      {!hasContent ? (
        <PdfStudioDropZone
          mode={mode}
          onLoadImageFiles={handleLoadImageFiles}
          onLoadPdfFile={handleLoadPdfFile}
        />
      ) : mode === "images-to-pdf" ? (
        <ImagesToPdfWorkspace
          items={imageItems}
          config={imagesToPdfConfig}
          onRemoveItem={handleRemoveImageItem}
          onReorderItems={handleReorderImageItems}
          onAddMoreFiles={handleLoadImageFiles}
          onClearAll={handleClearImages}
        />
      ) : pdfFile ? (
        <PdfToImagesWorkspace
          pdfFile={pdfFile}
          config={pdfToImagesConfig}
          onClear={handleClearPdf}
        />
      ) : null}

      {/* Expose state for external sidebar rendering */}
      {renderWorkspace({
        mode,
        hasContent,
        imageItems,
        pdfFile,
        imagesToPdfConfig,
        pdfToImagesConfig,
        onModeChange: setMode,
        onImagesToPdfConfigChange: setImagesToPdfConfig,
        onPdfToImagesConfigChange: setPdfToImagesConfig,
      })}
    </div>
  );
}
