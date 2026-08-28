"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Check, Edit2, GripVertical, Layers, Trash2, X } from "lucide-react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { confirmDialog, toast } from "@imify/stores";
import {
  useCollagePresetStore,
  type SavedCollagePreset,
} from "@imify/stores/stores/collage-preset-store";
import { useTranslation } from "@imify/i18n";
import type { GridDesignParams } from "../filling/types";
import {
  COLLAGE_LAYOUT_PRESETS,
  DEFAULT_COLLAGE_PRESET_COLOR,
  MAX_COLLAGE_IMAGES,
  MIN_COLLAGE_IMAGES,
  type CollageLayoutPreset,
} from "./config";
import { CollageLayoutPreview } from "./collage-layout-preview";

export interface UnifiedCollagePreset {
  id: string;
  name: string;
  imageCount: number;
  params: GridDesignParams;
  highlightColor?: string;
  isCustom: boolean;
  rawCustomPreset?: SavedCollagePreset;
}

export interface CollagePresetGridProps {
  /** Target image count to filter presets. If undefined, all sections from 2 to 10 photos are rendered with sticky headers and quick-jump bar. */
  targetImageCount?: number;
  /** Currently selected layout preset ID */
  selectedLayoutId?: string;
  /** Callback fired when a layout is clicked/selected */
  onSelectLayout?: (presetId: string, params: GridDesignParams) => void;
  /** Allow drag-and-drop reordering of custom presets */
  allowReorder?: boolean;
  /** Allow inline renaming of custom presets */
  allowRename?: boolean;
  /** Allow deletion of custom presets */
  allowDelete?: boolean;
  /** Custom CSS class for the grid container */
  gridClassName?: string;
  /** If true, layout uses wider column count (e.g. 3-5 cols) */
  wideGrid?: boolean;
}

interface SortablePresetCardProps {
  preset: UnifiedCollagePreset;
  isSelected: boolean;
  allowReorder?: boolean;
  allowRename?: boolean;
  allowDelete?: boolean;
  onSelect?: () => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (preset: UnifiedCollagePreset) => void;
}

