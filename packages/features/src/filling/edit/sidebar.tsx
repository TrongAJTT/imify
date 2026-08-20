"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Layers,
  Settings2,
  Ruler,
  ArrowLeftRight,
  Lock,
  Unlock,
} from "lucide-react";

import type {
  CanvasSizePreset,
  CanvasSizeUnit,
  LayerGroup,
  VectorLayer,
  TextLayer,
  ShapeType,
} from "../types";
import { generateId } from "../types";
import {
  generateShapePoints,
  regenerateLayerShapePoints,
} from "../shape-generators";
import { getBoundingBox } from "../vector-math";
import { LayerListPanel } from "../layer-list-panel";
import { LayerPropertiesPanel } from "../layer-properties-panel";
import { ShapePickerDialog } from "../shape-picker-dialog";
import { GroupLayerPanel } from "../group-layer-panel";
import {
  AccordionCard,
  Button,
  CheckboxCard,
  ResizableAccordionCard,
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui";
import { CanvasDimensionControls } from "@imify/features/shared/canvas-dimension-controls";

interface ManualEditorSidebarProps {
  layers: VectorLayer[];
  textLayers?: TextLayer[];
  groups: LayerGroup[];
  canvasWidth: number;
  canvasHeight: number;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  selectedTextLayerId?: string | null;
  onLayersChange: (layers: VectorLayer[]) => void;
  onTextLayersChange?: (textLayers: TextLayer[]) => void;
  onGroupsChange: (groups: LayerGroup[]) => void;
  onCanvasSizeChange: (width: number, height: number) => void;
  onSelectLayer: (id: string | null) => void;
  onSelectTextLayer?: (id: string | null) => void;
  onToggleLayerSelection: (id: string) => void;
  onClearSelection: () => void;
  enableWideSidebarGrid?: boolean;
}


import { useTranslation } from "@imify/i18n";
import {
  ASPECT_RATIO_OPTIONS,
  isSameRatio,
  parseAspectRatio,
  ratioFromDimensions,
} from "@imify/features/shared/use-aspect-ratio";

function synchronizeGroupsWithLayers(
  groups: LayerGroup[],
  layers: VectorLayer[],
): LayerGroup[] {
  const layerIdsByGroup = new Map<string, string[]>();

  for (const layer of layers) {
    if (!layer.groupId) {
      continue;
    }

    const current = layerIdsByGroup.get(layer.groupId) ?? [];
    current.push(layer.id);
    layerIdsByGroup.set(layer.groupId, current);
  }

  return groups
    .map((group) => ({
      ...group,
      layerIds: layerIdsByGroup.get(group.id) ?? [],
      combineAsConvexHull: Boolean(group.combineAsConvexHull),
    }))
    .filter((group) => group.layerIds.length > 0);
}

export function ManualEditorSidebar({
  layers,
  textLayers = [],
  groups,
  canvasWidth,
  canvasHeight,
  selectedLayerId,
  selectedLayerIds,
  selectedTextLayerId = null,
  onLayersChange,
  onTextLayersChange,
  onGroupsChange,
  onCanvasSizeChange,
  onSelectLayer,
  onSelectTextLayer,
  onToggleLayerSelection,
  onClearSelection,
  enableWideSidebarGrid = false,
}: ManualEditorSidebarProps) {
  const { t } = useTranslation("filling");
  const [shapePickerOpen, setShapePickerOpen] = useState(false);
  const [canvasUnit, setCanvasUnit] = useState<CanvasSizeUnit>("px");
  const [canvasDpi, setCanvasDpi] = useState(300);
  const [layersAccordionHeight, setLayersAccordionHeight] = useState(320);

  const selectedLayer = selectedLayerId
    ? layers.find((l) => l.id === selectedLayerId) ?? null
    : null;

  const normalizedGroups = useMemo(
    () => synchronizeGroupsWithLayers(groups, layers),
    [groups, layers],
  );

  const selectedGroup = useMemo(() => {
    if (!selectedLayer?.groupId) {
      return null;
    }

    return (
      normalizedGroups.find((group) => group.id === selectedLayer.groupId) ??
      null
    );
  }, [normalizedGroups, selectedLayer?.groupId]);

  const selectedGroupMembers = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    const memberIdSet = new Set(selectedGroup.layerIds);
    return layers.filter((layer) => memberIdSet.has(layer.id));
  }, [layers, selectedGroup]);

  const groupNamesById = useMemo(
    () =>
      normalizedGroups.reduce<Record<string, string>>((acc, group) => {
        acc[group.id] = group.name;
        return acc;
      }, {}),
    [normalizedGroups],
  );

  const selectedEditableLayers = useMemo(
    () => layers.filter((layer) => selectedLayerIds.includes(layer.id)),
    [layers, selectedLayerIds],
  );

  const selectedSharedGroupId = useMemo(() => {
    if (selectedEditableLayers.length === 0) {
      return null;
    }
    const firstGroupId = selectedEditableLayers[0].groupId ?? null;
    if (!firstGroupId) {
      return null;
    }
    return selectedEditableLayers.every(
      (layer) => layer.groupId === firstGroupId,
    )
      ? firstGroupId
      : null;
  }, [selectedEditableLayers]);

  const handleAddShape = useCallback(
    (type: ShapeType) => {
      const defaultW = Math.min(200, canvasWidth * 0.3);
      const defaultH =
        type === "square" || type === "circle"
          ? defaultW
          : Math.min(150, canvasHeight * 0.3);

      const points = generateShapePoints(type, defaultW, defaultH);
      const bbox = getBoundingBox(points);
      const cx = (canvasWidth - bbox.width) / 2;
      const cy = (canvasHeight - bbox.height) / 2;

      const newLayer: VectorLayer = {
        id: generateId("layer"),
        name: `Layer ${layers.length + 1}`,
        shapeType: type,
        points,
        x: Math.round(cx),
        y: Math.round(cy),
        width: Math.round(defaultW),
        height: Math.round(defaultH),
        rotation: 0,
        locked: false,
        visible: true,
      };

      const updated = [...layers, newLayer];
      onLayersChange(updated);
      onSelectTextLayer?.(null);
      onSelectLayer(newLayer.id);
    },
    [canvasHeight, canvasWidth, layers, onLayersChange, onSelectLayer, onSelectTextLayer],
  );

  const handleAddTextLayer = useCallback(() => {
    const defaultW = Math.min(300, canvasWidth * 0.5);
    const defaultH = Math.min(80, canvasHeight * 0.2);
    const cx = (canvasWidth - defaultW) / 2;
    const cy = (canvasHeight - defaultH) / 2;

    const newTextLayer: TextLayer = {
      id: generateId("text"),
      name: `Text ${textLayers.length + 1}`,
      x: Math.round(cx),
      y: Math.round(cy),
      width: Math.round(defaultW),
      height: Math.round(defaultH),
      rotation: 0,
      locked: false,
      visible: true,
    };

    onTextLayersChange?.([...textLayers, newTextLayer]);
    onClearSelection();
    onSelectTextLayer?.(newTextLayer.id);
  }, [canvasHeight, canvasWidth, onClearSelection, onSelectTextLayer, onTextLayersChange, textLayers]);

  const handleToggleLock = useCallback(
    (id: string) => {
      onLayersChange(
        layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
      );
    },
    [layers, onLayersChange],
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      onLayersChange(
        layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
      );
    },
    [layers, onLayersChange],
  );

  const handleDeleteLayer = useCallback(
    (id: string) => {
      const nextLayers = layers.filter((layer) => layer.id !== id);
      onLayersChange(nextLayers);
      onGroupsChange(synchronizeGroupsWithLayers(groups, nextLayers));

      if (selectedLayerIds.includes(id)) {
        const remainingSelectedIds = selectedLayerIds.filter(
          (selectedId) => selectedId !== id,
        );
        if (remainingSelectedIds.length > 0) {
          onSelectLayer(remainingSelectedIds[remainingSelectedIds.length - 1]);
        } else {
          onClearSelection();
        }
      }
    },
    [
      groups,
      layers,
      selectedLayerIds,
      onClearSelection,
      onGroupsChange,
      onLayersChange,
      onSelectLayer,
    ],
  );

  const handleToggleTextLayerLock = useCallback(
    (id: string) => {
      onTextLayersChange?.(
        textLayers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
      );
    },
    [onTextLayersChange, textLayers],
  );

  const handleToggleTextLayerVisibility = useCallback(
    (id: string) => {
      onTextLayersChange?.(
        textLayers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
      );
    },
    [onTextLayersChange, textLayers],
  );

  const handleDeleteTextLayer = useCallback(
    (id: string) => {
      const nextTextLayers = textLayers.filter((l) => l.id !== id);
      onTextLayersChange?.(nextTextLayers);
      if (selectedTextLayerId === id) {
        onSelectTextLayer?.(null);
      }
    },
    [onSelectTextLayer, onTextLayersChange, selectedTextLayerId, textLayers],
  );


  const handleDragLayer = useCallback(
    (
      from: number,
      to: number,
      activeLayerId: string,
      mergeTargetGroupId: string | null,
      forceUngroupByLeftDrag: boolean,
    ) => {
      const copy = [...layers];
      const activeLayerBeforeDrag = layers.find(
        (layer) => layer.id === activeLayerId,
      );
      const [moved] = copy.splice(from, 1);

      if (!moved) {
        return;
      }

      copy.splice(to, 0, moved);

      const activeGroupId = activeLayerBeforeDrag?.groupId ?? null;
      const shouldUngroup =
        forceUngroupByLeftDrag ||
        (!mergeTargetGroupId && Boolean(activeGroupId));
      const nextGroupId = shouldUngroup
        ? null
        : mergeTargetGroupId ?? activeGroupId;

      if (forceUngroupByLeftDrag && activeGroupId) {
        const movedIndex = copy.findIndex(
          (layer) => layer.id === activeLayerId,
        );
        const otherGroupIndexes = copy
          .map((layer, index) => ({ layer, index }))
          .filter(
            (entry) =>
              entry.layer.groupId === activeGroupId &&
              entry.layer.id !== activeLayerId,
          )
          .map((entry) => entry.index);

        if (movedIndex >= 0 && otherGroupIndexes.length > 0) {
          const groupFirstIndex = Math.min(...otherGroupIndexes);
          const groupLastIndex = Math.max(...otherGroupIndexes);
          const groupCenterIndex = (groupFirstIndex + groupLastIndex) / 2;
          const insertAboveGroup = movedIndex <= groupCenterIndex;
          const targetIndex = insertAboveGroup
            ? groupFirstIndex
            : groupLastIndex + 1;

          const [extracted] = copy.splice(movedIndex, 1);
          const adjustedTargetIndex =
            movedIndex < targetIndex ? targetIndex - 1 : targetIndex;
          copy.splice(adjustedTargetIndex, 0, extracted);
        }
      }

      const nextLayers = copy.map((layer) => {
        if (layer.id !== activeLayerId) {
          return layer;
        }

        if (shouldUngroup) {
          const nextLayer = { ...layer };
          delete nextLayer.groupId;
          return nextLayer;
        }

        if (!nextGroupId) {
          return layer;
        }

        return {
          ...layer,
          groupId: nextGroupId,
        };
      });

      onLayersChange(nextLayers);
      onGroupsChange(synchronizeGroupsWithLayers(groups, nextLayers));
    },
    [groups, layers, onGroupsChange, onLayersChange],
  );

  const handleUngroupSelectedLayer = useCallback(() => {
    if (selectedLayerIds.length === 0) {
      return;
    }

    const selectedSet = new Set(selectedLayerIds);
    let nextLayers = [...layers];
    const groupIdsToProcess = Array.from(
      new Set(
        nextLayers
          .filter((layer) => selectedSet.has(layer.id) && layer.groupId)
          .map((layer) => layer.groupId as string),
      ),
    );

    for (const groupId of groupIdsToProcess) {
      const indexedGroupLayers = nextLayers
        .map((layer, index) => ({ layer, index }))
        .filter((entry) => entry.layer.groupId === groupId);
      if (indexedGroupLayers.length === 0) {
        continue;
      }

      const originalGroupLastIndex =
        indexedGroupLayers[indexedGroupLayers.length - 1].index;
      const movingEntries = indexedGroupLayers.filter((entry) =>
        selectedSet.has(entry.layer.id),
      );
      if (movingEntries.length === 0) {
        continue;
      }

      const movingIds = new Set(movingEntries.map((entry) => entry.layer.id));
      const removedBeforeOrAtLast = movingEntries.filter(
        (entry) => entry.index <= originalGroupLastIndex,
      ).length;
      const insertIndex = Math.max(
        0,
        Math.min(
          nextLayers.length,
          originalGroupLastIndex - removedBeforeOrAtLast + 1,
        ),
      );

      const movingUngroupedLayers = movingEntries.map(({ layer }) => {
        const nextLayer = { ...layer };
        delete nextLayer.groupId;
        return nextLayer;
      });

      const remaining = nextLayers.filter((layer) => !movingIds.has(layer.id));
      nextLayers = [
        ...remaining.slice(0, insertIndex),
        ...movingUngroupedLayers,
        ...remaining.slice(insertIndex),
      ];
    }

    onLayersChange(nextLayers);
    onGroupsChange(synchronizeGroupsWithLayers(groups, nextLayers));
  }, [groups, layers, onGroupsChange, onLayersChange, selectedLayerIds]);

  const handleToggleGroupForSelectedLayer = useCallback(() => {
    if (selectedLayerIds.length === 0) {
      return;
    }

    if (selectedSharedGroupId) {
      handleUngroupSelectedLayer();
      return;
    }

    const selectedSet = new Set(selectedLayerIds);
    const movingLayers = layers.filter((layer) => selectedSet.has(layer.id));
    if (movingLayers.length === 0) {
      return;
    }

    const topSelectedIndex = layers.findIndex((layer) =>
      selectedSet.has(layer.id),
    );
    if (topSelectedIndex < 0) {
      return;
    }

    const insertIndex = layers
      .slice(0, topSelectedIndex)
      .filter((layer) => !selectedSet.has(layer.id)).length;

    const newGroupId = generateId("grp");
    const groupedLayers = movingLayers.map((layer) => ({
      ...layer,
      groupId: newGroupId,
    }));
    const remainingLayers = layers.filter(
      (layer) => !selectedSet.has(layer.id),
    );
    const nextLayers = [
      ...remainingLayers.slice(0, insertIndex),
      ...groupedLayers,
      ...remainingLayers.slice(insertIndex),
    ];

    const nextGroups = synchronizeGroupsWithLayers(
      [
        ...normalizedGroups,
        {
          id: newGroupId,
          name: t("manualEditor.groupDefaultName", {
            index: normalizedGroups.length + 1,
          }),
          layerIds: groupedLayers.map((layer) => layer.id),
          closeLoop: false,
          fillInterior: false,
          combineAsConvexHull: false,
        },
      ],
      nextLayers,
    );

    onLayersChange(nextLayers);
    onGroupsChange(nextGroups);
  }, [
    handleUngroupSelectedLayer,
    layers,
    normalizedGroups,
    onGroupsChange,
    onLayersChange,
    selectedLayerIds,
    selectedSharedGroupId,
  ]);

  const handleToggleCloseLoop = useCallback(
    (checked: boolean) => {
      if (!selectedGroup || selectedGroup.combineAsConvexHull) {
        return;
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              closeLoop: checked,
            }
          : group,
      );

      onGroupsChange(nextGroups);
    },
    [normalizedGroups, onGroupsChange, selectedGroup],
  );

  const handleToggleFillInterior = useCallback(
    (checked: boolean) => {
      if (!selectedGroup || selectedGroup.combineAsConvexHull) {
        return;
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              fillInterior: checked,
            }
          : group,
      );

      onGroupsChange(nextGroups);
    },
    [normalizedGroups, onGroupsChange, selectedGroup],
  );

  const handleRenameGroup = useCallback(
    (name: string) => {
      if (!selectedGroup) {
        return;
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              name,
            }
          : group,
      );

      onGroupsChange(nextGroups);
    },
    [normalizedGroups, onGroupsChange, selectedGroup],
  );

  const handleToggleCombineAsConvexHull = useCallback(
    (checked: boolean) => {
      if (!selectedGroup) {
        return;
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              combineAsConvexHull: checked,
              closeLoop: checked ? false : group.closeLoop,
              fillInterior: checked ? false : group.fillInterior,
            }
          : group,
      );

      onGroupsChange(nextGroups);
    },
    [normalizedGroups, onGroupsChange, selectedGroup],
  );

  const handleUpdateLayer = useCallback(
    (partial: Partial<VectorLayer>) => {
      if (!selectedLayerId) return;
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (!layer) return;

      const needsRegenerate =
        partial.width !== undefined ||
        partial.height !== undefined ||
        partial.shapeType !== undefined;

      let updatedLayer = { ...layer, ...partial };

      if (needsRegenerate) {
        updatedLayer.points = regenerateLayerShapePoints(
          updatedLayer,
          updatedLayer.width,
          updatedLayer.height,
        );
      }

      onLayersChange(
        layers.map((l) => (l.id === selectedLayerId ? updatedLayer : l)),
      );
    },
    [selectedLayerId, layers, onLayersChange],
  );

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "canvas",
      content: (
        <AccordionCard
          icon={<Ruler size={16} />}
          label={t("manualEditor.canvas")}
          sublabel={`${canvasWidth} x ${canvasHeight} px`}
          colorTheme="amber"
          defaultOpen={true}
        >
          <CanvasDimensionControls
            width={canvasWidth}
            height={canvasHeight}
            unit={canvasUnit}
            dpi={canvasDpi}
            onSizeChange={onCanvasSizeChange}
            onUnitChange={setCanvasUnit}
            onDpiChange={setCanvasDpi}
          />
        </AccordionCard>
      ),
    },
    {
      id: "layers",
      content: (
        <ResizableAccordionCard
          icon={<Layers size={16} />}
          label={t("manualEditor.layers")}
          sublabel={
            layers.length === 1
              ? t("templateList.layersCount", { count: 1 })
              : t("templateList.layersCountPlural", { count: layers.length })
          }
          colorTheme="sky"
          height={layersAccordionHeight}
          initialHeight={320}
          onHeightChange={setLayersAccordionHeight}
          minHeight={220}
          maxHeight={640}
          defaultOpen={true}
        >
          <LayerListPanel
            layers={layers}
            textLayers={textLayers}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            selectedTextLayerId={selectedTextLayerId}
            onSelectLayer={(id) => {
              onSelectTextLayer?.(null);
              onSelectLayer(id);
            }}
            onSelectTextLayer={(id) => {
              onClearSelection();
              onSelectTextLayer?.(id);
            }}
            onToggleLayerSelection={(id) => {
              onSelectTextLayer?.(null);
              onToggleLayerSelection(id);
            }}
            onToggleLock={handleToggleLock}
            onToggleVisibility={handleToggleVisibility}
            onDeleteLayer={handleDeleteLayer}
            onToggleTextLayerLock={handleToggleTextLayerLock}
            onToggleTextLayerVisibility={handleToggleTextLayerVisibility}
            onDeleteTextLayer={handleDeleteTextLayer}
            onDragLayer={handleDragLayer}
            onAddShape={() => setShapePickerOpen(true)}
            onToggleGroupForSelected={handleToggleGroupForSelectedLayer}
            canToggleGroupForSelected={selectedLayerIds.length > 0}
            isSelectedLayerGrouped={Boolean(selectedSharedGroupId)}
            groupNamesById={groupNamesById}
          />
        </ResizableAccordionCard>
      ),
    },
    ...(selectedLayer
      ? [
          {
            id: "properties",
            content: (
              <AccordionCard
                icon={<Settings2 size={16} />}
                label={t("manualEditor.properties")}
                sublabel={`${selectedLayer.name || t("manualEditor.layerDefaultName")}`}
                colorTheme="purple"
                defaultOpen={true}
              >
                <LayerPropertiesPanel
                  layer={selectedLayer}
                  onUpdate={handleUpdateLayer}
                />
              </AccordionCard>
            ),
          } satisfies WorkspaceConfigSidebarItem,
        ]
      : []),
    ...(selectedGroup
      ? [
          {
            id: "group",
            content: (
              <GroupLayerPanel
                group={selectedGroup}
                members={selectedGroupMembers}
                onUngroupSelectedLayer={handleUngroupSelectedLayer}
                onRenameGroup={handleRenameGroup}
                onToggleCombineAsConvexHull={handleToggleCombineAsConvexHull}
                onToggleCloseLoop={handleToggleCloseLoop}
                onToggleFillInterior={handleToggleFillInterior}
              />
            ),
          } satisfies WorkspaceConfigSidebarItem,
        ]
      : []),
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
      />

      <ShapePickerDialog
        isOpen={shapePickerOpen}
        onClose={() => setShapePickerOpen(false)}
        onSelect={handleAddShape}
        onSelectTextLayer={handleAddTextLayer}
      />
    </>
  );
}

