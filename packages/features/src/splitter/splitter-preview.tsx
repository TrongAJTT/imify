import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatingSpinner } from "@imify/ui";
import { CanvasViewportShell } from "../shared/canvas-viewport-shell";
import type { PreviewInteractionMode } from "@imify/ui";
import type { SplitterSplitPlan, SplitterSplitSettings } from "./types";
import { hasFileDragPayload } from "../shared/image-file-utils";
import { useTranslation } from "@imify/i18n";
import { getInitialCanvasHeightPx } from "@imify/core";
interface SplitterPreviewProps {
  image: {
    name: string;
    previewUrl: string;
    width: number;
    height: number;
  } | null;
  plan: SplitterSplitPlan | null;
  warningText?: string | null;
  onDropFiles?: (files: FileList | null) => void;
  isComputing?: boolean;
  previewInteractionMode?: PreviewInteractionMode;
  splitSettings?: SplitterSplitSettings;
  onBasicGuideChange?: (axis: "x" | "y", value: number) => void;
}

export function SplitterPreview({
  image,
  plan,
  warningText,
  onDropFiles,
  isComputing = false,
  previewInteractionMode = "zoom",
  splitSettings,
  onBasicGuideChange,
}: SplitterPreviewProps) {
  const { t } = useTranslation("splitter");
  const PREVIEW_ZOOM_FACTOR = 0.15;

  const [isDragOver, setIsDragOver] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [containerHeight, setContainerHeight] = useState(() =>
    getInitialCanvasHeightPx(520),
  );
  const [frameWidth, setFrameWidth] = useState(0);
  const previewFrameRef = useRef<HTMLDivElement>(null);

  const guideBoxRef = useRef<HTMLDivElement>(null);
  const dragAxisRef = useRef<"x" | "y" | null>(null);

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    const syncFrameWidth = () => {
      setFrameWidth(frame.clientWidth);
    };

    syncFrameWidth();
    const observer = new ResizeObserver(syncFrameWidth);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const renderedImageBox = useMemo(() => {
    if (!image) return { width: 0, height: 0 };
    const safeHeight = Math.max(1, containerHeight);
    const safeWidth = Math.max(1, frameWidth);
    const imageAspect = Math.max(1, image.width) / Math.max(1, image.height);
    const frameAspect = safeWidth / safeHeight;

    if (frameAspect > imageAspect) {
      return {
        width: Math.round(safeHeight * imageAspect),
        height: safeHeight,
      };
    }

    return {
      width: safeWidth,
      height: Math.round(safeWidth / imageAspect),
    };
  }, [containerHeight, frameWidth, image]);

  if (!image) {
    return null;
  }

  const xCuts = plan?.xCuts.slice(1, -1) ?? [];
  const yCuts = plan?.yCuts.slice(1, -1) ?? [];
  const isAutoSpriteMode =
    splitSettings?.mode === "advanced" &&
    splitSettings.advancedMethod === "auto_sprite";
  const firstXCut = xCuts[0] ?? null;
  const firstYCut = yCuts[0] ?? null;
  const canDragXGuide =
    splitSettings?.mode === "basic" &&
    (splitSettings.direction === "vertical" ||
      splitSettings.direction === "grid") &&
    firstXCut != null;
  const canDragYGuide =
    splitSettings?.mode === "basic" &&
    (splitSettings.direction === "horizontal" ||
      splitSettings.direction === "grid") &&
    firstYCut != null;

  const guideColor = splitSettings?.guideColor?.trim() || "#06b6d4";

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const axis = dragAxisRef.current;
      const guideBox = guideBoxRef.current;
      if (!axis || !guideBox || !onBasicGuideChange) {
        return;
      }

      const rect = guideBox.getBoundingClientRect();
      if (axis === "x") {
        const relative = Math.max(
          1,
          Math.min(rect.width - 1, event.clientX - rect.left),
        );
        const sourceValue = Math.round((relative / rect.width) * image.width);
        onBasicGuideChange("x", sourceValue);
        return;
      }

      const relative = Math.max(
        1,
        Math.min(rect.height - 1, event.clientY - rect.top),
      );
      const sourceValue = Math.round((relative / rect.height) * image.height);
      onBasicGuideChange("y", sourceValue);
    };

    const handleUp = () => {
      dragAxisRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [image.height, image.width, onBasicGuideChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span className="truncate">
          {t("previewLabel")}: {image.name}
        </span>
        <span className="shrink-0">
          {(plan?.rects.length ?? 0) === 1
            ? t("slicesCount_one")
            : t("slicesCount_other", { count: plan?.rects.length ?? 0 })}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-100 p-1.5 sm:p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div
          ref={previewFrameRef}
          onDragOver={(event) => {
            if (!onDropFiles || !hasFileDragPayload(event.dataTransfer)) return;
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => {
            if (!onDropFiles) return;
            setIsDragOver(false);
          }}
          onDrop={(event) => {
            if (!onDropFiles || !hasFileDragPayload(event.dataTransfer)) return;
            event.preventDefault();
            setIsDragOver(false);
            onDropFiles(event.dataTransfer.files);
          }}
        >
          <CanvasViewportShell
            zoom={zoom}
            panX={pan.x}
            panY={pan.y}
            onZoomChange={(v) => setZoom(Math.max(50, Math.min(10000, v)))}
            onPanChange={(x, y) => setPan({ x, y })}
            containerHeight={containerHeight}
            onHeightChange={setContainerHeight}
            minHeight={240}
            interactionMode={previewInteractionMode}
            minZoom={50}
            maxZoom={10000}
            className={`mx-auto bg-white dark:bg-slate-950 ${
              isDragOver
                ? "border-cyan-500 ring-2 ring-cyan-300/60 dark:ring-cyan-700/60"
                : "border-slate-300 dark:border-slate-700"
            }`}
            applyTransformToChildren={true}
          >
            <div
              ref={guideBoxRef}
              className="relative overflow-hidden"
              style={{
                width: `${Math.max(1, renderedImageBox.width)}px`,
                height: `${Math.max(1, renderedImageBox.height)}px`,
              }}
            >
              <img
                src={image.previewUrl}
                alt={image.name}
                className="h-full w-full object-fill pointer-events-none"
                draggable={false}
              />

              <div className="pointer-events-none absolute inset-0">
                {isAutoSpriteMode
                  ? (plan?.rects ?? []).map((rect) => (
                      <div
                        key={`sprite_${rect.index}_${rect.x}_${rect.y}`}
                        className="absolute border"
                        style={{
                          left: `${(rect.x / image.width) * 100}%`,
                          top: `${(rect.y / image.height) * 100}%`,
                          width: `${(rect.width / image.width) * 100}%`,
                          height: `${(rect.height / image.height) * 100}%`,
                          borderColor: guideColor,
                        }}
                      />
                    ))
                  : null}

                {!isAutoSpriteMode
                  ? xCuts.map((cut) => (
                      <div
                        key={`x_${cut}`}
                        className="absolute top-0 bottom-0 w-px"
                        style={{
                          left: `${(cut / image.width) * 100}%`,
                          backgroundColor: guideColor,
                        }}
                      />
                    ))
                  : null}

                {!isAutoSpriteMode
                  ? yCuts.map((cut) => (
                      <div
                        key={`y_${cut}`}
                        className="absolute left-0 right-0 h-px"
                        style={{
                          top: `${(cut / image.height) * 100}%`,
                          backgroundColor: guideColor,
                        }}
                      />
                    ))
                  : null}
              </div>
              {canDragXGuide ? (
                <button
                  type="button"
                  data-viewer-interactive="true"
                  className="absolute top-0 bottom-0 z-20 w-4 -translate-x-1/2 cursor-ew-resize bg-transparent pointer-events-auto"
                  style={{ left: `${(firstXCut / image.width) * 100}%` }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dragAxisRef.current = "x";
                  }}
                  aria-label="Adjust first vertical guide"
                />
              ) : null}
              {canDragYGuide ? (
                <button
                  type="button"
                  data-viewer-interactive="true"
                  className="absolute left-0 right-0 z-20 h-4 -translate-y-1/2 cursor-ns-resize bg-transparent pointer-events-auto"
                  style={{ top: `${(firstYCut / image.height) * 100}%` }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dragAxisRef.current = "y";
                  }}
                  aria-label="Adjust first horizontal guide"
                />
              ) : null}
            </div>

            {isDragOver ? (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cyan-500/15 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                {t("dropImagesToImport")}
              </div>
            ) : null}

            {isComputing ? (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-600/90 dark:bg-slate-900/90 dark:text-slate-200">
                  <AnimatingSpinner size={12} />
                  <span className="truncate">{t("computingSplitPreview")}</span>
                </div>
              </div>
            ) : null}
          </CanvasViewportShell>
        </div>
      </div>

      {warningText ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
          {warningText}
        </div>
      ) : null}
    </div>
  );
}
