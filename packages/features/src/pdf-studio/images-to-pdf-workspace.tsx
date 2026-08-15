"use client"

import React, { useRef, useState } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Download, GripVertical, Plus, Trash2 } from "lucide-react"
import { Button, AnimatingSpinner } from "@imify/ui"
import { useTranslation } from "@imify/i18n"
import { formatFileSize } from "../inspector/format-utils"
import { COMMON_IMAGE_ACCEPT, isCommonImageFile } from "../shared/image-file-utils"
import type { ImagesToPdfConfig, PdfStudioImageItem } from "./types"
import type { ResizeConfig } from "@imify/core/types"
import { PDFDocument } from "pdf-lib"
import {
  embedPreparedImageToDoc,
  prepareImageForPdf
} from "@imify/engine/converter/pdf-engine"

interface ImagesToPdfWorkspaceProps {
  items: PdfStudioImageItem[]
  config: ImagesToPdfConfig
  onRemoveItem: (id: string) => void
  onReorderItems: (fromIndex: number, toIndex: number) => void
  onAddMoreFiles: (files: File[]) => void
  onClearAll: () => void
}

interface SortablePageCardProps {
  item: PdfStudioImageItem
  pageIndex: number
  onRemove: (id: string) => void
}

function SortablePageCard({ item, pageIndex, onRemove }: SortablePageCardProps) {
  const { t } = useTranslation("pdfStudio")
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.6 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all dark:bg-slate-900 ${
        isDragging
          ? "border-red-500 shadow-lg ring-2 ring-red-500/20"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
      }`}
    >
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-2.5 py-1.5 dark:border-slate-800/80 dark:bg-slate-950/50">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:hover:text-slate-300"
            {...attributes}
            {...listeners}
            title={t("actions.dragToReorder")}
          >
            <GripVertical size={14} />
          </button>
          <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {pageIndex + 1}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          title={t("actions.removePage")}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Thumbnail Area */}
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-slate-100/50 p-2 dark:bg-slate-950/30">
        <img
          src={item.previewUrl}
          alt={item.name}
          className="max-h-full max-w-full rounded object-contain shadow-xs"
        />
      </div>

      {/* Info Footer */}
      <div className="flex flex-col gap-0.5 border-t border-slate-100 p-2.5 dark:border-slate-800/80">
        <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200" title={item.name}>
          {item.name}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {formatFileSize(item.size)}
        </span>
      </div>
    </div>
  )
}

export function ImagesToPdfWorkspace({
  items,
  config,
  onRemoveItem,
  onReorderItems,
  onAddMoreFiles,
  onClearAll
}: ImagesToPdfWorkspaceProps) {
  const { t } = useTranslation("pdfStudio")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ percent: number; message: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex >= 0 && newIndex >= 0) {
      onReorderItems(oldIndex, newIndex)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((f) => isCommonImageFile(f))
      if (validFiles.length > 0) {
        onAddMoreFiles(validFiles)
      }
      e.target.value = ""
    }
  }

  const handleExportPdf = async () => {
    if (items.length === 0 || isExporting) return

    setIsExporting(true)
    setExportProgress({ percent: 10, message: t("progress.building") })

    try {
      const pdfDoc = await PDFDocument.create()
      const total = items.length

      for (let i = 0; i < total; i += 1) {
        const item = items[i]!
        const pct = Math.min(88, 10 + Math.round(((i + 1) / total) * 78))
        setExportProgress({
          percent: pct,
          message: t("progress.rendering", { current: i + 1, total })
        })

        const resizeConfig: ResizeConfig =
          config.resizeMode === "paper_size"
            ? {
                mode: "paper_size",
                value: config.paperSize,
                dpi: config.dpi,
                resamplingAlgorithm: config.resamplingAlgorithm
              }
            : { mode: "inherit" }

        const prepared = await prepareImageForPdf({
          sourceBlob: item.file,
          resize: resizeConfig
        })

        await embedPreparedImageToDoc(pdfDoc, prepared, resizeConfig)
      }

      setExportProgress({ percent: 94, message: t("progress.saving") })
      const pdfBytes = await pdfDoc.save()
      const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "imify_document.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to generate PDF:", err)
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

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
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t("totalPagesCount", { count: items.length })}
          </span>
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
            {isExporting ? <AnimatingSpinner size={14} /> : <Download size={14} />}
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

      {/* Grid of Sortable Pages */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item, idx) => (
              <SortablePageCard
                key={item.id}
                item={item}
                pageIndex={idx}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
