"use client";

import React, { useCallback, useRef, useState } from "react";
import { GripHorizontal, GripVertical } from "lucide-react";
import type { GridRowBounds } from "./generator";
import type { GridPrimaryDirection } from "../types";

export interface GridRowReorderOverlayProps {
  boundsList: GridRowBounds[];
  direction: GridPrimaryDirection;
  renderScale: number;
  offsetX: number;
  offsetY: number;
  canvasWidth: number;
  canvasHeight: number;
  enabled: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onHoverRowChange?: (rowIndex: number | null) => void;
}

interface DragState {
  fromIndex: number;
  pointerId: number;
  currentX: number;
  currentY: number;
  dropIndex: number;
}

export function GridRowReorderOverlay({
  boundsList,
  direction,
  renderScale,
  offsetX,
  offsetY,
  canvasWidth,
  canvasHeight,
  enabled,
  onReorder,
  onHoverRowChange,
}: GridRowReorderOverlayProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isColsMode = direction === "cols";

  const handlePointerEnterRow = (index: number) => {
    if (dragState) return;
    setHoveredIndex(index);
    onHoverRowChange?.(index);
  };

  const handlePointerLeaveRow = (index: number) => {
    if (dragState) return;
    setHoveredIndex((prev) => (prev === index ? null : prev));
    onHoverRowChange?.(null);
  };

  const calculateDropIndex = useCallback(
    (clientX: number, clientY: number, fromIdx: number): number => {
      if (!overlayRef.current || boundsList.length === 0) return fromIdx;
      const rect = overlayRef.current.getBoundingClientRect();

      if (isColsMode) {
        const localX = clientX - rect.left - offsetX;
        const canvasX = localX / renderScale;

        for (let i = 0; i < boundsList.length; i++) {
          const b = boundsList[i]!;
          const midX = b.x + b.width / 2;
          if (canvasX < midX) {
            return i;
          }
        }
        return boundsList.length;
      } else {
        const localY = clientY - rect.top - offsetY;
        const canvasY = localY / renderScale;

        for (let i = 0; i < boundsList.length; i++) {
          const b = boundsList[i]!;
          const midY = b.y + b.height / 2;
          if (canvasY < midY) {
            return i;
          }
        }
        return boundsList.length;
      }
    },
    [boundsList, isColsMode, offsetX, offsetY, renderScale],
  );

  const handleStartDrag = (
    e: React.PointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!enabled || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    setDragState({
      fromIndex: index,
      pointerId: e.pointerId,
      currentX: e.clientX,
      currentY: e.clientY,
      dropIndex: index,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();

    const nextDropIndex = calculateDropIndex(
      e.clientX,
      e.clientY,
      dragState.fromIndex,
    );

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentX: e.clientX,
            currentY: e.clientY,
            dropIndex: nextDropIndex,
          }
        : null,
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already released
    }

    const { fromIndex, dropIndex } = dragState;
    setDragState(null);
    setHoveredIndex(null);
    onHoverRowChange?.(null);

    // Adjust target index for arrayMove semantics
    let targetIndex = dropIndex;
    if (targetIndex > fromIndex) {
      targetIndex = targetIndex - 1;
    }

    if (
      fromIndex !== targetIndex &&
      targetIndex >= 0 &&
      targetIndex < boundsList.length
    ) {
      onReorder(fromIndex, targetIndex);
    }
  };

  if (!enabled || boundsList.length <= 1) {
    return null;
  }

  // Calculate drop indicator line coordinate
  let dropLineCoord: number | null = null;
  if (dragState && dragState.dropIndex !== null) {
    const dIdx = dragState.dropIndex;
    if (dIdx === 0 && boundsList[0]) {
      dropLineCoord = isColsMode
        ? offsetX + boundsList[0].x * renderScale
        : offsetY + boundsList[0].y * renderScale;
    } else if (dIdx >= boundsList.length && boundsList[boundsList.length - 1]) {
      const last = boundsList[boundsList.length - 1]!;
      dropLineCoord = isColsMode
        ? offsetX + (last.x + last.width) * renderScale
        : offsetY + (last.y + last.height) * renderScale;
    } else if (boundsList[dIdx]) {
      const target = boundsList[dIdx]!;
      dropLineCoord = isColsMode
        ? offsetX + target.x * renderScale
        : offsetY + target.y * renderScale;
    }
  }

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden"
    >
      {/* Row / Col Hover & Drag Handles */}
      {boundsList.map((b) => {
        const isHovered = hoveredIndex === b.index;
        const isBeingDragged = dragState?.fromIndex === b.index;

        const screenX = offsetX + b.x * renderScale;
        const screenY = offsetY + b.y * renderScale;
        const screenW = b.width * renderScale;
        const screenH = b.height * renderScale;

        // Position the handle tag on top-left of the row/col
        const handleLeft = isColsMode
          ? screenX + screenW / 2 - 18
          : screenX + 8;
        const handleTop = isColsMode
          ? screenY + 8
          : screenY + Math.max(6, Math.min(screenH / 2 - 12, 16));

        return (
          <React.Fragment key={`row-overlay-${b.index}`}>
            {/* Row Hover Outline */}
            {(isHovered || isBeingDragged) && (
              <div
                className={`absolute rounded-md transition-all duration-75 pointer-events-none ${
                  isBeingDragged
                    ? "border-2 border-amber-500/80 bg-amber-500/10 shadow-sm"
                    : "border-2 border-sky-400/80 bg-sky-400/5 shadow-sm"
                }`}
                style={{
                  left: screenX - 2,
                  top: screenY - 2,
                  width: screenW + 4,
                  height: screenH + 4,
                }}
              />
            )}

            {/* Transparent hover detection strip for the row */}
            <div
              className="absolute pointer-events-auto cursor-default"
              style={{
                left: screenX,
                top: screenY,
                width: screenW,
                height: screenH,
              }}
              onPointerEnter={() => handlePointerEnterRow(b.index)}
              onPointerLeave={() => handlePointerLeaveRow(b.index)}
            />

            {/* Drag Handle Button Badge */}
            <div
              className="absolute pointer-events-auto z-20"
              style={{
                left: handleLeft,
                top: handleTop,
              }}
              onPointerEnter={() => handlePointerEnterRow(b.index)}
              onPointerLeave={() => handlePointerLeaveRow(b.index)}
            >
              <button
                type="button"
                data-viewer-interactive="true"
                aria-label={`Drag to reorder ${isColsMode ? "column" : "row"} ${b.index + 1}`}
                title={`Kéo để đổi vị trí ${isColsMode ? "Cột" : "Hàng"} ${b.index + 1}`}
                onPointerDown={(e) => handleStartDrag(e, b.index)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`group inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold shadow-sm transition-all cursor-grab active:cursor-grabbing ${
                  isBeingDragged
                    ? "scale-105 border-amber-500 bg-amber-500 text-white shadow-amber-500/30 opacity-100 ring-2 ring-amber-300"
                    : isHovered
                      ? "scale-105 border-sky-500 bg-sky-500 text-white shadow-sky-500/30 opacity-100 ring-2 ring-sky-300"
                      : "border-slate-300/90 bg-white/90 text-slate-600 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 opacity-80"
                }`}
              >
                {isColsMode ? (
                  <GripHorizontal size={12} className="shrink-0 text-current" />
                ) : (
                  <GripVertical size={12} className="shrink-0 text-current" />
                )}
                <span>{b.index + 1}</span>
              </button>
            </div>
          </React.Fragment>
        );
      })}

      {/* Drop Target Insertion Line */}
      {dragState && dropLineCoord !== null && (
        <div
          className="absolute pointer-events-none transition-all duration-75 z-30"
          style={
            isColsMode
              ? {
                  left: dropLineCoord - 1.5,
                  top: offsetY,
                  width: 3,
                  height: canvasHeight * renderScale,
                }
              : {
                  left: offsetX,
                  top: dropLineCoord - 1.5,
                  width: canvasWidth * renderScale,
                  height: 3,
                }
          }
        >
          <div className="relative h-full w-full bg-amber-500 shadow-md shadow-amber-500/50">
            {/* Top/Left round endpoint */}
            <div
              className={`absolute rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 ${
                isColsMode
                  ? "-top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2"
                  : "-left-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              }`}
            />
            {/* Bottom/Right round endpoint */}
            <div
              className={`absolute rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 ${
                isColsMode
                  ? "-bottom-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2"
                  : "-right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
