import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Zap,
  ChevronRight,
  Palette,
  PanelTop,
  LayoutGrid,
  Sparkles,
  Check,
} from "lucide-react";
import { ControlledPopover } from "@imify/ui/ui/controlled-popover";
import { usePopoverTriggerBehavior } from "../shared/use-popover-trigger-behavior";
import { useSplicingStore } from "@imify/stores/stores/splicing-store";
import { CaptionDpadPicker } from "../shared/caption-dpad-picker";
import type {
  SplicingCaptionPosition,
  SplicingCaptionAlignment,
} from "@imify/core";
import { useTranslation } from "@imify/i18n";

type SplicingQuickActionSubmenuKey = "color" | "outside" | "inside";

interface SplicingQuickActionsMenuProps {
  disabled?: boolean;
}

interface ColorPreset {
  id: string;
  labelKey: string;
  labelFallback: string;
  textColor: string;
  containerColor: string;
  containerOpacity: number;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "dark-glass",
    labelKey: "quickActions.colorDarkGlass",
    labelFallback: "Chữ trắng • Nền tối mờ",
    textColor: "#ffffff",
    containerColor: "rgba(0, 0, 0, 0.65)",
    containerOpacity: 100,
  },
  {
    id: "light-glass",
    labelKey: "quickActions.colorLightGlass",
    labelFallback: "Chữ đen • Nền sáng mờ",
    textColor: "#0f172a",
    containerColor: "rgba(255, 255, 255, 0.85)",
    containerOpacity: 100,
  },
  {
    id: "black-gold",
    labelKey: "quickActions.colorBlackGold",
    labelFallback: "Chữ vàng • Nền đen đặc",
    textColor: "#fbbf24",
    containerColor: "#000000",
    containerOpacity: 100,
  },
  {
    id: "white-slate",
    labelKey: "quickActions.colorWhiteSlate",
    labelFallback: "Chữ xanh đen • Nền trắng đặc",
    textColor: "#0f172a",
    containerColor: "#ffffff",
    containerOpacity: 100,
  },
  {
    id: "crimson-badge",
    labelKey: "quickActions.colorCrimsonBadge",
    labelFallback: "Chữ trắng • Nền đỏ",
    textColor: "#ffffff",
    containerColor: "rgba(225, 29, 72, 0.85)",
    containerOpacity: 100,
  },
  {
    id: "blue-badge",
    labelKey: "quickActions.colorBlueBadge",
    labelFallback: "Chữ trắng • Nền xanh",
    textColor: "#ffffff",
    containerColor: "rgba(37, 99, 235, 0.85)",
    containerOpacity: 100,
  },
  {
    id: "minimal-white",
    labelKey: "quickActions.colorMinimalWhite",
    labelFallback: "Chữ trắng không nền",
    textColor: "#ffffff",
    containerColor: "transparent",
    containerOpacity: 0,
  },
  {
    id: "minimal-black",
    labelKey: "quickActions.colorMinimalBlack",
    labelFallback: "Chữ đen không nền",
    textColor: "#0f172a",
    containerColor: "transparent",
    containerOpacity: 0,
  },
];

function computeInsideCaptionOffsets(
  pos: SplicingCaptionPosition,
  align: SplicingCaptionAlignment,
  fontSize: number,
): { offsetX: number; offsetY: number } {
  const offsetVal = Math.round(fontSize / 2);

  if (pos === "top") {
    if (align === "start") return { offsetX: offsetVal, offsetY: offsetVal };
    if (align === "center") return { offsetX: 0, offsetY: offsetVal };
    return { offsetX: -offsetVal, offsetY: offsetVal };
  }
  if (pos === "center") {
    if (align === "start") return { offsetX: offsetVal, offsetY: 0 };
    if (align === "center") return { offsetX: 0, offsetY: 0 };
    return { offsetX: -offsetVal, offsetY: 0 };
  }
  if (pos === "bottom") {
    if (align === "start") return { offsetX: offsetVal, offsetY: -offsetVal };
    if (align === "center") return { offsetX: 0, offsetY: -offsetVal };
    return { offsetX: -offsetVal, offsetY: -offsetVal };
  }
  if (pos === "left") {
    if (align === "start") return { offsetX: offsetVal, offsetY: offsetVal };
    if (align === "center") return { offsetX: offsetVal, offsetY: 0 };
    return { offsetX: offsetVal, offsetY: -offsetVal };
  }
  if (pos === "right") {
    if (align === "start") return { offsetX: -offsetVal, offsetY: offsetVal };
    if (align === "center") return { offsetX: -offsetVal, offsetY: 0 };
    return { offsetX: -offsetVal, offsetY: -offsetVal };
  }
  return { offsetX: 0, offsetY: 0 };
}

