import { Plus, Type, X } from "lucide-react";
import React, { useMemo } from "react";
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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { ControlledPopover } from "@imify/ui";

import type { SplicingCaptionMode, SplicingImageItem } from "./types";
import { SortableQueueItem } from "../shared/sortable-queue-item";

interface ImageStripProps {
  images: SplicingImageItem[];
  onRemove: (id: string) => void;
  /** Indices from current `images` order (same semantics as batch queue `arrayMove`). */
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAddMore: () => void;
  selectedImageId?: string | null;
  onSelectImage?: (id: string) => void;
  pinAddButtonRight?: boolean;
  captionMode?: SplicingCaptionMode;
  captionTexts?: Record<string, string>;
  onCaptionTextChange?: (id: string, text: string) => void;
}

function ImageCaptionEditPopover({
  index,
  imageId,
  value,
  onChange,
}: {
  index: number;
  imageId: string;
  value: string;
  onChange: (id: string, text: string) => void;
}) {
  const defaultText = `Image #${index + 1}`;
  const displayText = value.trim() ? value : defaultText;

  return (
    <ControlledPopover
      preset="dropdown"
      side="top"
      align="center"
      sideOffset={6}
      trigger={
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full text-left truncate px-1.5 py-0.5 text-[9px] font-medium bg-slate-900/75 hover:bg-slate-900 text-white rounded-xs transition-colors flex items-center justify-between gap-1 group/btn cursor-pointer shadow-xs"
          title={`Caption: ${displayText}`}
        >
          <span className="truncate">{displayText}</span>
          <Type
            size={9}
            className="shrink-0 opacity-70 group-hover/btn:opacity-100"
          />
        </button>
      }
      contentClassName="z-50 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xl space-y-2 text-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
          Tiêu đề ảnh #{index + 1}
        </span>
        {value.trim() !== "" && (
          <button
            type="button"
            onClick={() => onChange(imageId, "")}
            className="text-[10px] text-sky-600 hover:text-sky-500 font-medium cursor-pointer"
          >
            Mặc định
          </button>
        )}
      </div>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(imageId, e.target.value)}
          placeholder={defaultText}
          autoFocus
          className="w-full h-8 px-2.5 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(imageId, "")}
            className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </ControlledPopover>
  );
}

export function ImageStrip({
  images,
  onRemove,
  onReorder,
  onAddMore,
  selectedImageId,
  onSelectImage,
  pinAddButtonRight = false,
  captionMode = "none",
  captionTexts = {},
  onCaptionTextChange,
}: ImageStripProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortableIds = useMemo(() => images.map((i) => i.id), [images]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(oldIndex, newIndex);
  };

  if (images.length === 0) return null;

  const showCaptionBar = captionMode !== "none" && Boolean(onCaptionTextChange);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-stretch gap-2 overflow-x-auto py-2 scrollbar-thin">
        <SortableContext
          items={sortableIds}
          strategy={horizontalListSortingStrategy}
        >
          {images.map((img, i) => (
            <SortableQueueItem key={img.id} id={img.id}>
              <div
                className={`group relative flex-shrink-0 ${
                  showCaptionBar ? "h-[108px]" : "h-[88px]"
                } w-20 rounded-lg border bg-white dark:bg-slate-800 overflow-hidden shadow-sm transition-all flex flex-col justify-between ${
                  selectedImageId === img.id
                    ? "border-cyan-500 ring-2 ring-cyan-300/70 dark:ring-cyan-700/70 shadow-md"
                    : "border-slate-200 dark:border-slate-700 hover:shadow-md"
                }`}
              >
                <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onSelectImage?.(img.id)}
                    className="absolute inset-0 z-10"
                    aria-label={`Select image ${i + 1}`}
                  />
                  <img
                    src={img.thumbnailUrl}
                    alt={`Image ${i + 1}`}
                    className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    draggable={false}
                  />
                  <span className="absolute top-0.5 left-1 text-[9px] font-bold text-white bg-black/50 rounded px-1">
                    {i + 1}
                  </span>
                </div>

                {showCaptionBar && onCaptionTextChange && (
                  <div className="p-1 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700/60 z-20">
                    <ImageCaptionEditPopover
                      index={i}
                      imageId={img.id}
                      value={captionTexts[img.id] ?? ""}
                      onChange={onCaptionTextChange}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onRemove(img.id)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute z-30 top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Remove"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            </SortableQueueItem>
          ))}
        </SortableContext>

        <div
          className={
            pinAddButtonRight
              ? "sticky right-0 z-30 pl-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm"
              : ""
          }
        >
          <button
            type="button"
            onClick={onAddMore}
            className={`flex-shrink-0 w-20 ${
              showCaptionBar ? "h-[108px]" : "h-[88px]"
            } rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-600 bg-transparent hover:bg-sky-50 dark:hover:bg-sky-900/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-sky-500 transition-all cursor-pointer`}
          >
            <Plus size={18} />
            <span className="text-[10px] font-semibold">Add</span>
          </button>
        </div>
      </div>
    </DndContext>
  );
}
