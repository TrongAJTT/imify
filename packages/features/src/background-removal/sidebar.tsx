import React, { useEffect, useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  BodyText,
  MutedText,
  CheckboxCard,
  AccordionCard,
  SliderInput,
  RadioCard,
  ColorPickerPopover,
  SidebarPanel,
  SidebarCard,
} from "@imify/ui";
import {
  Brain,
  Sliders,
  Image,
  Cpu,
  Settings2,
  Eraser,
  Palette,
} from "lucide-react";
import { BACKGROUND_REMOVAL_MODELS } from "./models";
import { PresetSelector } from "../processor/preset-selector";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import {
  useBackgroundRemoverStore,
  type SavedSetupPreset,
} from "@imify/stores";
import { useIdentifiedPresetLoader } from "../shared/use-identified-preset-loader";
import { ModelVariantDialog } from "./model-variant-dialog";

import { BACKGROUND_REMOVER_PANEL_CONTENT } from "./remover-preset-info-panel";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";

export const BACKGROUND_REMOVER_SIDEBAR_PANEL_ID = "bg-remover-settings";

const BG_REMOVER_PRESET: SavedSetupPreset = {
  ...VIRTUAL_DEFAULT_PNG_PRESET,
  id: "preset_background-remover",
  name: "Background Remover",
  highlightColor: "#ec4899",
};

interface BackgroundRemoverSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

export function BackgroundRemoverSidebar({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx,
}: BackgroundRemoverSidebarProps) {
  const {
    modelId,
    setModelId,
    variantId,
    setVariantId,
    edgeSmoothing,
    setEdgeSmoothing,
    outputFormat,
    setOutputFormat,
    backgroundColor,
    setBackgroundColor,
    unloadModelAfterProcess,
    setUnloadModelAfterProcess,
    activePresetId,
    applyPreset,
    resetToDefault,
    hasImage,
  } = useBackgroundRemoverStore();

  const selectedModel =
    BACKGROUND_REMOVAL_MODELS.find((m) => m.id === modelId) ??
    BACKGROUND_REMOVAL_MODELS[0];
  const selectedVariant =
    selectedModel.variants.find((v) => v.id === variantId) ??
    selectedModel.variants[0];
  const [isModelVariantDialogOpen, setIsModelVariantDialogOpen] =
    useState(false);

  // Auto-apply identified preset if it exists and no preset is active (initial load)
  useIdentifiedPresetLoader(BG_REMOVER_PRESET, activePresetId, applyPreset);

  // Initialize smart default for unloadModelAfterProcess based on hardware
  useEffect(() => {
    const storageKey = "imify-background-remover-settings";
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
            {...BACKGROUND_REMOVER_PANEL_CONTENT}
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
          colorTheme="pink"
          childrenClassName="p-3 space-y-3"
        >
          <SidebarCard
            label={`Model: ${selectedModel.name}`}
            sublabel={selectedVariant.label}
            icon={<Brain size={16} className="text-pink-500" />}
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

          <div className="relative p-3.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 border-2 border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-3 transition-all">
            <div className="flex items-center gap-2">
              <Settings2 className="text-pink-500" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Current Selection
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                <MutedText className="text-[11px] leading-relaxed">
                  <strong>Model:</strong> {selectedModel.description}
                </MutedText>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                <MutedText className="text-[11px] leading-relaxed">
                  <strong>Variant:</strong> {selectedVariant.label}
                  {selectedVariant.description && (
                    <span className="opacity-85 italic ml-1">
                      - {selectedVariant.description}
                    </span>
                  )}
                </MutedText>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                <MutedText className="text-[11px]">
                  <strong>Suitable for:</strong> {selectedModel.usecase}
                </MutedText>
              </div>
            </div>
          </div>
        </AccordionCard>
      ),
    },
    {
      id: "output-preset",
      label: "",
      content: (
        <PresetSelector
          label="Output Preset"
          theme="pink"
          identifiedPreset={BG_REMOVER_PRESET}
          formatFilter={["png", "webp", "avif", "jxl", "jpg"]}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
          tooltipContent="Select an export preset from the Single Processor."
        />
      ),
    },
    {
      id: "output-settings",
      label: "",
      content: (
        <AccordionCard
          label="Processing & Output"
          sublabel={
            outputFormat === "transparent"
              ? "Format: Transparent"
              : "Format: Solid Color"
          }
          icon={<Sliders size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-4"
        >
          <SliderInput
            label="Edge Refinement"
            value={edgeSmoothing}
            min={-10}
            max={20}
            step={1}
            onChange={setEdgeSmoothing}
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image size={14} className="text-purple-500" />
              <BodyText className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Background Type
              </BodyText>
            </div>

            <div className="space-y-2">
              <RadioCard
                title="Transparent"
                value="transparent"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="purple"
                icon={<Eraser className="text-gray-500" size={16} />}
              />

              <RadioCard
                title="Solid Color"
                value="color"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="purple"
                icon={<Palette size={16} className="text-green-500" />}
                rightSlot={
                  <ColorPickerPopover
                    label=""
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    enableAlpha={false}
                    enableGradient={false}
                  />
                }
              />
            </div>
          </div>
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
