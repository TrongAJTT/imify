"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Group,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import {
  ArrowLeft,
  ChevronDown,
  Image,
  Loader2,
  MousePointerSquareDashed,
  Save,
} from "lucide-react";
import type { LayerGroup, TextLayer, VectorLayer } from "../types";
import { resolveLayerShapePoints } from "../shape-generators";
import {
  buildGroupOverlayPolygons,
  getBoundsFromPoints,
  toWorldLayerPoints,
} from "../group-geometry";
import { flattenPoints } from "../vector-math";
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences";
import { isShortcutEventFromEditableTarget } from "@imify/stores/shortcuts";
import { useShortcutActions } from "../use-shortcut-actions";
import { useTransformGuides, type RectBounds } from "../use-transform-guides";
import {
  Button,
  MutedText,
  PreviewInteractionModeToggle,
  Subheading,
  VisualHelpTooltip,
  ZoomPanControl,
} from "@imify/ui";
import { useCanvasResizer } from "../../shared/use-canvas-resizer";
import { useCanvasViewport } from "../../shared/use-canvas-viewport";
import { TriggerButton, useTriggerState } from "../../shared/trigger-button";
import { ControlledPopover } from "@imify/ui/ui/controlled-popover";
import type { PreviewInteractionMode } from "@imify/ui/ui/preview-interaction-mode-toggle";
import { useTranslation } from "@imify/i18n";
import { getInitialCanvasHeightPx } from "@imify/core";
import {
  PREVIEW_MIN_ZOOM,
  PREVIEW_MAX_ZOOM,
  CANVAS_PADDING,
  PREVIEW_ZOOM_FACTOR,
} from "../config";

export interface ManualEditorVisualHelp {
  label: string;
  description: string;
  webmSrc: string;
  buttonAriaLabel: string;
  mediaAlt: string;
}

interface ManualEditorWorkspaceProps {
  canvasWidth: number;
  canvasHeight: number;
  groups: LayerGroup[];
  layers: VectorLayer[];
  textLayers?: TextLayer[];
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  selectedTextLayerId?: string | null;
  onSelectLayer: (id: string | null) => void;
  onSelectTextLayer?: (id: string | null) => void;
  onToggleLayerSelection: (id: string) => void;
  onSetSelectedLayers: (ids: string[]) => void;
  onClearSelection: () => void;
  onUpdateLayer: (id: string, partial: Partial<VectorLayer>) => void;
  onUpdateTextLayer?: (id: string, partial: Partial<TextLayer>) => void;
  onToggleGroupForSelected?: () => void;
  onSaveTemplate: (destination: "fill" | "list") => Promise<void>;
  isSavingTemplate: boolean;
  visualHelp?: ManualEditorVisualHelp;
  showHeader?: boolean;
}

