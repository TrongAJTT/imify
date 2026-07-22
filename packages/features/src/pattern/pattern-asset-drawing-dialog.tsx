import {
  createTransparentTrimmedBlob,
  renderDrawingSurface,
  toBrushPreview,
  toLocalCanvasPoint,
  type BrushPreview,
  type DrawingTool,
  type Stroke,
  type StrokeSmoothingSettings,
} from "@imify/features/pattern/pattern-drawing-utils";
import {
  BaseDialog,
  Button,
  CheckboxCard,
  ColorPickerPopover,
  NumberInput,
  SliderInput,
  TextInput,
  Tooltip,
} from "@imify/ui";
import { useShortcutActions } from "../filling/use-shortcut-actions";
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences";
import { Brush, Eraser, RotateCcw, Trash2, X } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "@imify/i18n";
import {
  DEFAULT_BRUSH_SIZE_BY_TOOL,
  type CanvasSize,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_STREAMLINE_PERCENT,
  DEFAULT_SMOOTHING_PERCENT,
  MIN_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
  BRUSH_SIZE_STEP,
} from "./config";
import { useBreakpoint } from "../shared/use-break-point";

interface PatternAssetDrawingDialogProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  sourceImageUrl?: string | null;
  initialSuggestedName?: string;
  onClose: () => void;
  onSave: (payload: { blob: Blob; suggestedName: string }) => void;
}

function normalizeSuggestedName(input: string | null | undefined): string {
  const trimmed = input?.trim();
  if (!trimmed) {
    return "drawn-asset";
  }

  return trimmed;
}

function sanitizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function stopEvent(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

function stopEventAndPreventDefault(event: any): void {
  event.stopPropagation();
  if (event.cancelable) {
    event.preventDefault();
  }
}

export function PatternAssetDrawingDialog({
  isOpen,
  mode = "create",
  sourceImageUrl,
  initialSuggestedName,
  onClose,
  onSave,
}: PatternAssetDrawingDialogProps) {
  const { t } = useTranslation("pattern");
  const { getShortcutLabel } = useShortcutPreferences();
  const isMd = useBreakpoint("md");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<DrawingTool>("brush");
  const [brushSizeByTool, setBrushSizeByTool] = useState<
    Record<DrawingTool, number>
  >({
    ...DEFAULT_BRUSH_SIZE_BY_TOOL,
  });
  const [color, setColor] = useState("#0f172a");
  const [suggestedName, setSuggestedName] = useState("drawn-asset");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushPreview, setBrushPreview] = useState<BrushPreview | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [hasClearedSource, setHasClearedSource] = useState(false);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    ...DEFAULT_CANVAS_SIZE,
  });
  const [smoothBrushStroke, setSmoothBrushStroke] = useState(true);
  const [streamlinePercent, setStreamlinePercent] = useState(
    DEFAULT_STREAMLINE_PERCENT,
  );
  const [smoothingPercent, setSmoothingPercent] = useState(
    DEFAULT_SMOOTHING_PERCENT,
  );

  const activeBrushSize = brushSizeByTool[tool];
  const combinedStrokes = useMemo(() => {
    if (activeStroke && activeStroke.points.length >= 2) {
      return [...strokes, activeStroke];
    }

    return strokes;
  }, [activeStroke, strokes]);
  const hasContent = useMemo(() => {
    if (sourceImage) {
      return true;
    }

    return combinedStrokes.length > 0;
  }, [combinedStrokes.length, sourceImage]);
  const canUndo = useMemo(() => {
    if (strokes.length > 0 || hasClearedSource) {
      return true;
    }

    return (activeStroke?.points.length ?? 0) > 0;
  }, [activeStroke?.points.length, hasClearedSource, strokes.length]);
  const hasUndoHistory = strokes.length > 0 || hasClearedSource;
  const decreaseBrushShortcut = getShortcutLabel(
    "pattern.draw.decrease_brush_size",
  );
  const increaseBrushShortcut = getShortcutLabel(
    "pattern.draw.increase_brush_size",
  );
  const brushSizeTooltipContent =
    t("tooltips.brushSizeShortcutsLabel").split(" ").pop() === "Shortcuts"
      ? `Decrease: ${decreaseBrushShortcut}\nIncrease: ${increaseBrushShortcut}`
      : `Giảm: ${decreaseBrushShortcut}\nTăng: ${increaseBrushShortcut}`;

  const brushSmoothingSettings = useMemo<StrokeSmoothingSettings>(() => {
    return {
      enabled: smoothBrushStroke,
      streamline: sanitizePercent(streamlinePercent) / 100,
      smoothing: sanitizePercent(smoothingPercent) / 100,
    };
  }, [smoothBrushStroke, streamlinePercent, smoothingPercent]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    renderDrawingSurface(ctx, {
      width: canvas.width,
      height: canvas.height,
      sourceImage,
      strokes: combinedStrokes,
    });
  }, [combinedStrokes, sourceImage]);

  const syncBrushPreviewRadius = useCallback((nextBrushSize: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scale = Math.max(rect.width / Math.max(canvas.width, 1), 0.0001);
    const nextRadius = Math.max(1, (nextBrushSize * scale) / 2);

    setBrushPreview((previous) => {
      if (!previous) {
        return previous;
      }

      if (Math.abs(previous.radius - nextRadius) < 0.01) {
        return previous;
      }

      return {
        ...previous,
        radius: nextRadius,
      };
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTool("brush");
    setBrushSizeByTool({ ...DEFAULT_BRUSH_SIZE_BY_TOOL });
    setColor("#0f172a");
    setStrokes([]);
    setActiveStroke(null);
    setIsDrawing(false);
    setBrushPreview(null);
    setSourceImage(null);
    setHasClearedSource(false);
    setCanvasSize({ ...DEFAULT_CANVAS_SIZE });
    setSmoothBrushStroke(true);
    setStreamlinePercent(DEFAULT_STREAMLINE_PERCENT);
    setSmoothingPercent(DEFAULT_SMOOTHING_PERCENT);
    setSuggestedName(normalizeSuggestedName(initialSuggestedName));
  }, [initialSuggestedName, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!sourceImageUrl) {
      setSourceImage(null);
      setHasClearedSource(false);
      setCanvasSize({ ...DEFAULT_CANVAS_SIZE });
      return;
    }

    let cancelled = false;
    const image = new window.Image();

    image.onload = () => {
      if (cancelled) {
        return;
      }

      setSourceImage(image);
      setHasClearedSource(false);
      setCanvasSize({
        width: Math.max(1, image.naturalWidth),
        height: Math.max(1, image.naturalHeight),
      });
    };

    image.onerror = () => {
      if (cancelled) {
        return;
      }

      setSourceImage(null);
      setCanvasSize({ ...DEFAULT_CANVAS_SIZE });
    };

    image.src = sourceImageUrl;

    return () => {
      cancelled = true;
    };
  }, [isOpen, sourceImageUrl]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const updateBrushSizeForActiveTool = useCallback(
    (next: number) => {
      const clamped = Math.max(
        MIN_BRUSH_SIZE,
        Math.min(MAX_BRUSH_SIZE, Math.round(next)),
      );

      setBrushSizeByTool((current) => ({
        ...current,
        [tool]: clamped,
      }));

      syncBrushPreviewRadius(clamped);
    },
    [syncBrushPreviewRadius, tool],
  );

  const beginStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      setBrushPreview(toBrushPreview(canvas, event, activeBrushSize));

      const point = toLocalCanvasPoint(canvas, event);
      const stroke: Stroke = {
        tool,
        color,
        size: activeBrushSize,
        points: [point],
        smoothing: tool === "brush" ? brushSmoothingSettings : undefined,
      };

      setActiveStroke(stroke);
      setIsDrawing(true);
      canvas.setPointerCapture(event.pointerId);
    },
    [activeBrushSize, brushSmoothingSettings, color, tool],
  );

  const continueStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      setBrushPreview(toBrushPreview(canvas, event, activeBrushSize));

      if (!isDrawing) {
        return;
      }

      const point = toLocalCanvasPoint(canvas, event);
      setActiveStroke((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          points: [...current.points, point],
        };
      });
    },
    [activeBrushSize, isDrawing],
  );

  const finishStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      canvas.releasePointerCapture(event.pointerId);
      setBrushPreview(toBrushPreview(canvas, event, activeBrushSize));

      let strokeToCommit: Stroke | null = null;

      flushSync(() => {
        setIsDrawing(false);
        setActiveStroke((current) => {
          if (current && current.points.length >= 2) {
            strokeToCommit = current;
          }
          return null;
        });
      });

      if (strokeToCommit) {
        flushSync(() => {
          setStrokes((previous) => [...previous, strokeToCommit as Stroke]);
        });
      }
    },
    [activeBrushSize, isDrawing],
  );

  const handleUndo = useCallback(() => {
    setActiveStroke(null);
    setStrokes((previous) => previous.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setActiveStroke(null);
    setStrokes([]);

    if (sourceImage) {
      setSourceImage(null);
      setHasClearedSource(true);
    }
  }, [sourceImage]);

  const increaseBrushSize = useCallback(() => {
    updateBrushSizeForActiveTool(activeBrushSize + BRUSH_SIZE_STEP);
  }, [activeBrushSize, updateBrushSizeForActiveTool]);

  const decreaseBrushSize = useCallback(() => {
    updateBrushSizeForActiveTool(activeBrushSize - BRUSH_SIZE_STEP);
  }, [activeBrushSize, updateBrushSizeForActiveTool]);

  useEffect(() => {
    syncBrushPreviewRadius(activeBrushSize);
  }, [activeBrushSize, syncBrushPreviewRadius]);

  useShortcutActions(
    [
      {
        actionId: "pattern.draw.decrease_brush_size",
        enabled: isOpen,
        handler: () => decreaseBrushSize(),
      },
      {
        actionId: "pattern.draw.increase_brush_size",
        enabled: isOpen,
        handler: () => increaseBrushSize(),
      },
      {
        actionId: "pattern.draw.undo",
        enabled: isOpen,
        handler: () => handleUndo(),
      },
      {
        actionId: "pattern.draw.clear",
        enabled: isOpen,
        handler: () => handleClear(),
      },
    ],
    isOpen,
  );

  const handleSave = useCallback(async () => {
    const blob = await createTransparentTrimmedBlob({
      width: canvasSize.width,
      height: canvasSize.height,
      sourceImage,
      strokes: combinedStrokes,
    });

    if (!blob) {
      return;
    }

    onSave({
      blob,
      suggestedName: normalizeSuggestedName(suggestedName),
    });
  }, [
    canvasSize.height,
    canvasSize.width,
    combinedStrokes,
    onSave,
    sourceImage,
    suggestedName,
  ]);

  const handleManualClose = useCallback(() => {
    if (hasUndoHistory) {
      const confirmed = window.confirm(t("tooltips.unsavedChangesConfirm"));
      if (!confirmed) {
        return;
      }
    }

    onClose();
  }, [hasUndoHistory, onClose, t]);

  const saveButtonLabel =
    mode === "edit" ? t("drawingDialog.updateBtn") : t("drawingDialog.saveBtn");

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      isDirty={hasUndoHistory}
      className="max-w-5xl"
      contentClassName="w-full max-w-[96vw] rounded-2xl"
      stickyHeader
      stickyFooter
      header={
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t("drawingDialog.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleManualClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close drawing dialog"
          >
            <X size={16} />
          </button>
        </div>
      }
      footer={
        <div className="flex justify-between p-4">
          <div className="flex gap-2">
            {/* Undo button */}
            <Tooltip
              label={`${t("drawingDialog.undoBtn")} (${getShortcutLabel("pattern.draw.undo")})`}
              content={t("tooltips.undoStroke")}
              variant="nowrap"
            >
              <span className="block">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="w-full"
                >
                  <RotateCcw size={14} />
                  {isMd && t("drawingDialog.undoBtn")}
                </Button>
              </span>
            </Tooltip>

            {/* Clear button */}
            <Tooltip
              label={`${t("drawingDialog.clearBtn")} (${getShortcutLabel("pattern.draw.clear")})`}
              content={t("tooltips.clearCanvas")}
              variant="nowrap"
            >
              <span className="block">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClear}
                  disabled={!hasContent}
                  className="w-full"
                >
                  <Trash2 size={14} />
                  {isMd && t("drawingDialog.clearBtn")}
                </Button>
              </span>
            </Tooltip>
          </div>

          <div className="flex gap-2">
            {/* Cancel button */}
            <Button variant="secondary" size="sm" onClick={handleManualClose}>
              {t("common:cancel")}
            </Button>

            {/* Save button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={!hasContent}
            >
              {saveButtonLabel}
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-3" onWheel={stopEventAndPreventDefault}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/20 p-3">
            <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc),linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc)] dark:bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a),linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_75%,#0f172a_75%,#0f172a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="w-full h-auto rounded-lg touch-none cursor-none"
                onPointerDown={(event) => {
                  stopEventAndPreventDefault(event);
                  beginStroke(event);
                }}
                onPointerMove={(event) => {
                  stopEventAndPreventDefault(event);
                  continueStroke(event);
                }}
                onPointerUp={(event) => {
                  stopEventAndPreventDefault(event);
                  finishStroke(event);
                }}
                onPointerCancel={(event) => {
                  stopEventAndPreventDefault(event);
                  finishStroke(event);
                }}
                onPointerEnter={(event) => {
                  stopEvent(event);
                  const canvas = canvasRef.current;
                  if (!canvas) {
                    return;
                  }

                  setBrushPreview(
                    toBrushPreview(canvas, event, activeBrushSize),
                  );
                }}
                onPointerLeave={() => {
                  if (!isDrawing) {
                    setBrushPreview(null);
                  }
                }}
                onWheel={stopEventAndPreventDefault}
              />

              {brushPreview && (
                <div
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                    tool === "eraser"
                      ? "border-rose-400/90 bg-rose-300/10"
                      : "border-sky-500/90 bg-sky-300/10"
                  }`}
                  style={{
                    left: `${brushPreview.x}px`,
                    top: `${brushPreview.y}px`,
                    width: `${brushPreview.radius * 2}px`,
                    height: `${brushPreview.radius * 2}px`,
                  }}
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">
            <TextInput
              label={
                t("assetListItem.editInDraw").split(" ").pop() === "Draw"
                  ? "Asset Name"
                  : "Tên tài nguyên"
              }
              value={suggestedName}
              onChange={setSuggestedName}
              placeholder="drawn-asset"
              maxLength={80}
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tool === "brush" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTool("brush")}
                className="w-full"
              >
                <Brush size={14} />
                {t("drawingDialog.brush")}
              </Button>
              <Button
                variant={tool === "eraser" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTool("eraser")}
                className="w-full"
              >
                <Eraser size={14} />
                {t("drawingDialog.eraser")}
              </Button>
            </div>

            {tool === "brush" && (
              <div className="space-y-2">
                <CheckboxCard
                  title={t("drawingDialog.smoothBrush")}
                  subtitle={
                    smoothBrushStroke
                      ? t("common.enabled", { defaultValue: "Enabled" })
                      : t("common.disabled", { defaultValue: "Disabled" })
                  }
                  checked={smoothBrushStroke}
                  onChange={setSmoothBrushStroke}
                  tooltipLabel={t("tooltips.curveSmoothingLabel")}
                  tooltipContent={t("tooltips.curveSmoothingContent")}
                  className="px-2 py-1.5"
                />

                {smoothBrushStroke && (
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label={t("drawingDialog.streamline")}
                      value={sanitizePercent(streamlinePercent)}
                      min={0}
                      max={100}
                      step={1}
                      onChangeValue={(value) =>
                        setStreamlinePercent(sanitizePercent(value))
                      }
                    />
                    <NumberInput
                      label={t("drawingDialog.smoothing")}
                      value={sanitizePercent(smoothingPercent)}
                      min={0}
                      max={100}
                      step={1}
                      onChangeValue={(value) =>
                        setSmoothingPercent(sanitizePercent(value))
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {tool === "brush" && (
              <ColorPickerPopover
                label={t("drawingDialog.brushColor")}
                value={color}
                onChange={setColor}
                enableGradient={false}
                enableAlpha={false}
                outputMode="hex"
              />
            )}

            <div className="space-y-3">
              <SliderInput
                label={t("drawingDialog.brushSize")}
                value={activeBrushSize}
                onChange={updateBrushSizeForActiveTool}
                tooltipLabel={t("tooltips.brushSizeShortcutsLabel")}
                tooltipContent={brushSizeTooltipContent}
                min={MIN_BRUSH_SIZE}
                max={MAX_BRUSH_SIZE}
                step={BRUSH_SIZE_STEP}
              />
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
}
