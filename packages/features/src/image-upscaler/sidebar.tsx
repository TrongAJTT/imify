import React, { useEffect, useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  CheckboxCard,
  AccordionCard,
  SliderInput,
  RadioCard,
  SidebarPanel,
  SidebarCard,
} from "@imify/ui";
import {
  Brain,
  Sliders,
  Cpu,
  Settings2,
  Maximize2,
  Grid,
} from "lucide-react";
import { IMAGE_UPSCALER_MODELS } from "./models";
import { PresetSelector } from "../processor/preset-selector";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import {
  useImageUpscalerStore,
  type SavedSetupPreset,
} from "@imify/stores";
import { useIdentifiedPresetLoader } from "../shared/use-identified-preset-loader";
import { ModelVariantDialog } from "./model-variant-dialog";

import { IMAGE_UPSCALER_PANEL_CONTENT } from "./upscaler-preset-info-panel";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";

export const IMAGE_UPSCALER_SIDEBAR_PANEL_ID = "image-upscaler-settings";

const UPSCALER_PRESET: SavedSetupPreset = {
  ...VIRTUAL_DEFAULT_PNG_PRESET,
  id: "preset_image-upscaler",
  name: "Image Upscaler",
  highlightColor: "#a855f7", // Purple color theme
};

interface ImageUpscalerSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

export function ImageUpscalerSidebar({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx,
}: ImageUpscalerSidebarProps) {
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

  // Auto-apply identified preset if it exists and no preset is active (initial load)
  useIdentifiedPresetLoader(UPSCALER_PRESET, activePresetId, applyPreset);

  // Initialize smart default for unloadModelAfterProcess based on hardware
  useEffect(() => {
    const storageKey = "imify-image-upscaler-settings";
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
          <PresetInfoShowcasePanel
            {...IMAGE_UPSCALER_PANEL_CONTENT}
            padding={0}
          />
        </div>
      </SidebarPanel>
    );
  }

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "ai-engine-settings",
      label: "",
      content: (
        <AccordionCard
          label="AI Engine"
          sublabel={`${selectedModel.name} (${selectedVariant.label})`}
          icon={<Brain size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-3"
        >
          <SidebarCard
            label={`Model: ${selectedModel.name}`}
            sublabel={selectedVariant.label}
            icon={<Brain size={16} className="text-purple-500" />}
            onClick={() => setIsModelVariantDialogOpen(true)}
            className="cursor-pointer"
          />

          <CheckboxCard
            checked={unloadModelAfterProcess}
            onChange={setUnloadModelAfterProcess}
            title="Auto-unload Model"
            subtitle="Free up RAM immediately after processing."
            icon={<Cpu size={16} />}
          />

          <div className="relative p-3.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-3 transition-all">
            <div className="flex items-center gap-2">
              <Settings2 className="text-purple-500" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Current Selection
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block leading-tight">Suitable for</span>
                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                    {selectedModel.suitableFor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AccordionCard>
      ),
    },
    {
      id: "upscaling-settings",
      label: "",
      content: (
        <AccordionCard
          label="Upscaling Options"
          sublabel={`${scaleFactor}x Upscale (${processingMode === 'safe' ? 'Safe Mode' : 'Fast Mode'})`}
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
        <AccordionCard
          label="Export Settings"
          icon={<Settings2 size={16} />}
          defaultOpen={false}
          colorTheme="purple"
          childrenClassName="p-3"
        >
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
        </AccordionCard>
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

export function ImageUpscalerSidebarShell({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx = 1024,
}: ImageUpscalerSidebarProps) {
  return (
    <ImageUpscalerSidebar
      enableWideSidebarGrid={enableWideSidebarGrid}
      autoWideSidebarGridMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  );
}
