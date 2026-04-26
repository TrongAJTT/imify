"use client"

import { useMemo } from "react"
import { Box, ImagePlus, Layers, Palette, Settings2 } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { ColorPickerPopover } from "@imify/ui/ui/color-picker-popover"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { SidebarPanel } from "@imify/ui"
import { FillingInfoPanel } from "@imify/features/filling/filling-info-panel"
import { SymmetricSidebar } from "@imify/features/filling/symmetric-sidebar"
import { ManualEditorSidebar } from "@imify/features/filling/manual-editor-sidebar"
import { FillSidebar } from "@imify/features/filling/fill-sidebar"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import type { CanvasBackgroundType, FillingTemplate, LayerFillState, LayerGroup, VectorLayer } from "@imify/features/filling/types"

type FillingSidebarMode = "select" | "fill" | "edit" | "symmetric-generate"

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
      <SidebarPanel title="INFORMATION" className="rounded border border-slate-200 dark:border-slate-700" childrenClassName="space-y-2">
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
  const exportFormat = useFillingStore((state) => state.exportFormat)
  const exportQuality = useFillingStore((state) => state.exportQuality)
  const setCanvasFillState = useFillingStore((state) => state.setCanvasFillState)
  const updateLayerFillState = useFillingStore((state) => state.updateLayerFillState)
  const setExportFormat = useFillingStore((state) => state.setExportFormat)
  const setExportQuality = useFillingStore((state) => state.setExportQuality)
  const setExportJxlEffort = useFillingStore((state) => state.setExportJxlEffort)
  const setExportJxlLossless = useFillingStore((state) => state.setExportJxlLossless)
  const setExportJxlProgressive = useFillingStore((state) => state.setExportJxlProgressive)
  const setExportAvifSpeed = useFillingStore((state) => state.setExportAvifSpeed)
  const setExportAvifLossless = useFillingStore((state) => state.setExportAvifLossless)
  const setExportAvifQualityAlpha = useFillingStore((state) => state.setExportAvifQualityAlpha)
  const setExportWebpLossless = useFillingStore((state) => state.setExportWebpLossless)
  const setExportWebpEffort = useFillingStore((state) => state.setExportWebpEffort)
  const setExportWebpNearLossless = useFillingStore((state) => state.setExportWebpNearLossless)
  const setExportPngTinyMode = useFillingStore((state) => state.setExportPngTinyMode)
  const setExportPngDitheringLevel = useFillingStore((state) => state.setExportPngDitheringLevel)
  const setExportPngOxiPngCompression = useFillingStore((state) => state.setExportPngOxiPngCompression)
  const setExportMozJpegProgressive = useFillingStore((state) => state.setExportMozJpegProgressive)
  const setExportMozJpegChromaSubsampling = useFillingStore((state) => state.setExportMozJpegChromaSubsampling)
  const setExportBmpColorDepth = useFillingStore((state) => state.setExportBmpColorDepth)
  const setExportBmpDitheringLevel = useFillingStore((state) => state.setExportBmpDitheringLevel)
  const setExportTiffColorMode = useFillingStore((state) => state.setExportTiffColorMode)
  const exportMozJpegProgressive = useFillingStore((state) => state.exportMozJpegProgressive)
  const exportMozJpegChromaSubsampling = useFillingStore((state) => state.exportMozJpegChromaSubsampling)
  const exportPngTinyMode = useFillingStore((state) => state.exportPngTinyMode)
  const exportPngOxiPngCompression = useFillingStore((state) => state.exportPngOxiPngCompression)
  const exportPngDitheringLevel = useFillingStore((state) => state.exportPngDitheringLevel)
  const exportWebpLossless = useFillingStore((state) => state.exportWebpLossless)
  const exportWebpNearLossless = useFillingStore((state) => state.exportWebpNearLossless)
  const exportWebpEffort = useFillingStore((state) => state.exportWebpEffort)
  const exportAvifSpeed = useFillingStore((state) => state.exportAvifSpeed)
  const exportAvifQualityAlpha = useFillingStore((state) => state.exportAvifQualityAlpha)
  const exportAvifLossless = useFillingStore((state) => state.exportAvifLossless)
  const exportJxlEffort = useFillingStore((state) => state.exportJxlEffort)
  const exportJxlLossless = useFillingStore((state) => state.exportJxlLossless)
  const exportJxlProgressive = useFillingStore((state) => state.exportJxlProgressive)
  const exportBmpColorDepth = useFillingStore((state) => state.exportBmpColorDepth)
  const exportBmpDitheringLevel = useFillingStore((state) => state.exportBmpDitheringLevel)
  const exportTiffColorMode = useFillingStore((state) => state.exportTiffColorMode)

  const modeLabel = mode === "fill" ? "Fill" : mode === "edit" ? "Manual Edit" : "Symmetric Generate"

  if (mode === "symmetric-generate") {
    return (
      <div className="space-y-2">
        <SidebarPanel title="CONFIGURATION" childrenClassName="space-y-2">
          <SymmetricSidebar template={template} />
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

      <AccordionCard icon={<Settings2 size={16} />} label="Export" sublabel={exportFormat.toUpperCase()} colorTheme="amber">
        <div className="space-y-2">
          <SelectInput
            label="Format"
            value={exportFormat}
            options={FORMAT_OPTIONS}
            onChange={(value) => setExportFormat(value as typeof exportFormat)}
          />
          <NumberInput label="Quality" value={exportQuality} onChangeValue={setExportQuality} min={1} max={100} />

          {(exportFormat === "jpg" || exportFormat === "mozjpeg") && (
            <>
              <CheckboxCard
                icon={<ImagePlus size={14} />}
                title="Progressive"
                checked={exportMozJpegProgressive}
                onChange={setExportMozJpegProgressive}
              />
              <SelectInput
                label="Chroma Subsampling"
                value={exportMozJpegChromaSubsampling}
                options={[
                  { value: "4:4:4", label: "4:4:4" },
                  { value: "4:2:2", label: "4:2:2" },
                  { value: "4:2:0", label: "4:2:0" },
                ]}
                onChange={setExportMozJpegChromaSubsampling}
              />
            </>
          )}

          {exportFormat === "png" && (
            <>
              <CheckboxCard title="Tiny Mode" checked={exportPngTinyMode} onChange={setExportPngTinyMode} />
              <CheckboxCard
                title="OxiPNG Compression"
                checked={exportPngOxiPngCompression}
                onChange={setExportPngOxiPngCompression}
              />
              <NumberInput
                label="Dithering Level"
                value={exportPngDitheringLevel}
                onChangeValue={setExportPngDitheringLevel}
                min={0}
                max={100}
              />
            </>
          )}

          {exportFormat === "webp" && (
            <>
              <CheckboxCard title="Lossless" checked={exportWebpLossless} onChange={setExportWebpLossless} />
              <NumberInput
                label="Near Lossless"
                value={exportWebpNearLossless}
                onChangeValue={setExportWebpNearLossless}
                min={0}
                max={100}
              />
              <NumberInput label="Effort" value={exportWebpEffort} onChangeValue={setExportWebpEffort} min={0} max={6} />
            </>
          )}

          {exportFormat === "avif" && (
            <>
              <NumberInput label="Speed" value={exportAvifSpeed} onChangeValue={setExportAvifSpeed} min={0} max={10} />
              <NumberInput
                label="Alpha Quality"
                value={exportAvifQualityAlpha}
                onChangeValue={setExportAvifQualityAlpha}
                min={1}
                max={100}
              />
              <CheckboxCard title="Lossless" checked={exportAvifLossless} onChange={setExportAvifLossless} />
            </>
          )}

          {exportFormat === "jxl" && (
            <>
              <NumberInput label="Effort" value={exportJxlEffort} onChangeValue={setExportJxlEffort} min={1} max={9} />
              <CheckboxCard title="Lossless" checked={exportJxlLossless} onChange={setExportJxlLossless} />
              <CheckboxCard title="Progressive" checked={exportJxlProgressive} onChange={setExportJxlProgressive} />
            </>
          )}

          {exportFormat === "bmp" && (
            <>
              <SelectInput
                label="Color Depth"
                value={String(exportBmpColorDepth)}
                options={[
                  { value: "1", label: "1-bit" },
                  { value: "8", label: "8-bit" },
                  { value: "24", label: "24-bit" },
                  { value: "32", label: "32-bit" },
                ]}
                onChange={(value) => setExportBmpColorDepth(Number(value) as 1 | 8 | 24 | 32)}
              />
              <NumberInput
                label="Dithering Level"
                value={exportBmpDitheringLevel}
                onChangeValue={setExportBmpDitheringLevel}
                min={0}
                max={100}
              />
            </>
          )}

          {exportFormat === "tiff" && (
            <SelectInput
              label="Color Mode"
              value={exportTiffColorMode}
              options={[
                { value: "color", label: "Color" },
                { value: "grayscale", label: "Grayscale" },
              ]}
              onChange={(value) => setExportTiffColorMode(value as "color" | "grayscale")}
            />
          )}
        </div>
      </AccordionCard>
    </div>
  )
}
