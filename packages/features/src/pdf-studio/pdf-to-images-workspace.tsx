"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Check,
  CheckSquare,
  FileOutput,
  Layers,
  RotateCcw,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button, AnimatingSpinner } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { formatFileSize } from "../inspector/format-utils";
import type { PdfToImagesConfig } from "./types";
import { buildSmartOutputFileName } from "@imify/core/file-name-pattern";
import {
  APP_CONFIG,
  PDF_STUDIO_NAMING_CONFIG,
  parsePageRange,
  formatPageRange,
} from "@imify/core";
import {
  getPdfInfo,
  renderPdfPageToBlob,
  renderPdfPageToCanvas,
} from "@imify/engine/converter/pdf-reader";
import { StreamingZip } from "@imify/engine/converter/streaming-zip";
import {
  ExportSplitButton,
  type ExportSplitMode,
} from "../shared/export-split-button";
import { HeroProgressCard } from "../shared/hero-progress-card";
import { PaginationBar } from "../shared/pagination-bar";
import { confirmBatchDownload, promptRenameInput, toast } from "@imify/stores";
import { downloadWithFilename, sleep } from "../processor/batch/utils";
import {
  resolvePdfStudioLazyPagination,
  type PerformancePreferences,
  PERFORMANCE_PREFERENCES_KEY,
} from "../processor/performance-preferences";

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

interface ExportStats {
  current: number;
  total: number;
  percent: number;
  statusText: string;
  concurrency: number;
  ext: string;
}

