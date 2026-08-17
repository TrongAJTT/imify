"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Grid3x3,
  LayoutGrid,
  PenTool,
  Ruler,
  X,
} from "lucide-react";
import {
  BaseDialog,
  Button,
  MutedText,
  NumberInput,
  RadioCard,
  SelectInput,
  Subheading,
  PresetNameInput,
} from "@imify/ui";
import { generateDefaultPresetName, calculateAspectRatio } from "@imify/core";
import {
  DEFAULT_GRID_DESIGN_PARAMS,
  DEFAULT_SYMMETRIC_PARAMS,
  generateId,
  type CanvasSizePreset,
  type CanvasSizeUnit,
  type FillingTemplate,
} from "./types";
import { templateStorage } from "./template-storage";
import { CanvasSizeDialog } from "./canvas-size-dialog";
import { useTranslation } from "@imify/i18n";

export type TemplateCreationMethod = "manual" | "symmetric" | "grid-design";

interface TemplateMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onCreated: (
    template: FillingTemplate,
    method: TemplateCreationMethod,
  ) => void;
  initialWidth?: number;
  initialHeight?: number;
}

const DPI_DEFAULT = 300;

function toPixels(value: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round(value * dpi);
    case "cm":
      return Math.round((value / 2.54) * dpi);
    case "mm":
      return Math.round((value / 25.4) * dpi);
    default:
      return Math.round(value);
  }
}

function fromPixels(px: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round((px / dpi) * 100) / 100;
    case "cm":
      return Math.round((px / dpi) * 2.54 * 100) / 100;
    case "mm":
      return Math.round((px / dpi) * 25.4 * 10) / 10;
    default:
      return px;
  }
}

