import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Zap,
  ChevronRight,
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
} from "lucide-react";
import { ControlledPopover } from "@imify/ui/ui/controlled-popover";
import { usePopoverTriggerBehavior } from "../../shared/use-popover-trigger-behavior";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import type { FillingTemplate } from "../types";
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
  const triggerBehavior = usePopoverTriggerBehavior();
  const isDesktop = triggerBehavior === "hover";

  const [scope, setScope] = useState<QuickActionScope>("all");
  const [activeDesktopSubmenu, setActiveDesktopSubmenu] = useState<
    "fit" | "align" | "transform" | null
  >(null);

  const closeSubmenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearCloseSubmenuTimer = useCallback(() => {
    if (closeSubmenuTimerRef.current) {
      clearTimeout(closeSubmenuTimerRef.current);
      closeSubmenuTimerRef.current = null;
    }
  }, []);

  const handleSubmenuMouseEnter = useCallback(
    (menuKey: "fit" | "align" | "transform") => {
      clearCloseSubmenuTimer();
      setActiveDesktopSubmenu(menuKey);
    },
    [clearCloseSubmenuTimer],
  );

  const handleSubmenuMouseLeave = useCallback(() => {
    clearCloseSubmenuTimer();
    closeSubmenuTimerRef.current = setTimeout(() => {
      setActiveDesktopSubmenu(null);
      closeSubmenuTimerRef.current = null;
    }, 250); // 250ms buffer time to move mouse diagonally
  }, [clearCloseSubmenuTimer]);

  const layerFillStates = useFillingStore((s) => s.layerFillStates);
  const setLayerFillStates = useFillingStore((s) => s.setLayerFillStates);

  const filledLayerCount = useMemo(() => {
    return template.layers.filter((l) => {
      const state = layerFillStates.find((s) => s.layerId === l.id);
      return Boolean(state?.imageUrl);
    }).length;
  }, [template.layers, layerFillStates]);

  // Target layer IDs based on scope
  const getTargetLayerIds = useCallback((): string[] => {
    if (scope === "selected" && selectedLayerId) {
      return [selectedLayerId];
    }
    return template.layers.map((l) => l.id);
  }, [scope, selectedLayerId, template.layers]);

  // 1. FIT ACTIONS
  const handleApplyFit = useCallback(
    (mode: "fitWidth" | "cover" | "contain") => {
      const targetIds = new Set(getTargetLayerIds());
      const nextStates = layerFillStates.map((state) => {
        if (!targetIds.has(state.layerId) || !state.imageUrl) return state;

        const layer = template.layers.find((l) => l.id === state.layerId);
        const img = loadedImages.get(state.layerId);
        if (!layer || !img) return state;

        const naturalWidth = img.naturalWidth || 1;
        const naturalHeight = img.naturalHeight || 1;

        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;

        if (mode === "fitWidth") {
          scale = layer.width / naturalWidth;
          offsetY = Math.round((layer.height - naturalHeight * scale) / 2);
        } else if (mode === "cover") {
          scale = Math.max(
            layer.width / naturalWidth,
            layer.height / naturalHeight,
          );
          offsetX = Math.round((layer.width - naturalWidth * scale) / 2);
          offsetY = Math.round((layer.height - naturalHeight * scale) / 2);
        } else if (mode === "contain") {
          scale = Math.min(
            layer.width / naturalWidth,
            layer.height / naturalHeight,
          );
          offsetX = Math.round((layer.width - naturalWidth * scale) / 2);
          offsetY = Math.round((layer.height - naturalHeight * scale) / 2);
        }

        return {
          ...state,
          imageTransform: {
            x: offsetX,
            y: offsetY,
            scaleX: scale,
            scaleY: scale,
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

  const triggerButton = (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-sky-300 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/40 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Zap
        size={13}
        className="text-sky-600 dark:text-sky-400 fill-sky-500/20"
      />
      <span>{t("quickActions.button")}</span>
    </button>
  );

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

  return (
    <ControlledPopover
      trigger={triggerButton}
      preset="dropdown"
      behavior={triggerBehavior}
      align="end"
      sideOffset={6}
      disabled={disabled}
    >
      <div className="z-50 w-72 md:w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-xl outline-none text-slate-800 dark:text-slate-200 text-xs">
        {/* SCOPE SELECTION (Always visible at top) */}
        <div className="mb-2 pb-2 border-b border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            {t("quickActions.scopeLabel", {
              defaultValue: "Phạm vi áp dụng",
            })}
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
                  count: filledLayerCount,
                  defaultValue: `Tất cả (${filledLayerCount})`,
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
                {t("quickActions.scopeSelected", {
                  defaultValue: "Lớp chọn",
                })}
              </span>
            </button>
          </div>
        </div>

        {/* DESKTOP SUBMENU LAYOUT */}
        {isDesktop ? (
          <div className="space-y-1 relative">
            {/* 1. FIT SUBMENU TRIGGER */}
            <div
              className="relative"
              onMouseEnter={() => handleSubmenuMouseEnter("fit")}
              onMouseLeave={handleSubmenuMouseLeave}
            >
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                  activeDesktopSubmenu === "fit"
                    ? "bg-slate-100 dark:bg-slate-800/80 text-sky-600 dark:text-sky-400 font-semibold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <StretchHorizontal
                    size={14}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span>
                    {t("quickActions.fitGroup", {
                      defaultValue: "Khớp ảnh (Fit)",
                    })}
                  </span>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </button>

              {/* FIT SUBMENU CONTENT with hover bridge */}
              {activeDesktopSubmenu === "fit" && (
                <div
                  onMouseEnter={() => handleSubmenuMouseEnter("fit")}
                  onMouseLeave={handleSubmenuMouseLeave}
                  className="absolute left-full top-0 ml-1 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 shadow-xl space-y-0.5 animate-in fade-in-50 duration-75 before:absolute before:-left-3 before:inset-y-0 before:w-3"
                >
                  <button
                    type="button"
                    onClick={() => handleApplyFit("fitWidth")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 text-left transition-colors cursor-pointer"
                  >
                    <StretchHorizontal
                      size={14}
                      className="text-sky-500 shrink-0"
                    />
                    <div>
                      <div className="font-semibold">
                        {t("quickActions.fitWidth", {
                          defaultValue: "Khớp chiều rộng",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        Fit width (100% cell)
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFit("cover")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 text-left transition-colors cursor-pointer"
                  >
                    <Maximize2
                      size={14}
                      className="text-emerald-500 shrink-0"
                    />
                    <div>
                      <div className="font-semibold">
                        {t("quickActions.fitCover", {
                          defaultValue: "Phủ kín (Cover)",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        Cover without gaps
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFit("contain")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 text-left transition-colors cursor-pointer"
                  >
                    <Minimize2 size={14} className="text-indigo-500 shrink-0" />
                    <div>
                      <div className="font-semibold">
                        {t("quickActions.fitContain", {
                          defaultValue: "Trọn vẹn (Contain)",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        View 100% full image
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. ALIGNMENT SUBMENU TRIGGER */}
            <div
              className="relative"
              onMouseEnter={() => handleSubmenuMouseEnter("align")}
              onMouseLeave={handleSubmenuMouseLeave}
            >
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                  activeDesktopSubmenu === "align"
                    ? "bg-slate-100 dark:bg-slate-800/80 text-sky-600 dark:text-sky-400 font-semibold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight
                    size={14}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span>
                    {t("quickActions.alignGroup", {
                      defaultValue: "Căn lề (Align)",
                    })}
                  </span>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </button>

              {/* ALIGNMENT SUBMENU (3x3 Grid) with hover bridge */}
              {activeDesktopSubmenu === "align" && (
                <div
                  onMouseEnter={() => handleSubmenuMouseEnter("align")}
                  onMouseLeave={handleSubmenuMouseLeave}
                  className="absolute left-full top-0 ml-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-xl animate-in fade-in-50 duration-75 before:absolute before:-left-3 before:inset-y-0 before:w-3"
                >
                  <div className="text-[10px] font-bold text-slate-400 mb-1 px-1 uppercase tracking-wider">
                    {t("quickActions.alignGroup", {
                      defaultValue: "9 Điểm căn lề",
                    })}
                  </div>
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
                </div>
              )}
            </div>

            {/* 3. TRANSFORM SUBMENU TRIGGER */}
            <div
              className="relative"
              onMouseEnter={() => handleSubmenuMouseEnter("transform")}
              onMouseLeave={handleSubmenuMouseLeave}
            >
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                  activeDesktopSubmenu === "transform"
                    ? "bg-slate-100 dark:bg-slate-800/80 text-sky-600 dark:text-sky-400 font-semibold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCw
                    size={14}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span>
                    {t("quickActions.transformGroup", {
                      defaultValue: "Xoay & Lật",
                    })}
                  </span>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </button>

              {/* TRANSFORM SUBMENU with hover bridge */}
              {activeDesktopSubmenu === "transform" && (
                <div
                  onMouseEnter={() => handleSubmenuMouseEnter("transform")}
                  onMouseLeave={handleSubmenuMouseLeave}
                  className="absolute left-full top-0 ml-1 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 shadow-xl space-y-1 animate-in fade-in-50 duration-75 before:absolute before:-left-3 before:inset-y-0 before:w-3"
                >
                  <div className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">
                    {t("quickActions.transformGroup", {
                      defaultValue: "Góc xoay",
                    })}
                  </div>
                  {/* Reset to 0° button */}
                  <button
                    type="button"
                    onClick={handleResetRotation}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>
                      {t("quickActions.rotate0", {
                        defaultValue: "Về 0° (Reset)",
                      })}
                    </span>
                  </button>

                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyRotate(-90)}
                      className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>-90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRotate(90)}
                      className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <RotateCw size={11} />
                      <span>+90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRotate(180)}
                      className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <RotateCw size={11} />
                      <span>180°</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyRotate(-45)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>-45°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRotate(45)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <RotateCw size={11} />
                      <span>+45°</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider mb-1">
                      {t("common:flip", { defaultValue: "Lật ảnh" })}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => handleApplyFlip("horizontal")}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <FlipHorizontal size={13} />
                        <span>
                          {t("quickActions.flipHorizontal", {
                            defaultValue: "Lật ngang",
                          })}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyFlip("vertical")}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <FlipVertical size={13} />
                        <span>
                          {t("quickActions.flipVertical", {
                            defaultValue: "Lật dọc",
                          })}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MOBILE EXPANDED DIRECT LAYOUT */
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {/* FIT SECTION */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t("quickActions.fitGroup", {
                  defaultValue: "Khớp ảnh (Fit)",
                })}
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyFit("fitWidth")}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-center hover:bg-sky-50 dark:hover:bg-sky-950 cursor-pointer"
                >
                  <StretchHorizontal size={14} className="text-sky-500 mb-1" />
                  <span className="text-[10px] font-semibold">
                    {t("quickActions.fitWidth", {
                      defaultValue: "Fit Width",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFit("cover")}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-center hover:bg-sky-50 dark:hover:bg-sky-950 cursor-pointer"
                >
                  <Maximize2 size={14} className="text-emerald-500 mb-1" />
                  <span className="text-[10px] font-semibold">
                    {t("quickActions.fitCover", {
                      defaultValue: "Cover",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFit("contain")}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-center hover:bg-sky-50 dark:hover:bg-sky-950 cursor-pointer"
                >
                  <Minimize2 size={14} className="text-indigo-500 mb-1" />
                  <span className="text-[10px] font-semibold">
                    {t("quickActions.fitContain", {
                      defaultValue: "Contain",
                    })}
                  </span>
                </button>
              </div>
            </div>

            {/* ALIGNMENT SECTION */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t("quickActions.alignGroup", {
                  defaultValue: "Căn lề (Align)",
                })}
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-lg">
                {ALIGNMENT_GRID.map((item) => (
                  <button
                    key={item.pos}
                    type="button"
                    onClick={() => handleApplyAlignment(item.pos)}
                    title={item.label}
                    className="h-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white cursor-pointer shadow-xs"
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* TRANSFORM SECTION (Mobile Full Controls) */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t("quickActions.transformGroup", {
                  defaultValue: "Xoay & Lật",
                })}
              </div>

              {/* Reset to 0° button */}
              <button
                type="button"
                onClick={handleResetRotation}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>
                  {t("quickActions.rotate0", { defaultValue: "Về 0° (Reset)" })}
                </span>
              </button>

              {/* Row 1: 90 deg and 180 deg */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyRotate(-90)}
                  className="py-1.5 flex items-center justify-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold hover:bg-sky-50 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRotate(90)}
                  className="py-1.5 flex items-center justify-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold hover:bg-sky-50 cursor-pointer"
                >
                  <RotateCw size={11} />
                  <span>+90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRotate(180)}
                  className="py-1.5 flex items-center justify-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold hover:bg-sky-50 cursor-pointer"
                >
                  <span>180°</span>
                </button>
              </div>

              {/* Row 2: 45 deg and flips */}
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyRotate(-45)}
                  className="py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-center text-[11px] font-semibold hover:bg-sky-50 cursor-pointer"
                >
                  -45°
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRotate(45)}
                  className="py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-center text-[11px] font-semibold hover:bg-sky-50 cursor-pointer"
                >
                  +45°
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFlip("horizontal")}
                  title={t("quickActions.flipHorizontal")}
                  className="py-1.5 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold hover:bg-sky-50 cursor-pointer"
                >
                  <FlipHorizontal size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFlip("vertical")}
                  title={t("quickActions.flipVertical")}
                  className="py-1.5 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold hover:bg-sky-50 cursor-pointer"
                >
                  <FlipVertical size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ControlledPopover>
  );
}
