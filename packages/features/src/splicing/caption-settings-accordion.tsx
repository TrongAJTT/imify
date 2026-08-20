import React, { useEffect, useState } from "react";
import {
  Type,
  Link2,
  Unlink2,
  Lock,
  Unlock,
  RotateCw,
  Calculator,
  ArrowLeftRight,
  Maximize2,
} from "lucide-react";
import {
  AccordionCard,
  NumberInput,
  SelectInput,
  ColorPickerPopover,
  ControlledPopover,
  SegmentedControl,
} from "@imify/ui";

import { useTranslation } from "@imify/i18n";
import { useFontStore } from "@imify/stores/stores/font-store";
import {
  computeCaptionLockedOffset,
  type SplicingCaptionConfig,
  type SplicingCaptionMode,
  type SplicingCaptionPosition,
  type SplicingCaptionAlignment,
  type SplicingCaptionOffsetLockMode,
  type SplicingCaptionOffsetPaddingSource,
  type ResizeQuickStats,
  type ResizeApplyTo,
} from "@imify/core";

interface CaptionSettingsAccordionProps {
  captionConfig: SplicingCaptionConfig;
  onCaptionConfigChange: (patch: Partial<SplicingCaptionConfig>) => void;
  resizeQuickStats?: ResizeQuickStats | null;
  imageFitValue?: number;
  imageResize?: string;
  imageApplyTo?: ResizeApplyTo;
}