export function TemplateMethodDialog({
  isOpen,
  onClose,
  onRefresh,
  onCreated,
  initialWidth = 1920,
  initialHeight = 1080,
}: TemplateMethodDialogProps) {
  const { t } = useTranslation("filling");

  const UNIT_OPTIONS: Array<{ value: CanvasSizeUnit; label: string }> = [
    { value: "px", label: t("dialog.pixels") },
    { value: "in", label: t("dialog.inches") },
    { value: "cm", label: t("dialog.centimeters") },
    { value: "mm", label: t("dialog.millimeters") },
  ];

  const [name, setName] = useState("");
  const [method, setMethod] = useState<TemplateCreationMethod>("grid-design");
  const [widthPx, setWidthPx] = useState(initialWidth);
  const [heightPx, setHeightPx] = useState(initialHeight);
  const [unit, setUnit] = useState<CanvasSizeUnit>("px");
  const [dpi, setDpi] = useState(DPI_DEFAULT);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(
    null,
  );
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);

  const displayWidth = fromPixels(widthPx, unit, dpi);
  const displayHeight = fromPixels(heightPx, unit, dpi);

  const handleWidthChange = useCallback(
    (value: number) => {
      setWidthPx(toPixels(value, unit, dpi));
      setSelectedPresetLabel(null);
    },
    [dpi, unit],
  );

  const handleHeightChange = useCallback(
    (value: number) => {
      setHeightPx(toPixels(value, unit, dpi));
      setSelectedPresetLabel(null);
    },
    [dpi, unit],
  );

  const handlePresetConfirm = useCallback((preset: CanvasSizePreset) => {
    setWidthPx(preset.width);
    setHeightPx(preset.height);
    setSelectedPresetLabel(preset.label);
    setPresetDialogOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setName(generateDefaultPresetName("filling"));
    setMethod("grid-design");
    setWidthPx(initialWidth);
    setHeightPx(initialHeight);
    setUnit("px");
    setDpi(DPI_DEFAULT);
    setSelectedPresetLabel(null);
    setPresetDialogOpen(false);
  }, [initialHeight, initialWidth, isOpen]);

  const handleCreate = useCallback(async () => {
    if (widthPx < 1 || heightPx < 1) return;

    const now = Date.now();
    const template: FillingTemplate = {
      id: generateId("tmpl"),
      name: name.trim() || generateDefaultPresetName("filling"),
      canvasWidth: widthPx,
      canvasHeight: heightPx,
      layers: [],
      groups: [],
      symmetricParams: { ...DEFAULT_SYMMETRIC_PARAMS },
      gridDesignParams: { ...DEFAULT_GRID_DESIGN_PARAMS },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      lastUsedAt: null,
      isPinned: false,
    };

    await templateStorage.save(template);
    await onRefresh();
    onCreated(template, method);
    onClose();
  }, [heightPx, method, name, onClose, onCreated, onRefresh, widthPx]);

  return (
    <>
      <BaseDialog
        isOpen={isOpen}
        onClose={onClose}
        contentClassName="rounded-2xl w-full max-w-2xl"
      >
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <Subheading>{t("dialog.createTitle")}</Subheading>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          <div className="mb-5 space-y-4">
            <PresetNameInput
              label={t("dialog.templateName")}
              value={name}
              onChange={setName}
              featureKey="filling"
              placeholder="e.g. My Photo Grid"
              autoFocus
            />

            <section className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Ruler size={14} className="text-sky-500" />
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("dialog.canvasSize")}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setPresetDialogOpen(true)}
                  className="h-8"
                >
                  {t("dialog.popularSizes")}
                </Button>
              </div>

              <div className="mb-3 flex flex-col sm:flex-row items-center gap-3 md:gap-5">
                {/* Khối Chiều rộng + Đổi chỗ + Chiều cao (Full width trên mobile, flex-1 trên desktop) */}
                <div className="w-full min-w-0 flex flex-row gap-2 sm:gap-3 items-end">
                  <div className="flex-1 w-full min-w-0">
                    <NumberInput
                      label={t("dialog.width")}
                      value={displayWidth}
                      onChangeValue={handleWidthChange}
                      min={1}
                      max={unit === "px" ? 16384 : 9999}
                      step={unit === "px" ? 1 : 0.1}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const temp = widthPx;
                      setWidthPx(heightPx);
                      setHeightPx(temp);
                      setSelectedPresetLabel(null);
                    }}
                  >
                    <ArrowLeftRight
                      size={14}
                      className="rotate-90 sm:rotate-0"
                    />
                  </Button>

                  <div className="flex-1 w-full min-w-0">
                    <NumberInput
                      label={t("dialog.height")}
                      value={displayHeight}
                      onChangeValue={handleHeightChange}
                      min={1}
                      max={unit === "px" ? 16384 : 9999}
                      step={unit === "px" ? 1 : 0.1}
                    />
                  </div>
                </div>

                {/* Khối Đơn vị (Unit) (Full dòng trên mobile, fix cứng w-32 trên desktop) */}
                <div className="flex flex-row gap-3">
                  <SelectInput
                    label={t("dialog.unit")}
                    value={unit}
                    options={UNIT_OPTIONS}
                    onChange={(value) => setUnit(value as CanvasSizeUnit)}
                    className="flex-1 w-40"
                  />
                  {unit !== "px" && (
                    <div className="flex-1 w-full">
                      <NumberInput
                        label="DPI"
                        value={dpi}
                        onChangeValue={setDpi}
                        min={72}
                        max={600}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("dialog.finalSize", { defaultValue: "Final size:" })}{" "}
                {widthPx} x {heightPx} px
                {calculateAspectRatio(widthPx, heightPx)
                  ? ` (${calculateAspectRatio(widthPx, heightPx)})`
                  : ""}
              </div>
              {selectedPresetLabel && (
                <MutedText className="mt-1 text-[11px]">
                  {t("dialog.presetSelected", {
                    defaultValue: "Preset selected:",
                  })}{" "}
                  {selectedPresetLabel}
                </MutedText>
              )}
            </section>

            <section>
              <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("dialog.method")}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <RadioCard
                  icon={<LayoutGrid size={16} className="text-sky-500" />}
                  title={t("dialog.gridTitle")}
                  subtitle={t("dialog.gridDesc")}
                  value="grid-design"
                  selectedValue={method}
                  onChange={(value) =>
                    setMethod(value as TemplateCreationMethod)
                  }
                  className="h-full py-2.5"
                  badgeText={t("global.recommend", {
                    defaultValue: "Recommend",
                  })}
                />
                <RadioCard
                  icon={<Grid3x3 size={16} className="text-sky-500" />}
                  title={t("dialog.symmetricTitle")}
                  subtitle={t("dialog.symmetricDesc")}
                  value="symmetric"
                  selectedValue={method}
                  onChange={(value) =>
                    setMethod(value as TemplateCreationMethod)
                  }
                  className="h-full py-2.5"
                />
                <RadioCard
                  icon={<PenTool size={16} className="text-sky-500" />}
                  title={t("dialog.manualTitle")}
                  subtitle={t("dialog.manualDesc")}
                  value="manual"
                  selectedValue={method}
                  onChange={(value) =>
                    setMethod(value as TemplateCreationMethod)
                  }
                  className="h-full py-2.5"
                />
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("dialog.cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              {t("dialog.create")}
            </Button>
          </div>
        </div>
      </BaseDialog>

      <CanvasSizeDialog
        isOpen={presetDialogOpen}
        onClose={() => setPresetDialogOpen(false)}
        currentWidth={widthPx}
        currentHeight={heightPx}
        onConfirm={handlePresetConfirm}
      />
    </>
  );
}
