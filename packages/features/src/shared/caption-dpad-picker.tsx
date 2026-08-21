import React from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Circle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PanelTop,
} from "lucide-react";
import type {
  SplicingCaptionPosition,
  SplicingCaptionAlignment,
} from "@imify/core";
import { useTranslation } from "@imify/i18n";

export interface CaptionDpadPickerProps {
  position?: SplicingCaptionPosition;
  onPositionChange: (pos: SplicingCaptionPosition) => void;
  alignment?: SplicingCaptionAlignment;
  onAlignmentChange?: (align: SplicingCaptionAlignment) => void;
  allowedPositions?: SplicingCaptionPosition[];
  showAlignment?: boolean;
  allowedAlignments?: SplicingCaptionAlignment[];
  centerPlaceholderNode?: React.ReactNode;
  footerNode?: React.ReactNode;
  className?: string;
}

export function CaptionDpadPicker({
  position = "top",
  onPositionChange,
  alignment = "center",
  onAlignmentChange,
  allowedPositions = ["top", "bottom", "left", "right", "center"],
  showAlignment = true,
  allowedAlignments = ["start", "center", "end"],
  centerPlaceholderNode,
  footerNode,
  className = "",
}: CaptionDpadPickerProps) {
  const { t } = useTranslation("splicing");

  const isPosAllowed = (pos: SplicingCaptionPosition) =>
    allowedPositions.includes(pos);
  const isAlignAllowed = (align: SplicingCaptionAlignment) =>
    allowedAlignments.includes(align);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* DPAD Position Section */}
      <div className="space-y-1.5 flex flex-col items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 self-start">
          {t("captionFields.position", "Vị trí")}
        </span>
        <div className="grid grid-cols-3 gap-1.5 w-44">
          <div />

          {/* Top */}
          {isPosAllowed("top") ? (
            <button
              type="button"
              onClick={() => onPositionChange("top")}
              className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                position === "top"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
              }`}
              title={t("captionFields.posTop", "Trên")}
            >
              <ArrowUp size={14} className="text-sky-500" />
              <span>{t("captionFields.posTop", "Trên")}</span>
            </button>
          ) : (
            <div />
          )}

          <div />

          {/* Left */}
          {isPosAllowed("left") ? (
            <button
              type="button"
              onClick={() => onPositionChange("left")}
              className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                position === "left"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
              }`}
              title={t("captionFields.posLeft", "Trái")}
            >
              <ArrowLeft size={14} className="text-sky-500" />
              <span>{t("captionFields.posLeft", "Trái")}</span>
            </button>
          ) : (
            <div />
          )}

          {/* Center / Center Placeholder */}
          {isPosAllowed("center") ? (
            <button
              type="button"
              onClick={() => onPositionChange("center")}
              className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                position === "center"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
              }`}
              title={t("captionFields.posCenter", "Giữa")}
            >
              <Circle size={12} className="fill-current text-sky-500" />
              <span>{t("captionFields.posCenter", "Giữa")}</span>
            </button>
          ) : (
            centerPlaceholderNode ?? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 text-[10px]">
                <PanelTop size={16} className="opacity-40" />
              </div>
            )
          )}

          {/* Right */}
          {isPosAllowed("right") ? (
            <button
              type="button"
              onClick={() => onPositionChange("right")}
              className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                position === "right"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
              }`}
              title={t("captionFields.posRight", "Phải")}
            >
              <ArrowRight size={14} className="text-sky-500" />
              <span>{t("captionFields.posRight", "Phải")}</span>
            </button>
          ) : (
            <div />
          )}

          <div />

          {/* Bottom */}
          {isPosAllowed("bottom") ? (
            <button
              type="button"
              onClick={() => onPositionChange("bottom")}
              className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                position === "bottom"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
              }`}
              title={t("captionFields.posBottom", "Dưới")}
            >
              <ArrowDown size={14} className="text-sky-500" />
              <span>{t("captionFields.posBottom", "Dưới")}</span>
            </button>
          ) : (
            <div />
          )}

          <div />
        </div>
      </div>

      {/* Alignment Section */}
      {showAlignment && onAlignmentChange && (
        <div className="space-y-1.5 flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 self-start">
            {t("captionFields.alignment", "Căn lề")}
          </span>
          <div className="grid grid-cols-3 gap-1.5 w-44">
            {isAlignAllowed("start") && (
              <button
                type="button"
                onClick={() => onAlignmentChange("start")}
                className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                  alignment === "start"
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
                }`}
                title={t("captionFields.alignStart", "Trái")}
              >
                <AlignLeft size={14} className="text-sky-500" />
                <span>{t("captionFields.alignStart", "Trái")}</span>
              </button>
            )}

            {isAlignAllowed("center") && (
              <button
                type="button"
                onClick={() => onAlignmentChange("center")}
                className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                  alignment === "center"
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
                }`}
                title={t("captionFields.alignCenter", "Giữa")}
              >
                <AlignCenter size={14} className="text-sky-500" />
                <span>{t("captionFields.alignCenter", "Giữa")}</span>
              </button>
            )}

            {isAlignAllowed("end") && (
              <button
                type="button"
                onClick={() => onAlignmentChange("end")}
                className={`flex flex-col items-center justify-center h-11 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                  alignment === "end"
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600"
                }`}
                title={t("captionFields.alignEnd", "Phải")}
              >
                <AlignRight size={14} className="text-sky-500" />
                <span>{t("captionFields.alignEnd", "Phải")}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Optional Footer */}
      {footerNode && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          {footerNode}
        </div>
      )}
    </div>
  );
}
