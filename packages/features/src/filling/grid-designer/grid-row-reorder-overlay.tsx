"use client";

import React, { useCallback, useRef, useState } from "react";
import { ArrowLeftRight, GripHorizontal, GripVertical } from "lucide-react";
import {
  canReverseDefinition,
  type GridRowBounds,
  type GridRowGroup,
} from "./generator";
import type { GridPrimaryDirection } from "../types";

export interface GridRowReorderOverlayProps {
  boundsList: GridRowBounds[];
  groups: GridRowGroup[];
  direction: GridPrimaryDirection;
  renderScale: number;
  offsetX: number;
  offsetY: number;
  canvasWidth: number;
  canvasHeight: number;
  enabled: boolean;
  rowDefinitions?: string[];
  onReorder: (fromStart: number, fromEnd: number, toIndex: number) => void;
  onReverseRow?: (rowIndex: number) => void;
  onHoverRowChange?: (rowIndex: number | null) => void;
}

interface DragState {
  fromStart: number;
  fromEnd: number;
  pointerId: number;
  currentX: number;
  currentY: number;
  dropIndex: number;
}

export function GridRowReorderOverlay({
  boundsList,
  groups,
  direction,
  renderScale,
  offsetX,
  offsetY,
  canvasWidth,
  canvasHeight,
  enabled,
  rowDefinitions,
  onReorder,
  onReverseRow,
  onHoverRowChange,
}: GridRowReorderOverlayProps) {
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isColsMode = direction === "cols";

  const handlePointerEnterRow = (rowIndex: number, groupId: string) => {
    if (dragState) return;
    setHoveredRowIndex(rowIndex);
    setHoveredGroupId(groupId);
    onHoverRowChange?.(rowIndex);
  };

  const handlePointerLeaveRow = (rowIndex: number) => {
    if (dragState) return;
    setHoveredRowIndex((prev) => (prev === rowIndex ? null : prev));
    setHoveredGroupId((prev) => (hoveredRowIndex === rowIndex ? null : prev));
    onHoverRowChange?.(null);
  };

  // Calculate drop insertion index, snapping strictly to group boundaries (never in the middle of a merged block)
  const calculateDropIndex = useCallback(
    (
      clientX: number,
      clientY: number,
      fromStart: number,
      fromEnd: number,
    ): number => {
      if (!overlayRef.current || boundsList.length === 0) return fromStart;
      const rect = overlayRef.current.getBoundingClientRect();

      const canvasCoord = isColsMode
        ? (clientX - rect.left - offsetX) / renderScale
        : (clientY - rect.top - offsetY) / renderScale;

      // Check each group to find where the pointer falls
      for (const group of groups) {
        const groupStart = isColsMode ? group.x : group.y;
        const groupDim = isColsMode ? group.width : group.height;
        const groupMid = groupStart + groupDim / 2;

        if (canvasCoord < groupMid) {
          return group.startRow;
        }
        if (canvasCoord <= groupStart + groupDim) {
          return group.endRow + 1;
        }
      }

      return boundsList.length;
    },
    [boundsList.length, groups, isColsMode, offsetX, offsetY, renderScale],
  );

  const handleStartDrag = (
    e: React.PointerEvent<HTMLButtonElement>,
    fromStart: number,
    fromEnd: number,
  ) => {
    if (!enabled || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    setDragState({
      fromStart,
      fromEnd,
      pointerId: e.pointerId,
      currentX: e.clientX,
      currentY: e.clientY,
      dropIndex: fromStart,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();

    const nextDropIndex = calculateDropIndex(
      e.clientX,
      e.clientY,
      dragState.fromStart,
      dragState.fromEnd,
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

    const { fromStart, fromEnd, dropIndex } = dragState;
    setDragState(null);
    setHoveredRowIndex(null);
    setHoveredGroupId(null);
    onHoverRowChange?.(null);

    // If dropping at same start or immediately after its own span, no reorder needed
    const moveCount = fromEnd - fromStart + 1;
    if (dropIndex === fromStart || dropIndex === fromStart + moveCount) {
      return;
    }

    onReorder(fromStart, fromEnd, dropIndex);
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
      {/* 1. Transparent hover detection strips per row */}
      {boundsList.map((b) => {
        const group = groups.find((g) => g.rowIndices.includes(b.index));
        const groupId = group ? group.id : `single-${b.index}`;

        const screenX = offsetX + b.x * renderScale;
        const screenY = offsetY + b.y * renderScale;
        const screenW = b.width * renderScale;
        const screenH = b.height * renderScale;

        return (
          <div
            key={`row-hover-zone-${b.index}`}
            className="absolute pointer-events-auto cursor-default"
            style={{
              left: screenX,
              top: screenY,
              width: screenW,
              height: screenH,
            }}
            onPointerEnter={() => handlePointerEnterRow(b.index, groupId)}
            onPointerLeave={() => handlePointerLeaveRow(b.index)}
          />
        );
      })}

      {/* 2. Render Row Groups & Handles */}
      {groups.map((group) => {
        const isGroupHovered = hoveredGroupId === group.id;
        const isBeingDragged =
          dragState !== null &&
          dragState.fromStart === group.startRow &&
          dragState.fromEnd === group.endRow;

        const screenX = offsetX + group.x * renderScale;
        const screenY = offsetY + group.y * renderScale;
        const screenW = group.width * renderScale;
        const screenH = group.height * renderScale;

        return (
          <React.Fragment key={`group-render-${group.id}`}>
            {/* Outline when hovered or dragged */}
            {(isGroupHovered || isBeingDragged) && (
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

            {/* Case A: Merged Block (spanning > 1 row) */}
            {group.isMerged ? (
              <>
                {/* Unified Group Drag Handle */}
                <div
                  className="absolute pointer-events-auto z-20 flex items-center gap-1"
                  style={{
                    left: isColsMode ? screenX + screenW / 2 : screenX + 8,
                    top: screenY + 8,
                    transform: isColsMode ? "translateX(-50%)" : undefined,
                  }}
                  onPointerEnter={() =>
                    handlePointerEnterRow(group.startRow, group.id)
                  }
                >
                  <button
                    type="button"
                    data-viewer-interactive="true"
                    aria-label={`Drag merged block ${group.startRow + 1}-${group.endRow + 1}`}
                    title={`Kéo toàn bộ khối ${isColsMode ? "Cột" : "Hàng"} ${group.startRow + 1} - ${group.endRow + 1}`}
                    onPointerDown={(e) =>
                      handleStartDrag(e, group.startRow, group.endRow)
                    }
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`group inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold shadow-sm transition-all cursor-grab active:cursor-grabbing ${
                      isBeingDragged
                        ? "scale-105 border-amber-500 bg-amber-500 text-white shadow-amber-500/30 opacity-100 ring-2 ring-amber-300"
                        : isGroupHovered
                          ? "scale-105 border-sky-500 bg-sky-500 text-white shadow-sky-500/30 opacity-100 ring-2 ring-sky-300"
                          : "border-slate-300/90 bg-white/90 text-slate-600 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 opacity-85"
                    }`}
                  >
                    {isColsMode ? (
                      <GripHorizontal
                        size={12}
                        className="shrink-0 text-current"
                      />
                    ) : (
                      <GripVertical
                        size={12}
                        className="shrink-0 text-current"
                      />
                    )}
                    <span>
                      {group.startRow + 1}–{group.endRow + 1}
                    </span>
                  </button>
                </div>

                {/* Sub-row handles (revealed only on hover to detach individual rows) */}
                {isGroupHovered &&
                  group.rowIndices.map((rIdx) => {
                    const rowB = boundsList[rIdx];
                    if (!rowB) return null;

                    const rowScreenX = offsetX + rowB.x * renderScale;
                    const rowScreenY = offsetY + rowB.y * renderScale;
                    const rowScreenH = rowB.height * renderScale;
                    const rowScreenW = rowB.width * renderScale;

                    // Symmetrical placement on the opposite side with equal 8px margin
                    const subLeft = isColsMode
                      ? rowScreenX + rowScreenW / 2
                      : rowScreenX + rowScreenW - 8;
                    const subTop = isColsMode
                      ? rowScreenY + rowScreenH - 8
                      : rowScreenY + rowScreenH / 2;

                    const isThisRowDragged =
                      dragState !== null &&
                      dragState.fromStart === rIdx &&
                      dragState.fromEnd === rIdx;

                    const rowDef = rowDefinitions?.[rIdx];
                    const canReverse = canReverseDefinition(rowDef);

                    return (
                      <div
                        key={`sub-row-handle-${rIdx}`}
                        className="absolute pointer-events-auto z-20 flex items-center gap-1"
                        style={{
                          left: subLeft,
                          top: subTop,
                          transform: isColsMode
                            ? "translate(-50%, -100%)"
                            : "translate(-100%, -50%)",
                        }}
                        onPointerEnter={() =>
                          handlePointerEnterRow(rIdx, group.id)
                        }
                      >
                        {canReverse && (
                          <button
                            type="button"
                            data-viewer-interactive="true"
                            aria-label={`Reverse cells in ${isColsMode ? "column" : "row"} ${rIdx + 1}`}
                            title={`Đảo thứ tự các ô trong ${isColsMode ? "Cột" : "Hàng"} ${rIdx + 1}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReverseRow?.(rIdx);
                            }}
                            className="inline-flex items-center justify-center rounded-md border border-sky-300 bg-white/95 dark:bg-slate-800/95 p-1 text-sky-700 dark:text-sky-300 shadow-sm transition-all hover:border-sky-500 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white hover:scale-105"
                          >
                            <ArrowLeftRight size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          data-viewer-interactive="true"
                          aria-label={`Detach and drag row ${rIdx + 1}`}
                          title={`Kéo để tách riêng ${isColsMode ? "Cột" : "Hàng"} ${rIdx + 1} ra khỏi khối`}
                          onPointerDown={(e) => handleStartDrag(e, rIdx, rIdx)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerCancel={handlePointerUp}
                          className={`group inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium shadow-sm transition-all cursor-grab active:cursor-grabbing ${
                            isThisRowDragged
                              ? "scale-105 border-amber-500 bg-amber-500 text-white shadow-amber-500/30 opacity-100 ring-2 ring-amber-300"
                              : "border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-500 hover:bg-sky-500 hover:text-white dark:border-sky-600 dark:bg-slate-800 dark:text-sky-300 opacity-90 shadow-sm"
                          }`}
                        >
                          {isColsMode ? (
                            <GripHorizontal
                              size={11}
                              className="shrink-0 text-current"
                            />
                          ) : (
                            <GripVertical
                              size={11}
                              className="shrink-0 text-current"
                            />
                          )}
                          <span>{rIdx + 1}</span>
                        </button>
                      </div>
                    );
                  })}
              </>
            ) : (
              /* Case B: Single Row Handle */
              <div
                className="absolute pointer-events-auto z-20 flex items-center gap-1"
                style={{
                  left: isColsMode ? screenX + screenW / 2 : screenX + 8,
                  top: screenY + 8,
                  transform: isColsMode ? "translateX(-50%)" : undefined,
                }}
                onPointerEnter={() =>
                  handlePointerEnterRow(group.startRow, group.id)
                }
              >
                <button
                  type="button"
                  data-viewer-interactive="true"
                  aria-label={`Drag to reorder ${isColsMode ? "column" : "row"} ${group.startRow + 1}`}
                  title={`Kéo để đổi vị trí ${isColsMode ? "Cột" : "Hàng"} ${group.startRow + 1}`}
                  onPointerDown={(e) =>
                    handleStartDrag(e, group.startRow, group.startRow)
                  }
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={`group inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold shadow-sm transition-all cursor-grab active:cursor-grabbing ${
                    isBeingDragged
                      ? "scale-105 border-amber-500 bg-amber-500 text-white shadow-amber-500/30 opacity-100 ring-2 ring-amber-300"
                      : isGroupHovered
                        ? "scale-105 border-sky-500 bg-sky-500 text-white shadow-sky-500/30 opacity-100 ring-2 ring-sky-300"
                        : "border-slate-300/90 bg-white/90 text-slate-600 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 opacity-80"
                  }`}
                >
                  {isColsMode ? (
                    <GripHorizontal
                      size={12}
                      className="shrink-0 text-current"
                    />
                  ) : (
                    <GripVertical size={12} className="shrink-0 text-current" />
                  )}
                  <span>{group.startRow + 1}</span>
                </button>

                {rowDefinitions && canReverseDefinition(rowDefinitions[group.startRow]) && (
                  <button
                    type="button"
                    data-viewer-interactive="true"
                    aria-label={`Reverse cells in ${isColsMode ? "column" : "row"} ${group.startRow + 1}`}
                    title={`Đảo thứ tự các ô trong ${isColsMode ? "Cột" : "Hàng"} ${group.startRow + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReverseRow?.(group.startRow);
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300/90 bg-white/90 dark:bg-slate-800/90 p-1 text-slate-600 dark:text-slate-200 shadow-sm transition-all hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-500 dark:hover:text-white hover:scale-105 opacity-80 hover:opacity-100"
                  >
                    <ArrowLeftRight size={11} />
                  </button>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* 3. Drop Target Insertion Line */}
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
