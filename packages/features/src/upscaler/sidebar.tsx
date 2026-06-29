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

import { UPSCALER_PANEL_CONTENT } from "./upscaler-preset-info-panel";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";

export const UPSCALER_SIDEBAR_PANEL_ID = "upscaler-settings";

const UPSCALER_PRESET: SavedSetupPreset = {
  ...VIRTUAL_DEFAULT_PNG_PRESET,
  id: "preset_upscaler",
  name: "Upscaler",
  highlightColor: "#a855f7", // Purple color theme
};

interface UpscalerSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

export function UpscalerSidebar({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx,
}: UpscalerSidebarProps) {
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

  // If no image is imported, show the tool's showcase information
  if (!hasImage) {
    return (
      <SidebarPanel title="ABOUT THIS TOOL">
        <div className="px-1 py-1">
          <PresetInfoShowcasePanel {...UPSCALER_PANEL_CONTENT} padding={0} />
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
          label="AI Engine"
          sublabel={`${selectedModel.name} (${selectedVariant.label})`}
          colorTheme="purple"
          modelName={selectedModel.name}
          variantLabel={selectedVariant.label}
          onConfigureClick={() => setIsModelVariantDialogOpen(true)}
          unloadModelChecked={unloadModelAfterProcess}
          onUnloadModelChange={setUnloadModelAfterProcess}
          unloadModelTitle="Auto-unload Model"
          unloadModelSubtitle="Free up RAM immediately after processing."
          currentSelectionHeader="Current Selection"
          modelLabelText="Model:"
          modelDescription={selectedModel.description}
          variantLabelText="Variant:"
          variantDescription={selectedVariant.description}
          suitableForLabelText="Suitable for:"
          suitableForDescription={selectedModel.suitableFor}
        />
      ),
    },
    {
      id: "upscaling-settings",
      label: "",
      content: (
        <AccordionCard
          label="Upscaling Options"
          sublabel={`${scaleFactor}x Upscale (${processingMode === "safe" ? "Safe Mode" : "Fast Mode"})`}
          icon={<Sliders size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-4"
        >
          {/* Scale Factor Selection */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Scale Factor
            </span>
            {isScaleLocked ? (
              <div className="rounded-lg border border-purple-200/70 bg-purple-50/60 px-3 py-2 text-xs font-semibold text-purple-700 dark:border-purple-700/40 dark:bg-purple-900/20 dark:text-purple-200">
                Fixed at {selectedModel.scaleFactor}x by this model
              </div>
            ) : (
              <div className="space-y-2">
                <RadioCard
                  title="2x Magnify"
                  subtitle="High detail, fast processing."
                  value="2"
                  selectedValue={String(scaleFactor)}
                  onChange={(v) => setScaleFactor(Number(v))}
                  icon={<Maximize2 size={16} className="text-purple-500" />}
                  colorTheme="purple"
                />
                <RadioCard
                  title="4x Magnify"
                  subtitle="Maximum upscale resolution."
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
            label="Denoise Strength"
            value={denoiseLevel}
            min={0}
            max={100}
            step={1}
            onChange={setDenoiseLevel}
          />

          {/* Safe Mode (Tiling/Patch processing) Toggle */}
          <CheckboxCard
            checked={processingMode === "safe"}
            onChange={(checked) => setProcessingMode(checked ? "safe" : "fast")}
            title="Safe Mode (Tiling)"
            subtitle="Processes in small tiles to prevent browser crash on large files."
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
          label="Output Preset"
          theme="purple"
          identifiedPreset={UPSCALER_PRESET}
          formatFilter={["png", "webp", "avif", "jxl", "jpg"]}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
          tooltipContent="Select an export preset from the Single Processor."
        />
      ),
    },
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        title="CONFIGURATION"
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
