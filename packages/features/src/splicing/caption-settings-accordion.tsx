import React, { useEffect } from "react";
import {
  Type,
  Link2,
  Unlink2,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import {
  AccordionCard,
  NumberInput,
  SelectInput,
  ColorPickerPopover,
} from "@imify/ui";

import { useTranslation } from "@imify/i18n";
import { useFontStore } from "@imify/stores/stores/font-store";
import type {
  SplicingCaptionConfig,
  SplicingCaptionMode,
  SplicingCaptionPosition,
  SplicingCaptionAlignment,
} from "./types";

interface CaptionSettingsAccordionProps {
  captionConfig: SplicingCaptionConfig;
  onCaptionConfigChange: (patch: Partial<SplicingCaptionConfig>) => void;
}

export function CaptionSettingsAccordion({
  captionConfig,
  onCaptionConfigChange,
}: CaptionSettingsAccordionProps) {
  const { t } = useTranslation("splicing");
  const { installedFonts, loadInstalledFonts } = useFontStore();

  useEffect(() => {
    loadInstalledFonts();
  }, [loadInstalledFonts]);

  const mode = captionConfig.mode;
  const isEnabled = mode !== "none";

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
    ...(mode === "inside"
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

  const handlePaddingVChange = (v: number) => {
    if (captionConfig.paddingLinked) {
      onCaptionConfigChange({ paddingV: v, paddingH: v });
    } else {
      onCaptionConfigChange({ paddingV: v });
    }
  };

  const handlePaddingHChange = (h: number) => {
    if (captionConfig.paddingLinked) {
      onCaptionConfigChange({ paddingV: h, paddingH: h });
    } else {
      onCaptionConfigChange({ paddingH: h });
    }
  };

  const togglePaddingLinked = () => {
    const nextLinked = !captionConfig.paddingLinked;
    if (nextLinked) {
      onCaptionConfigChange({
        paddingLinked: true,
        paddingH: captionConfig.paddingV,
      });
    } else {
      onCaptionConfigChange({ paddingLinked: false });
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
            if (nextMode === "outside" && captionConfig.position === "center") {
              onCaptionConfigChange({ mode: nextMode, position: "top" });
            } else {
              onCaptionConfigChange({ mode: nextMode });
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
                  onChangeValue={(fontSize) =>
                    onCaptionConfigChange({ fontSize })
                  }
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
                <button
                  type="button"
                  onClick={togglePaddingLinked}
                  className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                    captionConfig.paddingLinked
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
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

              <div className="grid grid-cols-2 gap-2 items-end">
                <NumberInput
                  label={t("captionFields.paddingV")}
                  value={captionConfig.paddingV}
                  onChangeValue={handlePaddingVChange}
                  min={0}
                  max={150}
                />
                <NumberInput
                  label={t("captionFields.paddingH")}
                  value={captionConfig.paddingH}
                  onChangeValue={handlePaddingHChange}
                  min={0}
                  max={150}
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
            </div>

            {/* Section: Position & Alignment */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("captionFields.positionSection")}
              </span>

              <div className="grid grid-cols-2 gap-2">
                <SelectInput
                  label={t("captionFields.position")}
                  value={captionConfig.position}
                  options={positionOptions}
                  onChange={(p) =>
                    onCaptionConfigChange({
                      position: p as SplicingCaptionPosition,
                    })
                  }
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

              {captionConfig.position !== "center" && (
                <div className="grid grid-cols-2 gap-2 items-end">
                  <NumberInput
                    label={t("captionFields.offsetX")}
                    value={captionConfig.offsetX}
                    onChangeValue={(offsetX) =>
                      onCaptionConfigChange({ offsetX })
                    }
                    min={-500}
                    max={500}
                  />
                  <NumberInput
                    label={t("captionFields.offsetY")}
                    value={captionConfig.offsetY}
                    onChangeValue={(offsetY) =>
                      onCaptionConfigChange({ offsetY })
                    }
                    min={-500}
                    max={500}
                  />
                </div>
              )}

              {/* Flips */}
              <div className="pt-1 space-y-1.5">
                <label className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer select-none">
                  <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FlipHorizontal size={14} className="text-slate-400" />
                    {t("captionFields.flipHorizontal")}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={captionConfig.flipHorizontal}
                    onClick={() =>
                      onCaptionConfigChange({
                        flipHorizontal: !captionConfig.flipHorizontal,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                      captionConfig.flipHorizontal
                        ? "bg-amber-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        captionConfig.flipHorizontal
                          ? "translate-x-4"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer select-none">
                  <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FlipVertical size={14} className="text-slate-400" />
                    {t("captionFields.flipVertical")}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={captionConfig.flipVertical}
                    onClick={() =>
                      onCaptionConfigChange({
                        flipVertical: !captionConfig.flipVertical,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                      captionConfig.flipVertical
                        ? "bg-amber-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        captionConfig.flipVertical
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
