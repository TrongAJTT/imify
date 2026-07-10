import React, { useCallback, useEffect, useRef, useState } from "react";
import { BaseDialog, Kicker } from "@imify/ui";
import { useInspectorStore } from "@imify/stores/stores/inspector-store";
import { InteractivePreview, type PixelSample } from "./interactive-preview";

interface VisualAnalysisDialogProps {
  imageUrl: string;
  alt: string;
}

// Loupe dimensions for the standalone panel
const LOUPE_WIDTH = 192;
const LOUPE_HEIGHT = 108;
const LOUPE_SAMPLE_SIZE = 14;

// Loupe dimensions for the hover overlay floating panel
const HOVER_LOUPE_SIZE = 130;

export function VisualAnalysisDialog({
  imageUrl,
  alt,
}: VisualAnalysisDialogProps) {
  const isOpen = useInspectorStore((s) => s.visualAnalysisDialogOpen);
  const setOpen = useInspectorStore((s) => s.setVisualAnalysisDialogOpen);
  const previewChannelMode = useInspectorStore((s) => s.previewChannelMode);
  const colorBlindMode = useInspectorStore((s) => s.colorBlindMode);
  const loupeEnabled = useInspectorStore((s) => s.loupeEnabled);
  const loupeZoom = useInspectorStore((s) => s.loupeZoom);

  const [sample, setSample] = useState<PixelSample | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Ref for the standalone loupe in the right panel
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ref for the hover overlay loupe
  const hoverLoupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse position relative to preview container for overlay positioning
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Shared loupe drawing helper
  const drawLoupe = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number, forceDraw = false) => {
      if (!sample || (!loupeEnabled && !forceDraw) || !isReady) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const MAX_PREVIEW_EDGE = 1600;
        const scale = Math.min(
          1,
          MAX_PREVIEW_EDGE / Math.max(img.width, img.height),
        );
        const imgW = Math.max(1, Math.round(img.width * scale));
        const imgH = Math.max(1, Math.round(img.height * scale));
        const tempCanvas = new OffscreenCanvas(imgW, imgH);
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;
        tempCtx.drawImage(img, 0, 0, imgW, imgH);

        const currentZoom = loupeEnabled ? loupeZoom : 1;
        const loupeRatio = w / h;
        const effectiveSampleHeight = Math.max(
          4,
          Math.round((LOUPE_SAMPLE_SIZE * 8) / Math.max(2, currentZoom)),
        );
        const effectiveSampleWidth = Math.max(
          4,
          Math.round(effectiveSampleHeight * loupeRatio),
        );
        const halfW = Math.floor(effectiveSampleWidth / 2);
        const halfH = Math.floor(effectiveSampleHeight / 2);
        const clamp = (v: number, min: number, max: number) =>
          Math.max(min, Math.min(max, v));
        const sx = clamp(sample.x - halfW, 0, Math.max(0, imgW - effectiveSampleWidth));
        const sy = clamp(sample.y - halfH, 0, Math.max(0, imgH - effectiveSampleHeight));

        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, sx, sy, effectiveSampleWidth, effectiveSampleHeight, 0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      };
    },
    [imageUrl, isReady, loupeEnabled, loupeZoom, sample],
  );

  // Draw standalone loupe in the right panel
  useEffect(() => {
    const canvas = loupeCanvasRef.current;
    if (!canvas) return;
    drawLoupe(canvas, LOUPE_WIDTH, LOUPE_HEIGHT);
  }, [drawLoupe]);

  // Draw hover loupe
  useEffect(() => {
    const canvas = hoverLoupeCanvasRef.current;
    if (!canvas) return;
    drawLoupe(canvas, HOVER_LOUPE_SIZE, HOVER_LOUPE_SIZE, true);
  }, [drawLoupe]);

  // Check if device supports hover (typically desktop with mouse)
  const [isMobileTouch, setIsMobileTouch] = useState(false);

  useEffect(() => {
    // Check if the primary pointer supports hovering (true for mouse/trackpad, false for touchscreen)
    const mediaQuery = window.matchMedia("(hover: none)");
    setIsMobileTouch(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobileTouch(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Track mouse position inside the preview container for overlay placement
  const handlePreviewMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = previewContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [],
  );

  const handlePreviewMouseLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  // Compute overlay position (keep it from overflowing container edges)
  const getOverlayStyle = (): React.CSSProperties => {
    if (!hoverPos || !previewContainerRef.current) return { display: "none" };
    const container = previewContainerRef.current;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const PANEL_W = 196; // approximate width of overlay panel
    const PANEL_H = 220; // approximate height of overlay panel
    const OFFSET_X = 14;
    const OFFSET_Y = 14;

    let left = hoverPos.x + OFFSET_X;
    let top = hoverPos.y + OFFSET_Y;

    if (left + PANEL_W > containerW) left = hoverPos.x - PANEL_W - OFFSET_X;
    if (top + PANEL_H > containerH) top = hoverPos.y - PANEL_H - OFFSET_Y;
    if (left < 0) left = OFFSET_X;
    if (top < 0) top = OFFSET_Y;

    return { left, top };
  };

  // On desktop, we always show the popover on hover even if loupe is disabled (we default to 1x zoom in that case)
  const showHoverOverlay = !isMobileTouch && isReady && sample && hoverPos !== null;

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      contentClassName="h-[70vh] max-h-[70vh] w-[min(1100px,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-x-hidden rounded-md p-3 sm:p-4 lg:p-5"
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:gap-6">
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row lg:gap-6">
          {/* Left: Interactive image preview with hover overlay */}
          <div
            ref={previewContainerRef}
            className="relative flex min-h-[220px] min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20"
            onMouseMove={handlePreviewMouseMove}
            onMouseLeave={handlePreviewMouseLeave}
          >
            <div className="flex h-full w-full items-center justify-center p-2">
              <div className="mt-auto aspect-square w-full">
                <InteractivePreview
                  imageUrl={imageUrl}
                  alt={alt}
                  channelMode={previewChannelMode}
                  colorBlindMode={colorBlindMode}
                  loupeEnabled={loupeEnabled}
                  loupeZoom={loupeZoom}
                  onSampleChange={setSample}
                  onReadyChange={setIsReady}
                  hideOverlays={true}
                  maxDisplayHeight={560}
                />
              </div>
            </div>

            {/* Hover overlay panel — floats near cursor */}
            {showHoverOverlay && (
              <div
                className="pointer-events-none absolute z-10 w-48 overflow-hidden rounded-xl border border-slate-300/50 bg-white/90 shadow-xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/90"
                style={getOverlayStyle()}
              >
                {/* Zoom canvas */}
                <div className="relative overflow-hidden bg-black/5 dark:bg-white/5">
                  <canvas
                    ref={hoverLoupeCanvasRef}
                    style={{
                      imageRendering: "pixelated",
                      width: "100%",
                      height: HOVER_LOUPE_SIZE,
                      display: "block",
                    }}
                  />
                  {/* Zoom badge */}
                  <div className="absolute bottom-1.5 right-1.5 rounded bg-slate-900/65 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-sm">
                    {loupeEnabled ? loupeZoom : 1}×
                  </div>
                </div>

                {/* Pixel info */}
                <div className="px-2.5 py-2 space-y-1.5">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Pixel Sample
                  </span>

                  {/* Color swatch + hex */}
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 shrink-0 rounded-md border border-white/30 shadow-inner"
                      style={{ backgroundColor: sample.hex }}
                    />
                    <div>
                      <div className="font-mono text-[11px] font-bold uppercase text-slate-900 dark:text-white">
                        {sample.hex}
                      </div>
                      <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400">
                        {sample.r}, {sample.g}, {sample.b}
                      </div>
                    </div>
                  </div>

                  {/* Channel values grid */}
                  <div className="grid grid-cols-4 gap-1 border-t border-slate-100 dark:border-slate-700/50 pt-1.5">
                    {[
                      { label: "R", value: sample.r, color: "text-rose-500" },
                      { label: "G", value: sample.g, color: "text-emerald-500" },
                      { label: "B", value: sample.b, color: "text-blue-500" },
                      { label: "A", value: sample.a, color: "text-slate-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center">
                        <div className={`text-[9px] font-bold ${color}`}>{label}</div>
                        <div className="font-mono text-[10px] font-medium text-slate-700 dark:text-slate-300">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coords + alpha */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-1.5 text-[9px]">
                    <span className="text-slate-400">Coord</span>
                    <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                      {sample.x}, {sample.y}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hint when not hovering */}
            {!sample && isReady && (
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/55 px-3 py-1 text-[10px] text-white/80 backdrop-blur-sm">
                Hover to inspect pixel
              </div>
            )}
          </div>

          {/* Right: Standalone loupe + color info panel */}
          <div className="w-full min-w-0 shrink-0 overflow-y-auto lg:w-72 lg:pr-1">
            <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
              <div>
                <Kicker>
                  Move mouse over image to analyze. Adjust modes in Display
                  Accordion. Click inside the image to copy the pixel color.
                </Kicker>
                {/* Standalone Loupe */}
                <div className="mt-2 relative aspect-[16/9] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden shadow-sm">
                  {loupeEnabled && isReady && sample ? (
                    <>
                      <canvas
                        ref={loupeCanvasRef}
                        style={{
                          imageRendering: "pixelated",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                      <div className="absolute bottom-1.5 right-1.5 rounded-md bg-slate-900/60 transition-colors text-white text-[10px] px-2 py-0.5 backdrop-blur-sm">
                        {loupeZoom}x
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {loupeEnabled
                          ? "Hover over image to inspect"
                          : "Loupe is disabled"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Standalone Color & Pixel Info */}
              <div className="space-y-3">
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-3 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Pixel Sample
                  </span>

                  {sample ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-8 w-8 rounded-md shadow-inner border border-white/20"
                          style={{ backgroundColor: sample.hex }}
                        />
                        <div>
                          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">
                            {sample.hex}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            RGB({sample.r}, {sample.g}, {sample.b})
                          </div>
                        </div>
                      </div>

                      {/* Channel bars */}
                      <div className="space-y-1.5">
                        {[
                          { label: "R", value: sample.r, color: "bg-rose-500" },
                          { label: "G", value: sample.g, color: "bg-emerald-500" },
                          { label: "B", value: sample.b, color: "bg-blue-500" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="w-3 text-[9px] font-bold text-slate-400">
                              {label}
                            </span>
                            <div className="relative flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`absolute inset-y-0 left-0 rounded-full ${color}`}
                                style={{ width: `${(value / 255) * 100}%` }}
                              />
                            </div>
                            <span className="w-6 text-right font-mono text-[9px] text-slate-500">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase mb-0.5">
                            X coord
                          </span>
                          <span className="text-xs font-mono font-medium">
                            {sample.x}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase mb-0.5">
                            Y coord
                          </span>
                          <span className="text-xs font-mono font-medium">
                            {sample.y}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase mb-0.5">
                            Alpha
                          </span>
                          <span className="text-xs font-mono font-medium">
                            {sample.a}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-[11px] text-slate-400 italic">
                      Sample pixels...
                    </div>
                  )}
                </div>

                {/* Tools info (compact) */}
                <div className="px-1 space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Channel</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {previewChannelMode === "all"
                        ? "RGB"
                        : previewChannelMode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Simulation</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {colorBlindMode === "none" ? "Normal" : colorBlindMode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
}
