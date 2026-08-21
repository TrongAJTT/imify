import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Palette, PanelTop, LayoutGrid, Sparkles, Check } from "lucide-react";
import { useSplicingStore } from "@imify/stores/stores/splicing-store";
import { CaptionDpadPicker } from "../shared/caption-dpad-picker";
import {
  QuickActionsMenuFrame,
  type QuickActionSection,
} from "../shared/quick-actions-menu-frame";
import type {
  SplicingCaptionPosition,
  SplicingCaptionAlignment,
} from "@imify/core";
import { useTranslation } from "@imify/i18n";

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
    id: "white-blue",
    labelKey: "quickActions.colorWhiteBlue",
    labelFallback: "Chữ trắng • Nền xanh dương",
    textColor: "#ffffff",
    containerColor: "#0284c7",
    containerOpacity: 100,
  },
  {
    id: "yellow-red",
    labelKey: "quickActions.colorYellowRed",
    labelFallback: "Chữ vàng • Nền đỏ đô",
    textColor: "#fef08a",
    containerColor: "#991b1b",
    containerOpacity: 100,
  },
  {
    id: "green-glass",
    labelKey: "quickActions.colorGreenGlass",
    labelFallback: "Chữ xanh neon • Nền tối mờ",
    textColor: "#4ade80",
    containerColor: "rgba(15, 23, 42, 0.75)",
    containerOpacity: 100,
  },
  {
    id: "solid-black-white",
    labelKey: "quickActions.colorSolidBlackWhite",
    labelFallback: "Chữ trắng • Nền đen đặc",
    textColor: "#ffffff",
    containerColor: "#000000",
    containerOpacity: 100,
  },
  {
    id: "transparent-white",
    labelKey: "quickActions.colorTransparentWhite",
    labelFallback: "Chữ trắng • Không nền",
    textColor: "#ffffff",
    containerColor: "transparent",
    containerOpacity: 0,
  },
];

/**
 * Pure helper function to compute offset (X, Y) for inside captions
 */
function computeInsideCaptionOffsets(
  position: SplicingCaptionPosition,
  alignment: SplicingCaptionAlignment,
  fontSize: number,
): { offsetX: number; offsetY: number } {
  const offsetVal = Math.round(fontSize / 2);

  switch (position) {
    case "top":
      if (alignment === "start") return { offsetX: offsetVal, offsetY: offsetVal };
      if (alignment === "center") return { offsetX: 0, offsetY: offsetVal };
      if (alignment === "end") return { offsetX: -offsetVal, offsetY: offsetVal };
      break;
    case "bottom":
      if (alignment === "start") return { offsetX: offsetVal, offsetY: -offsetVal };
      if (alignment === "center") return { offsetX: 0, offsetY: -offsetVal };
      if (alignment === "end") return { offsetX: -offsetVal, offsetY: -offsetVal };
      break;
    case "left":
      if (alignment === "start") return { offsetX: offsetVal, offsetY: offsetVal };
      if (alignment === "center") return { offsetX: offsetVal, offsetY: 0 };
      if (alignment === "end") return { offsetX: offsetVal, offsetY: -offsetVal };
      break;
    case "right":
      if (alignment === "start") return { offsetX: -offsetVal, offsetY: offsetVal };
      if (alignment === "center") return { offsetX: -offsetVal, offsetY: 0 };
      if (alignment === "end") return { offsetX: -offsetVal, offsetY: -offsetVal };
      break;
    case "center":
      if (alignment === "start") return { offsetX: offsetVal, offsetY: 0 };
      if (alignment === "center") return { offsetX: 0, offsetY: 0 };
      if (alignment === "end") return { offsetX: -offsetVal, offsetY: 0 };
      break;
  }
  return { offsetX: 0, offsetY: 0 };
}

export function SplicingQuickActionsMenu({
  disabled = false,
}: SplicingQuickActionsMenuProps) {
  const { t } = useTranslation(["splicing", "common"]);

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
  useEffect(() => {
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

  const sections: QuickActionSection[] = [
    {
      key: "color",
      label: t("quickActions.captionColor"),
      icon: Palette,
      iconColor: "text-amber-500",
      widthClass: "w-60",
      content: colorContent,
    },
    {
      key: "outside",
      label: t("quickActions.captionOutside"),
      icon: PanelTop,
      iconColor: "text-sky-500",
      widthClass: "w-60",
      content: outsideContent,
    },
    {
      key: "inside",
      label: t("quickActions.captionInside"),
      icon: LayoutGrid,
      iconColor: "text-emerald-500",
      widthClass: "w-60",
      content: insideContent,
    },
  ];

  const headerNode = (
    <div className="px-1 py-0.5 flex items-center justify-between">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
        <Sparkles size={12} className="text-amber-500" />
        {t("quickActions.title")}
      </span>
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
