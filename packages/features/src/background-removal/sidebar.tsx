import React, { useEffect } from "react"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  BodyText,
  MutedText,
  CheckboxCard,
  AccordionCard,
  SliderInput,
  SelectInput,
  RadioCard,
  ColorPickerPopover,
  SidebarPanel
} from "@imify/ui"
import { Brain, Sliders, Image, Cpu, Settings2 } from "lucide-react"
import { BACKGROUND_REMOVAL_MODELS } from "./models"
import { PresetSelector } from "../processor/preset-selector"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils"
import { useBackgroundRemoverStore } from "@imify/stores"

import { BACKGROUND_REMOVER_PANEL_CONTENT } from "./remover-preset-info-panel"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"

export const BACKGROUND_REMOVER_SIDEBAR_PANEL_ID = "bg-remover-settings"

interface BackgroundRemoverSidebarProps {
  enableWideSidebarGrid?: boolean
  autoWideSidebarGridMinWidthPx?: number | null
}

export function BackgroundRemoverSidebar({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx
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
    hasImage
  } = useBackgroundRemoverStore()

  const selectedModel = BACKGROUND_REMOVAL_MODELS.find((m) => m.id === modelId) ?? BACKGROUND_REMOVAL_MODELS[0]
  const selectedVariant = selectedModel.variants.find(v => v.id === variantId) ?? selectedModel.variants[0]

  // Initialize smart default for unloadModelAfterProcess based on hardware
  useEffect(() => {
    const storageKey = "imify-background-remover-settings"
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      const ram = (navigator as any).deviceMemory
      if (ram && ram <= 4) {
        setUnloadModelAfterProcess(true)
      }
    }
  }, [setUnloadModelAfterProcess])

  // If no image is imported, show the tool's showcase information
  if (!hasImage) {
    return (
      <SidebarPanel
        title="ABOUT THIS TOOL"
      >
        <div className="px-1 py-1">
          <PresetInfoShowcasePanel {...BACKGROUND_REMOVER_PANEL_CONTENT} padding={0} />
        </div>
      </SidebarPanel>
    )
  }

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "ai-engine-settings",
      label: "",
      content: (
        <AccordionCard
          label="AI Engine"
          icon={<Brain size={16} />}
          defaultOpen={true}
          colorTheme="pink"
          childrenClassName="p-3 space-y-3"
        >
          <div className="grid grid-cols-1 gap-2">
            <SelectInput
              label="AI Model"
              value={selectedModel.id}
              options={BACKGROUND_REMOVAL_MODELS.map(m => ({ value: m.id, label: m.name }))}
              onChange={setModelId}
              tooltipContent="Choose the AI architecture for background removal."
            />

            {selectedModel.variants.length > 0 && (
              <SelectInput
                label="Variant"
                value={selectedVariant.id}
                options={selectedModel.variants.map(v => ({ value: v.id, label: v.label }))}
                onChange={setVariantId}
                tooltipContent="Select model precision."
              />
            )}
          </div>

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
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Current Selection</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                <MutedText className="text-[11px] leading-relaxed">
                  <strong>Model:</strong> {selectedModel.description}
                </MutedText>
              </div>
            </div>
          </div>
        </AccordionCard>
      )
    },
    {
      id: "output-preset",
      label: "",
      content: (
        <PresetSelector
          label="Output Preset"
          theme="pink"
          defaultPreset={VIRTUAL_DEFAULT_PNG_PRESET}
          formatFilter={["png", "webp", "avif", "jxl", "jpg"]}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
          tooltipContent="Select an export preset from the Single Processor."
        />
      )
    },
    {
      id: "output-settings",
      label: "",
      content: (
        <AccordionCard
          label="Processing & Output"
          icon={<Sliders size={16} />}
          defaultOpen={true}
          colorTheme="pink"
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
              <Image size={14} className="text-pink-500" />
              <BodyText className="text-xs font-semibold uppercase tracking-wider text-slate-500">Background Type</BodyText>
            </div>

            <div className="space-y-2">
              <RadioCard
                title="Transparent"
                value="transparent"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="pink"
                icon={<div className="w-4 h-4 rounded-sm border border-slate-200 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACtJREFUGFdjZEADJgY0QCSTmZkZpAAsAKYAFUAWQBVAFUAWQBVAFUAWQBVAFUAWQBVAFUAWQBUAFUAXQBUNAwAF+L7zAAAAAElFTkSuQmCC')] bg-repeat" />}
              />

              <RadioCard
                title="Solid Color"
                value="color"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="pink"
                icon={<div className="w-4 h-4 rounded-sm border border-slate-200" style={{ backgroundColor }} />}
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
      )
    }
  ]

  return (
    <WorkspaceConfigSidebarPanel
      title="CONFIGURATION"
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
      autoTwoColumnMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  )
}
