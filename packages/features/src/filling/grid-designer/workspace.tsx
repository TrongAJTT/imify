"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import { ArrowLeft, ChevronDown, Image, Pencil } from "lucide-react";
import {
  Button,
  PreviewInteractionModeToggle,
  ZoomPanControl,
} from "@imify/ui";
import { ControlledPopover } from "@imify/ui/ui/controlled-popover";
import { MutedText, Subheading } from "@imify/ui/ui/typography";
import type { PreviewInteractionMode } from "@imify/ui/ui/preview-interaction-mode-toggle";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { useFillUiStore } from "@imify/stores/stores/fill-ui-store";
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences";
import { useShortcutActions } from "../use-shortcut-actions";
import {
  parseGridDesign,
  generateGridLayers,
  generateGridTemplate,
  canReorderGridRows,
  computeGridRowBounds,
} from "./generator";
import { GridDesignCanvasLayer } from "./canvas-layer";
import { GridRowReorderOverlay } from "./grid-row-reorder-overlay";

import { templateStorage } from "../template-storage";
import type { FillingTemplate } from "../types";
import { DEFAULT_GRID_DESIGN_PARAMS } from "../types";
import { getInitialCanvasHeightPx } from "@imify/core";
import { useTranslation } from "@imify/i18n";
import { useCanvasViewport } from "../../shared/use-canvas-viewport";
import { useCanvasResizer } from "../../shared/use-canvas-resizer";
import {
  CANVAS_PADDING,
  PREVIEW_MAX_ZOOM,
  PREVIEW_MIN_ZOOM,
  PREVIEW_ZOOM_FACTOR,
} from "../config";

// When using mouse wheel, zoom "step" should feel bigger at higher zoom levels.
// Matches DiffChecker's multiplicative approach.

interface GridDesignWorkspaceProps {
  template: FillingTemplate;
  onRefresh: () => Promise<void>;
  onSaved?: (
    template: FillingTemplate,
    destination: "fill" | "edit" | "list",
  ) => void | Promise<void>;
  customActions?: React.ReactNode;
  autoSave?: boolean;
}

