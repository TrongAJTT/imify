import React from "react";
import type {
  DiffAlignAnchor,
  DiffAlignMode,
  MultiImageLayout2,
  MultiImageLayout3,
  MultiImageLayout4,
} from "./types";

export interface MultiImageItem {
  label: string;
  url: string;
  bgColor?: string | null;
}

interface ViewerSideBySideProps {
  images: MultiImageItem[];
  zoom: number;
  panX: number;
  panY: number;
  alignAnchor?: DiffAlignAnchor;
  alignMode?: DiffAlignMode;
  multiImageLayout2?: MultiImageLayout2;
  multiImageLayout3?: MultiImageLayout3;
  multiImageLayout4?: MultiImageLayout4;
}

export function ViewerSideBySide({
  images,
  zoom,
  panX,
  panY,
  alignAnchor = "center",
  alignMode = "fit-larger",
  multiImageLayout2 = "2_cols",
  multiImageLayout3 = "3_cols",
  multiImageLayout4 = "2x2_grid",
}: ViewerSideBySideProps) {
  const imageStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: alignMode === "original" ? "none" : "contain",
    objectPosition: alignAnchor === "top-left" ? "left top" : "center",
    transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
    transformOrigin: "center center",
    pointerEvents: "none",
    userSelect: "none",
  };

  let gridClasses = "grid-cols-2";
  if (images.length === 2) {
    gridClasses =
      multiImageLayout2 === "2_rows"
        ? "grid-rows-2 grid-cols-1"
        : "grid-cols-2";
  } else if (images.length === 3) {
    gridClasses =
      multiImageLayout3 === "3_rows"
        ? "grid-rows-3 grid-cols-1"
        : "grid-cols-3";
  } else if (images.length >= 4) {
    if (multiImageLayout4 === "4_cols") {
      gridClasses = "grid-cols-4";
    } else if (multiImageLayout4 === "4_rows") {
      gridClasses = "grid-rows-4 grid-cols-1";
    } else {
      gridClasses = "grid-cols-2 grid-rows-2";
    }
  }

  return (
    <div className={`absolute inset-0 grid ${gridClasses}`}>
      {images.map((item, idx) => {
        const isRightBorder =
          (images.length === 2 && multiImageLayout2 === "2_cols" && idx === 0) ||
          (images.length === 3 && multiImageLayout3 === "3_cols" && idx < 2) ||
          (images.length >= 4 && multiImageLayout4 === "4_cols" && idx < 3) ||
          (images.length >= 4 &&
            multiImageLayout4 === "2x2_grid" &&
            (idx === 0 || idx === 2));

        const isBottomBorder =
          (images.length === 2 && multiImageLayout2 === "2_rows" && idx === 0) ||
          (images.length === 3 && multiImageLayout3 === "3_rows" && idx < 2) ||
          (images.length >= 4 && multiImageLayout4 === "4_rows" && idx < 3) ||
          (images.length >= 4 &&
            multiImageLayout4 === "2x2_grid" &&
            (idx === 0 || idx === 1));

        return (
          <div
            key={item.label || idx}
            className={`relative overflow-hidden ${
              isRightBorder
                ? "border-r border-white/70 dark:border-slate-600/70"
                : ""
            } ${
              isBottomBorder
                ? "border-b border-white/70 dark:border-slate-600/70"
                : ""
            }`}
            style={{ backgroundColor: item.bgColor || "transparent" }}
          >
            <img
              src={item.url}
              alt={item.label}
              style={imageStyle}
              draggable={false}
            />
            <div className="pointer-events-none absolute top-3 left-3 z-10 select-none rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
