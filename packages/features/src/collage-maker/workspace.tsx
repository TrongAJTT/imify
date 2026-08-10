import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Grid,
  ImagePlus,
  LayoutGrid,
  Layers,
  Palette,
  Plus,
  Ruler,
  Sliders,
  Trash2,
  Upload,
} from "lucide-react";
import {
  AccordionCard,
  Button,
  CheckboxCard,
  EmptyDropCard,
  Kicker,
  LabelText,
  NumberInput,
  RadioCard,
  SelectInput,
  Subheading,
  Tooltip,
  WorkspaceLoadingState,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { useFillUiStore } from "@imify/stores/stores/fill-ui-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { PresetSelector } from "@imify/features/processor/preset-selector";

import {
  ASPECT_RATIO_OPTIONS,
  parseAspectRatio,
  ratioFromDimensions,
  isSameRatio,
} from "@imify/features/shared/use-aspect-ratio";
import { COMMON_IMAGE_ACCEPT, isCommonImageFile } from "@imify/features/shared/image-file-utils";

import type { CanvasSizeUnit, FillingTemplate, GridDesignParams, VectorLayer, LayerFillState } from "@imify/features/filling/types";
import { DEFAULT_CANVAS_FILL_STATE, createLayerFillState } from "@imify/features/filling/types";
import { generateGridLayers } from "@imify/features/filling/grid-designer/generator";
import { GridDesignWorkspace } from "@imify/features/filling/grid-designer/workspace";
import { FillWorkspace } from "@imify/features/filling/fill/workspace";
import { FillSidebar } from "@imify/features/filling/fill/sidebar";
import { SortableQueueItem } from "@imify/features/shared/sortable-queue-item";

import { CollageMakerInfoPanel } from "./collage-maker-info-panel";
import {
  COLLAGE_DEFAULT_NAME_PREFIX,
  COLLAGE_LAYOUT_PRESETS,
  MAX_COLLAGE_IMAGES,
  MIN_COLLAGE_IMAGES,
  useCollageIdentifiedPreset,
  type CollageLayoutPreset,
} from "./config";

export interface QueueImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export function CollageMakerWorkspace() {
  const { t } = useTranslation(["collageMaker", "filling", "common"]);

  // Stage Management: 1 = Prepare, 2 = Layout, 3 = Fill & Export
  const [stage, setStage] = useState<1 | 2 | 3>(1);

  // Stage 1 - Upload Queue
  const [queueImages, setQueueImages] = useState<QueueImageItem[]>([]);

  // Stage 2 - Canvas & Spacing Config
  const [canvasWidth, setCanvasWidth] = useState<number>(1920);
  const [canvasHeight, setCanvasHeight] = useState<number>(1080);
  const [canvasUnit, setCanvasUnit] = useState<CanvasSizeUnit>("px");
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
  const [gridParams, setGridParams] = useState<GridDesignParams>({
    direction: "cols",
    rowCount: 2,
    rowDefinitions: ["1", "1"],
    outerPadding: 20,
    gapX: 16,
    gapY: 16,
    uniformColumns: false,
    uniformColumnsDef: "",
  });

  // Header Store
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb);
  const setHeaderOnBack = useWorkspaceHeaderStore((state) => state.setOnBack);
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);

  // Identified Preset for Stage 3 Output Settings
  const identifiedPreset = useCollageIdentifiedPreset();

  // Handle Drag Sensors for Queue Item Reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Filter presets matching current queue count
  const matchingPresets = useMemo(() => {
    const count = queueImages.length;
    return COLLAGE_LAYOUT_PRESETS.filter(
      (p) => p.imageCount === (count >= 2 ? count : 2),
    );
  }, [queueImages.length]);

  // Set default selected layout preset when queue size changes
  useEffect(() => {
    if (matchingPresets.length > 0) {
      const first = matchingPresets[0]!;
      setSelectedLayoutId(first.id);
      setGridParams(first.params);
    }
  }, [matchingPresets]);

  // Image Upload Handlers
  const handleFilesAdded = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(isCommonImageFile);
    if (validFiles.length === 0) return;

    setQueueImages((prev) => {
      const remainingSlots = MAX_COLLAGE_IMAGES - prev.length;
      if (remainingSlots <= 0) return prev;

      const newItems: QueueImageItem[] = validFiles
        .slice(0, remainingSlots)
        .map((file) => ({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));

      return [...prev, ...newItems];
    });
  }, []);

  const handleClearAll = useCallback(() => {
    queueImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setQueueImages([]);
  }, [queueImages]);

  const handleRemoveImage = useCallback((id: string) => {
    setQueueImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setQueueImages((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  // Generated Filling Template based on current Grid Params & Canvas Size
  const templateId = useMemo(
    () => `collage-${canvasWidth}x${canvasHeight}-${gridParams.direction}-${gridParams.rowCount}-${gridParams.outerPadding}-${gridParams.gapX}-${gridParams.gapY}`,
    [canvasWidth, canvasHeight, gridParams],
  );

  const generatedTemplate = useMemo<FillingTemplate>(() => {
    const generatedLayers: VectorLayer[] = generateGridLayers(
      gridParams,
      canvasWidth,
      canvasHeight,
    );

    return {
      id: templateId,
      name: `${COLLAGE_DEFAULT_NAME_PREFIX}`,
      createdAt: 0,
      updatedAt: 0,
      usageCount: 0,
      lastUsedAt: null,
      isPinned: false,
      canvasWidth,
      canvasHeight,
      layers: generatedLayers,
      groups: [],
    };
  }, [canvasWidth, canvasHeight, gridParams, templateId]);

  // Stage 3 Initialization: Pre-fill uploaded images into generated template layers
  useEffect(() => {
    if (stage !== 3) return;

    // Reset session and initialize fill states
    useFillingStore.getState().initFillStatesForTemplate(generatedTemplate);
    useFillUiStore.getState().initializeFillSession(generatedTemplate);

    const defaultStates = useFillingStore.getState().layerFillStates;
    const nextStates: LayerFillState[] = generatedTemplate.layers.map((layer, idx) => {
      const imgItem = queueImages[idx];
      const existing = defaultStates.find((s) => s.layerId === layer.id);
      return {
        ...(existing ?? createLayerFillState(layer.id)),
        imageUrl: imgItem ? imgItem.previewUrl : null,
      };
    });

    useFillingStore.getState().setLayerFillStates(nextStates);
  }, [stage, generatedTemplate, queueImages]);

  // Header unmount cleanup
  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  const title = t("collageMaker.title", { defaultValue: "Ghép ảnh nhanh" });
  const stage1Title = t("collageMaker.stage1.title", { defaultValue: "Chuẩn bị ảnh" });
  const stage2Title = t("collageMaker.stage2.title", { defaultValue: "Chọn layout" });
  const stage3Title = t("collageMaker.stage3.title", { defaultValue: "Chỉnh ảnh" });

  const middleLabel = stage === 1 ? stage1Title : stage === 2 ? stage2Title : stage3Title;

  const handleRootClick = useCallback(() => {
    setStage(1);
  }, []);

  const handleBackClick = useCallback(() => {
    setStage((s) => (s - 1) as 1 | 2);
  }, []);

  const headerBreadcrumbNode = useMemo(
    () => (
      <FeatureBreadcrumb
        compact
        rootToolId="collage-maker"
        middleLabel={middleLabel}
        onRootClick={handleRootClick}
      />
    ),
    [middleLabel, handleRootClick],
  );

  // Configure Header based on current stage
  useEffect(() => {
    setHeaderSection(title);
    setHeaderBreadcrumb(headerBreadcrumbNode);
    setHeaderActions(null);
    setHeaderOnBack(stage > 1 ? handleBackClick : null);
  }, [stage, title, headerBreadcrumbNode, handleBackClick, setHeaderActions, setHeaderBreadcrumb, setHeaderOnBack, setHeaderSection]);

  // Configure Sidebar based on current stage
  const sidebarContent = useMemo(() => {
    if (stage === 1) {
      return <CollageMakerInfoPanel />;
    }

    if (stage === 2) {
      return (
        <div className="space-y-4 p-0">
          <AccordionCard
            icon={<Ruler size={16} />}
            label={t("collageMaker.stage2.imageSize", { defaultValue: "Output Image Size" })}
            sublabel={`${canvasWidth} x ${canvasHeight} px`}
            colorTheme="amber"
            defaultOpen={true}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 w-full min-w-0">
                  <NumberInput
                    label={t("filling:dialog.width", { defaultValue: "Width" })}
                    value={canvasWidth}
                    onChangeValue={(v) => setCanvasWidth(Math.max(100, Math.round(v)))}
                    min={100}
                    max={16384}
                  />
                </div>
                <div className="flex-1 w-full min-w-0">
                  <NumberInput
                    label={t("filling:dialog.height", { defaultValue: "Height" })}
                    value={canvasHeight}
                    onChangeValue={(v) => setCanvasHeight(Math.max(100, Math.round(v)))}
                    min={100}
                    max={16384}
                  />
                </div>
              </div>

              <SelectInput
                label={t("common:units", { defaultValue: "Unit" })}
                value={canvasUnit}
                onChange={(v) => setCanvasUnit(v as CanvasSizeUnit)}
                options={[
                  { label: "Pixel (px)", value: "px" },
                  { label: "Millimeter (mm)", value: "mm" },
                  { label: "Inch (in)", value: "in" },
                ]}
              />
            </div>
          </AccordionCard>

          <AccordionCard
            icon={<Sliders size={16} />}
            label={t("collageMaker.stage2.spacingPadding", { defaultValue: "Spacing & Margin" })}
            sublabel={`Pad: ${gridParams.outerPadding}px • Gap: ${gridParams.gapX}x${gridParams.gapY}px`}
            colorTheme="amber"
            defaultOpen={true}
          >
            <div className="space-y-3">
              <NumberInput
                label={t("collageMaker.stage2.outerPadding", { defaultValue: "Outer Margin" })}
                value={gridParams.outerPadding}
                onChangeValue={(v) =>
                  setGridParams((prev) => ({ ...prev, outerPadding: Math.max(0, Math.round(v)) }))
                }
                min={0}
                max={200}
              />
              <div className="flex gap-2">
                <NumberInput
                  label={t("collageMaker.stage2.gapX", { defaultValue: "Horizontal Gap" })}
                  value={gridParams.gapX ?? 0}
                  onChangeValue={(v) =>
                    setGridParams((prev) => ({ ...prev, gapX: Math.max(0, Math.round(v)) }))
                  }
                  min={0}
                  max={200}
                />
                <NumberInput
                  label={t("collageMaker.stage2.gapY", { defaultValue: "Vertical Gap" })}
                  value={gridParams.gapY ?? 0}
                  onChangeValue={(v) =>
                    setGridParams((prev) => ({ ...prev, gapY: Math.max(0, Math.round(v)) }))
                  }
                  min={0}
                  max={200}
                />
              </div>
            </div>
          </AccordionCard>

          <AccordionCard
            icon={<LayoutGrid size={16} />}
            label={t("collageMaker.stage2.layoutSelector", { defaultValue: "Layout Templates" })}
            sublabel={t("collageMaker.stage2.layoutsForImages", {
              count: queueImages.length,
              defaultValue: `Layouts for ${queueImages.length} photos`,
            })}
            colorTheme="amber"
            defaultOpen={true}
          >
            <div className="grid grid-cols-2 gap-2">
              {matchingPresets.map((preset) => {
                const isSelected = selectedLayoutId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedLayoutId(preset.id);
                      setGridParams(preset.params);
                    }}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-2.5 transition-all text-left ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-400 dark:border-amber-500 dark:bg-amber-900/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      className="h-16 w-full rounded border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                      dangerouslySetInnerHTML={{ __html: preset.svgPreview }}
                    />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </AccordionCard>

          <Button
            variant="primary"
            className="w-full gap-2 font-bold py-2.5"
            onClick={() => setStage(3)}
          >
            <span>{t("collageMaker.stage2.nextToEdit", { defaultValue: "Tiếp tục chỉnh ảnh" })}</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      );
    }

    // Stage 3 Sidebar
    return <FillSidebar template={generatedTemplate} />;
  }, [stage, queueImages.length, canvasWidth, canvasHeight, canvasUnit, gridParams, matchingPresets, selectedLayoutId, generatedTemplate, t]);

  return (
    <div className="space-y-4 p-0">
      {/* STAGE 1: PREPARE IMAGES */}
      {stage === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div>
              <Subheading className="text-xl">
                {t("collageMaker.stage1.title", { defaultValue: "Chuẩn bị ảnh" })}
              </Subheading>
              <LabelText className="text-xs text-slate-500">
                {t("collageMaker.stage1.subtitle", {
                  count: queueImages.length,
                  max: MAX_COLLAGE_IMAGES,
                  width: canvasWidth,
                  height: canvasHeight,
                  defaultValue: `Đã tải ${queueImages.length}/${MAX_COLLAGE_IMAGES} ảnh • Canvas ${canvasWidth} x ${canvasHeight} px`,
                })}
              </LabelText>
            </div>

            {queueImages.length >= MIN_COLLAGE_IMAGES && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleClearAll}>
                  <Trash2 size={14} />
                  {t("collageMaker.stage1.clearAll", { defaultValue: "Xóa tất cả" })}
                </Button>
                <Button variant="primary" size="sm" onClick={() => setStage(2)}>
                  <span>{t("collageMaker.stage1.createCollage", { defaultValue: "Tạo ảnh ghép" })}</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            )}
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
            }}
          >
            <EmptyDropCard
              icon={<Upload size={28} className="text-amber-500" />}
              iconWrapperClassName="bg-amber-100 dark:bg-amber-900/30 border-transparent shadow-none"
              title={t("collageMaker.stage1.dropzoneTitle", { defaultValue: "Kéo thả ảnh vào đây để tạo ảnh ghép" })}
              subtitle={t("collageMaker.stage1.dropzoneSubtitle", {
                max: MAX_COLLAGE_IMAGES,
                defaultValue: `Tải lên từ 2 đến ${MAX_COLLAGE_IMAGES} ảnh (JPEG, PNG, WebP, AVIF)`,
              })}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = COMMON_IMAGE_ACCEPT;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) handleFilesAdded(target.files);
                };
                input.click();
              }}
            />
          </div>

          {queueImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Subheading className="text-sm font-semibold">
                  {t("collageMaker.stage1.queueTitle", { defaultValue: "Danh sách ảnh đã chọn" })}
                </Subheading>
                <LabelText className="text-xs text-slate-400">
                  {t("collageMaker.stage1.reorderHelp", { defaultValue: "Kéo thẻ ảnh để đổi vị trí trong layout." })}
                </LabelText>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={queueImages.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {queueImages.map((item, idx) => (
                      <SortableQueueItem key={item.id} id={item.id}>
                        <div className="group relative flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute top-0.5 left-0.5 rounded bg-black/60 px-1 py-0.2 text-[10px] font-bold text-white">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {item.file.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {Math.round(item.file.size / 1024)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(item.id);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                            aria-label="Remove image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </SortableQueueItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: CHOOSE LAYOUT */}
      {stage === 2 && (
        <GridDesignWorkspace
          template={generatedTemplate}
          onRefresh={async () => {}}
        />
      )}

      {/* STAGE 3: EDIT & FILL */}
      {stage === 3 && (
        <FillWorkspace template={generatedTemplate} />
      )}
    </div>
  );
}
