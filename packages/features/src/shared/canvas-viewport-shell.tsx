import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Expand, Shrink } from "lucide-react";
import { ZoomPanControl, type PreviewInteractionMode } from "@imify/ui";
import {
  useCanvasViewport,
  type CanvasViewportOptions,
} from "./use-canvas-viewport";
import { useCanvasResizer } from "./use-canvas-resizer";

export interface CanvasViewportShellProps {
  children: ReactNode;
  zoom: number;
  panX: number;
  panY: number;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
  containerHeight: number;
  onHeightChange?: (height: number) => void;
  minHeight?: number;
  interactionMode?: PreviewInteractionMode;
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
  resetPanThreshold?: number;
  enableFullscreen?: boolean;
  enableResizer?: boolean;
  className?: string;
  wrapperClassName?: string;
  /** Optional container ref to attach to the outer shell div */
  containerRef?:
    | React.RefObject<HTMLDivElement | null>
    | React.RefObject<HTMLDivElement>;
  /** Pass-through style for children wrapper if transform is applied externally */
  applyTransformToChildren?: boolean;
}

export function CanvasViewportShell({
  children,
  zoom,
  panX,
  panY,
  onZoomChange,
  onPanChange,
  containerHeight,
  onHeightChange,
  minHeight = 200,
  interactionMode = "zoom",
  minZoom = 10,
  maxZoom = 10000,
  zoomFactor = 0.15,
  resetPanThreshold = 150,
  enableFullscreen = true,
  enableResizer = true,
  className = "",
  wrapperClassName = "",
  containerRef,
  applyTransformToChildren = false,
}: CanvasViewportShellProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const activeContainerRef = (containerRef ||
    internalRef) as React.RefObject<HTMLDivElement>;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { isResizing, handleResizeStart } = useCanvasResizer({
    containerRef: activeContainerRef,
    onHeightChange: onHeightChange || (() => {}),
    minHeight,
  });

  const {
    isPanning,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useCanvasViewport({
    zoom,
    panX,
    panY,
    onZoomChange,
    onPanChange,
    interactionMode,
    minZoom,
    maxZoom,
    zoomFactor,
    containerRef: activeContainerRef,
  });

  // Track Fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === activeContainerRef.current,
      );
    };
    onFullscreenChange();
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [activeContainerRef]);

  const handleToggleFullscreen = useCallback(async () => {
    const el = activeContainerRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch (error) {
      console.warn("[CanvasViewportShell] Failed to toggle fullscreen:", error);
    }
  }, [activeContainerRef]);

  const cursorClass =
    interactionMode === "pan" || isPanning
      ? isPanning
        ? "cursor-grabbing"
        : "cursor-grab"
      : interactionMode === "idle"
        ? "cursor-default"
        : "cursor-default";

  return (
    <div
      ref={(node) => {
        (internalRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (containerRef) {
          (
            containerRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
        }
      }}
      className={`relative rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/30 p-2 overflow-hidden select-none touch-none ${cursorClass} ${className}`}
      style={{
        height: isFullscreen ? "100vh" : `${containerHeight}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div
        className={`relative w-full h-full flex items-center justify-center overflow-hidden ${wrapperClassName}`}
      >
        {applyTransformToChildren ? (
          <div
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
              transformOrigin: "center center",
            }}
          >
            {children}
          </div>
        ) : (
          children
        )}

        {/* Floating Zoom & Pan Controls */}
        <ZoomPanControl
          zoom={zoom}
          panX={panX}
          panY={panY}
          onZoomChange={onZoomChange}
          onPanChange={onPanChange}
          minZoom={minZoom}
          maxZoom={maxZoom}
          resetPanThreshold={resetPanThreshold}
        />

        {/* Fullscreen Toggle Button */}
        {enableFullscreen && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-sm pointer-events-auto z-20">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Resize Bottom Handle */}
      {enableResizer && !isFullscreen && onHeightChange && (
        <div
          onPointerDown={handleResizeStart}
          className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors z-20 pointer-events-auto ${
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
      )}
    </div>
  );
}
