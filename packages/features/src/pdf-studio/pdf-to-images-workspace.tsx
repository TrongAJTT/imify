"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Check, FileOutput, Trash2 } from "lucide-react";
import { Button, AnimatingSpinner, ToastContainer } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { formatFileSize } from "../inspector/format-utils";
import type { PdfToImagesConfig } from "./types";
import { buildSmartOutputFileName } from "@imify/core/file-name-pattern";
import { APP_CONFIG, PDF_STUDIO_NAMING_CONFIG } from "@imify/core";
import {
  getPdfInfo,
  renderPdfPageToBlob,
  renderPdfPageToCanvas,
} from "@imify/engine/converter/pdf-reader";
import { zipSync } from "fflate";
import {
  ExportSplitButton,
  type ExportSplitMode,
} from "../shared/export-split-button";
import { BatchDownloadConfirmDialog } from "../shared/download-confirm-dialog";
import { downloadWithFilename, sleep } from "../processor/batch/utils";
import { useConversionToasts } from "@imify/core/hooks/use-toast";
import type { ConversionProgressPayload } from "@imify/core/types";

interface PdfToImagesWorkspaceProps {
  pdfFile: File;
  config: PdfToImagesConfig;
  onClear: () => void;
}

interface PageThumbnail {
  pageNumber: number;
  previewUrl: string | null;
  isLoading: boolean;
}