export function CaptionSettingsAccordion({
  captionConfig,
  onCaptionConfigChange,
  resizeQuickStats,
  imageFitValue = 800,
  imageResize = "inherit",
  imageApplyTo = "width",
}: CaptionSettingsAccordionProps) {
  const { t } = useTranslation("splicing");
  const { installedFonts, loadInstalledFonts } = useFontStore();
  const [lockPaddingHMax, setLockPaddingHMax] = useState(false);

  useEffect(() => {
    loadInstalledFonts();
  }, [loadInstalledFonts]);

  const mode = captionConfig.mode;
  const isEnabled = mode !== "none";
  const isInside = mode === "inside";

  // Max padding calculations:
  // 1. Pad Vertical: max = 2 * fontSize
  const maxPaddingV = Math.max(16, captionConfig.fontSize * 2);

  // 2. Pad Horizontal: max = image width if top/bottom/center, or image height if left/right (after resize)
  const isVerticalAxis =
    captionConfig.position === "top" ||
    captionConfig.position === "bottom" ||
    captionConfig.position === "center";

  const maxImageDimension = isVerticalAxis
    ? resizeQuickStats?.width?.max || imageFitValue || 800
    : resizeQuickStats?.height?.max || imageFitValue || 800;

  const maxPaddingH = Math.max(10, Math.round(maxImageDimension));



  // If lockPaddingHMax is active, keep paddingH locked to maxPaddingH
  useEffect(() => {
    if (lockPaddingHMax && captionConfig.paddingH !== maxPaddingH) {
      onCaptionConfigChange({ paddingH: maxPaddingH });
    }
  }, [
    lockPaddingHMax,
    maxPaddingH,
    captionConfig.paddingH,
    onCaptionConfigChange,
  ]);

  const modeOptions: { value: SplicingCaptionMode; label: string }[] = [
    { value: "none", label: t("captionFields.modeNone", "Không có") },
    { value: "inside", label: t("captionFields.modeInside", "Trong ảnh") },
    { value: "outside", label: t("captionFields.modeOutside", "Ngoài ảnh") },
  ];

  const positionOptions: { value: SplicingCaptionPosition; label: string }[] = [
    { value: "top", label: t("captionFields.posTop", "Trên") },
    { value: "bottom", label: t("captionFields.posBottom", "Dưới") },
    { value: "left", label: t("captionFields.posLeft", "Trái") },
    { value: "right", label: t("captionFields.posRight", "Phải") },
    ...(isInside
      ? [
          {
            value: "center" as const,
            label: t("captionFields.posCenter", "Giữa"),
          },
        ]
      : []),
  ];

  const alignmentOptions: { value: SplicingCaptionAlignment; label: string }[] =
    [
      { value: "start", label: t("captionFields.alignStart", "Đầu / Trái") },
      { value: "center", label: t("captionFields.alignCenter", "Giữa") },
      { value: "end", label: t("captionFields.alignEnd", "Cuối / Phải") },
    ];

  const fontOptions = [
    { value: "Inter", label: "Inter (Default)" },
    { value: "sans-serif", label: "System Sans-Serif" },
    ...installedFonts.map((f) => ({
      value: f.name,
      label: f.name,
    })),
  ];

  const lockedOffset = computeCaptionLockedOffset(captionConfig);

  const applyOffsetLockUpdate = (
    patch: Partial<SplicingCaptionConfig>,
    candidateConfig?: SplicingCaptionConfig,
  ) => {
    const nextCfg = candidateConfig || { ...captionConfig, ...patch };
    if (nextCfg.mode === "outside") {
      patch.offsetX = 0;
      patch.offsetY = 0;
      patch.offsetLockMode = "none";
    } else if (nextCfg.offsetLockMode === "auto") {
      const offsetVal = computeCaptionLockedOffset(nextCfg);
      // For inside mode, negative pushes inside
      const finalOffsetVal = -offsetVal;
      if (nextCfg.position === "top") {
        patch.offsetY = -finalOffsetVal;
        patch.offsetX = 0;
      } else if (nextCfg.position === "bottom") {
        patch.offsetY = finalOffsetVal;
        patch.offsetX = 0;
      } else if (nextCfg.position === "left") {
        patch.offsetX = -finalOffsetVal;
        patch.offsetY = 0;
      } else if (nextCfg.position === "right") {
        patch.offsetX = finalOffsetVal;
        patch.offsetY = 0;
      } else {
        patch.offsetX = 0;
        patch.offsetY = 0;
      }
    }
    onCaptionConfigChange(patch);
  };

  const handleFontSizeChange = (fontSize: number) => {
    const nextMaxPadV = Math.max(16, fontSize * 2);
    const patch: Partial<SplicingCaptionConfig> = { fontSize };
    if (captionConfig.paddingV > nextMaxPadV) {
      patch.paddingV = nextMaxPadV;
      if (captionConfig.paddingLinked) {
        patch.paddingH = Math.min(nextMaxPadV, maxPaddingH);
      }
    }
    applyOffsetLockUpdate(patch, { ...captionConfig, fontSize });
  };

  const handlePaddingVChange = (v: number) => {
    const clampedV = Math.min(v, maxPaddingV);
    const patch: Partial<SplicingCaptionConfig> = captionConfig.paddingLinked
      ? { paddingV: clampedV, paddingH: Math.min(clampedV, maxPaddingH) }
      : { paddingV: clampedV };
    applyOffsetLockUpdate(patch, {
      ...captionConfig,
      ...patch,
    });
  };

  const handlePaddingHChange = (h: number) => {
    const clampedH = Math.min(h, maxPaddingH);
    const patch: Partial<SplicingCaptionConfig> = captionConfig.paddingLinked
      ? { paddingV: Math.min(clampedH, maxPaddingV), paddingH: clampedH }
      : { paddingH: clampedH };
    applyOffsetLockUpdate(patch, {
      ...captionConfig,
      ...patch,
    });
  };

  const togglePaddingLinked = () => {
    const nextLinked = !captionConfig.paddingLinked;
    if (nextLinked) {
      const targetPad = Math.min(captionConfig.paddingV, maxPaddingH);
      const patch = {
        paddingLinked: true,
        paddingH: targetPad,
      };
      applyOffsetLockUpdate(patch, { ...captionConfig, ...patch });
    } else {
      onCaptionConfigChange({ paddingLinked: false });
    }
  };

  // Swap text color & container color
  const handleSwapColors = () => {
    const currentText = captionConfig.textColor;
    const currentBg = captionConfig.containerColor;
    onCaptionConfigChange({
      textColor: currentBg,
      containerColor: currentText,
    });
  };

  // Toggle max paddingH lock
  const handleToggleLockPaddingHMax = () => {
    const nextLock = !lockPaddingHMax;
    setLockPaddingHMax(nextLock);
    if (nextLock) {
      onCaptionConfigChange({
        paddingH: maxPaddingH,
        paddingLinked: false,
      });
    }
  };

  const sublabel = !isEnabled
    ? t("captionFields.sublabelDisabled", "Tắt")
    : `${mode === "inside" ? t("captionFields.modeInside", "Trong ảnh") : t("captionFields.modeOutside", "Ngoài ảnh")} • ${captionConfig.fontSize}px`;

  return (
    <AccordionCard
      icon={<Type size={16} />}
      label={t("sidebar.caption", "Tiêu đề ảnh")}
      sublabel={sublabel}
      colorTheme="amber"
      defaultOpen={false}
    >
      <div className="space-y-3 pt-1">
        {/* Mode Selector */}
        <SelectInput
          label={t("captionFields.mode", "Chế độ tiêu đề")}
          value={mode}
          options={modeOptions}
          onChange={(m) => {
            const nextMode = m as SplicingCaptionMode;
            if (nextMode === "outside") {
              const nextPos =
                captionConfig.position === "center"
                  ? "top"
                  : captionConfig.position;
              applyOffsetLockUpdate(
                {
                  mode: nextMode,
                  position: nextPos,
                  offsetX: 0,
                  offsetY: 0,
                  offsetLockMode: "none",
                },
                {
                  ...captionConfig,
                  mode: nextMode,
                  position: nextPos,
                  offsetX: 0,
                  offsetY: 0,
                  offsetLockMode: "none",
                },
              );
            } else {
              applyOffsetLockUpdate(
                { mode: nextMode },
                { ...captionConfig, mode: nextMode },
              );
            }
          }}
        />

        {isEnabled && (
          <>
            {/* Section: Typography */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("captionFields.typographySection")}
              </span>

              <SelectInput
                label={t("captionFields.fontFamily")}
                value={captionConfig.fontFamily || "Inter"}
                options={fontOptions}
                onChange={(fontFamily) => onCaptionConfigChange({ fontFamily })}
              />

              <div className="grid grid-cols-2 gap-2 items-end">
                <NumberInput
                  label={t("captionFields.fontSize")}
                  value={captionConfig.fontSize}
                  onChangeValue={handleFontSizeChange}
                  min={8}
                  max={200}
                />
                <ColorPickerPopover
                  label={t("captionFields.textColor")}
                  value={captionConfig.textColor}
                  onChange={(textColor) => onCaptionConfigChange({ textColor })}
                  enableAlpha={false}
                  outputMode="hex"
                  appearance="stacked"
                />
              </div>
            </div>

            {/* Section: Container */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("captionFields.containerSection")}
                </span>

                <div className="flex items-center gap-1">
                  {/* Swap Colors Button */}
                  <button
                    type="button"
                    onClick={handleSwapColors}
                    className="p-1 rounded-md text-xs transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title={t(
                      "captionFields.swapColors",
                      "Đổi màu chữ & khung nền",
                    )}
                  >
                    <ArrowLeftRight size={13} />
                  </button>

                  {/* Lock Max PaddingH Button */}
                  <button
                    type="button"
                    onClick={handleToggleLockPaddingHMax}
                    className={`p-1 rounded-md text-xs transition-colors flex items-center gap-0.5 ${
                      lockPaddingHMax
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                    title={
                      lockPaddingHMax
                        ? t(
                            "captionFields.lockPaddingHMaxActive",
                            "Đang khóa pad ngang tối đa",
                          )
                        : t(
                            "captionFields.lockPaddingHMaxInactive",
                            "Khóa pad ngang khớp ảnh",
                          )
                    }
                  >
                    <Maximize2 size={13} />
                  </button>

                  {/* Link Padding Ratio Button */}
                  <button
                    type="button"
                    onClick={togglePaddingLinked}
                    disabled={lockPaddingHMax}
                    className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                      captionConfig.paddingLinked
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    } ${lockPaddingHMax ? "opacity-40 cursor-not-allowed" : ""}`}
                    title={
                      captionConfig.paddingLinked
                        ? t("captionFields.paddingLinked")
                        : t("captionFields.paddingUnlinked")
                    }
                  >
                    {captionConfig.paddingLinked ? (
                      <Link2 size={13} />
                    ) : (
                      <Unlink2 size={13} />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-end">
                <NumberInput
                  label={t("captionFields.paddingV")}
                  value={captionConfig.paddingV}
                  onChangeValue={handlePaddingVChange}
                  min={0}
                  max={maxPaddingV}
                />
                <NumberInput
                  label={t("captionFields.paddingH")}
                  value={captionConfig.paddingH}
                  onChangeValue={handlePaddingHChange}
                  min={0}
                  max={maxPaddingH}
                  disabled={lockPaddingHMax}
                />
                <NumberInput
                  label={t("captionFields.borderRadius")}
                  value={captionConfig.borderRadius}
                  onChangeValue={(borderRadius) =>
                    onCaptionConfigChange({ borderRadius })
                  }
                  min={0}
                  max={100}
                />
                <NumberInput
                  label={t("captionFields.containerOpacity")}
                  value={
                    typeof captionConfig.containerOpacity === "number"
                      ? captionConfig.containerOpacity
                      : 100
                  }
                  onChangeValue={(containerOpacity) =>
                    onCaptionConfigChange({ containerOpacity })
                  }
                  min={0}
                  max={100}
                />
              </div>

              <ColorPickerPopover
                label={t("captionFields.containerColor")}
                value={captionConfig.containerColor}
                onChange={(containerColor) =>
                  onCaptionConfigChange({ containerColor })
                }
                enableAlpha={true}
                outputMode="rgba"
                appearance="stacked"
              />
            </div>

            {/* Section: Position & Alignment */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("captionFields.positionSection")}
                </span>

                {/* Lock Offset Popover Button (Only for Inside Mode) */}
                {isInside && (
                  <ControlledPopover
                    behavior="click"
                    align="end"
                    side="bottom"
                    contentClassName="p-3 w-72 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-50"
                    trigger={
                      <button
                        type="button"
                        className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                          captionConfig.offsetLockMode === "auto"
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                        title={t("captionFields.offsetLock")}
                      >
                        {captionConfig.offsetLockMode === "auto" ? (
                          <Lock size={13} />
                        ) : (
                          <Unlock size={13} />
                        )}
                        <span className="text-[10px] font-mono">
                          {captionConfig.offsetLockMode === "auto"
                            ? `±${lockedOffset}px`
                            : ""}
                        </span>
                      </button>
                    }
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Calculator size={14} className="text-amber-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {t("captionFields.offsetFormulaTitle")}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <SegmentedControl
                          value={captionConfig.offsetLockMode || "none"}
                          onChange={(val) => {
                            const modeVal =
                              val as SplicingCaptionOffsetLockMode;
                            applyOffsetLockUpdate(
                              { offsetLockMode: modeVal },
                              { ...captionConfig, offsetLockMode: modeVal },
                            );
                          }}
                          options={[
                            {
                              value: "none",
                              label: t("captionFields.offsetLockNone"),
                            },
                            {
                              value: "auto",
                              label: t("captionFields.offsetLockAuto"),
                            },
                          ]}
                        />
                      </div>

                      {captionConfig.offsetLockMode === "auto" && (
                        <div className="space-y-2.5 pt-1">
                          {/* Font size multiplier */}
                          <SelectInput
                            label={t("captionFields.offsetFontSizeMultiplier")}
                            value={String(
                              captionConfig.offsetFontSizeMultiplier ?? 1,
                            )}
                            options={[
                              { value: "0.5", label: "0.5x" },
                              { value: "1", label: "1.0x" },
                              { value: "2", label: "2.0x" },
                            ]}
                            onChange={(v) => {
                              const mult = parseFloat(v);
                              applyOffsetLockUpdate(
                                { offsetFontSizeMultiplier: mult },
                                {
                                  ...captionConfig,
                                  offsetFontSizeMultiplier: mult,
                                },
                              );
                            }}
                          />

                          {/* Padding Source */}
                          <SelectInput
                            label={t("captionFields.offsetPaddingSource")}
                            value={captionConfig.offsetPaddingSource || "max"}
                            options={[
                              {
                                value: "max",
                                label: t("captionFields.offsetPaddingMax"),
                              },
                              {
                                value: "sum",
                                label: t("captionFields.offsetPaddingSum"),
                              },
                              {
                                value: "min",
                                label: t("captionFields.offsetPaddingMin"),
                              },
                            ]}
                            onChange={(v) => {
                              const src =
                                v as SplicingCaptionOffsetPaddingSource;
                              applyOffsetLockUpdate(
                                { offsetPaddingSource: src },
                                { ...captionConfig, offsetPaddingSource: src },
                              );
                            }}
                          />

                          {/* Padding Multiplier */}
                          <SelectInput
                            label={t("captionFields.offsetPaddingMultiplier")}
                            value={String(
                              captionConfig.offsetPaddingMultiplier ?? 1,
                            )}
                            options={[
                              { value: "0.5", label: "0.5x" },
                              { value: "1", label: "1.0x" },
                              { value: "2", label: "2.0x" },
                            ]}
                            onChange={(v) => {
                              const mult = parseFloat(v);
                              applyOffsetLockUpdate(
                                { offsetPaddingMultiplier: mult },
                                {
                                  ...captionConfig,
                                  offsetPaddingMultiplier: mult,
                                },
                              );
                            }}
                          />

                          <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-300 font-mono text-center">
                            {t("captionFields.offsetCalculatedPreview", {
                              value: lockedOffset,
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </ControlledPopover>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <SelectInput
                  label={t("captionFields.position")}
                  value={captionConfig.position}
                  options={positionOptions}
                  onChange={(p) => {
                    const nextPos = p as SplicingCaptionPosition;
                    applyOffsetLockUpdate(
                      { position: nextPos },
                      { ...captionConfig, position: nextPos },
                    );
                  }}
                />
                <SelectInput
                  label={t("captionFields.alignment")}
                  value={captionConfig.alignment}
                  options={alignmentOptions}
                  onChange={(a) =>
                    onCaptionConfigChange({
                      alignment: a as SplicingCaptionAlignment,
                    })
                  }
                />
              </div>

              {/* Offset Controls: ONLY for Inside mode and non-center */}
              {isInside && captionConfig.position !== "center" && (
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div className="relative">
                    <NumberInput
                      label={t("captionFields.offsetX")}
                      value={captionConfig.offsetX}
                      onChangeValue={(offsetX) =>
                        onCaptionConfigChange({ offsetX })
                      }
                      min={-500}
                      max={500}
                      disabled={captionConfig.offsetLockMode === "auto"}
                    />
                  </div>
                  <div className="relative">
                    <NumberInput
                      label={t("captionFields.offsetY")}
                      value={captionConfig.offsetY}
                      onChangeValue={(offsetY) =>
                        onCaptionConfigChange({ offsetY })
                      }
                      min={-500}
                      max={500}
                      disabled={captionConfig.offsetLockMode === "auto"}
                    />
                  </div>
                </div>
              )}

              {/* Rotate 180° (Invert text) */}
              <div className="pt-1">
                <label className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer select-none">
                  <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <RotateCw size={14} className="text-slate-400" />
                    {t("captionFields.rotate180")}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={captionConfig.rotate180}
                    onClick={() =>
                      onCaptionConfigChange({
                        rotate180: !captionConfig.rotate180,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                      captionConfig.rotate180
                        ? "bg-amber-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        captionConfig.rotate180
                          ? "translate-x-4"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </AccordionCard>
  );
}
