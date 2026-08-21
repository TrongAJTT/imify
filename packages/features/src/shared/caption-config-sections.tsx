import React, { useEffect, useState } from "react";
import {
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
  type SplicingCaptionPosition,
  type SplicingCaptionAlignment,
  type SplicingCaptionOffsetLockMode,
  type SplicingCaptionOffsetPaddingSource,
} from "@imify/core";

export interface CaptionConfigData {
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  paddingV?: number;
  paddingH?: number;
  paddingLinked?: boolean;
  containerColor?: string;
  containerOpacity?: number;
  borderRadius?: number;
  position?:
    | SplicingCaptionPosition
    | "top"
    | "center"
    | "bottom"
    | "left"
    | "right";
  alignment?: SplicingCaptionAlignment;
  offsetX?: number;
  offsetY?: number;
  offsetLockMode?: SplicingCaptionOffsetLockMode;
  offsetFontSizeMultiplier?: number;
  offsetPaddingSource?: SplicingCaptionOffsetPaddingSource;
  offsetPaddingMultiplier?: number;
  rotate180?: boolean;
}

export interface CaptionConfigSectionsProps<
  T extends CaptionConfigData = CaptionConfigData,
> {
  config: T;
  onChange: (patch: Partial<T>) => void;
  textInputNode?: React.ReactNode;
  positionOptions?: Array<{ value: string; label: string }>;
  maxPaddingV?: number;
  maxPaddingH?: number;
  showOffsetCalculator?: boolean;
  showOffsetInputs?: boolean;
  enableLockPaddingHMax?: boolean;
  extraTypographyNode?: React.ReactNode;
  extraContainerNode?: React.ReactNode;
  extraPositionNode?: React.ReactNode;
  sectionClassName?: string;
}

export function CaptionConfigSections<
  T extends CaptionConfigData = CaptionConfigData,
