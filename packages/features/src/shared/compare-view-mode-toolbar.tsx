"use client";

import React from "react";
import { Columns, LayoutGrid, SquareMousePointer, Move, Mouse } from "lucide-react";
import { Button, InfoPopover } from "@imify/ui";

export type CompareViewMode = "split" | "side_by_side";

interface CompareViewModeToolbarProps {
  viewMode: CompareViewMode;
  onViewModeChange: (mode: CompareViewMode) => void;
  showGuide?: boolean;
  className?: string;
}

export function CompareViewModeToolbar({
  viewMode,
  onViewModeChange,
  showGuide = false,
  className = "",
}: CompareViewModeToolbarProps) {
  return (
    <div className={`flex items-center justify-center gap-3 pt-2 ${className}`}>
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 shadow-md">
        <Button
          variant={viewMode === "split" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("split")}
          className={`rounded-full h-9 px-5 gap-2.5 transition-all ${
            viewMode === "split" ? "shadow-sm" : ""
          }`}
        >
          <Columns size={16} />
          <span className="text-sm font-semibold">Slider</span>
        </Button>
        <Button
          variant={viewMode === "side_by_side" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("side_by_side")}
          className={`rounded-full h-9 px-5 gap-2.5 transition-all ${
            viewMode === "side_by_side" ? "shadow-sm" : ""
          }`}
        >
          <LayoutGrid size={16} />
          <span className="text-sm font-semibold">Side-by-side</span>
        </Button>
      </div>

      {showGuide && (
        <div className="flex h-10 items-center">
          <InfoPopover label="Interaction Guide" icon={SquareMousePointer} iconSize={18}>
            <div className="flex flex-col gap-1.5 p-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Move size={14} className="text-sky-500" />
                <span><strong>Drag</strong> on the image to pan</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Mouse size={14} className="text-sky-500" />
                <span><strong>Scroll</strong> (Mouse Wheel) to zoom</span>
              </div>
            </div>
          </InfoPopover>
        </div>
      )}
    </div>
  );
}
