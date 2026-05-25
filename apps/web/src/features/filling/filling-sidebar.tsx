"use client"

import { useEffect, useMemo } from "react"
import { Box, Layers, Palette } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { ColorPickerPopover } from "@imify/ui/ui/color-picker-popover"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { SidebarPanel } from "@imify/ui"
import { FillingInfoPanel } from "@imify/features/filling/filling-info-panel"
import { SymmetricSidebar } from "@imify/features/filling/symmetric-generator/sidebar"
import { GridDesignSidebar } from "@imify/features/filling/grid-designer/sidebar"
import { ManualEditorSidebar } from "@imify/features/filling/edit/sidebar"
import { FillSidebar } from "@imify/features/filling/fill/sidebar"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import type { CanvasBackgroundType, FillingTemplate, LayerGroup, VectorLayer } from "@imify/features/filling/types"
import { PresetSelector } from "@imify/features/processor/preset-selector"
import { useIdentifiedPresetLoader } from "@imify/features/shared/use-identified-preset-loader"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "@imify/features/processor/preset-utils"
import { useBatchStore, type SavedSetupPreset } from "@imify/stores/stores/batch-store"

type FillingSidebarMode = "select" | "fill" | "edit" | "symmetric-generate" | "grid-design"

const FILLING_TARGET_FORMATS = ["png", "webp", "avif", "jxl", "jpg", "bmp", "tiff"]

interface ManualEditorSidebarBindings {
  layers: VectorLayer[]
  groups: LayerGroup[]
  canvasWidth: number
  canvasHeight: number
  selectedLayerId: string | null
  selectedLayerIds: string[]
  onLayersChange: (layers: VectorLayer[]) => void
  onGroupsChange: (groups: LayerGroup[]) => void
  onCanvasSizeChange: (width: number, height: number) => void
  onSelectLayer: (id: string | null) => void
  onToggleLayerSelection: (id: string) => void
  onClearSelection: () => void
}