>({
  config,
  onChange,
  textInputNode,
  positionOptions,
  maxPaddingV,
  maxPaddingH,
  showOffsetCalculator = false,
  showOffsetInputs = false,
  enableLockPaddingHMax = false,
  extraTypographyNode,
  extraContainerNode,
  extraPositionNode,
  sectionClassName = "border-t border-slate-100 dark:border-slate-800/80 space-y-2 pt-2",
}: CaptionConfigSectionsProps<T>) {
  const { t } = useTranslation("splicing");
  const { installedFonts, loadInstalledFonts } = useFontStore();
  const [lockPaddingHMax, setLockPaddingHMax] = useState(false);

  useEffect(() => {
    loadInstalledFonts();
  }, [loadInstalledFonts]);

  const fontSize = config.fontSize ?? 24;
  const effectiveMaxPadV = maxPaddingV ?? Math.max(16, fontSize * 2);
  const effectiveMaxPadH = maxPaddingH ?? 800;

  useEffect(() => {
    if (
      enableLockPaddingHMax &&
      lockPaddingHMax &&
      config.paddingH !== effectiveMaxPadH
    ) {
      onChange({ paddingH: effectiveMaxPadH } as Partial<T>);
    }
  }, [
    enableLockPaddingHMax,
    lockPaddingHMax,
    effectiveMaxPadH,
    config.paddingH,
    onChange,
  ]);

  const fontOptions = [
    { value: "Inter", label: "Inter (Default)" },
    { value: "sans-serif", label: "System Sans-Serif" },
    ...installedFonts.map((f) => ({
      value: f.name,
      label: f.name,
    })),
  ];

  const defaultPositionOptions = [
    { value: "top", label: t("captionFields.posTop", "Trên") },
    { value: "bottom", label: t("captionFields.posBottom", "Dưới") },
    { value: "left", label: t("captionFields.posLeft", "Trái") },
    { value: "right", label: t("captionFields.posRight", "Phải") },
    { value: "center", label: t("captionFields.posCenter", "Giữa") },
  ];

  const alignmentOptions: { value: SplicingCaptionAlignment; label: string }[] =
    [
      { value: "start", label: t("captionFields.alignStart", "Đầu / Trái") },
      { value: "center", label: t("captionFields.alignCenter", "Giữa") },
      { value: "end", label: t("captionFields.alignEnd", "Cuối / Phải") },
    ];

  const lockedOffset = computeCaptionLockedOffset(
    config as unknown as SplicingCaptionConfig,
  );

  const handleFontSizeChange = (nextFontSize: number) => {
    const nextMaxPadV = maxPaddingV ?? Math.max(16, nextFontSize * 2);
    const patch: Partial<T> = { fontSize: nextFontSize } as Partial<T>;
    if ((config.paddingV ?? 0) > nextMaxPadV) {
      (patch as any).paddingV = nextMaxPadV;
      if (config.paddingLinked) {
        (patch as any).paddingH = Math.min(nextMaxPadV, effectiveMaxPadH);
      }
    }
    onChange(patch);
  };

  const handlePaddingVChange = (v: number) => {
    const clampedV = Math.min(v, effectiveMaxPadV);
    const patch: Partial<T> = (
      config.paddingLinked
        ? { paddingV: clampedV, paddingH: Math.min(clampedV, effectiveMaxPadH) }
        : { paddingV: clampedV }
    ) as Partial<T>;
    onChange(patch);
  };

  const handlePaddingHChange = (h: number) => {
    const clampedH = Math.min(h, effectiveMaxPadH);
    const patch: Partial<T> = (
      config.paddingLinked
        ? { paddingV: Math.min(clampedH, effectiveMaxPadV), paddingH: clampedH }
        : { paddingH: clampedH }
    ) as Partial<T>;
    onChange(patch);
  };

  const togglePaddingLinked = () => {
    const nextLinked = !config.paddingLinked;
    if (nextLinked) {
      const targetPad = Math.min(config.paddingV ?? 12, effectiveMaxPadH);
      onChange({
        paddingLinked: true,
        paddingH: targetPad,
      } as Partial<T>);
    } else {
      onChange({ paddingLinked: false } as Partial<T>);
    }
  };

  const handleSwapColors = () => {
    const currentText = config.textColor || "#ffffff";
    const currentBg = config.containerColor || "rgba(0, 0, 0, 0.6)";
    onChange({
      textColor: currentBg,
      containerColor: currentText,
    } as Partial<T>);
  };

  const handleToggleLockPaddingHMax = () => {
    const nextLock = !lockPaddingHMax;
    setLockPaddingHMax(nextLock);
    if (nextLock) {
      onChange({
        paddingH: effectiveMaxPadH,
        paddingLinked: false,
      } as Partial<T>);
    }
  };

  return (
    <>
      {/* Section: Typography */}
      <div className={sectionClassName}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("captionFields.typographySection", "Văn bản")}
        </span>

        {textInputNode}

        <SelectInput
          label={t("captionFields.fontFamily", "Phông chữ")}
          value={config.fontFamily || "Inter"}
          options={fontOptions}
          onChange={(fontFamily) => onChange({ fontFamily } as Partial<T>)}
        />

        <div className="grid grid-cols-2 gap-2 items-end">
          <NumberInput
            label={t("captionFields.fontSize", "Cỡ chữ (px)")}
            value={fontSize}
            onChangeValue={handleFontSizeChange}
            min={8}
            max={500}
          />
          <ColorPickerPopover
            label={t("captionFields.textColor", "Màu chữ")}
            value={config.textColor || "#ffffff"}
            onChange={(textColor) => onChange({ textColor } as Partial<T>)}
            enableAlpha={false}
            outputMode="hex"
            appearance="stacked"
          />
        </div>

        {extraTypographyNode}
      </div>

      {/* Section: Container */}
      <div className={sectionClassName}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("captionFields.containerSection", "Khung nền")}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSwapColors}
              className="p-1 rounded-md text-xs transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title={t("captionFields.swapColors", "Đổi màu chữ & khung nền")}
            >
              <ArrowLeftRight size={13} />
            </button>

            {enableLockPaddingHMax && (
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
            )}

            <button
              type="button"
              onClick={togglePaddingLinked}
              disabled={lockPaddingHMax}
              className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                config.paddingLinked
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              } ${lockPaddingHMax ? "opacity-40 cursor-not-allowed" : ""}`}
              title={
                config.paddingLinked
                  ? t("captionFields.paddingLinked", "Liên kết tỷ lệ padding")
                  : t("captionFields.paddingUnlinked", "Hủy liên kết padding")
              }
            >
              {config.paddingLinked ? (
                <Link2 size={13} />
              ) : (
                <Unlink2 size={13} />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 items-end">
          <NumberInput
            label={t("captionFields.paddingV", "Pad Dọc")}
            value={config.paddingV ?? 12}
            onChangeValue={handlePaddingVChange}
            min={0}
            max={effectiveMaxPadV}
          />
          <NumberInput
            label={t("captionFields.paddingH", "Pad Ngang")}
            value={config.paddingH ?? 16}
            onChangeValue={handlePaddingHChange}
            min={0}
            max={effectiveMaxPadH}
            disabled={enableLockPaddingHMax && lockPaddingHMax}
          />
          <NumberInput
            label={t("captionFields.borderRadius", "Bo góc")}
            value={config.borderRadius ?? 0}
            onChangeValue={(borderRadius) =>
              onChange({ borderRadius } as Partial<T>)
            }
            min={0}
            max={200}
          />
          <NumberInput
            label={t("captionFields.containerOpacity", "Độ mờ (%)")}
            value={
              typeof config.containerOpacity === "number"
                ? config.containerOpacity
                : 100
            }
            onChangeValue={(containerOpacity) =>
              onChange({ containerOpacity } as Partial<T>)
            }
            min={0}
            max={100}
          />
        </div>

        <ColorPickerPopover
          label={t("captionFields.containerColor", "Màu nền khung")}
          value={config.containerColor || "rgba(0, 0, 0, 0.6)"}
          onChange={(containerColor) =>
            onChange({ containerColor } as Partial<T>)
          }
          enableAlpha={true}
          outputMode="rgba"
          appearance="stacked"
        />

        {extraContainerNode}
      </div>

      {/* Section: Position & Alignment */}
      <div className={sectionClassName}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("captionFields.positionSection", "Vị trí & Căn lề")}
          </span>

          {showOffsetCalculator && (
            <ControlledPopover
              behavior="click"
              align="end"
              side="bottom"
              contentClassName="p-3 w-72 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-50"
              trigger={
                <button
                  type="button"
                  className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                    config.offsetLockMode === "auto"
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title={t(
                    "captionFields.offsetLock",
                    "Khóa khoảng cách tự động",
                  )}
                >
                  {config.offsetLockMode === "auto" ? (
                    <Lock size={13} />
                  ) : (
                    <Unlock size={13} />
                  )}
                  <span className="text-[10px] font-mono">
                    {config.offsetLockMode === "auto"
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
                    {t(
                      "captionFields.offsetFormulaTitle",
                      "Tính toán khoảng cách tự động",
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  <SegmentedControl
                    value={config.offsetLockMode || "none"}
                    onChange={(val) => {
                      const modeVal = val as SplicingCaptionOffsetLockMode;
                      onChange({ offsetLockMode: modeVal } as Partial<T>);
                    }}
                    options={[
                      {
                        value: "none",
                        label: t("captionFields.offsetLockNone", "Thủ công"),
                      },
                      {
                        value: "auto",
                        label: t("captionFields.offsetLockAuto", "Tự động"),
                      },
                    ]}
                  />
                </div>

                {config.offsetLockMode === "auto" && (
                  <div className="space-y-2.5 pt-1">
                    <SelectInput
                      label={t(
                        "captionFields.offsetFontSizeMultiplier",
                        "Hệ số Cỡ chữ",
                      )}
                      value={String(config.offsetFontSizeMultiplier ?? 1)}
                      options={[
                        { value: "0.5", label: "0.5x" },
                        { value: "1", label: "1.0x" },
                        { value: "2", label: "2.0x" },
                      ]}
                      onChange={(v) => {
                        onChange({
                          offsetFontSizeMultiplier: parseFloat(v),
                        } as Partial<T>);
                      }}
                    />

                    <SelectInput
                      label={t(
                        "captionFields.offsetPaddingSource",
                        "Nguồn Padding",
                      )}
                      value={config.offsetPaddingSource || "max"}
                      options={[
                        {
                          value: "max",
                          label: t(
                            "captionFields.offsetPaddingMax",
                            "Lớn nhất (Max)",
                          ),
                        },
                        {
                          value: "sum",
                          label: t(
                            "captionFields.offsetPaddingSum",
                            "Tổng (Sum)",
                          ),
                        },
                        {
                          value: "min",
                          label: t(
                            "captionFields.offsetPaddingMin",
                            "Nhỏ nhất (Min)",
                          ),
                        },
                      ]}
                      onChange={(v) => {
                        onChange({
                          offsetPaddingSource:
                            v as SplicingCaptionOffsetPaddingSource,
                        } as Partial<T>);
                      }}
                    />

                    <SelectInput
                      label={t(
                        "captionFields.offsetPaddingMultiplier",
                        "Hệ số Padding",
                      )}
                      value={String(config.offsetPaddingMultiplier ?? 1)}
                      options={[
                        { value: "0.5", label: "0.5x" },
                        { value: "1", label: "1.0x" },
                        { value: "2", label: "2.0x" },
                      ]}
                      onChange={(v) => {
                        onChange({
                          offsetPaddingMultiplier: parseFloat(v),
                        } as Partial<T>);
                      }}
                    />

                    <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-300 font-mono text-center">
                      {t("captionFields.offsetCalculatedPreview", {
                        value: lockedOffset,
                        defaultValue: `Khoảng cách tính toán: ±${lockedOffset}px`,
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
            label={t("captionFields.position", "Vị trí")}
            value={config.position || "top"}
            options={positionOptions ?? defaultPositionOptions}
            onChange={(p) => onChange({ position: p as any } as Partial<T>)}
          />
          <SelectInput
            label={t("captionFields.alignment", "Căn lề")}
            value={config.alignment || "center"}
            options={alignmentOptions}
            onChange={(a) =>
              onChange({
                alignment: a as SplicingCaptionAlignment,
              } as Partial<T>)
            }
          />
        </div>

        {showOffsetInputs && (
          <div className="grid grid-cols-2 gap-2 items-end">
            <div className="relative">
              <NumberInput
                label={t("captionFields.offsetX", "Lệch X (px)")}
                value={config.offsetX ?? 0}
                onChangeValue={(offsetX) => onChange({ offsetX } as Partial<T>)}
                min={-500}
                max={500}
                disabled={config.offsetLockMode === "auto"}
              />
            </div>
            <div className="relative">
              <NumberInput
                label={t("captionFields.offsetY", "Lệch Y (px)")}
                value={config.offsetY ?? 0}
                onChangeValue={(offsetY) => onChange({ offsetY } as Partial<T>)}
                min={-500}
                max={500}
                disabled={config.offsetLockMode === "auto"}
              />
            </div>
          </div>
        )}

        <div className="pt-1">
          <label className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer select-none">
            <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <RotateCw size={14} className="text-slate-400" />
              {t("captionFields.rotate180", "Đảo ngược chữ (180°)")}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(config.rotate180)}
              onClick={() =>
                onChange({ rotate180: !config.rotate180 } as Partial<T>)
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                config.rotate180
                  ? "bg-amber-500"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.rotate180 ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        {extraPositionNode}
      </div>
    </>
  );
}