function SortablePresetCard({
  preset,
  isSelected,
  allowReorder = false,
  allowRename = false,
  allowDelete = false,
  onSelect,
  onRename,
  onDelete,
}: SortablePresetCardProps) {
  const { t } = useTranslation(["collageMaker", "common", "workspace"]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(preset.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: preset.id,
    disabled: !allowReorder,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleSaveRename = () => {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== preset.name && onRename) {
      onRename(preset.id, trimmed.slice(0, 30));
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditingName(preset.name);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col items-center gap-1.5 rounded-md border p-2 transition-all select-none ${
        isSelected
          ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/80 dark:border-amber-500 dark:bg-amber-900/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
      }`}
    >
      {/* Top Right Actions (Drag Handle / Delete Button) */}
      {(allowReorder || (allowDelete && preset.isCustom)) && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 z-10">
          {allowReorder && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shadow-2xs"
              title={t("common:actions.reorder", {
                defaultValue: "Drag to reorder",
              })}
            >
              <GripVertical size={12} />
            </button>
          )}

          {allowDelete && preset.isCustom && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(preset);
              }}
              className="p-0.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shadow-2xs"
              title={t("common:actions.delete", { defaultValue: "Delete" })}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      {/* Main Preview Click Area */}
      <button
        type="button"
        onClick={onSelect}
        title={preset.name}
        className="w-full flex flex-col items-center gap-1.5 cursor-pointer"
      >
        <div className="aspect-square w-full rounded border border-slate-200/80 bg-slate-100/90 dark:border-slate-700/80 dark:bg-slate-800/90 p-1 flex items-center justify-center">
          <CollageLayoutPreview
            presetId={preset.id}
            params={preset.params}
            fill={preset.highlightColor || "#cbd5e1"}
            className="h-full w-full"
          />
        </div>
      </button>

      {/* Preset Name / Inline Rename */}
      <div className="w-full">
        {isEditing ? (
          <div className="flex items-center gap-1 w-full">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
                if (e.key === "Escape") handleCancelRename();
              }}
              autoFocus
              className="w-full rounded border border-amber-400 bg-white dark:bg-slate-800 px-1 py-0.5 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
              maxLength={30}
            />
            <button
              type="button"
              onClick={handleSaveRename}
              className="text-emerald-500 hover:text-emerald-600 p-0.5"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={handleCancelRename}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 w-full group/name">
            <span
              className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[85%] text-center cursor-pointer"
              title={preset.name}
              onClick={onSelect}
            >
              {preset.name}
            </span>
            {allowRename && preset.isCustom && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 group-hover/name:opacity-100 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-opacity p-0.5"
                title={t("common:actions.rename", { defaultValue: "Rename" })}
              >
                <Edit2 size={10} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CollagePresetGrid({
  targetImageCount,
  selectedLayoutId,
  onSelectLayout,
  allowReorder = false,
  allowRename = false,
  allowDelete = false,
  gridClassName,
  wideGrid = false,
}: CollagePresetGridProps) {
  const { t } = useTranslation(["collageMaker", "common", "workspace"]);

  // Custom presets & order from store
  const customPresets = useCollagePresetStore((state) => state.presets);
  const presetOrder = useCollagePresetStore((state) => state.presetOrder);
  const setPresetOrder = useCollagePresetStore((state) => state.setPresetOrder);
  const updatePresetMeta = useCollagePresetStore(
    (state) => state.updatePresetMeta,
  );
  const deletePreset = useCollagePresetStore((state) => state.deletePreset);

  // Available image counts list: 2..10
  const imageCounts = useMemo(() => {
    const list: number[] = [];
    for (let c = MIN_COLLAGE_IMAGES; c <= MAX_COLLAGE_IMAGES; c++) {
      list.push(c);
    }
    return list;
  }, []);

  // Helper to compute sorted presets for a specific count
  const getPresetsForCount = useCallback(
    (count: number): UnifiedCollagePreset[] => {
      const customs: UnifiedCollagePreset[] = customPresets
        .filter((p) => p.config.imageCount === count)
        .map((p) => ({
          id: p.id,
          name: p.name,
          imageCount: p.config.imageCount,
          params: p.config.params,
          highlightColor: p.highlightColor,
          isCustom: true,
          rawCustomPreset: p,
        }));

      const defaults: UnifiedCollagePreset[] = COLLAGE_LAYOUT_PRESETS.filter(
        (p) => p.imageCount === count,
      ).map((p) => ({
        id: p.id,
        name: p.name ?? `Default ${p.imageCount}x${p.id}`,
        imageCount: p.imageCount,
        params: p.params,
        highlightColor: p.highlightColor ?? DEFAULT_COLLAGE_PRESET_COLOR,
        isCustom: false,
      }));

      const baseList = [...customs, ...defaults];
      if (!presetOrder || presetOrder.length === 0) {
        return baseList;
      }

      return [...baseList].sort((a, b) => {
        const idxA = presetOrder.indexOf(a.id);
        const idxB = presetOrder.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    },
    [customPresets, presetOrder],
  );

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEndForCount = useCallback(
    (count: number, event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const groupPresets = getPresetsForCount(count);
      const oldIndex = groupPresets.findIndex((p) => p.id === active.id);
      const newIndex = groupPresets.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newActiveItems = arrayMove([...groupPresets], oldIndex, newIndex);
        const newActiveIds = newActiveItems.map((p) => p.id);

        const currentPresetOrder = presetOrder || [];
        const remainingOrders = currentPresetOrder.filter(
          (id) => !newActiveIds.includes(id),
        );
        setPresetOrder([...newActiveIds, ...remainingOrders]);
      }
    },
    [getPresetsForCount, presetOrder, setPresetOrder],
  );

  const handleRename = useCallback(
    (id: string, newName: string) => {
      const target = customPresets.find((p) => p.id === id);
      if (target) {
        updatePresetMeta({
          id,
          name: newName,
          highlightColor: target.highlightColor,
        });
        toast.success(t("workspace:assets.collagePresets.renameSuccess"));
      }
    },
    [customPresets, updatePresetMeta, t],
  );

  const handleDelete = useCallback(
    async (preset: UnifiedCollagePreset) => {
      const confirmed = await confirmDialog({
        title: t("workspace:assets.collagePresets.deleteConfirm", {
          name: preset.name,
        }),
        variant: "destructive",
      });

      if (confirmed) {
        deletePreset(preset.id);
        toast.success(t("workspace:assets.collagePresets.deletedToast"));
      }
    },
    [deletePreset, t],
  );

  const handleQuickJump = (count: number) => {
    const el = document.getElementById(`collage-section-${count}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const defaultGridClass = wideGrid
    ? "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5"
    : "grid grid-cols-3 sm:grid-cols-2 gap-2";

  // CASE 1: Single Target Image Count (e.g. inside Collage Maker stage 2 sidebar)
  if (targetImageCount !== undefined) {
    const presets = getPresetsForCount(targetImageCount);

    if (presets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("presetGrid.emptyState", {
              count: targetImageCount,
            })}
          </p>
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => handleDragEndForCount(targetImageCount, e)}
      >
        <SortableContext
          items={presets.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className={gridClassName ?? defaultGridClass}>
            {presets.map((preset) => (
              <SortablePresetCard
                key={preset.id}
                preset={preset}
                isSelected={selectedLayoutId === preset.id}
                allowReorder={allowReorder}
                allowRename={allowRename}
                allowDelete={allowDelete}
                onSelect={() => onSelectLayout?.(preset.id, preset.params)}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // CASE 2: All Sections 2..10 with Sticky Section Headers and Quick Jump Bar
  return (
    <div className="w-full space-y-6">
      {/* Quick Jump Bar */}
      <div className="sticky top-0 z-30 -mx-1 px-1 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mr-1 shrink-0 flex items-center gap-1">
          <Layers size={13} />
          <span>{t("presetGrid.filterLabel")}:</span>
        </div>
        {imageCounts.map((count) => {
          const matchingPresets = getPresetsForCount(count);

          return (
            <button
              key={count}
              type="button"
              onClick={() => handleQuickJump(count)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium shrink-0 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 dark:bg-slate-800 dark:hover:bg-amber-900/40 dark:hover:text-amber-200 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <span>{count}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                ({matchingPresets.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Sections 2 to 10 */}
      <div className="space-y-6">
        {imageCounts.map((count) => {
          const presets = getPresetsForCount(count);
          const customCount = presets.filter((p) => p.isCustom).length;

          return (
            <div
              key={count}
              id={`collage-section-${count}`}
              className="space-y-2.5 scroll-mt-24"
            >
              {/* Sticky Section Header: pinned below Quick Jump bar */}
              <div className="sticky top-[38px] z-20 -mx-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs rounded-t-md">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-white text-[11px] font-bold shadow-2xs">
                    {count}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t("stage2.layoutsForImages", { count })}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    ({presets.length})
                  </span>
                </div>

                {customCount > 0 && (
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
                    {customCount} {t("presetGrid.customBadge")}
                  </span>
                )}
              </div>

              {/* Section Grid Content */}
              {presets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("presetGrid.emptyState", { count })}
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEndForCount(count, e)}
                >
                  <SortableContext
                    items={presets.map((p) => p.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className={gridClassName ?? defaultGridClass}>
                      {presets.map((preset) => (
                        <SortablePresetCard
                          key={preset.id}
                          preset={preset}
                          isSelected={selectedLayoutId === preset.id}
                          allowReorder={allowReorder}
                          allowRename={allowRename}
                          allowDelete={allowDelete}
                          onSelect={() =>
                            onSelectLayout?.(preset.id, preset.params)
                          }
                          onRename={handleRename}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
