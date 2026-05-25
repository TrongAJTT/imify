import React, { useEffect, useMemo, useState } from "react";
import type { FillingTemplate } from "@imify/features/filling/types";
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
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { useFillUiStore } from "@imify/stores/stores/fill-ui-store";
import { FillLayerCard } from "@imify/features/filling/fill/layer-card";
import { FillLayerCustomizationAccordion } from "@imify/features/filling/fill/layer-customization-accordion";
import { FillCanvasAccordion } from "@imify/features/filling/fill/canvas-accordion";
import { SortableFillLayerItem } from "@imify/features/filling/sortable-fill-layer-item";
import { ResizableAccordionCard } from "@imify/ui/ui/resizable-accordion-card";
import { ImagePlus } from "lucide-react";
import {
  buildFillRuntimeItems,
  expandRuntimeOrderToVisibleLayerIds,
  type FillRuntimeItem,
} from "@imify/features/filling/fill/runtime-items";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui/ui/workspace-config-sidebar-panel";
import { PresetSelector } from "@imify/features/processor/preset-selector";
import { useIdentifiedPresetLoader } from "@imify/features/shared/use-identified-preset-loader";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "@imify/features/processor/preset-utils";
import {
  useBatchStore,
  type SavedSetupPreset,
} from "@imify/stores/stores/batch-store";

interface FillSidebarProps {
  template: FillingTemplate;
  enableWideSidebarGrid?: boolean;
}

const FILLING_TARGET_FORMATS = [
  "png",
  "webp",
  "avif",
  "jxl",
  "jpg",
  "bmp",
  "tiff",
];

