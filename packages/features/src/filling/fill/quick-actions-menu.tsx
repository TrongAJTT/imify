import React, { useState, useMemo, useCallback } from "react";
import {
  Maximize2,
  Minimize2,
  StretchHorizontal,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sparkles,
  Layers,
  Square,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  Circle,
  ArrowRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
  RefreshCw,
  Palette,
  CornerUpRight,
  type LucideIcon,
} from "lucide-react";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { useFillUiStore } from "@imify/stores/stores/fill-ui-store";
import {
  QuickActionsMenuFrame,
  type QuickActionSection,
} from "../../shared/quick-actions-menu-frame";
import {
  DEFAULT_IMAGE_TRANSFORM,
  type FillingTemplate,
  type LayerFillState,
} from "../types";
import { useTranslation } from "@imify/i18n";

type QuickActionScope = "all" | "selected";
type AlignmentPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface FillQuickActionsMenuProps {
  template: FillingTemplate;
  selectedLayerId: string | null;
  loadedImages: Map<string, HTMLImageElement>;
  disabled?: boolean;
}

export function FillQuickActionsMenu({
  template,
  selectedLayerId,
  loadedImages,
  disabled = false,
}: FillQuickActionsMenuProps) {
  const { t } = useTranslation(["filling", "common"]);

  const [scope, setScope] = useState<QuickActionScope>("all");

  const layerFillStates = useFillingStore((s) => s.layerFillStates);
  const setLayerFillStates = useFillingStore((s) => s.setLayerFillStates);
  const updateSavedTextLayerConfig = useFillingStore(
    (s) => s.updateSavedTextLayerConfig,
  );
  const updateSessionTemplate = useFillUiStore((s) => s.updateSessionTemplate);

  const totalLayerCount = useMemo(() => {
    return template.layers.length + (template.textLayers?.length ?? 0);
  }, [template.layers, template.textLayers]);

  // Target layer IDs based on scope (vector layers and text layers)
  const getTargetLayerIds = useCallback((): string[] => {
    if (scope === "selected" && selectedLayerId) {
      return [selectedLayerId];
    }
    const layerIds = template.layers.map((l) => l.id);
    const textLayerIds = (template.textLayers ?? []).map((tl) => tl.id);
    return [...layerIds, ...textLayerIds];
  }, [scope, selectedLayerId, template.layers, template.textLayers]);

  // 1. FIT ACTIONS
  const handleApplyFit = useCallback(
    (mode: "fill" | "cover" | "contain") => {
      const targetIds = new Set(getTargetLayerIds());
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId) || !state.imageUrl) return state;

        const layer = template.layers.find((l) => l.id === state.layerId);
        const img = loadedImages.get(state.layerId);
        if (!layer || !img) return state;

        const naturalWidth = img.naturalWidth || 1;
        const naturalHeight = img.naturalHeight || 1;

        let scaleX = 1;
        let scaleY = 1;
        let offsetX = 0;
        let offsetY = 0;

        if (mode === "fill") {
          scaleX = layer.width / naturalWidth;
          scaleY = layer.height / naturalHeight;
          offsetX = 0;
          offsetY = 0;
        } else if (mode === "cover") {
          const scale = Math.max(
            layer.width / naturalWidth,
            layer.height / naturalHeight,
          );
          scaleX = scale;
          scaleY = scale;
          offsetX = Math.round((layer.width - naturalWidth * scale) / 2);
          offsetY = Math.round((layer.height - naturalHeight * scale) / 2);
        } else if (mode === "contain") {
          const scale = Math.min(
            layer.width / naturalWidth,
            layer.height / naturalHeight,
          );
          scaleX = scale;
          scaleY = scale;
          offsetX = Math.round((layer.width - naturalWidth * scale) / 2);
          offsetY = Math.round((layer.height - naturalHeight * scale) / 2);
        }

        return {
          ...state,
          imageTransform: {
            x: offsetX,
            y: offsetY,
            scaleX,
            scaleY,
            rotation: 0,
          },
        };
      });

      setLayerFillStates(nextStates);
    },
    [
      getTargetLayerIds,
      layerFillStates,
      template.layers,
      loadedImages,
      setLayerFillStates,
    ],
  );

  // 2. ALIGNMENT ACTIONS (9 points exact anchor math)
  const handleApplyAlignment = useCallback(
    (position: AlignmentPosition) => {
      const targetIds = new Set(getTargetLayerIds());
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId) || !state.imageUrl) return state;

        const layer = template.layers.find((l) => l.id === state.layerId);
        const img = loadedImages.get(state.layerId);
        if (!layer || !img) return state;

        const currentTransform = state.imageTransform;
        const naturalWidth = img.naturalWidth || 1;
        const naturalHeight = img.naturalHeight || 1;
        const scaleX = currentTransform.scaleX || 1;
        const scaleY = currentTransform.scaleY || 1;
        const absScaleX = Math.abs(scaleX);
        const absScaleY = Math.abs(scaleY);

        const imgWidth = naturalWidth * absScaleX;
        const imgHeight = naturalHeight * absScaleY;

        let targetX = 0;
        let targetY = 0;

        // Calculate X anchor
        const isLeft =
          position === "top-left" ||
          position === "center-left" ||
          position === "bottom-left";
        const isCenterX =
          position === "top-center" ||
          position === "center" ||
          position === "bottom-center";
        const isRight =
          position === "top-right" ||
          position === "center-right" ||
          position === "bottom-right";

        if (isLeft) {
          // Top-left of image matches top-left of layer (x = 0)
          targetX = scaleX > 0 ? 0 : imgWidth;
        } else if (isCenterX) {
          // Center of image matches center of layer
          targetX =
            scaleX > 0
              ? Math.round((layer.width - imgWidth) / 2)
              : Math.round((layer.width + imgWidth) / 2);
        } else if (isRight) {
          // Right of image matches right of layer (x = layer.width)
          targetX =
            scaleX > 0
              ? Math.round(layer.width - imgWidth)
              : Math.round(layer.width);
        }

        // Calculate Y anchor
        const isTop =
          position === "top-left" ||
          position === "top-center" ||
          position === "top-right";
        const isCenterY =
          position === "center-left" ||
          position === "center" ||
          position === "center-right";
        const isBottom =
          position === "bottom-left" ||
          position === "bottom-center" ||
          position === "bottom-right";

        if (isTop) {
          // Top of image matches top of layer (y = 0)
          targetY = scaleY > 0 ? 0 : imgHeight;
        } else if (isCenterY) {
          // Center of image matches center of layer
          targetY =
            scaleY > 0
              ? Math.round((layer.height - imgHeight) / 2)
              : Math.round((layer.height + imgHeight) / 2);
        } else if (isBottom) {
          // Bottom of image matches bottom of layer (y = layer.height)
          targetY =
            scaleY > 0
              ? Math.round(layer.height - imgHeight)
              : Math.round(layer.height);
        }

        return {
          ...state,
          imageTransform: {
            ...currentTransform,
            x: targetX,
            y: targetY,
          },
        };
      });

      setLayerFillStates(nextStates);
    },
    [
      getTargetLayerIds,
      layerFillStates,
      template.layers,
      loadedImages,
      setLayerFillStates,
    ],
  );

  // 3. TRANSFORM ACTIONS (Rotate & Flip & Reset 0)
  const handleApplyRotate = useCallback(
    (degrees: number) => {
      const targetIds = new Set(getTargetLayerIds());
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId)) return state;

        const nextRotation =
          (state.imageTransform.rotation + degrees + 360) % 360;
        return {
          ...state,
          imageTransform: {
            ...state.imageTransform,
            rotation: nextRotation,
          },
        };
      });

      setLayerFillStates(nextStates);
    },
    [getTargetLayerIds, layerFillStates, setLayerFillStates],
  );

  const handleResetRotation = useCallback(() => {
    const targetIds = new Set(getTargetLayerIds());
    const nextStates = layerFillStates.map((state) => {
      if (!targetIds.has(state.layerId)) return state;

      return {
        ...state,
        imageTransform: {
          ...state.imageTransform,
          rotation: 0,
        },
      };
    });

    setLayerFillStates(nextStates);
  }, [getTargetLayerIds, layerFillStates, setLayerFillStates]);

  const handleApplyFlip = useCallback(
    (axis: "horizontal" | "vertical") => {
      const targetIds = new Set(getTargetLayerIds());
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId)) return state;

        const img = loadedImages.get(state.layerId);
        const naturalWidth = img?.naturalWidth || 1;
        const naturalHeight = img?.naturalHeight || 1;
        const transform = state.imageTransform;

        if (axis === "horizontal") {
          const newScaleX = -transform.scaleX;
          const newX = transform.x + transform.scaleX * naturalWidth;
          return {
            ...state,
            imageTransform: {
              ...transform,
              scaleX: newScaleX,
              x: newX,
            },
          };
        } else {
          const newScaleY = -transform.scaleY;
          const newY = transform.y + transform.scaleY * naturalHeight;
          return {
            ...state,
            imageTransform: {
              ...transform,
              scaleY: newScaleY,
              y: newY,
            },
          };
        }
      });

      setLayerFillStates(nextStates);
    },
    [getTargetLayerIds, layerFillStates, loadedImages, setLayerFillStates],
  );

  const handleApplyBorderWidth = useCallback(
    (width: number) => {
      const targetIds = new Set(getTargetLayerIds());
      const existingIds = new Set(layerFillStates.map((s) => s.layerId));
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId)) return state;
        return {
          ...state,
          borderWidth: width,
        };
      });

      for (const id of targetIds) {
        if (!existingIds.has(id)) {
          nextStates.push({
            layerId: id,
            imageUrl: null,
            imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
            borderWidth: width,
            borderColor: "#000000",
            borderGradient: null,
            cornerRadius: 0,
          });
        }
      }

      setLayerFillStates(nextStates);
    },
    [getTargetLayerIds, layerFillStates, setLayerFillStates],
  );

  const handleApplyBorderRadius = useCallback(
    (radius: number) => {
      const targetIds = new Set(getTargetLayerIds());
      const existingIds = new Set(layerFillStates.map((s) => s.layerId));
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId)) return state;
        const nextBorderWidth =
          (state.borderWidth ?? 0) === 0 ? 1 : state.borderWidth;
        return {
          ...state,
          cornerRadius: radius,
          borderWidth: nextBorderWidth,
        };
      });

      for (const id of targetIds) {
        if (!existingIds.has(id)) {
          nextStates.push({
            layerId: id,
            imageUrl: null,
            imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
            cornerRadius: radius,
            borderWidth: 1,
            borderColor: "#000000",
            borderGradient: null,
          });
        }
      }

      setLayerFillStates(nextStates);

      for (const id of targetIds) {
        updateSavedTextLayerConfig(template.id, id, { borderRadius: radius });
      }

      updateSessionTemplate((prev) => {
        if (!prev || !prev.textLayers) return prev;
        const updatedTextLayers = prev.textLayers.map((tl) =>
          targetIds.has(tl.id) ? { ...tl, borderRadius: radius } : tl,
        );
        return {
          ...prev,
          textLayers: updatedTextLayers,
          updatedAt: Date.now(),
        };
      });
    },
    [
      getTargetLayerIds,
      layerFillStates,
      setLayerFillStates,
      template.id,
      updateSavedTextLayerConfig,
      updateSessionTemplate,
    ],
  );

  const handleApplyBorderColor = useCallback(
    (color: string) => {
      const targetIds = new Set(getTargetLayerIds());
      const existingIds = new Set(layerFillStates.map((s) => s.layerId));
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId)) return state;
        const nextBorderWidth =
          (state.borderWidth ?? 0) === 0 ? 1 : state.borderWidth;
        return {
          ...state,
          borderColor: color,
          borderWidth: nextBorderWidth,
        };
      });

      for (const id of targetIds) {
        if (!existingIds.has(id)) {
          nextStates.push({
            layerId: id,
            imageUrl: null,
            imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
            borderColor: color,
            borderWidth: 1,
            borderGradient: null,
            cornerRadius: 0,
          });
        }
      }

      setLayerFillStates(nextStates);
    },
    [getTargetLayerIds, layerFillStates, setLayerFillStates],
  );

  const BTN_TRANSFORM =
    "flex items-center justify-left gap-1.5 py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 text-[11px] font-medium transition-colors cursor-pointer";

  const BTN_RESET =
    "flex items-center justify-left gap-1.5 py-1.5 px-2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-[11px] font-bold transition-colors cursor-pointer";

  const FIT_CONFIG: {
    mode: "fill" | "cover" | "contain";
    labelKey: string;
    desc: string;
    icon: LucideIcon;
    colorClass: string;
  }[] = [
    {
      mode: "fill",
      labelKey: "quickActions.fitFill",
      desc: "Stretch to exact cell size",
      icon: StretchHorizontal,
      colorClass: "text-sky-500",
    },
    {
      mode: "cover",
      labelKey: "quickActions.fitCover",
      desc: "Cover without gaps",
      icon: Maximize2,
      colorClass: "text-emerald-500",
    },
    {
      mode: "contain",
      labelKey: "quickActions.fitContain",
      desc: "View 100% full image",
      icon: Minimize2,
      colorClass: "text-indigo-500",
    },
  ];

  const ROTATE_ROW_PAIRS: {
    left: { angle: number; label: string; icon: LucideIcon };
    right: { angle: number; label: string; icon: LucideIcon };
  }[] = [
    {
      left: { angle: -90, label: "-90°", icon: RotateCcw },
      right: { angle: 90, label: "+90°", icon: RotateCw },
    },
    {
      left: { angle: -45, label: "-45°", icon: RotateCcw },
      right: { angle: 45, label: "+45°", icon: RotateCw },
    },
  ];

  const FLIP_OPTIONS: {
    axis: "horizontal" | "vertical";
    labelKey: string;
    icon: LucideIcon;
  }[] = [
    {
      axis: "horizontal",
      labelKey: "quickActions.flipHorizontal",
      icon: FlipHorizontal,
    },
    {
      axis: "vertical",
      labelKey: "quickActions.flipVertical",
      icon: FlipVertical,
    },
  ];

  const ALIGNMENT_GRID: {
    pos: AlignmentPosition;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      pos: "top-left",
      label: t("quickActions.alignTopLeft"),
      icon: <ArrowUpLeft size={13} />,
    },
    {
      pos: "top-center",
      label: t("quickActions.alignTopCenter"),
      icon: <ArrowUp size={13} />,
    },
    {
      pos: "top-right",
      label: t("quickActions.alignTopRight"),
      icon: <ArrowUpRight size={13} />,
    },
    {
      pos: "center-left",
      label: t("quickActions.alignCenterLeft"),
      icon: <ArrowLeft size={13} />,
    },
    {
      pos: "center",
      label: t("quickActions.alignCenter"),
      icon: <Circle size={10} className="fill-current" />,
    },
    {
      pos: "center-right",
      label: t("quickActions.alignCenterRight"),
      icon: <ArrowRight size={13} />,
    },
    {
      pos: "bottom-left",
      label: t("quickActions.alignBottomLeft"),
      icon: <ArrowDownLeft size={13} />,
    },
    {
      pos: "bottom-center",
      label: t("quickActions.alignBottomCenter"),
      icon: <ArrowDown size={13} />,
    },
    {
      pos: "bottom-right",
      label: t("quickActions.alignBottomRight"),
      icon: <ArrowDownRight size={13} />,
    },
  ];

  // Shared Section Contents (used identically across Desktop Submenus and Mobile Expanded list)
  const fitContent = (
    <div className="space-y-0.5">
      {FIT_CONFIG.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => handleApplyFit(opt.mode)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 text-left transition-colors cursor-pointer"
          >
            <Icon size={14} className={`${opt.colorClass} shrink-0`} />
            <div>
              <div className="font-semibold">{t(opt.labelKey)}</div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {opt.desc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const alignContent = (
    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
      {ALIGNMENT_GRID.map((item) => (
        <button
          key={item.pos}
          type="button"
          onClick={() => handleApplyAlignment(item.pos)}
          title={item.label}
          className="h-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 shadow-xs transition-colors cursor-pointer"
        >
          {item.icon}
        </button>
      ))}
    </div>
  );

  const rotateContent = (
    <div className="space-y-1">
      {/* Row 1: Reset 0° & 180° */}
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={handleResetRotation}
          className={BTN_RESET}
        >
          <RefreshCw size={12} />
          <span>{t("quickActions.rotate0")}</span>
        </button>
        <button
          type="button"
          onClick={() => handleApplyRotate(180)}
          className={BTN_TRANSFORM}
        >
          <RotateCw size={11} />
          <span>180°</span>
        </button>
      </div>

      {/* Row 2 (-90 / +90) & Row 3 (-45 / +45) */}
      {ROTATE_ROW_PAIRS.map((row, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => handleApplyRotate(row.left.angle)}
            className={BTN_TRANSFORM}
          >
            <row.left.icon size={11} />
            <span>{row.left.label}</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyRotate(row.right.angle)}
            className={BTN_TRANSFORM}
          >
            <row.right.icon size={11} />
            <span>{row.right.label}</span>
          </button>
        </div>
      ))}
    </div>
  );

  const BORDER_WIDTH_OPTIONS = [0, 1, 2, 4, 8, 12, 16, 24];
  const BORDER_RADIUS_OPTIONS = [0, 4, 8, 12, 16, 24, 32, 48];
  const BORDER_COLOR_OPTIONS = [
    "#000000",
    "#ffffff",
    "#64748b",
    "#ef4444",
    "#f97316",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
  ];

  const flipContent = (
    <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
      {FLIP_OPTIONS.map((opt) => (
        <button
          key={opt.axis}
          type="button"
          onClick={() => handleApplyFlip(opt.axis)}
          className={BTN_TRANSFORM}
        >
          <opt.icon size={13} />
          <span>{t(opt.labelKey)}</span>
        </button>
      ))}
    </div>
  );

  const borderWidthContent = (
    <div className="grid grid-cols-8 md:grid-cols-4 gap-1">
      {BORDER_WIDTH_OPTIONS.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => handleApplyBorderWidth(w)}
          title={`${w}px`}
          className="h-7 flex items-center justify-center rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
        >
          <span>{w}</span>
        </button>
      ))}
    </div>
  );

  const borderRadiusContent = (
    <div className="grid grid-cols-8 md:grid-cols-4 gap-1">
      {BORDER_RADIUS_OPTIONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => handleApplyBorderRadius(r)}
          title={`${r}px`}
          className="h-7 flex items-center justify-center rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
        >
          <span>{r}</span>
        </button>
      ))}
    </div>
  );

  const borderColorContent = (
    <div className="grid grid-cols-8 md:grid-cols-4 gap-1">
      {BORDER_COLOR_OPTIONS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => handleApplyBorderColor(c)}
          title={c}
          className="h-7 flex items-center justify-center rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 shadow-xs"
            style={{ backgroundColor: c }}
          />
        </button>
      ))}
    </div>
  );

  const sections: QuickActionSection[] = [
    {
      key: "fit",
      label: t("quickActions.fitGroup"),
      icon: StretchHorizontal,
      widthClass: "w-52",
      content: fitContent,
    },
    {
      key: "align",
      label: t("quickActions.alignGroup"),
      icon: ArrowUpRight,
      widthClass: "w-44",
      content: alignContent,
    },
    {
      key: "rotate",
      label: t("quickActions.rotateGroup"),
      icon: RotateCw,
      widthClass: "w-56",
      content: rotateContent,
    },
    {
      key: "flip",
      label: t("quickActions.flipGroup"),
      icon: FlipHorizontal,
      widthClass: "w-44",
      content: flipContent,
    },
    {
      key: "border-width",
      label: t("quickActions.borderWidthGroup"),
      icon: Square,
      widthClass: "w-44",
      content: borderWidthContent,
    },
    {
      key: "border-radius",
      label: t("quickActions.borderRadiusGroup"),
      icon: CornerUpRight,
      widthClass: "w-44",
      content: borderRadiusContent,
    },
    {
      key: "border-color",
      label: t("quickActions.borderColorGroup"),
      icon: Palette,
      widthClass: "w-44",
      content: borderColorContent,
    },
  ];

  const headerNode = (
    <div className="space-y-1">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1">
        <Sparkles size={11} className="text-amber-500" />
        {t("quickActions.scopeLabel")}
      </div>
      <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setScope("all")}
          className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
            scope === "all"
              ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Layers size={12} />
          <span className="truncate">
            {t("quickActions.scopeAll", {
              count: totalLayerCount,
            })}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setScope("selected")}
          disabled={!selectedLayerId}
          className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            scope === "selected"
              ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Square size={12} />
          <span className="truncate">
            {t("quickActions.scopeSelected")}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <QuickActionsMenuFrame
      sections={sections}
      headerNode={headerNode}
      triggerLabel={t("quickActions.button")}
      disabled={disabled}
      flyoutSide="left"
    />
  );
}
