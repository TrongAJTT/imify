import React, { useEffect, useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  CheckboxCard,
  AccordionCard,
  SliderInput,
  RadioCard,
  SidebarPanel,
} from "@imify/ui";
import { Sliders, Maximize2, Grid } from "lucide-react";
import { IMAGE_UPSCALER_MODELS } from "./models";
import { PresetSelector } from "../processor/preset-selector";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import { useImageUpscalerStore, type SavedSetupPreset } from "@imify/stores";
import { useIdentifiedPresetLoader } from "../shared/use-identified-preset-loader";
import { ModelVariantDialog } from "./model-variant-dialog";
import { AiEngineAccordionCard } from "../shared/ai-engine-accordion-card";
import { FEATURE_PRESET_PREFIXES } from "@imify/core";

import { useUpscalerPanelContent } from "./upscaler-preset-info-panel";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";

import { useTranslation } from "@imify/i18n";

import {
  UPSCALER_PRESET,
  DENOISE_STRENGTH_MIN,
  DENOISE_STRENGTH_MAX,
  DENOISE_STRENGTH_STEP,
} from "./config";

interface UpscalerSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

export function UpscalerSidebar({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx,
}: UpscalerSidebarProps) {
  const { t } = useTranslation(["upscaler", "common"]);
  const {
    modelId,
    setModelId,
    variantId,
    setVariantId,
    scaleFactor,
    setScaleFactor,
    denoiseLevel,
    setDenoiseLevel,
    processingMode,
    setProcessingMode,
    unloadModelAfterProcess,
    setUnloadModelAfterProcess,
    activePresetId,
    applyPreset,
    resetToDefault,
    hasImage,
  } = useImageUpscalerStore();

  const selectedModel =
    IMAGE_UPSCALER_MODELS.find((m) => m.id === modelId) ??
    IMAGE_UPSCALER_MODELS[0];
  const selectedVariant =
    selectedModel.variants.find((v) => v.id === variantId) ??
    selectedModel.variants[0];
  const [isModelVariantDialogOpen, setIsModelVariantDialogOpen] =
    useState(false);
  const isScaleLocked = typeof selectedModel.scaleFactor === "number";

  // Auto-apply identified preset if it exists and no preset is active (initial load)
  useIdentifiedPresetLoader(UPSCALER_PRESET, activePresetId, applyPreset);

  useEffect(() => {
    if (isScaleLocked && scaleFactor !== selectedModel.scaleFactor) {
      setScaleFactor(selectedModel.scaleFactor);
    }
  }, [isScaleLocked, scaleFactor, selectedModel.scaleFactor, setScaleFactor]);

  // Initialize smart default for unloadModelAfterProcess based on hardware
  useEffect(() => {
    const storageKey = "imify-upscaler-settings";
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      const ram = (navigator as any).deviceMemory;
      if (ram && ram <= 4) {
        setUnloadModelAfterProcess(true);
      }
    }
  }, [setUnloadModelAfterProcess]);

  const showcaseContent = useUpscalerPanelContent();

  // If no image is imported, show the tool's showcase information
  if (!hasImage) {
    return (
      <SidebarPanel title={t("common:aboutThisTool")}>
        <div className="px-1 py-1">
          <PresetInfoShowcasePanel {...showcaseContent} padding={0} />
        </div>
      </SidebarPanel>
    );
  }

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "ai-engine-settings",
      label: "",
      content: (
        <AiEngineAccordionCard
          label={t("sidebar.aiEngine")}
          sublabel={`${selectedModel.name} (${selectedVariant.label})`}
          colorTheme="purple"
          modelName={selectedModel.name}
          variantLabel={selectedVariant.label}
          onConfigureClick={() => setIsModelVariantDialogOpen(true)}
          unloadModelChecked={unloadModelAfterProcess}
          onUnloadModelChange={setUnloadModelAfterProcess}
          unloadModelTitle={t("sidebar.unloadModelTitle")}
          unloadModelSubtitle={t("sidebar.unloadModelSubtitle")}
          currentSelectionHeader={t("sidebar.currentSelection")}
          modelLabelText={t("sidebar.modelLabel")}
          modelDescription={selectedModel.description}
          variantLabelText={t("sidebar.variantLabel")}
          variantDescription={selectedVariant.description}
          suitableForLabelText={t("sidebar.suitableForLabel")}
          suitableForDescription={selectedModel.suitableFor}
        />
      ),
    },
    {
      id: "upscaling-settings",
      label: "",
      content: (
        <AccordionCard
          label={t("sidebar.optionsLabel")}
          sublabel={
            processingMode === "safe"
              ? t("sidebar.sublabelSafe", { scale: scaleFactor })
              : t("sidebar.sublabelFast", { scale: scaleFactor })
          }
          icon={<Sliders size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-4"
        >
          {/* Scale Factor Selection */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t("sidebar.scaleFactor")}
            </span>
            {isScaleLocked ? (
              <div className="rounded-lg border border-purple-200/70 bg-purple-50/60 px-3 py-2 text-xs font-semibold text-purple-700 dark:border-purple-700/40 dark:bg-purple-900/20 dark:text-purple-200">
                {t("sidebar.scaleFixed", { scale: selectedModel.scaleFactor })}
              </div>
            ) : (
              <div className="space-y-2">
                <RadioCard
                  title={t("sidebar.magnify2x")}
                  subtitle={t("sidebar.magnify2xDesc")}
                  value="2"
                  selectedValue={String(scaleFactor)}
                  onChange={(v) => setScaleFactor(Number(v))}
                  icon={<Maximize2 size={16} className="text-purple-500" />}
                  colorTheme="purple"
                />
                <RadioCard
                  title={t("sidebar.magnify4x")}
                  subtitle={t("sidebar.magnify4xDesc")}
                  value="4"
                  selectedValue={String(scaleFactor)}
                  onChange={(v) => setScaleFactor(Number(v))}
                  icon={<Maximize2 size={16} className="text-purple-500" />}
                  colorTheme="purple"
                />
              </div>
            )}
          </div>

          {/* Denoise Level Slider */}
          <SliderInput
            label={t("sidebar.denoiseStrength")}
            value={denoiseLevel}
            min={DENOISE_STRENGTH_MIN}
            max={DENOISE_STRENGTH_MAX}
            step={DENOISE_STRENGTH_STEP}
            onChange={setDenoiseLevel}
          />

          {/* Safe Mode (Tiling/Patch processing) Toggle */}
          <CheckboxCard
            checked={processingMode === "safe"}
            onChange={(checked) => setProcessingMode(checked ? "safe" : "fast")}
            title={t("sidebar.safeMode")}
            subtitle={t("sidebar.safeModeDesc")}
            icon={<Grid size={16} />}
          />
        </AccordionCard>
      ),
    },
    {
      id: "export-presets",
      label: "",
      content: (
        <PresetSelector
          label={t("sidebar.outputPreset")}
          theme="purple"
          identifiedPreset={UPSCALER_PRESET}
          formatFilter={["png", "webp", "avif", "jxl", "jpg"]}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
          tooltipContent={t("sidebar.outputPresetTooltip")}
        />
      ),
    },
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        title={t("sidebar.panelTitle")}
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
        autoTwoColumnMinWidthPx={autoWideSidebarGridMinWidthPx}
      />

      <ModelVariantDialog
        isOpen={isModelVariantDialogOpen}
        onClose={() => setIsModelVariantDialogOpen(false)}
        modelId={modelId}
        setModelId={setModelId}
        variantId={variantId}
        setVariantId={setVariantId}
      />
    </>
  );
}

export function UpscalerSidebarShell({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx = 1024,
}: UpscalerSidebarProps) {
  return (
    <UpscalerSidebar
      enableWideSidebarGrid={enableWideSidebarGrid}
      autoWideSidebarGridMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  );
}