export function PdfToImagesWorkspace({
  pdfFile,
  config,
  onClear,
}: PdfToImagesWorkspaceProps) {
  const { t } = useTranslation("pdfStudio");
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [pendingExportMode, setPendingExportMode] =
    useState<ExportSplitMode | null>(null);

  const [exportToastPayload, setExportToastPayload] =
    useState<ConversionProgressPayload | null>(null);
  const exportToastHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const conversionToasts = useConversionToasts([exportToastPayload]);

  const clearToastHideTimer = useCallback(() => {
    if (exportToastHideTimerRef.current) {
      clearTimeout(exportToastHideTimerRef.current);
      exportToastHideTimerRef.current = null;
    }
  }, []);

  const pushExportToast = useCallback(
    (payload: ConversionProgressPayload) => {
      clearToastHideTimer();
      setExportToastPayload(payload);
    },
    [clearToastHideTimer],
  );

  const scheduleToastHide = useCallback(
    (toastId: string, delayMs: number) => {
      clearToastHideTimer();
      exportToastHideTimerRef.current = setTimeout(() => {
        setExportToastPayload((current) =>
          current?.id === toastId ? null : current,
        );
        exportToastHideTimerRef.current = null;
      }, delayMs);
    },
    [clearToastHideTimer],
  );

  // 1. Initial document scan & thumbnail generation
  useEffect(() => {
    let isCancelled = false;

    const loadPdf = async () => {
      setIsInitializing(true);
      try {
        const info = await getPdfInfo(pdfFile);
        if (isCancelled) return;

        const count = info.pageCount;
        setPageCount(count);

        // Select all pages by default
        const allSet = new Set<number>();
        const initialThumbs: PageThumbnail[] = [];
        for (let i = 1; i <= count; i += 1) {
          allSet.add(i);
          initialThumbs.push({
            pageNumber: i,
            previewUrl: null,
            isLoading: true,
          });
        }
        setSelectedPages(allSet);
        setThumbnails(initialThumbs);

        // Asynchronously load thumbnail for each page (max width 200 for fast, lightweight preview)
        for (let i = 1; i <= count; i += 1) {
          if (isCancelled) break;
          try {
            const { canvas } = await renderPdfPageToCanvas(pdfFile, i, {
              maxWidth: 200,
            });
            if (isCancelled) break;

            const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
            setThumbnails((prev) =>
              prev.map((th) =>
                th.pageNumber === i
                  ? { ...th, previewUrl: dataUrl, isLoading: false }
                  : th,
              ),
            );
          } catch (e) {
            console.error(`Failed to load thumb for page ${i}:`, e);
            setThumbnails((prev) =>
              prev.map((th) =>
                th.pageNumber === i ? { ...th, isLoading: false } : th,
              ),
            );
          }
        }
      } catch (err) {
        console.error("Failed to load PDF info:", err);
      } finally {
        if (!isCancelled) setIsInitializing(false);
      }
    };

    void loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfFile]);

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = new Set<number>();
    for (let i = 1; i <= pageCount; i += 1) all.add(i);
    setSelectedPages(all);
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const getFormatOptions = () => {
    const format = config.format || "png";
    if (format === "jpg") {
      return { format: "jpg" as const, quality: 0.92, ext: "jpg" };
    }
    if (format === "webp") {
      return { format: "webp" as const, quality: 0.88, ext: "webp" };
    }
    if (format === "webp-lossless") {
      return { format: "webp" as const, quality: 1.0, ext: "webp" };
    }
    return { format: "png" as const, quality: 1.0, ext: "png" };
  };

  const executeExport = async (
    mode: "zip" | "one_by_one",
  ) => {
    const pagesToExport = Array.from(selectedPages).sort((a, b) => a - b);
    if (pagesToExport.length === 0 || isExporting) return;

    const toastId = `export-pdf-images-${Date.now()}`;
    setIsExporting(true);

    const { format: targetFormat, quality, ext } = getFormatOptions();
    const pattern =
      config.fileNamePattern || PDF_STUDIO_NAMING_CONFIG.defaultPattern;

    pushExportToast({
      id: toastId,
      fileName: pdfFile.name,
      targetFormat: ext as any,
      status: "processing",
      percent: 5,
      message: t("progress.startExtracting"),
    });

    try {
      // If only 1 page selected, download directly as single image file
      if (pagesToExport.length === 1) {
        const pageNum = pagesToExport[0]!;
        pushExportToast({
          id: toastId,
          fileName: pdfFile.name,
          targetFormat: ext as any,
          status: "processing",
          percent: 50,
          message: t("progress.rendering", { current: 1, total: 1 }),
        });

        const blob = await renderPdfPageToBlob(pdfFile, {
          pageNumber: pageNum,
          dpi: config.dpi,
          format: targetFormat,
          quality,
        });

        const smartName = buildSmartOutputFileName({
          pattern,
          originalFileName: pdfFile.name,
          outputExtension: ext,
          index: pageNum,
          totalFiles: pageCount,
          dimensions: { width: 0, height: 0 },
          now: new Date(),
        });

        const finalFileName = smartName.endsWith(`.${ext}`)
          ? smartName
          : `${smartName}.${ext}`;

        await downloadWithFilename(blob, finalFileName);

        pushExportToast({
          id: toastId,
          fileName: pdfFile.name,
          targetFormat: ext as any,
          status: "success",
          percent: 100,
          message: t("progress.exportComplete", {
            defaultValue: "Xuất hình ảnh thành công!",
          }),
        });
        scheduleToastHide(toastId, 2500);
        return;
      }

      // One by one sequential download
      if (mode === "one_by_one") {
        const total = pagesToExport.length;

        for (let i = 0; i < total; i += 1) {
          const pageNum = pagesToExport[i]!;
          const pct = Math.min(95, 10 + Math.round(((i + 1) / total) * 85));
          pushExportToast({
            id: toastId,
            fileName: pdfFile.name,
            targetFormat: ext as any,
            status: "processing",
            percent: pct,
            message: `${t("progress.rendering", { current: i + 1, total })}`,
          });

          const blob = await renderPdfPageToBlob(pdfFile, {
            pageNumber: pageNum,
            dpi: config.dpi,
            format: targetFormat,
            quality,
          });

          const smartName = buildSmartOutputFileName({
            pattern,
            originalFileName: pdfFile.name,
            outputExtension: ext,
            index: pageNum,
            totalFiles: pageCount,
            dimensions: { width: 0, height: 0 },
            now: new Date(),
          });

          const finalFileName = smartName.endsWith(`.${ext}`)
            ? smartName
            : `${smartName}.${ext}`;

          await downloadWithFilename(blob, finalFileName);
          await sleep(120);
        }

        pushExportToast({
          id: toastId,
          fileName: pdfFile.name,
          targetFormat: ext as any,
          status: "success",
          percent: 100,
          message: t("progress.exportComplete", {
            defaultValue: "Xuất hình ảnh thành công!",
          }),
        });
        scheduleToastHide(toastId, 2500);
        return;
      }

      // Multiple pages -> package as ZIP
      const archive: Record<string, Uint8Array> = {};
      const total = pagesToExport.length;

      for (let i = 0; i < total; i += 1) {
        const pageNum = pagesToExport[i]!;
        const pct = Math.min(88, 10 + Math.round(((i + 1) / total) * 78));
        pushExportToast({
          id: toastId,
          fileName: pdfFile.name,
          targetFormat: ext as any,
          status: "processing",
          percent: pct,
          message: t("progress.rendering", { current: i + 1, total }),
        });

        const blob = await renderPdfPageToBlob(pdfFile, {
          pageNumber: pageNum,
          dpi: config.dpi,
          format: targetFormat,
          quality,
        });

        const smartName = buildSmartOutputFileName({
          pattern,
          originalFileName: pdfFile.name,
          outputExtension: ext,
          index: pageNum,
          totalFiles: pageCount,
          dimensions: { width: 0, height: 0 },
          now: new Date(),
        });

        const finalFileName = smartName.endsWith(`.${ext}`)
          ? smartName
          : `${smartName}.${ext}`;
        const buffer = new Uint8Array(await blob.arrayBuffer());
        archive[finalFileName] = buffer;
      }

      pushExportToast({
        id: toastId,
        fileName: pdfFile.name,
        targetFormat: ext as any,
        status: "processing",
        percent: 92,
        message: t("progress.packaging"),
      });

      const zipBytes = zipSync(archive, { level: 6 });
      const zipBlob = new Blob([zipBytes as unknown as BlobPart], {
        type: "application/zip",
      });

      const baseName = pdfFile.name.replace(/\.[^.]+$/, "") || "document";
      await downloadWithFilename(zipBlob, `${baseName}_images.zip`);

      pushExportToast({
        id: toastId,
        fileName: pdfFile.name,
        targetFormat: ext as any,
        status: "success",
        percent: 100,
        message: t("progress.exportComplete", {
          defaultValue: "Xuất hình ảnh thành công!",
        }),
      });
      scheduleToastHide(toastId, 2500);
    } catch (err) {
      console.error("Failed to export images from PDF:", err);
      pushExportToast({
        id: toastId,
        fileName: pdfFile.name,
        targetFormat: ext as any,
        status: "error",
        percent: 100,
        message: "Failed to export images from PDF",
      });
      scheduleToastHide(toastId, 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportModeSelect = (mode: ExportSplitMode) => {
    const pagesToExportCount = selectedPages.size;
    if (pagesToExportCount === 0 || isExporting) return;

    if (
      mode === "one_by_one" &&
      pagesToExportCount > APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD
    ) {
      setPendingExportMode(mode);
      setShowDownloadConfirm(true);
      return;
    }

    void executeExport(mode === "one_by_one" ? "one_by_one" : "zip");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <FileOutput size={16} className="text-red-500" />
          <div className="flex flex-col">
            <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[200px] sm:max-w-xs">
              {pdfFile.name}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {formatFileSize(pdfFile.size)} &middot;{" "}
              {t("totalPagesCount", { count: pageCount })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={
              selectedPages.size === pageCount
                ? handleDeselectAll
                : handleSelectAll
            }
            disabled={isInitializing || isExporting}
          >
            {selectedPages.size === pageCount
              ? t("actions.deselectAll")
              : t("actions.selectAll")}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClear}
            disabled={isExporting}
          >
            <Trash2 size={14} />
            {t("actions.clear")}
          </Button>

          <ExportSplitButton
            onExport={handleExportModeSelect}
            isLoading={isExporting}
            primaryMode="zip"
            oneByOneCount={selectedPages.size}
            showPdfOptions={false}
          />
        </div>
      </div>

      {/* Grid of Pages */}
      {isInitializing && thumbnails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <AnimatingSpinner size={32} />
          <span className="mt-3 text-xs text-slate-500">
            {t("progress.readingPdf")}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {thumbnails.map((thumb) => {
            const isSelected = selectedPages.has(thumb.pageNumber);

            return (
              <div
                key={thumb.pageNumber}
                onClick={() => togglePageSelection(thumb.pageNumber)}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all dark:bg-slate-900 ${
                  isSelected
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : "border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300 dark:border-slate-800"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-2.5 py-1.5 dark:border-slate-800/80 dark:bg-slate-950/50">
                  <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {t("pageNumberLabel", { num: thumb.pageNumber })}
                  </span>

                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
                      isSelected
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-slate-100/50 p-2 dark:bg-slate-950/30">
                  {thumb.previewUrl ? (
                    <img
                      src={thumb.previewUrl}
                      alt={`Page ${thumb.pageNumber}`}
                      className="max-h-full max-w-full rounded object-contain shadow-xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AnimatingSpinner size={18} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-download confirmation dialog */}
      <BatchDownloadConfirmDialog
        isOpen={showDownloadConfirm}
        count={selectedPages.size}
        onClose={() => {
          setShowDownloadConfirm(false);
          setPendingExportMode(null);
        }}
        onConfirm={() => {
          setShowDownloadConfirm(false);
          setPendingExportMode(null);
          void executeExport("one_by_one");
        }}
      />

      <ToastContainer
        toasts={conversionToasts}
        onRemove={() => setExportToastPayload(null)}
      />
    </div>
  );
}
