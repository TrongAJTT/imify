import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Trash2, Upload } from "lucide-react";
import { Button, EmptyDropCard, LabelText, Subheading } from "@imify/ui";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { useFillUiStore } from "@imify/stores/stores/fill-ui-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";

import {
  COMMON_IMAGE_ACCEPT,
  isCommonImageFile,
} from "@imify/features/shared/image-file-utils";

import type {
  CanvasSizeUnit,
  FillingTemplate,
  GridDesignParams,
  VectorLayer,
  LayerFillState,
} from "@imify/features/filling/types";
import { createLayerFillState } from "@imify/features/filling/types";
import { generateGridLayers } from "@imify/features/filling/grid-designer/generator";
import { GridDesignWorkspace } from "@imify/features/filling/grid-designer/workspace";
import { FillWorkspace } from "@imify/features/filling/fill/workspace";
import { FillSidebar } from "@imify/features/filling/fill/sidebar";
import { SortableQueueItem } from "@imify/features/shared/sortable-queue-item";
import { MediaQueueCard } from "../shared/media-queue-card";

import { CollageMakerInfoPanel } from "./collage-maker-info-panel";
import { CollageMakerStage2Sidebar } from "./collage-maker-stage2-sidebar";
import {
  COLLAGE_DEFAULT_NAME_PREFIX,
  COLLAGE_LAYOUT_PRESETS,
  MAX_COLLAGE_IMAGES,
  MIN_COLLAGE_IMAGES,
} from "./config";

export interface QueueImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export interface CollageMakerWorkspaceProps {
  stage?: 1 | 2 | 3;
  onStageChange?: (stage: 1 | 2 | 3) => void;
  onSidebarChange?: (sidebar: React.ReactNode, title?: string) => void;
  enableWideSidebarGrid?: boolean;
}

