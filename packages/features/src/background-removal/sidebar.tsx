import React, { useEffect } from "react"
import { WorkspaceConfigSidebarPanel, type WorkspaceConfigSidebarItem, BodyText, MutedText } from "@imify/ui"
import { Brain, Sliders, Image, Cpu, Settings2 } from "lucide-react"
import { useBackgroundRemoverStore } from "@imify/stores"
import { CheckboxCard, AccordionCard, SliderInput, SelectInput, RadioCard, ColorPickerPopover } from "@imify/ui"
import { BACKGROUND_REMOVAL_MODELS } from "./models"

export const BACKGROUND_REMOVER_SIDEBAR_PANEL_ID = "bg-remover-settings"

export function BackgroundRemoverSidebar() {
  const {
    modelId,
    setModelId,
    edgeSmoothing,
    setEdgeSmoothing,
    outputFormat,
    setOutputFormat,
    backgroundColor,
    setBackgroundColor,
    unloadModelAfterProcess,
    setUnloadModelAfterProcess
  } = useBackgroundRemoverStore()

  const selectedModel = BACKGROUND_REMOVAL_MODELS.find((m) => m.id === modelId) ?? BACKGROUND_REMOVAL_MODELS[0]

  // Initialize smart default for unloadModelAfterProcess based on hardware
  useEffect(() => {
    // Check if we have a persisted value or if it's the first time
    const storageKey = "imify-background-remover-settings"
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      // Very simple detection: if navigator.deviceMemory is available and <= 4
      const ram = (navigator as any).deviceMemory
      if (ram && ram <= 4) {
        setUnloadModelAfterProcess(true)
      }
    }
  }, [setUnloadModelAfterProcess])

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "remover-settings-group",
      label: "",
      content: (
        <AccordionCard
          label="Remover Settings"
          icon={<Settings2 size={16} />}
          defaultOpen={true}
          colorTheme="pink"
          childrenClassName="p-3 space-y-3"
        >
          {/* AI Model */}
          <SelectInput
            label="AI Model"
            value={selectedModel.id}
            options={BACKGROUND_REMOVAL_MODELS.map(m => ({ value: m.id, label: m.name }))}
            onChange={setModelId}
            tooltipContent={selectedModel.description}
          />

          {/* Edge Refinement */}
          <SliderInput
            label="Edge Refinement"
            value={edgeSmoothing}
            min={-10}
            max={20}
            step={1}
            suffix=""
            onChange={setEdgeSmoothing}
          />

          {/* Background Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Image size={14} />
              <BodyText className="text-xs font-semibold">Background Type</BodyText>
            </div>

            <div className="space-y-2">
              <RadioCard
                title="Transparent"
                subtitle="Remove background and keep it clear"
                value="transparent"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="pink"
                icon={<div className="w-4 h-4 rounded-sm border border-slate-200 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACtJREFUGFdjZEADJgY0QCSTmZkZpAAsAKYAFUAWQBVAFUAWQBVAFUAWQBUAFUAXQBUNAwAF+L7zAAAAAElFTkSuQmCC')] bg-repeat" />}
              />

              <RadioCard
                title="Solid Color"
                subtitle="Fill the background with a specific color"
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

          {/* Resource Efficiency */}
          <CheckboxCard
            checked={unloadModelAfterProcess}
            onChange={setUnloadModelAfterProcess}
            title="Auto-unload AI Model"
            subtitle="Free up RAM immediately after processing. Recommended for low-memory devices."
            icon={<Cpu size={16} />}
          />
          {/* <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Cpu size={14} />
              <BodyText className="text-xs font-semibold">Resource Efficiency</BodyText>
            </div>

          </div> */}
        </AccordionCard>
      )
    }
  ]

  return <WorkspaceConfigSidebarPanel title="CONFIGURATION" items={sidebarItems} />
}