export function GridDesignWorkspace({
  template,
  onRefresh,
  onSaved,
  customActions,
  autoSave = false,
}: GridDesignWorkspaceProps) {
  const { t } = useTranslation("filling");
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [previewContainerHeight, setPreviewContainerHeight] = useState(() =>
    getInitialCanvasHeightPx(680),
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
  });

  const params = useFillingStore((state) => state.gridDesignParams);
  const setGridDesignParams = useFillingStore(
    (state) => state.setGridDesignParams,
  );
  const setGridLayerCount = useFillingStore((state) => state.setGridLayerCount);
  const highlightedGridIndex = useFillUiStore(
    (state) => state.highlightedGridIndex,
  );
  const setHighlightedGridIndex = useFillUiStore(
    (state) => state.setHighlightedGridIndex,
  );
  const updateTemplate = useFillingStore((state) => state.updateTemplate);
  const { getShortcutLabel } = useShortcutPreferences();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setGridDesignParams(
      template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS },
    );
  }, [setGridDesignParams, template.gridDesignParams, template.id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setStageSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.max(400, Math.floor(entry.contentRect.height)),
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
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

  const activeParams = params ??
    template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS };
  const parseResult = useMemo(
    () =>
      parseGridDesign(
        activeParams,
        template.canvasWidth,
        template.canvasHeight,
      ),
    [activeParams, template.canvasHeight, template.canvasWidth],
  );

  useEffect(() => {
    setGridLayerCount(parseResult.layoutCells.length);
  }, [parseResult.layoutCells.length, setGridLayerCount]);

  const reorderCheck = useMemo(
    () => canReorderGridRows(parseResult, activeParams),
    [parseResult, activeParams],
  );

  const rowBoundsList = useMemo(
    () =>
      computeGridRowBounds(
        activeParams,
        template.canvasWidth,
        template.canvasHeight,
      ),
    [activeParams, template.canvasWidth, template.canvasHeight],
  );

  const handleReorderRows = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const count = Math.max(1, Math.round(activeParams.rowCount));
      const currentDefs = Array.from(
        { length: count },
        (_, index) => activeParams.rowDefinitions[index] ?? "",
      );

      const item = currentDefs[fromIndex];
      if (item === undefined) return;
      currentDefs.splice(fromIndex, 1);
      currentDefs.splice(toIndex, 0, item);

      setGridDesignParams({
        ...activeParams,
        rowDefinitions: currentDefs,
      });
    },
    [activeParams, setGridDesignParams],
  );

  const fitScale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2;
    const availH = stageSize.height - CANVAS_PADDING * 2;
    return Math.min(
      1,
      availW / template.canvasWidth,
      availH / template.canvasHeight,
    );
  }, [stageSize, template.canvasHeight, template.canvasWidth]);

  const renderScale = fitScale * (previewZoom / 100);
  const offsetX =
    (stageSize.width - template.canvasWidth * renderScale) / 2 + previewPan.x;
  const offsetY =
    (stageSize.height - template.canvasHeight * renderScale) / 2 + previewPan.y;

  const buildUpdatedTemplate = useCallback((): FillingTemplate => {
    const { layers, textLayers } = generateGridTemplate(
      activeParams,
      template.canvasWidth,
      template.canvasHeight,
    );
    return {
      ...template,
      layers,
      textLayers,
      gridDesignParams: activeParams,
      updatedAt: Date.now(),
    };
  }, [activeParams, template]);

  const handleSaveToDestination = useCallback(
    async (destination: "fill" | "edit" | "list") => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        const updated = buildUpdatedTemplate();
        await templateStorage.save(updated);
        updateTemplate(updated);
        await onRefresh();
        if (onSaved) {
          await onSaved(updated, destination);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [buildUpdatedTemplate, isSaving, onRefresh, onSaved, updateTemplate],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const synced = buildUpdatedTemplate();
      updateTemplate(synced);
      if (autoSave && !customActions) {
        void templateStorage.save(synced);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [autoSave, buildUpdatedTemplate, customActions, updateTemplate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Subheading>{t("dialog.gridTitle")}</Subheading>
          <MutedText className="mt-0.5 text-xs truncate">
            {parseResult.layoutCells.length === 1
              ? t("gridDesigner.cellsGenerated", { count: 1 })
              : t("gridDesigner.cellsGeneratedPlural", {
                  count: parseResult.layoutCells.length,
                })}{" "}
            &middot; {template.canvasWidth} x {template.canvasHeight} px
          </MutedText>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PreviewInteractionModeToggle
            mode={previewInteractionMode}
            onChange={setPreviewInteractionMode}
            zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
            panKeyHint={getShortcutLabel("global.preview.pan_mode")}
            idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
          />
          {customActions !== undefined ? (
            customActions
          ) : (
            <div className="flex items-center">
              <Button
                variant="primary"
                size="sm"
                disabled={isSaving}
                className="rounded-r-none px-2"
                onClick={() => void handleSaveToDestination("fill")}
              >
                <Image size={14} />
                {t("gridDesigner.saveFill")}
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
                    disabled={isSaving}
                    className="rounded-l-none border-l border-sky-400/60 px-2"
                  >
                    <ChevronDown size={14} />
                  </Button>
                }
                contentClassName="z-[9999] min-w-[170px] rounded-md border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                closeOnContentClick
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => void handleSaveToDestination("edit")}
                >
                  <Pencil size={14} />
                  {t("gridDesigner.saveEdit")}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => void handleSaveToDestination("list")}
                >
                  <ArrowLeft size={14} />
                  {t("gridDesigner.saveBack")}
                </button>
              </ControlledPopover>
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 select-none touch-none"
        style={{ height: `${previewContainerHeight}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Stage ref={stageRef} width={stageSize.width} height={stageSize.height}>
          <GridDesignCanvasLayer
            canvasWidth={template.canvasWidth}
            canvasHeight={template.canvasHeight}
            offsetX={offsetX}
            offsetY={offsetY}
            renderScale={renderScale}
            cells={parseResult.layoutCells}
            direction={activeParams.direction ?? "rows"}
            highlightedIndex={highlightedGridIndex}
          />
        </Stage>
        <GridRowReorderOverlay
          boundsList={rowBoundsList}
          direction={activeParams.direction ?? "rows"}
          renderScale={renderScale}
          offsetX={offsetX}
          offsetY={offsetY}
          canvasWidth={template.canvasWidth}
          canvasHeight={template.canvasHeight}
          enabled={reorderCheck.allowed && !isViewportPanning}
          onReorder={handleReorderRows}
          onHoverRowChange={setHighlightedGridIndex}
        />
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
          aria-label="Resize grid designer preview height"
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