export function CollageMakerWorkspace({
  stage: controlledStage,
  onStageChange,
  onSidebarChange,
  enableWideSidebarGrid = false,
}: CollageMakerWorkspaceProps = {}) {
  const { t } = useTranslation(["collageMaker", "filling", "common"]);

  // Stage Management: 1 = Prepare, 2 = Layout, 3 = Fill & Export
  const [internalStage, setInternalStage] = useState<1 | 2 | 3>(
    controlledStage ?? 1,
  );
  const stage = controlledStage ?? internalStage;

  const setStage = useCallback(
    (action: 1 | 2 | 3 | ((prev: 1 | 2 | 3) => 1 | 2 | 3)) => {
      const nextStage = typeof action === "function" ? action(stage) : action;
      if (onStageChange) {
        onStageChange(nextStage);
      }
      setInternalStage(nextStage);
    },
    [stage, onStageChange],
  );

  useEffect(() => {
    if (controlledStage !== undefined) {
      setInternalStage(controlledStage);
    }
  }, [controlledStage]);

  // Stage 1 - Upload Queue
  const [queueImages, setQueueImages] = useState<QueueImageItem[]>([]);

  // Stage 2 - Canvas & Spacing Config
  const [canvasWidth, setCanvasWidth] = useState<number>(1920);
  const [canvasHeight, setCanvasHeight] = useState<number>(1080);
  const [canvasUnit, setCanvasUnit] = useState<CanvasSizeUnit>("px");
  const [canvasDpi, setCanvasDpi] = useState<number>(300);
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

  const handleSelectLayout = useCallback(
    (presetId: string, params: GridDesignParams) => {
      setSelectedLayoutId(presetId);
      setGridParams(params);
      useFillingStore.getState().setGridDesignParams(params);
    },
    [],
  );

  const handleGridParamsChange = useCallback((params: GridDesignParams) => {
    setGridParams(params);
    useFillingStore.getState().setGridDesignParams(params);
  }, []);

  // Header Store
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const setHeaderOnBack = useWorkspaceHeaderStore((state) => state.setOnBack);
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);

  // Handle Drag Sensors for Queue Item Reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      useFillingStore.getState().setGridDesignParams(first.params);
    }
  }, [matchingPresets]);

  // Fallback to stage 1 if stage > 1 but photos are insufficient
  useEffect(() => {
    if (stage > 1 && queueImages.length < MIN_COLLAGE_IMAGES) {
      setStage(1);
    }
  }, [stage, queueImages.length, setStage]);

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
    () =>
      `collage-${canvasWidth}x${canvasHeight}-${gridParams.direction}-${gridParams.rowCount}-${gridParams.rowDefinitions.join("_")}-${gridParams.outerPadding}-${gridParams.gapX}-${gridParams.gapY}-${selectedLayoutId}`,
    [canvasWidth, canvasHeight, gridParams, selectedLayoutId],
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
      gridDesignParams: gridParams,
    };
  }, [canvasWidth, canvasHeight, gridParams, templateId]);

  // Stage 3 Initialization: Pre-fill uploaded images into generated template layers with auto fit-to-width
  useEffect(() => {
    if (stage !== 3) return;

    // Reset session and initialize fill states
    useFillingStore.getState().initFillStatesForTemplate(generatedTemplate);
    useFillUiStore.getState().initializeFillSession(generatedTemplate);

    const defaultStates = useFillingStore.getState().layerFillStates;

    // Calculate fit-to-width transform for each image in matching grid cell
    const loadPromises = generatedTemplate.layers.map(async (layer, idx) => {
      const imgItem = queueImages[idx];
      if (!imgItem) {
        return createLayerFillState(layer.id);
      }

      const existing = defaultStates.find((s) => s.layerId === layer.id);

      return new Promise<LayerFillState>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const naturalWidth = img.naturalWidth || 1;
          const naturalHeight = img.naturalHeight || 1;
          // Scale image to match cell width exactly
          const scaleToWidth = layer.width / naturalWidth;
          const offsetY = Math.round(
            (layer.height - naturalHeight * scaleToWidth) / 2,
          );

          resolve({
            ...(existing ?? createLayerFillState(layer.id)),
            imageUrl: imgItem.previewUrl,
            imageTransform: {
              x: 0,
              y: offsetY,
              scaleX: scaleToWidth,
              scaleY: scaleToWidth,
              rotation: 0,
            },
          });
        };
        img.onerror = () => {
          resolve({
            ...(existing ?? createLayerFillState(layer.id)),
            imageUrl: imgItem.previewUrl,
          });
        };
        img.src = imgItem.previewUrl;
      });
    });

    let isSubscribed = true;
    Promise.all(loadPromises).then((nextStates) => {
      if (isSubscribed) {
        useFillingStore.getState().setLayerFillStates(nextStates);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [stage, generatedTemplate, queueImages]);

  // Dynamic Sidebar Title according to Stage
  const sidebarTitle = useMemo(() => {
    if (stage === 1) return t("common:aboutThisTool");
    if (stage === 2) {
      return `${t("common:toolSettings")} - ${t("stage2.title")}`;
    }
    return `${t("common:toolSettings")} - ${t("stage3.title")}`;
  }, [stage, t]);

  const title = t("title");
  const stage1Title = t("stage1.title");
  const stage2Title = t("stage2.title");
  const stage3Title = t("stage3.title");

  const middleLabel =
    stage === 1 ? stage1Title : stage === 2 ? stage2Title : stage3Title;

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
  }, [
    stage,
    title,
    headerBreadcrumbNode,
    handleBackClick,
    setHeaderActions,
    setHeaderBreadcrumb,
    setHeaderOnBack,
    setHeaderSection,
  ]);

  // Configure Sidebar based on current stage
  const sidebarContent = useMemo(() => {
    if (stage === 1) {
      return <CollageMakerInfoPanel />;
    }

    if (stage === 2) {
      return (
        <CollageMakerStage2Sidebar
          queueCount={queueImages.length}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          canvasUnit={canvasUnit}
          canvasDpi={canvasDpi}
          selectedLayoutId={selectedLayoutId}
          gridParams={gridParams}
          onCanvasWidthChange={setCanvasWidth}
          onCanvasHeightChange={setCanvasHeight}
          onCanvasUnitChange={setCanvasUnit}
          onCanvasDpiChange={setCanvasDpi}
          onGridParamsChange={handleGridParamsChange}
          onSelectLayout={handleSelectLayout}
          enableWideSidebarGrid={enableWideSidebarGrid}
        />
      );
    }

    // Stage 3 Sidebar
    return (
      <FillSidebar
        template={generatedTemplate}
        enableWideSidebarGrid={enableWideSidebarGrid}
      />
    );
  }, [
    stage,
    queueImages.length,
    canvasWidth,
    canvasHeight,
    canvasUnit,
    selectedLayoutId,
    gridParams,
    enableWideSidebarGrid,
    handleGridParamsChange,
    handleSelectLayout,
    generatedTemplate,
    t,
  ]);

  useEffect(() => {
    if (onSidebarChange) {
      onSidebarChange(sidebarContent, sidebarTitle);
    }
  }, [sidebarContent, sidebarTitle, onSidebarChange]);

  return (
    <div className="space-y-4 p-0">
      {/* STAGE 1: PREPARE IMAGES */}
      {stage === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Subheading className="text-xl">{t("stage1.title")}</Subheading>
              <LabelText className="text-xs text-slate-500">
                {t("stage1.subtitle", {
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
                  {t("stage1.clearAll")}
                </Button>
                <Button variant="primary" size="sm" onClick={() => setStage(2)}>
                  <span>{t("stage1.createCollage")}</span>
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
              title={t("stage1.dropzoneTitle")}
              subtitle={t("stage1.dropzoneSubtitle", {
                max: MAX_COLLAGE_IMAGES,
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
                  {t("stage1.queueTitle")}
                </Subheading>
                <LabelText className="text-xs text-slate-400">
                  {t("stage1.reorderHelp")}
                </LabelText>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={queueImages.map((i) => i.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {queueImages.map((item, idx) => (
                      <SortableQueueItem key={item.id} id={item.id}>
                        <MediaQueueCard
                          id={item.id}
                          name={item.file.name}
                          sizeBytes={item.file.size}
                          previewUrl={item.previewUrl}
                          indexBadge={idx + 1}
                          onRemove={handleRemoveImage}
                        />
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
          customActions={
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 font-bold px-3 shadow-xs"
              onClick={() => setStage(3)}
            >
              <span>{t("stage2.nextToEdit")}</span>
              <ArrowRight size={14} />
            </Button>
          }
          onSaved={(_template, destination) => {
            if (destination === "fill") {
              setStage(3);
            }
          }}
        />
      )}

      {/* STAGE 3: EDIT & FILL */}
      {stage === 3 && <FillWorkspace template={generatedTemplate} />}
    </div>
  );
}