export function PdfToImagesWorkspace({
  pdfFile,
  config,
  onClear,
}: PdfToImagesWorkspaceProps) {
  const { t } = useTranslation(["pdfStudio", "common"]);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState<string>("");
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isExporting) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isExporting]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Read performance preferences for lazy load paging
  const [isLazyPaging, setIsLazyPaging] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(PERFORMANCE_PREFERENCES_KEY);
      const parsed: PerformancePreferences | undefined = raw
        ? JSON.parse(raw)
        : undefined;
      return resolvePdfStudioLazyPagination(
        parsed,
        window.innerWidth < 768,
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      try {
        const raw = localStorage.getItem(PERFORMANCE_PREFERENCES_KEY);
        const parsed: PerformancePreferences | undefined = raw
          ? JSON.parse(raw)
          : undefined;
        setIsLazyPaging(resolvePdfStudioLazyPagination(parsed, mobile));
      } catch {
        // Ignore
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const pageSize = isMobile
    ? APP_CONFIG.PDF_STUDIO.PAGE_SIZE_MOBILE
    : APP_CONFIG.PDF_STUDIO.PAGE_SIZE_DESKTOP;

  const totalPages = Math.max(1, Math.ceil(pageCount / pageSize));

  // Reset page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Object URLs tracking to avoid memory leak
  const previewUrlsMapRef = useRef<Map<number, string>>(new Map());
  const thumbnailAbortControllerRef = useRef<AbortController | null>(null);
  const exportAbortControllerRef = useRef<AbortController | null>(null);

  const cleanupAllPreviewUrls = useCallback(() => {
    previewUrlsMapRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsMapRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      cleanupAllPreviewUrls();
      thumbnailAbortControllerRef.current?.abort();
      exportAbortControllerRef.current?.abort();
    };
  }, [cleanupAllPreviewUrls]);

  // 1. Initial document scan
  useEffect(() => {
    let isCancelled = false;

    const scanPdf = async () => {
      setIsInitializing(true);
      setCurrentPage(1);
      cleanupAllPreviewUrls();

      try {
        const info = await getPdfInfo(pdfFile);
        if (isCancelled) return;

        const count = info.pageCount;
        setPageCount(count);

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
        setRangeInput(formatPageRange(allSet, count));
        setThumbnails(initialThumbs);
        setIsInitializing(false);
      } catch (err) {
        console.error("Failed to load PDF info:", err);
        if (!isCancelled) setIsInitializing(false);
      }
    };

    void scanPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfFile, cleanupAllPreviewUrls]);

  // 2. Thumbnail loading (Lazy Paged or All in background, cancellable on export)
  useEffect(() => {
    if (isInitializing || pageCount === 0 || isExporting) return;

    // Cancel any previous thumbnail loader
    thumbnailAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    thumbnailAbortControllerRef.current = abortController;
    const signal = abortController.signal;

    const startPage = isLazyPaging
      ? (currentPage - 1) * pageSize + 1
      : 1;
    const endPage = isLazyPaging
      ? Math.min(pageCount, currentPage * pageSize)
      : pageCount;

    const loadThumbnails = async () => {
      for (let i = startPage; i <= endPage; i += 1) {
        if (signal.aborted) break;

        // Skip if already loaded
        if (previewUrlsMapRef.current.has(i)) continue;

        try {
          const { canvas } = await renderPdfPageToCanvas(pdfFile, i, {
            maxWidth: 200,
          });
          if (signal.aborted) break;

          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.7),
          );
          if (signal.aborted || !blob) break;

          const objectUrl = URL.createObjectURL(blob);
          previewUrlsMapRef.current.set(i, objectUrl);

          setThumbnails((prev) =>
            prev.map((th) =>
              th.pageNumber === i
                ? { ...th, previewUrl: objectUrl, isLoading: false }
                : th,
            ),
          );
        } catch (e) {
          if (signal.aborted) break;
          setThumbnails((prev) =>
            prev.map((th) =>
              th.pageNumber === i ? { ...th, isLoading: false } : th,
            ),
          );
        }
      }
    };

    void loadThumbnails();

    return () => {
      abortController.abort();
    };
  }, [pdfFile, pageCount, isInitializing, currentPage, pageSize, isLazyPaging, isExporting]);

  // Handle manual click toggle on page card
  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      setRangeInput(formatPageRange(next, pageCount));
      return next;
    });
  };

  // Handle page range input change (2-way binding)
  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    const parsed = parsePageRange(val, pageCount);
    setSelectedPages(parsed);
  };

  // Quick preset selections
  const handleSelectAll = () => {
    const all = new Set<number>();
    for (let i = 1; i <= pageCount; i += 1) all.add(i);
    setSelectedPages(all);
    setRangeInput(formatPageRange(all, pageCount));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
    setRangeInput("");
  };

  const handleSelectEven = () => {
    const even = new Set<number>();
    for (let i = 2; i <= pageCount; i += 2) even.add(i);
    setSelectedPages(even);
    setRangeInput(formatPageRange(even, pageCount));
  };

  const handleSelectOdd = () => {
    const odd = new Set<number>();
    for (let i = 1; i <= pageCount; i += 2) odd.add(i);
    setSelectedPages(odd);
    setRangeInput(formatPageRange(odd, pageCount));
  };

  const handleInvertSelection = () => {
    setSelectedPages((prev) => {
      const inverted = new Set<number>();
      for (let i = 1; i <= pageCount; i += 1) {
        if (!prev.has(i)) inverted.add(i);
      }
      setRangeInput(formatPageRange(inverted, pageCount));
      return inverted;
    });
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

  const handleCancelExport = useCallback(() => {
    if (exportAbortControllerRef.current) {
      exportAbortControllerRef.current.abort();
      exportAbortControllerRef.current = null;
    }
    setIsExporting(false);
    setExportStats(null);
  }, []);

  const executeExport = async (
    mode: "zip" | "one_by_one",
    customInput?: string,
  ) => {
    const pagesToExport = Array.from(selectedPages).sort((a, b) => a - b);
    if (pagesToExport.length === 0 || isExporting) return;

    const startTime = Date.now();
    const notifyCompleted = () => {
      const elapsedMs = Date.now() - startTime;
      const durationSeconds = (elapsedMs / 1000).toFixed(1);
      toast.success(
        t("done", { ns: "common" }),
        t("completedInSeconds", { ns: "common", seconds: durationSeconds }),
        3000,
      );
    };

    // 1. Immediately abort background thumbnail generation to allocate 100% resources
    thumbnailAbortControllerRef.current?.abort();

    // 2. Initialize export abort controller
    const abortController = new AbortController();
    exportAbortControllerRef.current = abortController;
    const signal = abortController.signal;

    setIsExporting(true);

    const { format: targetFormat, quality, ext } = getFormatOptions();
    const pattern =
      config.fileNamePattern || PDF_STUDIO_NAMING_CONFIG.defaultPattern;

    const hardwareThreads =
      typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 4;
    const concurrency = Math.max(1, Math.min(6, Math.floor(hardwareThreads / 2) || 2));

    setExportStats({
      current: 0,
      total: pagesToExport.length,
      percent: 5,
      statusText: t("progress.startExtracting"),
      concurrency,
      ext: ext.toUpperCase(),
    });

    try {
      // Single page direct download
      if (pagesToExport.length === 1) {
        const pageNum = pagesToExport[0]!;
        setExportStats((s) => (s ? { ...s, percent: 50, statusText: t("progress.rendering", { current: 1, total: 1 }) } : s));

        const blob = await renderPdfPageToBlob(pdfFile, {
          pageNumber: pageNum,
          dpi: config.dpi,
          format: targetFormat,
          quality,
        });

        if (signal.aborted) return;

        const smartName = buildSmartOutputFileName({
          pattern,
          originalFileName: pdfFile.name,
          outputExtension: ext,
          index: pageNum,
          totalFiles: pageCount,
          dimensions: { width: 0, height: 0 },
          now: new Date(),
          input: customInput,
        });

        const finalFileName = smartName.endsWith(`.${ext}`)
          ? smartName
          : `${smartName}.${ext}`;

        await downloadWithFilename(blob, finalFileName);
        notifyCompleted();
        return;
      }

      // One by one sequential download
      if (mode === "one_by_one") {
        const total = pagesToExport.length;

        for (let i = 0; i < total; i += 1) {
          if (signal.aborted) return;
          const pageNum = pagesToExport[i]!;
          const pct = Math.min(95, 5 + Math.round(((i + 1) / total) * 90));

          setExportStats((s) =>
            s
              ? {
                  ...s,
                  current: i + 1,
                  percent: pct,
                  statusText: t("progress.rendering", { current: i + 1, total }),
                }
              : s,
          );

          const blob = await renderPdfPageToBlob(pdfFile, {
            pageNumber: pageNum,
            dpi: config.dpi,
            format: targetFormat,
            quality,
          });

          if (signal.aborted) return;

          const smartName = buildSmartOutputFileName({
            pattern,
            originalFileName: pdfFile.name,
            outputExtension: ext,
            index: pageNum,
            totalFiles: pageCount,
            dimensions: { width: 0, height: 0 },
            now: new Date(),
            input: customInput,
          });

          const finalFileName = smartName.endsWith(`.${ext}`)
            ? smartName
            : `${smartName}.${ext}`;

          await downloadWithFilename(blob, finalFileName);
          await sleep(100);
        }
        notifyCompleted();
        return;
      }

      // Multiple pages -> Streaming ZIP with concurrency
      const streamingZip = new StreamingZip();
      const total = pagesToExport.length;
      let completedCount = 0;

      // Process in concurrency chunks
      for (let i = 0; i < total; i += concurrency) {
        if (signal.aborted) {
          streamingZip.abort();
          return;
        }

        const chunk = pagesToExport.slice(i, i + concurrency);
        await Promise.all(
          chunk.map(async (pageNum) => {
            if (signal.aborted) return;
            const blob = await renderPdfPageToBlob(pdfFile, {
              pageNumber: pageNum,
              dpi: config.dpi,
              format: targetFormat,
              quality,
            });

            if (signal.aborted) return;

            const smartName = buildSmartOutputFileName({
              pattern,
              originalFileName: pdfFile.name,
              outputExtension: ext,
              index: pageNum,
              totalFiles: pageCount,
              dimensions: { width: 0, height: 0 },
              now: new Date(),
              input: customInput,
            });

            const finalFileName = smartName.endsWith(`.${ext}`)
              ? smartName
              : `${smartName}.${ext}`;

            await streamingZip.addFile(finalFileName, blob);
            completedCount += 1;

            const pct = Math.min(
              90,
              5 + Math.round((completedCount / total) * 85),
            );

            setExportStats((s) =>
              s
                ? {
                    ...s,
                    current: completedCount,
                    percent: pct,
                    statusText: t("progress.rendering", {
                      current: completedCount,
                      total,
                    }),
                  }
                : s,
            );
          }),
        );
      }

      if (signal.aborted) {
        streamingZip.abort();
        return;
      }

      // Finalize ZIP
      setExportStats((s) =>
        s
          ? {
              ...s,
              percent: 95,
              statusText: t("progress.zipBuilding"),
            }
          : s,
      );

      const zipBlob = await streamingZip.finalize();
      if (signal.aborted) return;

      const now = new Date();
      const pad2 = (n: number) => n.toString().padStart(2, "0");
      const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
      const zipFileName = `imify-pdftoimg-${time}.zip`;
      await downloadWithFilename(zipBlob, zipFileName);
      notifyCompleted();
    } catch (e: any) {
      if (!signal.aborted) {
        console.error("Export error:", e);
      }
    } finally {
      setIsExporting(false);
      setExportStats(null);
      exportAbortControllerRef.current = null;
    }
  };

  const handleExportClick = async (exportMode: ExportSplitMode) => {
    const pagesToExport = Array.from(selectedPages);
    if (pagesToExport.length === 0) return;

    const pattern =
      config.fileNamePattern || PDF_STUDIO_NAMING_CONFIG.defaultPattern;
    let customInput: string | undefined = undefined;

    if (pattern.includes("[Input]")) {
      const inputVal = await promptRenameInput(pattern);
      if (inputVal === null) return;
      customInput = inputVal;
    }

    if (exportMode === "one_by_one" && pagesToExport.length > 1) {
      const confirmed = await confirmBatchDownload(pagesToExport.length);
      if (!confirmed) return;
      await executeExport("one_by_one", customInput);
      return;
    }

    await executeExport(exportMode === "one_by_one" ? "one_by_one" : "zip", customInput);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(pageCount, startIndex + pageSize);
  const visibleThumbnails = thumbnails.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-4">
      {/* Workspace Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <FileOutput size={20} />
          </div>
          <div>
            <h3
              className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs md:max-w-md"
              title={pdfFile.name}
            >
              {pdfFile.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatFileSize(pdfFile.size)} •{" "}
              {t("totalPagesCount", { count: pageCount })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={isInitializing || isExporting}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
          >
            <Trash2 size={14} />
            <span>{t("actions.clear")}</span>
          </Button>

          <ExportSplitButton
            onExport={handleExportClick}
            disabled={
              isInitializing || isExporting || selectedPages.size === 0
            }
            isLoading={isExporting}
            primaryMode="zip"
            oneByOneCount={selectedPages.size}
            showPdfOptions={false}
          />
        </div>
      </div>

      {/* Hero Progress Card (Mounted above selection controls during export) */}
      {isExporting && exportStats && (
        <HeroProgressCard
          badge={exportStats.ext}
          concurrency={exportStats.concurrency}
          elapsedSeconds={elapsedSeconds}
          statusText={exportStats.statusText}
          percent={exportStats.percent}
          current={exportStats.current}
          total={exportStats.total}
          onCancel={handleCancelExport}
        />
      )}

      {/* Page Range & Quick Selection Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
        {/* Left: 2-way Range Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Layers size={14} />
            </div>
            <input
              type="text"
              value={rangeInput}
              onChange={handleRangeInputChange}
              placeholder={t("actions.pageRangePlaceholder")}
              disabled={isInitializing || isExporting}
              className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {t("actions.selectedPagesCount", {
              selected: selectedPages.size,
              total: pageCount,
            })}
          </span>
        </div>

        {/* Right: Quick Selection Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedPages.size < pageCount ? (
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isInitializing || isExporting}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={t("actions.selectAll")}
            >
              <CheckSquare size={12} className="text-red-500" />
              <span>{t("actions.selectAll")}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={isInitializing || isExporting}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={t("actions.deselectAll")}
            >
              <Square size={12} className="text-slate-400" />
              <span>{t("actions.deselectAll")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSelectOdd}
            disabled={isInitializing || isExporting}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span>{t("actions.selectOdd")}</span>
          </button>

          <button
            type="button"
            onClick={handleSelectEven}
            disabled={isInitializing || isExporting}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span>{t("actions.selectEven")}</span>
          </button>

          <button
            type="button"
            onClick={handleInvertSelection}
            disabled={isInitializing || isExporting}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title={t("actions.invertSelection")}
          >
            <RotateCcw size={12} className="text-amber-500" />
            <span>{t("actions.invertSelection")}</span>
          </button>
        </div>
      </div>

      {/* Grid of Pages & Pagination (Hidden during active export to release DOM & GPU memory) */}
      {!isExporting && (
        <>
          {isInitializing && thumbnails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <AnimatingSpinner size={32} />
              <span className="mt-3 text-xs text-slate-500">
                {t("progress.readingPdf")}
              </span>
            </div>
          ) : (
            <div className="grid gap-2 md:gap-3 grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visibleThumbnails.map((thumb) => {
                const isSelected = selectedPages.has(thumb.pageNumber);

                return (
                  <div
                    key={thumb.pageNumber}
                    onClick={() => togglePageSelection(thumb.pageNumber)}
                    className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-xs transition-all dark:bg-slate-900 ${
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
                          className="max-h-full max-w-full rounded object-contain shadow-xs pointer-events-none"
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

          {/* Pagination Controls Bar */}
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            startItemIndex={startIndex + 1}
            endItemIndex={endIndex}
            totalItems={pageCount}
          />
        </>
      )}
    </div>
  );
}
