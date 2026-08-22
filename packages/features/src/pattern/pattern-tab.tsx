import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Save } from "lucide-react";
import { useCanvasResizer } from "../shared/use-canvas-resizer";
import { useCanvasViewport } from "../shared/use-canvas-viewport";

import { Subheading, MutedText } from "@imify/ui";
import { toUserFacingConversionError } from "@imify/core/error-utils";
import type { ConversionProgressPayload } from "@imify/core/types";
import { renderPatternToContext } from "@imify/features/pattern/pattern-renderer";
import { mapQuickExportToEngineConfig } from "@imify/core";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { toast } from "@imify/stores";
import { useShortcutActions } from "../filling/use-shortcut-actions";
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences";
import { Button } from "@imify/ui";
import { ZoomPanControl } from "@imify/ui";
import { exportPatternComposition } from "./pattern-export-utils";
import {
  PreviewInteractionModeToggle,
  type PreviewInteractionMode,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import {
  PREVIEW_MIN_ZOOM,
  PREVIEW_MAX_ZOOM,
  PREVIEW_PADDING,
  PREVIEW_ZOOM_FACTOR,
} from "./config";

const PatternBoundaryVisualOverlay = lazy(() =>
  import("./pattern-boundary-visual-overlay").then((module) => ({
    default: module.PatternBoundaryVisualOverlay,
  })),
);

// When using mouse wheel, zoom "step" should feel bigger at higher zoom levels.

function closeBitmapMap(map: Map<string, ImageBitmap>): void {
  for (const bitmap of map.values()) {
    bitmap.close();
  }
}

async function loadBitmapFromUrl(url: string): Promise<ImageBitmap> {
  const response = await fetch(url);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

export function PatternTab() {
  const { t } = useTranslation("pattern");
  const [canUseBoundaryOverlay, setCanUseBoundaryOverlay] = useState(false);
  const canvas = usePatternStore((state) => state.canvas);
  const settings = usePatternStore((state) => state.settings);
  const assets = usePatternStore((state) => state.assets);
  const visualBoundaryVisibility = usePatternStore(
    (state) => state.visualBoundaryVisibility,
  );
  const activeVisualBoundary = usePatternStore(
    (state) => state.activeVisualBoundary,
  );
  const setBoundary = usePatternStore((state) => state.setBoundary);
  const setActiveVisualBoundary = usePatternStore(
    (state) => state.setActiveVisualBoundary,
  );
  const hideVisualBoundary = usePatternStore(
    (state) => state.hideVisualBoundary,
  );
  const previewContainerHeight = usePatternStore(
    (state) => state.previewContainerHeight,
  );
  const setPreviewContainerHeight = usePatternStore(
    (state) => state.setPreviewContainerHeight,
  );

  const exportFormat = usePatternStore((state) => state.exportFormat);
  const { getShortcutLabel } = useShortcutPreferences();

  const previewHostRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [previewHostSize, setPreviewHostSize] = useState({
    width: 960,
    height: 560,
  });
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [previewInteractionMode, setPreviewInteractionMode] =
    useState<PreviewInteractionMode>("zoom");
  const [assetBitmapMap, setAssetBitmapMap] = useState<
    Map<string, ImageBitmap>
  >(new Map());
  const [backgroundBitmap, setBackgroundBitmap] = useState<ImageBitmap | null>(
    null,
  );
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { isResizing, handleResizeStart } = useCanvasResizer({
    containerRef: previewHostRef,
    onHeightChange: setPreviewContainerHeight,
    minHeight: 200,
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
    containerRef: previewHostRef,
    shouldStartPan: (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          '[data-viewer-interactive="true"], [class*="pointer-events-auto"], input, button, select, textarea, [class*="cursor-"]',
        )
      ) {
        return false;
      }
      return true;
    },
  });

  const assetBitmapsRef = useRef<Map<string, ImageBitmap>>(new Map());
  const backgroundBitmapRef = useRef<ImageBitmap | null>(null);

  const activeAssets = useMemo(
    () => assets.filter((asset) => asset.enabled),
    [assets],
  );

  const previewShortcutsEnabled = activeAssets.length > 0;

  useShortcutActions([
    {
      actionId: "global.preview.zoom_mode",
      enabled: previewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("zoom"),
    },
    {
      actionId: "global.preview.pan_mode",
      enabled: previewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("pan"),
    },
    {
      actionId: "global.preview.idle_mode",
      enabled: previewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("idle"),
    },
  ]);
  const hasVisualBoundaryOverlay = useMemo(() => {
    if (activeVisualBoundary === "inbound") {
      return (
        visualBoundaryVisibility.inbound && settings.inboundBoundary.enabled
      );
    }

    if (activeVisualBoundary === "outbound") {
      return (
        visualBoundaryVisibility.outbound && settings.outboundBoundary.enabled
      );
    }

    return false;
  }, [
    activeVisualBoundary,
    settings.inboundBoundary.enabled,
    settings.outboundBoundary.enabled,
    visualBoundaryVisibility.inbound,
    visualBoundaryVisibility.outbound,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setCanUseBoundaryOverlay(false);
      return;
    }

    const protocol = window.location.protocol;
    setCanUseBoundaryOverlay(
      protocol === "chrome-extension:" || protocol === "moz-extension:",
    );
  }, []);

  const shouldRenderBoundaryOverlay =
    hasVisualBoundaryOverlay && canUseBoundaryOverlay;

  const { targetFormat, quality, codecOptions } = useMemo(
    () => mapQuickExportToEngineConfig(exportFormat),
    [exportFormat],
  );

  const pushExportToast = useCallback((payload: ConversionProgressPayload) => {
    toast.progress(payload);
  }, []);

  const replaceAssetBitmaps = useCallback(
    (nextMap: Map<string, ImageBitmap>) => {
      const previous = assetBitmapsRef.current;
      assetBitmapsRef.current = nextMap;
      setAssetBitmapMap(nextMap);
      closeBitmapMap(previous);
    },
    [],
  );

  const replaceBackgroundBitmap = useCallback(
    (nextBitmap: ImageBitmap | null) => {
      const previous = backgroundBitmapRef.current;
      backgroundBitmapRef.current = nextBitmap;
      setBackgroundBitmap(nextBitmap);

      if (previous) {
        previous.close();
      }
    },
    [],
  );

  useEffect(() => {
    const element = previewHostRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const next = entries[0];
      if (!next) {
        return;
      }

      setPreviewHostSize({
        width: Math.max(320, Math.round(next.contentRect.width)),
        height: Math.max(320, Math.round(next.contentRect.height)),
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextMap = new Map<string, ImageBitmap>();

      for (const asset of activeAssets) {
        try {
          const bitmap = await loadBitmapFromUrl(asset.imageUrl);
          if (cancelled) {
            bitmap.close();
            continue;
          }

          nextMap.set(asset.id, bitmap);
        } catch {
          // Ignore failed asset decode and continue.
        }
      }

      if (cancelled) {
        closeBitmapMap(nextMap);
        return;
      }

      replaceAssetBitmaps(nextMap);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeAssets, replaceAssetBitmaps]);

  useEffect(() => {
    let cancelled = false;

    const loadBackground = async () => {
      if (canvas.backgroundType !== "image" || !canvas.backgroundImageUrl) {
        replaceBackgroundBitmap(null);
        return;
      }

      try {
        const bitmap = await loadBitmapFromUrl(canvas.backgroundImageUrl);

        if (cancelled) {
          bitmap.close();
          return;
        }

        replaceBackgroundBitmap(bitmap);
      } catch {
        if (!cancelled) {
          replaceBackgroundBitmap(null);
        }
      }
    };

    void loadBackground();

    return () => {
      cancelled = true;
    };
  }, [
    canvas.backgroundImageUrl,
    canvas.backgroundType,
    replaceBackgroundBitmap,
  ]);

  useEffect(() => {
    return () => {
      closeBitmapMap(assetBitmapsRef.current);
      assetBitmapsRef.current = new Map();

      if (backgroundBitmapRef.current) {
        backgroundBitmapRef.current.close();
        backgroundBitmapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (activeVisualBoundary === "inbound") {
      const inboundVisible =
        visualBoundaryVisibility.inbound && settings.inboundBoundary.enabled;
      if (!inboundVisible) {
        hideVisualBoundary();
      }
      return;
    }

    if (activeVisualBoundary === "outbound") {
      const outboundVisible =
        visualBoundaryVisibility.outbound && settings.outboundBoundary.enabled;
      if (!outboundVisible) {
        hideVisualBoundary();
      }
    }
  }, [
    activeVisualBoundary,
    hideVisualBoundary,
    settings.inboundBoundary.enabled,
    settings.outboundBoundary.enabled,
    visualBoundaryVisibility.inbound,
    visualBoundaryVisibility.outbound,
  ]);

  useEffect(() => {
    const canvasElement = previewCanvasRef.current;

    if (!canvasElement) {
      return;
    }

    const ctx = canvasElement.getContext("2d", { alpha: true });

    if (!ctx) {
      return;
    }

    setIsRenderingPreview(true);

    try {
      renderPatternToContext({
        ctx,
        canvas,
        settings,
        assets,
        loadedAssetBitmaps: assetBitmapMap,
        backgroundBitmap,
        drawGuides: !shouldRenderBoundaryOverlay,
        maxPlacements: 30000,
      });
    } finally {
      setIsRenderingPreview(false);
    }
  }, [
    assetBitmapMap,
    assets,
    backgroundBitmap,
    canvas,
    settings,
    shouldRenderBoundaryOverlay,
  ]);

  const renderScale = useMemo(() => {
    const availableWidth = Math.max(
      1,
      previewHostSize.width - PREVIEW_PADDING * 2,
    );
    const availableHeight = Math.max(
      1,
      previewHostSize.height - PREVIEW_PADDING * 2,
    );

    return Math.min(
      availableWidth / Math.max(1, canvas.width),
      availableHeight / Math.max(1, canvas.height),
      1,
    );
  }, [
    canvas.height,
    canvas.width,
    previewHostSize.height,
    previewHostSize.width,
  ]);

  const displayWidth = Math.max(1, Math.round(canvas.width * renderScale));
  const displayHeight = Math.max(1, Math.round(canvas.height * renderScale));
  const previewBaseOffset = useMemo(
    () => ({
      x: (previewHostSize.width - displayWidth) / 2,
      y: (previewHostSize.height - displayHeight) / 2,
    }),
    [
      displayHeight,
      displayWidth,
      previewHostSize.height,
      previewHostSize.width,
    ],
  );

  const handleExportPattern = async () => {
    if (isExporting) {
      return;
    }

    const toastId = `pattern_export_${Date.now()}`;
    const outputBaseName = `pattern-${Date.now()}`;

    setIsExporting(true);
    pushExportToast({
      id: toastId,
      fileName: outputBaseName,
      targetFormat: targetFormat as any,
      status: "processing",
      percent: 2,
      message: t("toasts.preparingExport"),
    });

    try {
      await exportPatternComposition({
        canvas,
        settings,
        assets,
        exportFormat: targetFormat as any,
        exportQuality: quality,
        formatOptions: codecOptions as any,
        outputBaseName,
        onProgress: ({ percent, message }) => {
          pushExportToast({
            id: toastId,
            fileName: outputBaseName,
            targetFormat: targetFormat as any,
            status: "processing",
            percent,
            message,
          });
        },
      });

      pushExportToast({
        id: toastId,
        fileName: outputBaseName,
        targetFormat: mapQuickExportToEngineConfig(exportFormat)
          .targetFormat as any,
        status: "success",
        percent: 100,
        message: t("toasts.exportCompleted"),
      });
    } catch (error) {
      pushExportToast({
        id: toastId,
        fileName: outputBaseName,
        targetFormat: mapQuickExportToEngineConfig(exportFormat)
          .targetFormat as any,
        status: "error",
        percent: 100,
        message: toUserFacingConversionError(error, t("toasts.exportFailed")),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-0 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="min-w-0">
          <Subheading className="truncate">{t("workspace.title")}</Subheading>
          <MutedText className="text-xs mt-0.5 truncate">
            {t("workspace.subtitle", {
              count: activeAssets.length,
              size: `${canvas.width} x ${canvas.height} px`,
            })}
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
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleExportPattern}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("toasts.exporting")}
              </>
            ) : (
              <>
                <Save size={14} />
                {t("toasts.exportPattern")}
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        ref={previewHostRef}
        className="relative mx-auto overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 select-none touch-none"
        style={{
          width: "100%",
          height: `${previewContainerHeight}px`,
          cursor: isViewportPanning
            ? "grabbing"
            : previewInteractionMode === "pan"
              ? "grab"
              : previewInteractionMode === "idle"
                ? "default"
                : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className="relative h-full w-full flex items-center justify-center overflow-hidden"
          style={{
            transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom / 100})`,
            transformOrigin: "center center",
            touchAction: "none",
          }}
        >
          <div
            className="relative bg-white shadow-xl dark:bg-slate-950"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={displayWidth}
              height={displayHeight}
              className="h-full w-full object-contain"
            />

            {shouldRenderBoundaryOverlay && (
              <div className="absolute inset-0 z-10">
                <Suspense fallback={null}>
                  <PatternBoundaryVisualOverlay
                    renderScale={renderScale}
                    displayWidth={displayWidth}
                    displayHeight={displayHeight}
                    inboundBoundary={settings.inboundBoundary}
                    outboundBoundary={settings.outboundBoundary}
                    activeTarget={activeVisualBoundary}
                    onBoundaryChange={setBoundary}
                    onActiveTargetChange={setActiveVisualBoundary}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        {isRenderingPreview && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-600/90 dark:bg-slate-900/90 dark:text-slate-200">
              <Loader2 size={12} className="animate-spin" />
              <span className="truncate">{t("toasts.renderingPreview")}</span>
            </div>
          </div>
        )}

        <ZoomPanControl
          zoom={previewZoom}
          panX={previewPan.x}
          panY={previewPan.y}
          onZoomChange={(value) =>
            setPreviewZoom(
              Math.max(PREVIEW_MIN_ZOOM, Math.min(PREVIEW_MAX_ZOOM, value)),
            )
          }
          onPanChange={(x, y) => setPreviewPan({ x, y })}
          minZoom={PREVIEW_MIN_ZOOM}
          maxZoom={PREVIEW_MAX_ZOOM}
        />

        <div
          ref={resizeHandleRef}
          onPointerDown={handleResizeStart}
          className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors z-20 ${
            isResizing ? "bg-sky-400 dark:bg-sky-500" : ""
          }`}
          style={{ cursor: "ns-resize", touchAction: "none" }}
        >
          <div
            className={`absolute inset-x-0 bottom-0 h-1 transition-colors ${
              isResizing ? "bg-sky-500" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
}