const FORMAT_OPTIONS = [
  { value: "jpg", label: "JPG" },
  { value: "mozjpeg", label: "MozJPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jxl", label: "JXL" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" },
]

const BACKGROUND_OPTIONS: Array<{ value: CanvasBackgroundType; label: string }> = [
  { value: "solid", label: "Customized Color" },
  { value: "transparent", label: "Transparent" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
]

export function FillingOverviewSidebar() {
  return (
    <div className="space-y-1">
      <SidebarPanel title="ABOUT THIS TOOL" className="rounded border border-slate-200 dark:border-slate-700" childrenClassName="space-y-2">
        <div>
          <FillingInfoPanel />
        </div>
      </SidebarPanel>
    </div>
  )
}

export function FillingWorkflowSidebar({
  mode,
  template,
  manualEditor,
  enableWideSidebarGrid = false
}: {
  mode: FillingSidebarMode
  template: FillingTemplate
  manualEditor?: ManualEditorSidebarBindings | null
  enableWideSidebarGrid?: boolean
}) {
  const canvasFillState = useFillingStore((state) => state.canvasFillState)
  const setCanvasFillState = useFillingStore((state) => state.setCanvasFillState)
  
  const exportSettings = useFillingStore((state) => state.exportSettings)
  const activePresetId = useFillingStore((state) => state.activePresetId)
  const applyPreset = useFillingStore((state) => state.applyPreset)
  const resetToDefault = useFillingStore((state) => state.resetToDefault)

  const identifiedPresetId = `preset_filling_${template.id}`
  const identifiedPresetName = `Filling #${template.name}`
  const identifiedPresetColor = "#06b6d4"

  const fillingIdentifiedPreset: SavedSetupPreset = useMemo(() => ({
    ...VIRTUAL_DEFAULT_PNG_PRESET,
    id: identifiedPresetId,
    name: identifiedPresetName,
    highlightColor: identifiedPresetColor,
    config: {
      ...VIRTUAL_DEFAULT_PNG_PRESET.config,
      targetFormat: exportSettings.targetFormat as any,
      quality: exportSettings.quality,
      formatOptions: exportSettings.codecOptions as any,
      fileNamePattern: exportSettings.fileNamePattern
    }
  }), [identifiedPresetId, identifiedPresetName, identifiedPresetColor, exportSettings])

  useIdentifiedPresetLoader(fillingIdentifiedPreset, activePresetId, applyPreset)

  const batchTargetFormat = useBatchStore((s) => s.targetFormat)
  const batchQuality = useBatchStore((s) => s.quality)
  const batchFileNamePattern = useBatchStore((s) => s.fileNamePattern)
  const batchFormatOptions = useBatchStore((s) => s.formatOptions)

  // Sync global batch store changes to local store when in "Custom" mode (activePresetId is null)
  useEffect(() => {
    if (activePresetId === null) {
      applyPreset({
        id: identifiedPresetId,
        name: identifiedPresetName,
        highlightColor: identifiedPresetColor,
        config: {
          ...VIRTUAL_DEFAULT_PNG_PRESET.config,
          targetFormat: batchTargetFormat,
          quality: batchQuality,
          fileNamePattern: batchFileNamePattern,
          formatOptions: batchFormatOptions
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    }
  }, [activePresetId, batchTargetFormat, batchQuality, batchFileNamePattern, batchFormatOptions, identifiedPresetId, identifiedPresetName, identifiedPresetColor, applyPreset])

  const modeLabel =
    mode === "fill"
      ? "Fill"
      : mode === "edit"
        ? "Manual Edit"
        : mode === "grid-design"
          ? "Grid Designer"
          : "Symmetric Generate"

  if (mode === "symmetric-generate") {
    return (
      <div className="space-y-2">
        <SidebarPanel title="CONFIGURATION" childrenClassName="space-y-2">
          <SymmetricSidebar template={template} />
        </SidebarPanel>
      </div>
    )
  }

  if (mode === "grid-design") {
    return (
      <div className="space-y-2">
        <SidebarPanel title="CONFIGURATION" childrenClassName="space-y-2">
          <GridDesignSidebar template={template} />
        </SidebarPanel>
      </div>
    )
  }

  if (mode === "edit" && manualEditor) {
    return (
      <div className="space-y-2">
        <ManualEditorSidebar
          layers={manualEditor.layers}
          groups={manualEditor.groups}
          canvasWidth={manualEditor.canvasWidth}
          canvasHeight={manualEditor.canvasHeight}
          selectedLayerId={manualEditor.selectedLayerId}
          selectedLayerIds={manualEditor.selectedLayerIds}
          onLayersChange={manualEditor.onLayersChange}
          onGroupsChange={manualEditor.onGroupsChange}
          onCanvasSizeChange={manualEditor.onCanvasSizeChange}
          onSelectLayer={manualEditor.onSelectLayer}
          onToggleLayerSelection={manualEditor.onToggleLayerSelection}
          onClearSelection={manualEditor.onClearSelection}
          enableWideSidebarGrid={enableWideSidebarGrid}
        />
      </div>
    )
  }

  if (mode === "fill") {
    return (
      <div className="space-y-2">
        <FillSidebar template={template} enableWideSidebarGrid={enableWideSidebarGrid} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AccordionCard icon={<Box size={16} />} label="Template" sublabel={modeLabel} colorTheme="sky" defaultOpen>
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{template.name}</p>
          <p>{template.canvasWidth} x {template.canvasHeight} px</p>
          <p>{template.layers.length} layers, {template.groups.length} groups</p>
          <p>{template.usageCount} exports</p>
        </div>
      </AccordionCard>

      <AccordionCard icon={<Palette size={16} />} label="Canvas" sublabel="Background & overrides" colorTheme="purple">
        <div className="space-y-2">
          <SelectInput
            label="Background"
            value={canvasFillState.backgroundType}
            options={BACKGROUND_OPTIONS}
            onChange={(value) => setCanvasFillState({ ...canvasFillState, backgroundType: value as CanvasBackgroundType })}
          />
          {(canvasFillState.backgroundType === "solid" || canvasFillState.backgroundType === "gradient" || canvasFillState.backgroundType === "image") && (
            <ColorPickerPopover
              label="Background Color"
              value={canvasFillState.backgroundColor}
              onChange={(value) => setCanvasFillState({ ...canvasFillState, backgroundColor: value })}
              enableAlpha
              outputMode="rgba"
            />
          )}
          <CheckboxCard
            title="Override Layer Borders"
            checked={canvasFillState.borderOverrideEnabled}
            onChange={(checked) => setCanvasFillState({ ...canvasFillState, borderOverrideEnabled: checked })}
          />
          {canvasFillState.borderOverrideEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Width"
                value={canvasFillState.borderOverrideWidth}
                onChangeValue={(value) => setCanvasFillState({ ...canvasFillState, borderOverrideWidth: value })}
                min={0}
                max={50}
              />
              <ColorPickerPopover
                label="Color"
                value={canvasFillState.borderOverrideColor}
                onChange={(value) => setCanvasFillState({ ...canvasFillState, borderOverrideColor: value })}
                outputMode="hex"
                enableAlpha={false}
              />
            </div>
          )}
          <CheckboxCard
            title="Override Corner Radius"
            checked={canvasFillState.cornerRadiusOverrideEnabled}
            onChange={(checked) => setCanvasFillState({ ...canvasFillState, cornerRadiusOverrideEnabled: checked })}
          />
          {canvasFillState.cornerRadiusOverrideEnabled && (
            <NumberInput
              label="Corner Radius"
              value={canvasFillState.cornerRadiusOverride}
              onChangeValue={(value) => setCanvasFillState({ ...canvasFillState, cornerRadiusOverride: value })}
              min={0}
              max={200}
            />
          )}
        </div>
      </AccordionCard>

      <PresetSelector
        label="Output Settings"
        theme="amber"
        identifiedPreset={fillingIdentifiedPreset}
        formatFilter={FILLING_TARGET_FORMATS}
        activePresetId={activePresetId}
        onSelect={applyPreset}
        onReset={resetToDefault}
        tooltipContent="Select an export preset for Image Filling."
      />
    </div>
  )
}