export function FillSidebar({
  template,
  enableWideSidebarGrid = false,
}: FillSidebarProps) {
  const layerFillStates = useFillingStore((s) => s.layerFillStates);
  const sessionTemplate = useFillUiStore((s) => s.sessionTemplate);
  const initializeFillSession = useFillUiStore((s) => s.initializeFillSession);
  const updateSessionTemplate = useFillUiStore((s) => s.updateSessionTemplate);
  const hiddenLayerIds = useFillUiStore((s) => s.hiddenLayerIds);
  const resetFillSessionState = useFillUiStore((s) => s.resetFillSessionState);
  const [layersAccordionHeight, setLayersAccordionHeight] = useState(320);

  const exportSettings = useFillingStore((s) => s.exportSettings);
  const activePresetId = useFillingStore((s) => s.activePresetId);
  const applyPreset = useFillingStore((s) => s.applyPreset);
  const resetToDefault = useFillingStore((s) => s.resetToDefault);

  const identifiedPresetId = `preset_filling_${template.id}`;
  const identifiedPresetName = `Filling #${template.name}`;
  const identifiedPresetColor = "#06b6d4";

  const fillingIdentifiedPreset: SavedSetupPreset = useMemo(
    () => ({
      ...VIRTUAL_DEFAULT_PNG_PRESET,
      id: identifiedPresetId,
      name: identifiedPresetName,
      highlightColor: identifiedPresetColor,
      config: {
        ...VIRTUAL_DEFAULT_PNG_PRESET.config,
        targetFormat: exportSettings.targetFormat as any,
        quality: exportSettings.quality,
        formatOptions: exportSettings.codecOptions as any,
        fileNamePattern: exportSettings.fileNamePattern,
      },
    }),
    [
      identifiedPresetId,
      identifiedPresetName,
      identifiedPresetColor,
      exportSettings,
    ],
  );

  useIdentifiedPresetLoader(
    fillingIdentifiedPreset,
    activePresetId,
    applyPreset,
  );

  const batchTargetFormat = useBatchStore((s) => s.targetFormat);
  const batchQuality = useBatchStore((s) => s.quality);
  const batchFileNamePattern = useBatchStore((s) => s.fileNamePattern);
  const batchFormatOptions = useBatchStore((s) => s.formatOptions);

  // Sync global batch store changes to local store when in "Custom" mode (activePresetId is null)
  useEffect(() => {
    if (activePresetId === null) {
      applyPreset({
        id: identifiedPresetId,
        name: identifiedPresetName,
        highlightColor: identifiedPresetColor,
        config: {
          ...VIRTUAL_DEFAULT_PNG_PRESET.config,
          targetFormat: batchTargetFormat,
          quality: batchQuality,
          fileNamePattern: batchFileNamePattern,
          formatOptions: batchFormatOptions,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }, [
    activePresetId,
    batchTargetFormat,
    batchQuality,
    batchFileNamePattern,
    batchFormatOptions,
    identifiedPresetId,
    identifiedPresetName,
    identifiedPresetColor,
    applyPreset,
  ]);

  const activeTemplate = useMemo(() => {
    if (sessionTemplate && sessionTemplate.id === template.id)
      return sessionTemplate;
    return template;
  }, [sessionTemplate, template]);

  const hiddenLayerIdSet = useMemo(
    () => new Set(hiddenLayerIds),
    [hiddenLayerIds],
  );

  useEffect(() => {
    initializeFillSession(template);
    return () => resetFillSessionState();
  }, [initializeFillSession, resetFillSessionState, template.id]);

  const runtimeItems = useMemo(
    () => buildFillRuntimeItems(activeTemplate, hiddenLayerIdSet),
    [activeTemplate.layers, activeTemplate.groups, hiddenLayerIdSet],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = runtimeItems.findIndex((item) => item.id === active.id);
    const newIndex = runtimeItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedRuntimeItems = arrayMove(runtimeItems, oldIndex, newIndex);
    const expandedLayerOrder = expandRuntimeOrderToVisibleLayerIds(
      reorderedRuntimeItems.map((item) => item.id),
      runtimeItems,
    );
    const visibleLayerById = new Map(
      activeTemplate.layers
        .filter((layer) => layer.visible && !hiddenLayerIdSet.has(layer.id))
        .map((layer) => [layer.id, layer]),
    );

    let visibleCursor = 0;
    const reorderedLayers = activeTemplate.layers.map((layer) => {
      if (!layer.visible || hiddenLayerIdSet.has(layer.id)) return layer;
      const nextLayerId = expandedLayerOrder[visibleCursor];
      const nextLayer = nextLayerId ? visibleLayerById.get(nextLayerId) : null;
      visibleCursor += 1;
      return nextLayer ?? layer;
    });

    const nextTemplate: FillingTemplate = {
      ...activeTemplate,
      layers: reorderedLayers,
      updatedAt: Date.now(),
    };
    updateSessionTemplate(() => nextTemplate);
  };

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "layers",
      label: "Layers",
      content: (
        <ResizableAccordionCard
          icon={<ImagePlus size={16} />}
          label="Layers"
          sublabel={`${runtimeItems.length} visible`}
          colorTheme="sky"
          defaultOpen={true}
          height={layersAccordionHeight}
          initialHeight={320}
          onHeightChange={setLayersAccordionHeight}
          minHeight={180}
          maxHeight={640}
        >
          <div className="space-y-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={runtimeItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {runtimeItems.map((item: FillRuntimeItem) => {
                  const fillState = layerFillStates.find(
                    (state) => state.layerId === item.id,
                  );
                  return (
                    <SortableFillLayerItem key={item.id} id={item.id}>
                      <FillLayerCard item={item} fillState={fillState} />
                    </SortableFillLayerItem>
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </ResizableAccordionCard>
      ),
    },
    {
      id: "layer-customization",
      label: "Layer Customization",
      content: <FillLayerCustomizationAccordion template={activeTemplate} />,
    },
    { id: "canvas", label: "Canvas", content: <FillCanvasAccordion /> },
    {
      id: "output-settings",
      label: "",
      content: (
        <PresetSelector
          label="Output Settings"
          theme="amber"
          identifiedPreset={fillingIdentifiedPreset}
          formatFilter={FILLING_TARGET_FORMATS}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
          tooltipContent="Select an export preset for Image Filling."
        />
      ),
    },
  ];

  return (
    <WorkspaceConfigSidebarPanel
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
    />
  );
}
