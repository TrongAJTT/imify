"use client";

import React, { useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Download, Images, Plus, Trash2 } from "lucide-react";
import { Button, AnimatingSpinner } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { formatFileSize } from "../inspector/format-utils";
import {
  COMMON_IMAGE_ACCEPT,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { SortableQueueItem } from "../shared/sortable-queue-item";
import { MediaQueueCard } from "../shared/media-queue-card";
import type { ImagesToPdfConfig, PdfStudioImageItem } from "./types";
import type { ResizeConfig } from "@imify/core/types";
import { PDFDocument } from "pdf-lib";
import {
  embedPreparedImageToDoc,
  prepareImageForPdf,
} from "@imify/engine/converter/pdf-engine";

interface ImagesToPdfWorkspaceProps {
  items: PdfStudioImageItem[];
  config: ImagesToPdfConfig;
  onRemoveItem: (id: string) => void;
  onReorderItems: (fromIndex: number, toIndex: number) => void;
  onAddMoreFiles: (files: File[]) => void;
  onClearAll: () => void;
}

export function ImagesToPdfWorkspace({
  items,
  config,
  onRemoveItem,
  onReorderItems,
  onAddMoreFiles,
  onClearAll,
}: ImagesToPdfWorkspaceProps) {
  const { t } = useTranslation("pdfStudio");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{
    percent: number;
    message: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      onReorderItems(oldIndex, newIndex);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((f) =>
        isCommonImageFile(f),
      );
      if (validFiles.length > 0) {
        onAddMoreFiles(validFiles);
      }
      e.target.value = "";
    }
  };

  const handleExportPdf = async () => {
    if (items.length === 0 || isExporting) return;

    setIsExporting(true);
    setExportProgress({ percent: 10, message: t("progress.building") });

    try {
      const pdfDoc = await PDFDocument.create();
      const total = items.length;

      for (let i = 0; i < total; i += 1) {
        const item = items[i]!;
        const pct = Math.min(88, 10 + Math.round(((i + 1) / total) * 78));
        setExportProgress({
          percent: pct,
          message: t("progress.rendering", { current: i + 1, total }),
        });

        const resizeConfig: ResizeConfig = (() => {
          if (config.resizeMode === "paper_size") {
            return {
              mode: "paper_size",
              value: config.paperSize,
              dpi: config.dpi,
              resamplingAlgorithm: config.resamplingAlgorithm,
            };
          }
          if (
            config.resizeMode === "fit_value" ||
            config.resizeMode === "zoom_min" ||
            config.resizeMode === "zoom_max"
          ) {
            return {
              mode: config.resizeMode,
              value: config.resizeValue,
              applyTo: config.resizeApplyTo,
              resamplingAlgorithm: config.resamplingAlgorithm,
            };
          }
          if (config.resizeMode === "scale") {
            return {
              mode: "scale",
              value: config.resizeValue,
              resamplingAlgorithm: config.resamplingAlgorithm,
            };
          }
          if (config.resizeMode === "set_size") {
            return {
              mode: "set_size",
              width: config.resizeWidth,
              height: config.resizeHeight,
              fitMode: config.resizeFitMode,
              aspectMode: config.resizeAspectMode,
              aspectRatio: config.resizeAspectRatio,
              containBackground: config.resizeContainBackground,
              resamplingAlgorithm: config.resamplingAlgorithm,
            };
          }
          return { mode: "inherit" };
        })();

        const prepared = await prepareImageForPdf({
          sourceBlob: item.file,
          resize: resizeConfig,
        });

        await embedPreparedImageToDoc(pdfDoc, prepared, resizeConfig);
      }

      setExportProgress({ percent: 94, message: t("progress.saving") });
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "imify_document.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const totalSize = React.useMemo(
    () => items.reduce((acc, item) => acc + item.size, 0),
    [items],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={COMMON_IMAGE_ACCEPT}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <Images size={16} className="text-red-500" />
          <div className="flex flex-col">
            <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
              {t("documentTitle")}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {formatFileSize(totalSize)} &middot;{" "}
              {t("totalPagesCount", { count: items.length })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExporting}
          >
            <Plus size={14} />
            {t("actions.addImages")}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClearAll}
            disabled={isExporting}
          >
            <Trash2 size={14} />
            {t("actions.clearAll")}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExporting || items.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
          >
            {isExporting ? (
              <AnimatingSpinner size={14} />
            ) : (
              <Download size={14} />
            )}
            {t("actions.exportPdf")}
          </Button>
        </div>
      </div>

      {/* Progress Bar when exporting */}
      {isExporting && exportProgress && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>{exportProgress.message}</span>
            <span>{exportProgress.percent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-red-500 transition-all duration-200"
              style={{ width: `${exportProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid of Sortable Pages using MediaQueueCard */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-3 grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item, idx) => (
              <SortableQueueItem key={item.id} id={item.id}>
                <MediaQueueCard
                  id={item.id}
                  name={item.name}
                  sizeBytes={item.size}
                  previewUrl={item.previewUrl}
                  indexBadge={idx + 1}
                  onRemove={onRemoveItem}
                />
              </SortableQueueItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