export function ManualEditorWorkspace({
  canvasWidth,
  canvasHeight,
  groups,
  layers,
  textLayers = [],
  selectedLayerId,
  selectedLayerIds,
  selectedTextLayerId = null,
  onSelectLayer,
  onSelectTextLayer,
  onToggleLayerSelection,
  onSetSelectedLayers,
  onClearSelection,
  onUpdateLayer,
  onUpdateTextLayer,
  onToggleGroupForSelected,
  onSaveTemplate,
  isSavingTemplate,
  visualHelp,
  showHeader = true,
}: ManualEditorWorkspaceProps) {
  const { t } = useTranslation("filling");
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const ignoreNextStageClickRef = useRef(false);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [previewContainerHeight, setPreviewContainerHeight] = useState(() =>
    getInitialCanvasHeightPx(520),
  );
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const {
    isResizing: isResizingPreview,
    handleResizeStart: handlePreviewResizeStart,
  } = useCanvasResizer({
    containerRef,
    onHeightChange: setPreviewContainerHeight,
    minHeight: 320,
  });
  const [previewInteractionMode, setPreviewInteractionMode] =
    useState<PreviewInteractionMode>("zoom");

  const selectTriggerState = useTriggerState({
    mode: "double_tap",
  });

  const {
    isPanning: isViewportPanning,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useCanvasViewport({
    zoom: previewZoom,
    panX: previewPan.x,
    panY: previewPan.y,
    onZoomChange: setPreviewZoom,
    onPanChange: (x, y) => setPreviewPan({ x, y }),
    interactionMode: previewInteractionMode,
    minZoom: PREVIEW_MIN_ZOOM,
    maxZoom: PREVIEW_MAX_ZOOM,
    zoomFactor: PREVIEW_ZOOM_FACTOR,
    containerRef,
    allowDragInZoomMode: !selectTriggerState.active,
    shouldStartPan: () => {
      if (selectTriggerState.active) return false;
      const stage = stageRef.current;
      if (!stage) return true;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return true;
      const hitShape = stage.getIntersection(pointerPos);
      if (hitShape) {
        return false;
      }
      return true;
    },
  });

  const [isFreeAspectRatio, setIsFreeAspectRatio] = useState(false);
  const [cursor, setCursor] = useState("default");
  const [rotationGuideLine, setRotationGuideLine] = useState<number[] | null>(
    null,
  );
  const [positionGuideLines, setPositionGuideLines] = useState<number[][]>([]);
  const [selectionBoxStart, setSelectionBoxStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionBoxRect, setSelectionBoxRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const { getShortcutLabel } = useShortcutPreferences();
  const {
    rotationSnapAngles,
    getSnappedRotation,
    buildRotationGuideLine,
    snapRectPosition,
  } = useTransformGuides({
    rotationStep: 45,
    rotationTolerance: 4,
    positionTolerance: 8,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEventFromEditableTarget(e)) return;

      // Group / Ungroup shortcut: Ctrl+G / Cmd+G
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "g" || e.key === "G") &&
        !e.shiftKey &&
        !e.altKey
      ) {
        if (selectedLayerIds.length > 0 && onToggleGroupForSelected) {
          e.preventDefault();
          onToggleGroupForSelected();
          return;
        }
      }

      // Arrow keys movement
      const isArrowKey =
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight";

      if (!isArrowKey) return;

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;

      // 1. If a text layer is selected
      if (selectedTextLayerId && onUpdateTextLayer) {
        const textLayer = textLayers.find((l) => l.id === selectedTextLayerId);
        if (textLayer && !textLayer.locked) {
          e.preventDefault();
          onUpdateTextLayer(selectedTextLayerId, {
            x: Math.round((textLayer.x + dx) * 100) / 100,
            y: Math.round((textLayer.y + dy) * 100) / 100,
          });
          return;
        }
      }

      // 2. If shape layers are selected
      if (selectedLayerIds.length > 0) {
        e.preventDefault();
        for (const layerId of selectedLayerIds) {
          const layer = layers.find((l) => l.id === layerId);
          if (layer && !layer.locked) {
            onUpdateLayer(layerId, {
              x: Math.round((layer.x + dx) * 100) / 100,
              y: Math.round((layer.y + dy) * 100) / 100,
            });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    layers,
    onToggleGroupForSelected,
    onUpdateLayer,
    onUpdateTextLayer,
    selectedLayerIds,
    selectedTextLayerId,
    textLayers,
  ]);

  const clampPreviewZoom = useCallback((value: number) => {
    return Math.max(
      PREVIEW_MIN_ZOOM,
      Math.min(PREVIEW_MAX_ZOOM, Math.round(value)),
    );
  }, []);

  useShortcutActions([
    {
      actionId: "global.preview.zoom_mode",
      handler: () => setPreviewInteractionMode("zoom"),
    },
    {
      actionId: "global.preview.pan_mode",
      handler: () => setPreviewInteractionMode("pan"),
    },
    {
      actionId: "global.preview.idle_mode",
      handler: () => setPreviewInteractionMode("idle"),
    },
  ]);

  const fitScale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2;
    const availH = stageSize.height - CANVAS_PADDING * 2;
    return Math.min(1, availW / canvasWidth, availH / canvasHeight);
  }, [canvasHeight, canvasWidth, stageSize]);

  const renderScale = fitScale * (previewZoom / 100);
  const offsetX =
    (stageSize.width - canvasWidth * renderScale) / 2 + previewPan.x;
  const offsetY =
    (stageSize.height - canvasHeight * renderScale) / 2 + previewPan.y;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setStageSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.max(320, Math.floor(entry.contentRect.height)),
      });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      setIsFreeAspectRatio(true);
      transformerRef.current?.keepRatio(false);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.ctrlKey) return;
      setIsFreeAspectRatio(false);
      transformerRef.current?.keepRatio(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (selectedLayerId) {
      const node = stage.findOne(`#layer-${selectedLayerId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    if (selectedTextLayerId) {
      const node = stage.findOne(`#text-layer-${selectedTextLayerId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedLayerId, selectedTextLayerId, layers, textLayers]);

  const toWorldPoint = useCallback(
    (pointer: { x: number; y: number }) => ({
      x: (pointer.x - offsetX) / renderScale,
      y: (pointer.y - offsetY) / renderScale,
    }),
    [offsetX, renderScale],
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      if (ignoreNextStageClickRef.current) {
        ignoreNextStageClickRef.current = false;
        return;
      }
      if (e.target === e.target.getStage()) {
        onClearSelection();
        setRotationGuideLine(null);
        setPositionGuideLines([]);
      }
    },
    [onClearSelection],
  );

  const handleStagePointerDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) => {
      if (!selectTriggerState.active) return;
      if (e.target !== e.target.getStage() || selectedLayerIds.length > 0)
        return;
      const pointer = e.target.getStage()?.getPointerPosition();
      if (!pointer) return;
      const start = toWorldPoint(pointer);
      setSelectionBoxStart(start);
      setSelectionBoxRect({ x: start.x, y: start.y, width: 0, height: 0 });
    },
    [selectTriggerState.active, selectedLayerIds.length, toWorldPoint],
  );

  const handleStagePointerMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) => {
      if (!selectTriggerState.active || !selectionBoxStart) return;
      const pointer = e.target.getStage()?.getPointerPosition();
      if (!pointer) return;
      const current = toWorldPoint(pointer);
      setSelectionBoxRect({
        x: Math.min(selectionBoxStart.x, current.x),
        y: Math.min(selectionBoxStart.y, current.y),
        width: Math.abs(current.x - selectionBoxStart.x),
        height: Math.abs(current.y - selectionBoxStart.y),
      });
    },
    [selectTriggerState.active, selectionBoxStart, toWorldPoint],
  );

  const handleStagePointerUp = useCallback(() => {
    if (!selectionBoxStart || !selectionBoxRect) return;
    const hasDraggedSelectionBox =
      selectionBoxRect.width > 2 || selectionBoxRect.height > 2;
    if (hasDraggedSelectionBox) {
      const rectRight = selectionBoxRect.x + selectionBoxRect.width;
      const rectBottom = selectionBoxRect.y + selectionBoxRect.height;
      const selectedIds = layers
        .filter((layer) => layer.visible)
        .filter((layer) => {
          const bounds = getBoundsFromPoints(toWorldLayerPoints(layer));
          return (
            bounds.x >= selectionBoxRect.x &&
            bounds.y >= selectionBoxRect.y &&
            bounds.x + bounds.width <= rectRight &&
            bounds.y + bounds.height <= rectBottom
          );
        })
        .map((layer) => layer.id);
      onSetSelectedLayers(selectedIds);
    }
    ignoreNextStageClickRef.current = hasDraggedSelectionBox;
    setSelectionBoxStart(null);
    setSelectionBoxRect(null);

    if (hasDraggedSelectionBox || selectTriggerState.active) {
      selectTriggerState.consume();
    }
  }, [
    layers,
    onSetSelectedLayers,
    selectTriggerState,
    selectionBoxRect,
    selectionBoxStart,
  ]);

  const handleDragEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      onUpdateLayer(layerId, {
        x: Math.round(((node.x() - offsetX) / renderScale) * 100) / 100,
        y: Math.round(((node.y() - offsetY) / renderScale) * 100) / 100,
      });
      setPositionGuideLines([]);
      setCursor("grab");
    },
    [offsetX, offsetY, onUpdateLayer, renderScale],
  );

  const handleDragMove = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const layer = layers.find((candidate) => candidate.id === layerId);
      if (!layer) return;
      const draftLayer: VectorLayer = {
        ...layer,
        x: (node.x() - offsetX) / renderScale,
        y: (node.y() - offsetY) / renderScale,
      };
      const movingBounds = getBoundsFromPoints(toWorldLayerPoints(draftLayer));
      const candidateBounds: RectBounds[] = [
        ...layers
          .filter((candidate) => candidate.id !== layerId && candidate.visible)
          .map((candidate) =>
            getBoundsFromPoints(toWorldLayerPoints(candidate)),
          ),
        ...textLayers
          .filter((candidate) => candidate.visible)
          .map((candidate) => ({
            x: candidate.x,
            y: candidate.y,
            width: candidate.width,
            height: candidate.height,
          })),
      ];
      const { snappedRect, guides } = snapRectPosition({
        movingRect: movingBounds,
        candidateRects: candidateBounds,
        canvasRect: {
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        } as RectBounds,
      });
      const deltaX = snappedRect.x - movingBounds.x;
      const deltaY = snappedRect.y - movingBounds.y;
      if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
        node.x(node.x() + deltaX * renderScale);
        node.y(node.y() + deltaY * renderScale);
      }
      const stageGuides = guides.map((guide) => {
        if (guide.orientation === "vertical") {
          const x = offsetX + guide.value * renderScale;
          return [x, offsetY, x, offsetY + canvasHeight * renderScale];
        }
        const y = offsetY + guide.value * renderScale;
        return [offsetX, y, offsetX + canvasWidth * renderScale, y];
      });
      setPositionGuideLines(stageGuides);
    },
    [
      canvasHeight,
      canvasWidth,
      layers,
      textLayers,
      offsetX,
      offsetY,
      renderScale,
      snapRectPosition,
    ],
  );

  const handleTextLayerDragMove = useCallback(
    (textLayerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const textLayer = textLayers.find(
        (candidate) => candidate.id === textLayerId,
      );
      if (!textLayer) return;
      const movingBounds: RectBounds = {
        x: (node.x() - offsetX) / renderScale,
        y: (node.y() - offsetY) / renderScale,
        width: textLayer.width,
        height: textLayer.height,
      };
      const candidateBounds: RectBounds[] = [
        ...layers
          .filter((candidate) => candidate.visible)
          .map((candidate) =>
            getBoundsFromPoints(toWorldLayerPoints(candidate)),
          ),
        ...textLayers
          .filter(
            (candidate) => candidate.id !== textLayerId && candidate.visible,
          )
          .map((candidate) => ({
            x: candidate.x,
            y: candidate.y,
            width: candidate.width,
            height: candidate.height,
          })),
      ];
      const { snappedRect, guides } = snapRectPosition({
        movingRect: movingBounds,
        candidateRects: candidateBounds,
        canvasRect: {
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        } as RectBounds,
      });
      const deltaX = snappedRect.x - movingBounds.x;
      const deltaY = snappedRect.y - movingBounds.y;
      if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
        node.x(node.x() + deltaX * renderScale);
        node.y(node.y() + deltaY * renderScale);
      }
      const stageGuides = guides.map((guide) => {
        if (guide.orientation === "vertical") {
          const x = offsetX + guide.value * renderScale;
          return [x, offsetY, x, offsetY + canvasHeight * renderScale];
        }
        const y = offsetY + guide.value * renderScale;
        return [offsetX, y, offsetX + canvasWidth * renderScale, y];
      });
      setPositionGuideLines(stageGuides);
    },
    [
      canvasHeight,
      canvasWidth,
      layers,
      textLayers,
      offsetX,
      offsetY,
      renderScale,
      snapRectPosition,
    ],
  );

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const snappedRotation = getSnappedRotation(node.rotation());
      if (!snappedRotation.snapped) {
        setRotationGuideLine(null);
        return;
      }
      node.rotation(snappedRotation.rotation);
      const clientRect = node.getClientRect();
      const centerX = clientRect.x + clientRect.width / 2;
      const centerY = clientRect.y + clientRect.height / 2;
      const guideLength = Math.max(canvasWidth, canvasHeight) * renderScale;
      setRotationGuideLine(
        buildRotationGuideLine(
          centerX,
          centerY,
          snappedRotation.snapAngle ?? snappedRotation.rotation,
          guideLength,
        ),
      );
    },
    [
      buildRotationGuideLine,
      canvasHeight,
      canvasWidth,
      getSnappedRotation,
      renderScale,
    ],
  );

  const handleTransformEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleXNode = node.scaleX();
      const scaleYNode = node.scaleY();
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;
      onUpdateLayer(layerId, {
        x: Math.round(((node.x() - offsetX) / renderScale) * 100) / 100,
        y: Math.round(((node.y() - offsetY) / renderScale) * 100) / 100,
        width: Math.round(Math.abs(layer.width * scaleXNode)),
        height: Math.round(Math.abs(layer.height * scaleYNode)),
        rotation: Math.round(node.rotation() * 100) / 100,
      });
      node.scaleX(1);
      node.scaleY(1);
      setRotationGuideLine(null);
      setPositionGuideLines([]);
      setCursor("default");
    },
    [layers, offsetX, offsetY, onUpdateLayer, renderScale],
  );

  const handleTextLayerDragEnd = useCallback(
    (textLayerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      onUpdateTextLayer?.(textLayerId, {
        x: Math.round(((node.x() - offsetX) / renderScale) * 100) / 100,
        y: Math.round(((node.y() - offsetY) / renderScale) * 100) / 100,
      });
      setPositionGuideLines([]);
      setCursor("grab");
    },
    [offsetX, offsetY, onUpdateTextLayer, renderScale],
  );

  const handleTextLayerTransformEnd = useCallback(
    (textLayerId: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleXNode = node.scaleX();
      const scaleYNode = node.scaleY();
      const textLayer = textLayers.find((l) => l.id === textLayerId);
      if (!textLayer) return;
      onUpdateTextLayer?.(textLayerId, {
        x: Math.round(((node.x() - offsetX) / renderScale) * 100) / 100,
        y: Math.round(((node.y() - offsetY) / renderScale) * 100) / 100,
        width: Math.round(Math.abs(textLayer.width * scaleXNode)),
        height: Math.round(Math.abs(textLayer.height * scaleYNode)),
        rotation: Math.round(node.rotation() * 100) / 100,
      });
      node.scaleX(1);
      node.scaleY(1);
      setRotationGuideLine(null);
      setPositionGuideLines([]);
      setCursor("default");
    },
    [textLayers, offsetX, offsetY, onUpdateTextLayer, renderScale],
  );

  const groupConnectionOverlays = useMemo(
    () => groups.flatMap((group) => buildGroupOverlayPolygons(group, layers)),
    [groups, layers],
  );

  return (
    <div className="space-y-4">
      {showHeader ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Subheading>{t("dialog.manualTitle")}</Subheading>
              {visualHelp ? (
                <VisualHelpTooltip
                  label={t("tooltips.selectionHelpLabel")}
                  description={t("tooltips.selectionHelpDesc")}
                  webmSrc={visualHelp.webmSrc}
                  buttonAriaLabel={t("tooltips.selectionHelpAria")}
                  mediaAlt={t("tooltips.selectionHelpMediaAlt")}
                />
              ) : null}
            </div>
            <MutedText className="text-xs mt-0.5 truncate">
              {canvasWidth} x {canvasHeight} px &middot;{" "}
              {layers.length === 1
                ? t("templateList.layersCount", { count: 1 })
                : t("templateList.layersCountPlural", { count: layers.length })}
            </MutedText>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PreviewInteractionModeToggle
              mode={previewInteractionMode}
              onChange={setPreviewInteractionMode}
              zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
              panKeyHint={getShortcutLabel("global.preview.pan_mode")}
              idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
            />
            <TriggerButton
              state={selectTriggerState}
              mode="double_tap"
              icon={<MousePointerSquareDashed size={14} />}
              label={t("manualEditor.boxSelect", "Box Select")}
              size="md"
            />
            <div className="flex items-center">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  void onSaveTemplate("fill");
                }}
                disabled={isSavingTemplate}
                className="rounded-r-none px-2"
              >
                {isSavingTemplate ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t("manualEditor.saving")}
                  </>
                ) : (
                  <>
                    <Image size={14} />
                    {t("gridDesigner.saveFill")}
                  </>
                )}
              </Button>
              <ControlledPopover
                preset="dropdown"
                side="bottom"
                align="end"
                sideOffset={6}
                collisionPadding={10}
                trigger={
                  <Button
                    variant="primary"
                    size="sm"
                    aria-label="Open save actions"
                    disabled={isSavingTemplate}
                    className="rounded-l-none border-l border-sky-400/60 px-2"
                  >
                    <ChevronDown size={14} />
                  </Button>
                }
                contentClassName="z-[9999] min-w-[190px] rounded-md border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                closeOnContentClick
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    void onSaveTemplate("list");
                  }}
                >
                  <ArrowLeft size={14} />
                  {t("gridDesigner.saveBack")}
                </button>
              </ControlledPopover>
            </div>
          </div>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="relative w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden select-none touch-none"
        style={{ height: `${previewContainerHeight}px`, cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onPointerDown={handleStagePointerDown}
          onPointerUp={handleStagePointerUp}
          onPointerMove={handleStagePointerMove}
          onTouchStart={handleStagePointerDown}
          onTouchMove={handleStagePointerMove}
          onTouchEnd={handleStagePointerUp}
          onMouseMove={(e) => {
            handleStagePointerMove(e);

            if (selectTriggerState.active) {
              setCursor("crosshair");
              return;
            }

            if (isViewportPanning) {
              setCursor("grabbing");
              return;
            }

            if (previewInteractionMode === "pan") {
              const isPointerDown = (e.evt as PointerEvent).buttons === 1;
              setCursor(isPointerDown ? "grabbing" : "grab");
              return;
            }

            const targetName = e.target.name();
            if (targetName.includes("rotater")) {
              setCursor("crosshair");
              return;
            }
            if (targetName.includes("manual-layer-shape")) {
              const isPointerDown = (e.evt as PointerEvent).buttons === 1;
              setCursor(isPointerDown ? "grabbing" : "grab");
              return;
            }
            setCursor("default");
          }}
          onMouseLeave={() => setCursor("default")}
        >
          <Layer>
            <Rect
              x={offsetX}
              y={offsetY}
              width={canvasWidth * renderScale}
              height={canvasHeight * renderScale}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={1}
              listening={false}
            />
            {positionGuideLines.map((points, index) => (
              <Line
                key={`manual-position-guide-${index}`}
                points={points}
                stroke="rgba(14, 165, 233, 0.9)"
                strokeWidth={1.2}
                dash={[6, 6]}
                listening={false}
                perfectDrawEnabled={false}
              />
            ))}
            {rotationGuideLine ? (
              <Line
                key="manual-rotation-guide"
                points={rotationGuideLine}
                stroke="rgba(14, 165, 233, 0.9)"
                strokeWidth={1.5}
                dash={[10, 6]}
                listening={false}
                perfectDrawEnabled={false}
              />
            ) : null}
            {groupConnectionOverlays.map((overlay) => {
              const scaledPoints = flattenPoints(overlay.points).map(
                (value, index) =>
                  value * renderScale + (index % 2 === 0 ? offsetX : offsetY),
              );
              const isInterior = overlay.type === "interior";
              const isCombinedHull = overlay.type === "combined-hull";
              return (
                <Line
                  key={overlay.id}
                  name="manual-group-overlay"
                  points={scaledPoints}
                  closed
                  fill={
                    isCombinedHull
                      ? "rgba(245, 158, 11, 0.18)"
                      : isInterior
                        ? "rgba(250, 204, 21, 0.28)"
                        : "rgba(250, 204, 21, 0.06)"
                  }
                  stroke={
                    isCombinedHull
                      ? "rgba(194, 65, 12, 0.95)"
                      : isInterior
                        ? "rgba(217, 119, 6, 0.95)"
                        : "rgba(217, 119, 6, 0.82)"
                  }
                  strokeWidth={isCombinedHull ? 2 : isInterior ? 1.8 : 1.4}
                  dash={isInterior || isCombinedHull ? undefined : [6, 4]}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              );
            })}
            {layers.map((layer) => {
              if (!layer.visible) return null;
              const flat = flattenPoints(resolveLayerShapePoints(layer));
              const scaledFlat = flat.map((value) => value * renderScale);
              return (
                <Line
                  key={layer.id}
                  id={`layer-${layer.id}`}
                  name="manual-layer-shape"
                  points={scaledFlat}
                  x={offsetX + layer.x * renderScale}
                  y={offsetY + layer.y * renderScale}
                  rotation={layer.rotation}
                  closed
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke={
                    selectedLayerIds.includes(layer.id) ? "#3b82f6" : "#94a3b8"
                  }
                  strokeWidth={selectedLayerIds.includes(layer.id) ? 2 : 1}
                  draggable={!layer.locked}
                  onClick={(event) => {
                    if (event.evt.ctrlKey || event.evt.metaKey) {
                      onToggleLayerSelection(layer.id);
                      return;
                    }
                    onSelectLayer(layer.id);
                  }}
                  onTap={() => onSelectLayer(layer.id)}
                  onMouseEnter={() =>
                    setCursor(layer.locked ? "not-allowed" : "grab")
                  }
                  onMouseLeave={() => setCursor("default")}
                  onDragStart={() => {
                    setPositionGuideLines([]);
                    setRotationGuideLine(null);
                    setCursor("grabbing");
                  }}
                  onDragMove={(e) => handleDragMove(layer.id, e)}
                  onDragEnd={(e) => handleDragEnd(layer.id, e)}
                  onTransformStart={() => {
                    setPositionGuideLines([]);
                    setRotationGuideLine(null);
                    setCursor("grabbing");
                  }}
                  onTransform={handleTransform}
                  onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
                />
              );
            })}
            {textLayers.map((tLayer) => {
              if (!tLayer.visible) return null;
              const isSelected = selectedTextLayerId === tLayer.id;
              const w = tLayer.width * renderScale;
              const h = tLayer.height * renderScale;
              return (
                <Group
                  key={tLayer.id}
                  id={`text-layer-${tLayer.id}`}
                  name="manual-text-layer"
                  x={offsetX + tLayer.x * renderScale}
                  y={offsetY + tLayer.y * renderScale}
                  rotation={tLayer.rotation}
                  draggable={!tLayer.locked}
                  onClick={() => {
                    onClearSelection();
                    onSelectTextLayer?.(tLayer.id);
                  }}
                  onTap={() => {
                    onClearSelection();
                    onSelectTextLayer?.(tLayer.id);
                  }}
                  onMouseEnter={() =>
                    setCursor(tLayer.locked ? "not-allowed" : "grab")
                  }
                  onMouseLeave={() => setCursor("default")}
                  onDragStart={() => {
                    setPositionGuideLines([]);
                    setRotationGuideLine(null);
                    setCursor("grabbing");
                  }}
                  onDragMove={(e) => handleTextLayerDragMove(tLayer.id, e)}
                  onDragEnd={(e) => handleTextLayerDragEnd(tLayer.id, e)}
                  onTransformStart={() => {
                    setPositionGuideLines([]);
                    setRotationGuideLine(null);
                    setCursor("grabbing");
                  }}
                  onTransform={handleTransform}
                  onTransformEnd={(e) =>
                    handleTextLayerTransformEnd(tLayer.id, e)
                  }
                >
                  <Rect
                    width={w}
                    height={h}
                    fill={
                      isSelected
                        ? "rgba(147, 51, 234, 0.18)"
                        : "rgba(147, 51, 234, 0.08)"
                    }
                    stroke={isSelected ? "#9333ea" : "#c084fc"}
                    strokeWidth={isSelected ? 2 : 1.2}
                    dash={[6, 4]}
                    cornerRadius={4}
                  />
                  <Text
                    text={tLayer.name || "Text Layer"}
                    width={w}
                    height={h}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.max(
                      10,
                      Math.min(18 * renderScale, h * 0.45),
                    )}
                    fontFamily="sans-serif"
                    fontStyle="bold"
                    fill={isSelected ? "#7e22ce" : "#9333ea"}
                    padding={4}
                    listening={false}
                  />
                </Group>
              );
            })}
            {selectionBoxRect ? (
              <Rect
                x={offsetX + selectionBoxRect.x * renderScale}
                y={offsetY + selectionBoxRect.y * renderScale}
                width={selectionBoxRect.width * renderScale}
                height={selectionBoxRect.height * renderScale}
                fill="rgba(14, 165, 233, 0.12)"
                stroke="rgba(14, 165, 233, 0.85)"
                strokeWidth={1}
                dash={[6, 4]}
                listening={false}
              />
            ) : null}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio={!isFreeAspectRatio}
              rotationSnaps={rotationSnapAngles}
              rotationSnapTolerance={4}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              boundBoxFunc={(oldBox, newBox) =>
                Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10
                  ? oldBox
                  : newBox
              }
            />
          </Layer>
        </Stage>
        <ZoomPanControl
          zoom={previewZoom}
          panX={previewPan.x}
          panY={previewPan.y}
          onZoomChange={setPreviewZoom}
          onPanChange={(x, y) => setPreviewPan({ x, y })}
          minZoom={PREVIEW_MIN_ZOOM}
          maxZoom={PREVIEW_MAX_ZOOM}
        />
        <div
          onPointerDown={handlePreviewResizeStart}
          className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors z-20 ${
            isResizingPreview ? "bg-sky-400 dark:bg-sky-500" : ""
          }`}
          style={{ cursor: "ns-resize", touchAction: "none" }}
          role="separator"
          aria-label="Resize manual preview height"
        >
          <div
            className={`absolute inset-x-0 bottom-0 h-1 transition-colors ${
              isResizingPreview ? "bg-sky-500" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
}
