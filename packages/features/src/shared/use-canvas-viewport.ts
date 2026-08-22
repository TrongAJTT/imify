import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PreviewInteractionMode } from "@imify/ui";

export interface CanvasViewportOptions {
  zoom: number;
  panX: number;
  panY: number;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
  interactionMode?: PreviewInteractionMode;
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
  enabled?: boolean;
  /** Whether to allow dragging even if in "zoom" mode (default true) */
  allowDragInZoomMode?: boolean;
  /** Threshold to ignore interactive elements */
  interactiveSelector?: string;
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Optional predicate to check if panning should start on pointer down (ignored when Space is held) */
  shouldStartPan?: (e: React.PointerEvent<HTMLElement>) => boolean;
}

export interface CanvasViewportResult {
  isPanning: boolean;
  handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  resetPan: () => void;
  resetViewport: () => void;
  zoomTowardPointer: (e: WheelEvent | { clientX: number; clientY: number; deltaY: number }) => void;
}

const DEFAULT_INTERACTIVE_SELECTOR =
  '[data-viewer-interactive="true"], [class*="pointer-events-auto"], input, button, select, textarea';

export function useCanvasViewport(
  options: CanvasViewportOptions,
): CanvasViewportResult {
  const {
    zoom,
    panX,
    panY,
    onZoomChange,
    onPanChange,
    interactionMode = "zoom",
    minZoom = 10,
    maxZoom = 10000,
    zoomFactor = 0.15,
    enabled = true,
    allowDragInZoomMode = true,
    interactiveSelector = DEFAULT_INTERACTIVE_SELECTOR,
    containerRef,
    shouldStartPan,
  } = options;

  // Use refs for props so event callbacks always have fresh values without re-attaching listeners
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panXRef = useRef(panX);
  panXRef.current = panX;
  const panYRef = useRef(panY);
  panYRef.current = panY;
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const onPanChangeRef = useRef(onPanChange);
  onPanChangeRef.current = onPanChange;
  const interactionModeRef = useRef(interactionMode);
  interactionModeRef.current = interactionMode;
  const shouldStartPanRef = useRef(shouldStartPan);
  shouldStartPanRef.current = shouldStartPan;

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Space key tracker (for Space+Drag panning)
  const isSpacePressedRef = useRef(false);

  // Multi-touch tracking for pointer events
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const resetPan = useCallback(() => {
    onPanChangeRef.current(0, 0);
  }, []);

  const resetViewport = useCallback(() => {
    onZoomChangeRef.current(100);
    onPanChangeRef.current(0, 0);
  }, []);

  const zoomTowardPointer = useCallback(
    (e: WheelEvent | { clientX: number; clientY: number; deltaY: number }) => {
      const dir = e.deltaY > 0 ? -1 : 1;
      const oldZoom = zoomRef.current;
      const nextZoom = Math.round(
        Math.max(
          minZoom,
          Math.min(maxZoom, oldZoom * (1 + zoomFactor * dir)),
        ),
      );
      if (nextZoom === oldZoom) return;

      const container = containerRef?.current;
      let centerX = window.innerWidth / 2;
      let centerY = window.innerHeight / 2;

      if (container) {
        const rect = container.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      }

      const pointerOffsetX = e.clientX - centerX;
      const pointerOffsetY = e.clientY - centerY;

      const oldScale = oldZoom / 100;
      const newScale = nextZoom / 100;
      const scaleRatio = newScale / oldScale;

      const currentPanX = panXRef.current;
      const currentPanY = panYRef.current;

      const newPanX =
        pointerOffsetX * (1 - scaleRatio) + currentPanX * scaleRatio;
      const newPanY =
        pointerOffsetY * (1 - scaleRatio) + currentPanY * scaleRatio;

      onZoomChangeRef.current(nextZoom);
      onPanChangeRef.current(Math.round(newPanX), Math.round(newPanY));
    },
    [containerRef, maxZoom, minZoom, zoomFactor],
  );

  // Track space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const activeEl = document.activeElement;
        const isInput =
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement ||
          activeEl?.getAttribute("contenteditable") === "true";
        if (!isInput) {
          isSpacePressedRef.current = true;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Global window pointermove & pointerup while panning for 100% smooth dragging
  useEffect(() => {
    if (!isPanning) return;

    const onWindowPointerMove = (e: PointerEvent) => {
      if (panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const newX = Math.round(panStartRef.current.originX + dx);
        const newY = Math.round(panStartRef.current.originY + dy);

        onPanChangeRef.current(newX, newY);
      }
    };

    const onWindowPointerUp = () => {
      panStartRef.current = null;
      setIsPanning(false);
      pointersRef.current.clear();
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);
    };
  }, [isPanning]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      if (target.closest(interactiveSelector)) return;

      const currentMode = interactionModeRef.current;
      const isPanAllowed =
        currentMode === "pan" ||
        (currentMode === "zoom" && allowDragInZoomMode) ||
        isSpacePressedRef.current;

      pointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });

      if (pointersRef.current.size === 1) {
        if (!isPanAllowed && e.pointerType === "mouse") return;
        if (e.button !== 0 && e.pointerType === "mouse") return;

        if (shouldStartPanRef.current && !isSpacePressedRef.current) {
          if (!shouldStartPanRef.current(e)) {
            pointersRef.current.delete(e.pointerId);
            return;
          }
        }

        // Save exact current pan coordinates as origin to prevent jumping to (0,0)
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          originX: panXRef.current,
          originY: panYRef.current,
        };
        setIsPanning(true);
      }
    },
    [allowDragInZoomMode, enabled, interactiveSelector],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;

      pointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });

      if (panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const newX = Math.round(panStartRef.current.originX + dx);
        const newY = Math.round(panStartRef.current.originY + dy);

        onPanChangeRef.current(newX, newY);
      }
    },
    [enabled],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size === 0) {
      panStartRef.current = null;
      setIsPanning(false);
    }
  }, []);

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      handlePointerUp(e);
    },
    [handlePointerUp],
  );

  // Wheel listener with rAF throttle on containerRef
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !enabled) return;

    let rafId: number | null = null;
    let pendingWheelEvent: WheelEvent | null = null;

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(interactiveSelector)) return;

      const currentMode = interactionModeRef.current;
      if (currentMode === "idle") return;

      e.preventDefault();
      pendingWheelEvent = e;

      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const ev = pendingWheelEvent;
        if (!ev) return;
        pendingWheelEvent = null;

        const mode = interactionModeRef.current;
        if (mode === "pan") {
          // Pan mode: wheel scrolls vertically, Shift+wheel scrolls horizontally
          const delta = ev.deltaY > 0 ? 50 : -50;
          if (ev.shiftKey) {
            onPanChangeRef.current(panXRef.current - delta, panYRef.current);
          } else {
            onPanChangeRef.current(panXRef.current, panYRef.current - delta);
          }
        } else {
          // Zoom mode: wheel zooms toward pointer
          zoomTowardPointer(ev);
        }
      });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [containerRef, enabled, interactiveSelector, zoomTowardPointer]);

  // Native multi-touch pinch zoom & pan on containerRef for mobile devices
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !enabled) return;

    let initialDistance: number | null = null;
    let startZoom = 100;
    let startPan = { x: 0, y: 0 };
    let midpointOffset = { x: 0, y: 0 };

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(interactiveSelector)) return;

      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialDistance = Math.hypot(
          t2.clientX - t1.clientX,
          t2.clientY - t1.clientY,
        );
        startZoom = zoomRef.current;
        startPan = { x: panXRef.current, y: panYRef.current };
        const rect = container.getBoundingClientRect();
        midpointOffset = {
          x: (t1.clientX + t2.clientX) / 2 - (rect.left + rect.width / 2),
          y: (t1.clientY + t2.clientY) / 2 - (rect.top + rect.height / 2),
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance && initialDistance > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDistance = Math.hypot(
          t2.clientX - t1.clientX,
          t2.clientY - t1.clientY,
        );

        if (currentDistance > 0) {
          const ratio = currentDistance / initialDistance;
          const nextZoom = Math.round(
            Math.max(
              minZoom,
              Math.min(maxZoom, startZoom * ratio),
            ),
          );

          const zoomRatio = nextZoom / startZoom;
          const newPanX =
            midpointOffset.x * (1 - zoomRatio) + startPan.x * zoomRatio;
          const newPanY =
            midpointOffset.y * (1 - zoomRatio) + startPan.y * zoomRatio;

          onZoomChangeRef.current(nextZoom);
          onPanChangeRef.current(Math.round(newPanX), Math.round(newPanY));
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialDistance = null;
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerRef, enabled, interactiveSelector, maxZoom, minZoom]);

  return {
    isPanning,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    resetPan,
    resetViewport,
    zoomTowardPointer,
  };
}