export function SplicingQuickActionsMenu({
  disabled = false,
}: SplicingQuickActionsMenuProps) {
  const { t } = useTranslation(["splicing", "common"]);
  const triggerBehavior = usePopoverTriggerBehavior();
  const isDesktop = triggerBehavior === "hover";

  const [activeDesktopSubmenu, setActiveDesktopSubmenu] =
    useState<SplicingQuickActionSubmenuKey | null>(null);

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
    (menuKey: SplicingQuickActionSubmenuKey) => {
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
    }, 250);
  }, [clearCloseSubmenuTimer]);

  const captionConfig = useSplicingStore((s) => s.captionConfig);
  const setCaptionConfig = useSplicingStore((s) => s.setCaptionConfig);
  const resizeQuickStats = useSplicingStore((s) => s.resizeQuickStats);

  // Local selection state for inside caption combination chips
  const [selectedInsidePosition, setSelectedInsidePosition] =
    useState<SplicingCaptionPosition>(() => captionConfig.position || "top");
  const [selectedInsideAlignment, setSelectedInsideAlignment] =
    useState<SplicingCaptionAlignment>(
      () => captionConfig.alignment || "center",
    );

  // Keep local selection synchronized with store if store changes externally
  React.useEffect(() => {
    if (captionConfig.position)
      setSelectedInsidePosition(captionConfig.position);
    if (captionConfig.alignment)
      setSelectedInsideAlignment(captionConfig.alignment);
  }, [captionConfig.position, captionConfig.alignment]);

  const maxPaddingH = useMemo(() => {
    const isVerticalAxis =
      captionConfig.position === "top" ||
      captionConfig.position === "bottom" ||
      captionConfig.position === "center";
    const maxDim = isVerticalAxis
      ? resizeQuickStats?.width?.max || 800
      : resizeQuickStats?.height?.max || 800;
    return Math.max(10, Math.round(maxDim));
  }, [captionConfig.position, resizeQuickStats]);

  // Action: Apply Color Preset
  const handleApplyColor = useCallback(
    (preset: ColorPreset) => {
      setCaptionConfig({
        textColor: preset.textColor,
        containerColor: preset.containerColor,
        containerOpacity: preset.containerOpacity,
      });
    },
    [setCaptionConfig],
  );

  // Action: Apply Outside Caption Position
  const handleApplyOutside = useCallback(
    (position: "top" | "bottom" | "left" | "right") => {
      const fontSize = captionConfig.fontSize || 24;
      const pad = Math.round(fontSize / 3);

      setCaptionConfig({
        mode: "outside",
        position,
        alignment: "center",
        paddingV: pad,
        paddingH: maxPaddingH,
        paddingLinked: false,
        offsetX: 0,
        offsetY: 0,
        offsetLockMode: "none",
      });
    },
    [captionConfig.fontSize, maxPaddingH, setCaptionConfig],
  );

  // Action: Apply Inside Caption Combination
  const handleApplyInsideCombination = useCallback(
    (
      pos: SplicingCaptionPosition = selectedInsidePosition,
      align: SplicingCaptionAlignment = selectedInsideAlignment,
    ) => {
      const fontSize = captionConfig.fontSize || 24;
      const pad = Math.round(fontSize / 3);
      const { offsetX, offsetY } = computeInsideCaptionOffsets(
        pos,
        align,
        fontSize,
      );

      setCaptionConfig({
        mode: "inside",
        position: pos,
        alignment: align,
        paddingV: pad,
        paddingH: pad,
        paddingLinked: true,
        offsetX,
        offsetY,
        offsetLockMode: "none",
      });
    },
    [
      captionConfig.fontSize,
      selectedInsidePosition,
      selectedInsideAlignment,
      setCaptionConfig,
    ],
  );

  // Compute offsets and padding for current inside caption configuration
  const currentFontSize = captionConfig.fontSize || 24;
  const currentComputedOffsets = computeInsideCaptionOffsets(
    selectedInsidePosition,
    selectedInsideAlignment,
    currentFontSize,
  );
  const currentComputedPad = Math.round(currentFontSize / 3);

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

  // Submenu 1: Colors Content
  const colorContent = (
    <div className="space-y-1">
      {COLOR_PRESETS.map((p) => {
        const isSelected =
          captionConfig.textColor === p.textColor &&
          captionConfig.containerColor === p.containerColor;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => handleApplyColor(p)}
            className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors text-left cursor-pointer ${
              isSelected
                ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0"
                style={{
                  backgroundColor:
                    p.containerColor === "transparent"
                      ? "transparent"
                      : p.containerColor,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: p.textColor }}
                />
              </div>
              <span className="truncate">{t(p.labelKey, p.labelFallback)}</span>
            </div>
            {isSelected && (
              <Check size={12} className="text-sky-600 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );

  // Submenu 2: Outside Content (DPAD Layout)
  const outsideContent = (
    <CaptionDpadPicker
      position={captionConfig.position || "top"}
      onPositionChange={(pos) => handleApplyOutside(pos as any)}
      allowedPositions={["top", "bottom", "left", "right"]}
      showAlignment={false}
      footerNode={
        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate text-center">
          {t("quickActions.previewParams", {
            pad: currentComputedPad,
            offX:
              currentComputedOffsets.offsetX >= 0
                ? `+${currentComputedOffsets.offsetX}`
                : currentComputedOffsets.offsetX,
            offY:
              currentComputedOffsets.offsetY >= 0
                ? `+${currentComputedOffsets.offsetY}`
                : currentComputedOffsets.offsetY,
            defaultValue: `Pad: ${currentComputedPad}px • Offset: (${currentComputedOffsets.offsetX}, ${currentComputedOffsets.offsetY})px`,
          })}
        </div>
      }
    />
  );

  // Submenu 3: Inside Combination Content (DPAD Position + Alignment)
  const insideContent = (
    <CaptionDpadPicker
      position={selectedInsidePosition}
      onPositionChange={(pos) => {
        setSelectedInsidePosition(pos);
        handleApplyInsideCombination(pos, selectedInsideAlignment);
      }}
      alignment={selectedInsideAlignment}
      onAlignmentChange={(align) => {
        setSelectedInsideAlignment(align);
        handleApplyInsideCombination(selectedInsidePosition, align);
      }}
      allowedPositions={["top", "bottom", "left", "right", "center"]}
      allowedAlignments={["start", "center", "end"]}
      showAlignment={true}
      footerNode={
        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate text-center">
          {t("quickActions.previewParams", {
            pad: currentComputedPad,
            offX:
              currentComputedOffsets.offsetX >= 0
                ? `+${currentComputedOffsets.offsetX}`
                : currentComputedOffsets.offsetX,
            offY:
              currentComputedOffsets.offsetY >= 0
                ? `+${currentComputedOffsets.offsetY}`
                : currentComputedOffsets.offsetY,
            defaultValue: `Pad: ${currentComputedPad}px • Offset: (${currentComputedOffsets.offsetX}, ${currentComputedOffsets.offsetY})px`,
          })}
        </div>
      }
    />
  );

  const renderSubmenuItem = (
    menuKey: SplicingQuickActionSubmenuKey,
    label: string,
    icon: React.ReactNode,
    submenuContent: React.ReactNode,
    submenuWidth = "w-64",
  ) => {
    const isSubmenuActive = activeDesktopSubmenu === menuKey;

    return (
      <div
        key={menuKey}
        className="relative"
        onMouseEnter={() => isDesktop && handleSubmenuMouseEnter(menuKey)}
        onMouseLeave={() => isDesktop && handleSubmenuMouseLeave()}
      >
        <button
          type="button"
          onClick={() => {
            if (!isDesktop) {
              setActiveDesktopSubmenu((prev) =>
                prev === menuKey ? null : menuKey,
              );
            }
          }}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            isSubmenuActive
              ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <span className="truncate">{label}</span>
          </div>
          <ChevronRight
            size={14}
            className={`text-slate-400 transition-transform ${
              isSubmenuActive && !isDesktop ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Desktop Floating Flyout Submenu */}
        {isDesktop && isSubmenuActive && (
          <div
            className={`absolute top-0 right-full mr-1.5 ${submenuWidth} p-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-60 animate-in fade-in zoom-in-95 duration-100`}
            onMouseEnter={() => handleSubmenuMouseEnter(menuKey)}
            onMouseLeave={handleSubmenuMouseLeave}
          >
            <div className="mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              {icon}
              <span>{label}</span>
            </div>
            {submenuContent}
          </div>
        )}

        {/* Mobile / Tablet Accordion Expand */}
        {!isDesktop && isSubmenuActive && (
          <div className="pl-3 pr-1 py-2 border-l-2 border-sky-400 ml-3 my-1 space-y-1 bg-slate-50/60 dark:bg-slate-800/40 rounded-r-lg">
            {submenuContent}
          </div>
        )}
      </div>
    );
  };

  return (
    <ControlledPopover
      trigger={triggerButton}
      behavior={triggerBehavior}
      align="end"
      side="bottom"
      contentClassName="p-2 w-64 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="space-y-1">
        <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            {t("quickActions.title")}
          </span>
        </div>

        {renderSubmenuItem(
          "color",
          t("quickActions.captionColor"),
          <Palette size={14} className="text-amber-500" />,
          colorContent,
          "w-60",
        )}

        {renderSubmenuItem(
          "outside",
          t("quickActions.captionOutside"),
          <PanelTop size={14} className="text-sky-500" />,
          outsideContent,
          "w-60",
        )}

        {renderSubmenuItem(
          "inside",
          t("quickActions.captionInside"),
          <LayoutGrid size={14} className="text-emerald-500" />,
          insideContent,
          "w-60",
        )}
      </div>
    </ControlledPopover>
  );
}
