import { useEffect, useMemo, useState } from "react"
import { FileEdit, Crop } from "lucide-react"

import { QUALITY_FORMATS } from "@/core/format-config"
import { getCanonicalExtension } from "@/core/download-utils"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import type {
  SplicingExportFormat,
  SplicingExportMode,
  SplicingImageAppearanceDirection,
  SplicingImageResize,
  SplicingPreset
} from "@/features/splicing/types"
import { NumberInput } from "@/options/components/ui/number-input"
import { RadioCard } from "@/options/components/ui/radio-card"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { useSplicingStore } from "@/options/stores/splicing-store"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import SidebarCard from "@/options/components/ui/sidebar-card"
import { ConcurrencySelector } from "@/options/components/shared/concurrency-selector"
import { FormatAdvancedSettingsCard } from "@/options/components/shared/format-advanced-settings-card"
import { TargetFormatQualityCard } from "../shared/target-format-quality-card"
import { ResizeCard } from "../shared/resize-card"
import {
  RenamePatternDialog,
  SPLICING_EXPORT_RENAME_PRESETS,
  SPLICING_EXPORT_RENAME_TAGS
} from "@/options/components/ui/rename-pattern-dialog"
import {
  ALIGNMENT_OPTIONS,
  type BentoLayoutMode,
  EXPORT_FORMAT_OPTIONS,
  EXPORT_MODE_OPTIONS,
  GRID_DIRECTION_OPTIONS,
  PRESET_OPTIONS,
  STITCH_H_DIRECTION_OPTIONS,
  STITCH_V_DIRECTION_OPTIONS,
  SelectField,
  deriveBentoLayoutMode,
  getAvailableExportModes,
  getBentoDefaultImageDirection,
  mapBentoLayoutModeToDirections
} from "@/options/components/splicing/splicing-sidebar-fields"
import { BentoLayoutControls } from "@/options/components/splicing/bento-layout-controls"

interface SplicingSidebarPanelProps {
  performancePreferences: PerformancePreferences
}

export function SplicingSidebarPanel({
  performancePreferences
}: SplicingSidebarPanelProps) {
  const preset = useSplicingStore((s) => s.preset)
  const primaryDirection = useSplicingStore((s) => s.primaryDirection)
  const secondaryDirection = useSplicingStore((s) => s.secondaryDirection)
  const gridCount = useSplicingStore((s) => s.gridCount)
  const flowMaxSize = useSplicingStore((s) => s.flowMaxSize)
  const alignment = useSplicingStore((s) => s.alignment)
  const imageAppearanceDirection = useSplicingStore((s) => s.imageAppearanceDirection)
  const previewBentoFlowGroupCount = useSplicingStore((s) => s.previewBentoFlowGroupCount)

  const canvasPadding = useSplicingStore((s) => s.canvasPadding)
  const mainSpacing = useSplicingStore((s) => s.mainSpacing)
  const crossSpacing = useSplicingStore((s) => s.crossSpacing)
  const canvasBorderRadius = useSplicingStore((s) => s.canvasBorderRadius)
  const canvasBorderWidth = useSplicingStore((s) => s.canvasBorderWidth)
  const canvasBorderColor = useSplicingStore((s) => s.canvasBorderColor)
  const backgroundColor = useSplicingStore((s) => s.backgroundColor)

  const imageResize = useSplicingStore((s) => s.imageResize)
  const imageFitValue = useSplicingStore((s) => s.imageFitValue)
  const imagePadding = useSplicingStore((s) => s.imagePadding)
  const imagePaddingColor = useSplicingStore((s) => s.imagePaddingColor)
  const imageBorderRadius = useSplicingStore((s) => s.imageBorderRadius)
  const imageBorderWidth = useSplicingStore((s) => s.imageBorderWidth)
  const imageBorderColor = useSplicingStore((s) => s.imageBorderColor)
  const isImageResizeOpen = useSplicingStore((s) => s.isImageResizeOpen)

  const exportMode = useSplicingStore((s) => s.exportMode)
  const exportTrimBackground = useSplicingStore((s) => s.exportTrimBackground)
  const exportFormat = useSplicingStore((s) => s.exportFormat)
  const exportQuality = useSplicingStore((s) => s.exportQuality)
  const exportJxlEffort = useSplicingStore((s) => s.exportJxlEffort)
  const exportAvifSpeed = useSplicingStore((s) => s.exportAvifSpeed)
  const exportAvifQualityAlpha = useSplicingStore((s) => s.exportAvifQualityAlpha)
  const exportAvifLossless = useSplicingStore((s) => s.exportAvifLossless)
  const exportAvifSubsample = useSplicingStore((s) => s.exportAvifSubsample)
  const exportAvifTune = useSplicingStore((s) => s.exportAvifTune)
  const exportAvifHighAlphaQuality = useSplicingStore((s) => s.exportAvifHighAlphaQuality)
  const exportPngTinyMode = useSplicingStore((s) => s.exportPngTinyMode)
  const exportConcurrency = useSplicingStore((s) => s.exportConcurrency)
  const exportFileNamePattern = useSplicingStore((s) => s.exportFileNamePattern)
  const isExportFormatQualityOpen = useSplicingStore((s) => s.isExportFormatQualityOpen)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)

  const setPreset = useSplicingStore((s) => s.setPreset)
  const setPrimaryDirection = useSplicingStore((s) => s.setPrimaryDirection)
  const setSecondaryDirection = useSplicingStore((s) => s.setSecondaryDirection)
  const setGridCount = useSplicingStore((s) => s.setGridCount)
  const setFlowMaxSize = useSplicingStore((s) => s.setFlowMaxSize)
  const setAlignment = useSplicingStore((s) => s.setAlignment)
  const setImageAppearanceDirection = useSplicingStore((s) => s.setImageAppearanceDirection)
  const setCanvasPadding = useSplicingStore((s) => s.setCanvasPadding)
  const setMainSpacing = useSplicingStore((s) => s.setMainSpacing)
  const setCrossSpacing = useSplicingStore((s) => s.setCrossSpacing)
  const setCanvasBorderRadius = useSplicingStore((s) => s.setCanvasBorderRadius)
  const setCanvasBorderWidth = useSplicingStore((s) => s.setCanvasBorderWidth)
  const setCanvasBorderColor = useSplicingStore((s) => s.setCanvasBorderColor)
  const setBackgroundColor = useSplicingStore((s) => s.setBackgroundColor)
  const setImageResize = useSplicingStore((s) => s.setImageResize)
  const setImageFitValue = useSplicingStore((s) => s.setImageFitValue)
  const setImagePadding = useSplicingStore((s) => s.setImagePadding)
  const setImagePaddingColor = useSplicingStore((s) => s.setImagePaddingColor)
  const setImageBorderRadius = useSplicingStore((s) => s.setImageBorderRadius)
  const setImageBorderWidth = useSplicingStore((s) => s.setImageBorderWidth)
  const setImageBorderColor = useSplicingStore((s) => s.setImageBorderColor)
  const setExportFormat = useSplicingStore((s) => s.setExportFormat)
  const setExportQuality = useSplicingStore((s) => s.setExportQuality)
  const setExportJxlEffort = useSplicingStore((s) => s.setExportJxlEffort)
  const setExportAvifSpeed = useSplicingStore((s) => s.setExportAvifSpeed)
  const setExportAvifQualityAlpha = useSplicingStore((s) => s.setExportAvifQualityAlpha)
  const setExportAvifLossless = useSplicingStore((s) => s.setExportAvifLossless)
  const setExportAvifSubsample = useSplicingStore((s) => s.setExportAvifSubsample)
  const setExportAvifTune = useSplicingStore((s) => s.setExportAvifTune)
  const setExportAvifHighAlphaQuality = useSplicingStore((s) => s.setExportAvifHighAlphaQuality)
  const setExportPngTinyMode = useSplicingStore((s) => s.setExportPngTinyMode)
  const setExportMode = useSplicingStore((s) => s.setExportMode)
  const setExportTrimBackground = useSplicingStore((s) => s.setExportTrimBackground)
  const setExportConcurrency = useSplicingStore((s) => s.setExportConcurrency)
  const setExportFileNamePattern = useSplicingStore((s) => s.setExportFileNamePattern)
  const setIsImageResizeOpen = useSplicingStore((s) => s.setIsImageResizeOpen)
  const setIsExportFormatQualityOpen = useSplicingStore((s) => s.setIsExportFormatQualityOpen)

  const splicingRenamePreviewSample = useMemo(
    () => ({
      originalFileName: "splice-preview",
      dimensions: { width: 1920, height: 1080 },
      index: 3,
      totalFiles: 12,
      outputExtension: getCanonicalExtension(exportFormat)
    }),
    [exportFormat]
  )

  const bentoLayoutMode = deriveBentoLayoutMode(primaryDirection, secondaryDirection)
  /** For Bento, non-start alignments only apply when preview has at least 2 lines (columns/rows). */
  const bentoAlignmentLimited =
    preset === "bento" &&
    (previewBentoFlowGroupCount === null || previewBentoFlowGroupCount <= 1)
  const bentoAlignmentOptions = useMemo(
    () =>
      bentoAlignmentLimited
        ? ALIGNMENT_OPTIONS.filter((o) => o.value === "start")
        : ALIGNMENT_OPTIONS,
    [bentoAlignmentLimited]
  )

  useEffect(() => {
    if (bentoAlignmentLimited && alignment !== "start") {
      setAlignment("start")
    }
  }, [alignment, bentoAlignmentLimited, setAlignment])

  const availableExportModes = getAvailableExportModes(preset, preset === "bento" ? bentoLayoutMode : undefined)
  const showTrimBackground = exportMode !== "single"
  const showQuality = QUALITY_FORMATS.includes(exportFormat)
  const showTinyMode = exportFormat === "png"

  return (
    <div className="flex flex-col gap-1">
      {/* Preset + Layout */}
      <SidebarPanel title="PRESET & LAYOUT">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.value}
                title={opt.title}
                subtitle={opt.subtitle}
                value={opt.value}
                selectedValue={preset}
                onChange={(v) => {
                  setPreset(v as SplicingPreset)
                  if (v === "stitch_vertical") {
                    setImageAppearanceDirection("top_to_bottom")
                  } else if (v === "stitch_horizontal") {
                    setImageAppearanceDirection("left_to_right")
                  } else if (v === "grid") {
                    setImageAppearanceDirection("lr_tb")
                  } else if (v === "bento") {
                    const mode = deriveBentoLayoutMode(primaryDirection, secondaryDirection)
                    setImageAppearanceDirection(getBentoDefaultImageDirection(mode))
                  }
                }}
              />
            ))}
          </div>

          {(preset === "bento" || preset === "grid") && (
            <div className="space-y-3">
              {preset === "bento" && (
                <BentoLayoutControls
                  mode={bentoLayoutMode}
                  flowMaxSize={flowMaxSize}
                  count={gridCount}
                  alignment={alignment}
                  alignmentOptions={bentoAlignmentOptions}
                  imageAppearanceDirection={imageAppearanceDirection}
                  onLayoutModeChange={(mode: BentoLayoutMode) => {
                    const { primary, secondary } = mapBentoLayoutModeToDirections(mode)
                    setPrimaryDirection(primary)
                    setSecondaryDirection(secondary)
                    setImageAppearanceDirection(getBentoDefaultImageDirection(mode))
                  }}
                  onFlowMaxSizeChange={setFlowMaxSize}
                  onCountChange={setGridCount}
                  onAlignmentChange={setAlignment}
                  onImageAppearanceDirectionChange={setImageAppearanceDirection}
                />
              )}

              {preset === "grid" && (
                <div className="flex gap-2 items-start">
                  <div className="min-w-0 shrink-0 flex-[1]">
                    <NumberInput
                      label="Columns"
                      value={gridCount}
                      onChangeValue={setGridCount}
                      min={1}
                      max={20}
                    />
                  </div>
                  <div className="min-w-0 flex-[2]">
                    <SelectField
                      label="Image Direction"
                      value={imageAppearanceDirection}
                      options={GRID_DIRECTION_OPTIONS}
                      onChange={(v) => setImageAppearanceDirection(v as SplicingImageAppearanceDirection)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {preset === "stitch_vertical" && (
            <SelectField
              label="Image Direction"
              value={imageAppearanceDirection}
              options={STITCH_V_DIRECTION_OPTIONS}
              onChange={(v) => setImageAppearanceDirection(v as SplicingImageAppearanceDirection)}
            />
          )}

          {preset === "stitch_horizontal" && (
            <SelectField
              label="Image Direction"
              value={imageAppearanceDirection}
              options={STITCH_H_DIRECTION_OPTIONS}
              onChange={(v) => setImageAppearanceDirection(v as SplicingImageAppearanceDirection)}
            />
          )}
        </div>
      </SidebarPanel>

      {/* Canvas Style */}
      <SidebarPanel title="CANVAS">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Main Gap" value={mainSpacing} onChangeValue={setMainSpacing} min={0} max={200} />
            <NumberInput label="Cross Gap" value={crossSpacing} onChangeValue={setCrossSpacing} min={0} max={200} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput label="Padding" value={canvasPadding} onChangeValue={setCanvasPadding} min={0} max={200} />
            <NumberInput label="Radius" value={canvasBorderRadius} onChangeValue={setCanvasBorderRadius} min={0} max={200} />
            <NumberInput label="Border" value={canvasBorderWidth} onChangeValue={setCanvasBorderWidth} min={0} max={50} />
          </div>
          <ColorPickerPopover
            label="Background"
            value={backgroundColor}
            onChange={setBackgroundColor}
            enableAlpha
            outputMode="rgba"
          />
          {canvasBorderWidth > 0 && (
            <ColorPickerPopover
              label="Border Color"
              value={canvasBorderColor}
              onChange={setCanvasBorderColor}
              enableAlpha={false}
              outputMode="hex"
            />
          )}
        </div>
      </SidebarPanel>

      {/* Image Style */}
      <SidebarPanel title="IMAGES">
        <div className="space-y-3">
          {/* Image Resize Card */}
          <ResizeCard
            resizeMode={imageResize === "original" ? "none" : imageResize}
            resizeValue={imageFitValue}
            resizeWidth={0}
            resizeHeight={0}
            resizeAspectMode="fixed"
            resizeAspectRatio={0}
            resizeFitMode="contain"
            resizeContainBackground="#000000"
            resizeSourceWidth={0}
            resizeSourceHeight={0}
            resizeSyncVersion={0}
            paperSize="A4"
            dpi={300}
            onResizeModeChange={(mode) => setImageResize((mode === "none" ? "original" : mode) as SplicingImageResize)}
            onResizeValueChange={setImageFitValue}
            onResizeWidthChange={() => {}}
            onResizeHeightChange={() => {}}
            onResizeAspectModeChange={() => {}}
            onResizeAspectRatioChange={() => {}}
            onResizeFitModeChange={() => {}}
            onResizeContainBackgroundChange={() => {}}
            onPaperSizeChange={() => {}}
            onDpiChange={() => {}}
            availableModes={["none", "fit_width", "fit_height"]}
            isOpen={isImageResizeOpen}
            onOpenChange={setIsImageResizeOpen}
          />

          <div className="grid grid-cols-3 gap-2">
            <NumberInput label="Padding" value={imagePadding} onChangeValue={setImagePadding} min={0} max={100} />
            <NumberInput label="Radius" value={imageBorderRadius} onChangeValue={setImageBorderRadius} min={0} max={100} />
            <NumberInput label="Border" value={imageBorderWidth} onChangeValue={setImageBorderWidth} min={0} max={20} />
          </div>
          {imagePadding > 0 && (
            <ColorPickerPopover
              label="Padding Color"
              value={imagePaddingColor}
              onChange={setImagePaddingColor}
              enableAlpha={false}
              outputMode="hex"
            />
          )}
          {imageBorderWidth > 0 && (
            <ColorPickerPopover
              label="Border Color"
              value={imageBorderColor}
              onChange={setImageBorderColor}
              enableAlpha={false}
              outputMode="hex"
            />
          )}
        </div>
      </SidebarPanel>

      {/* Export */}
      <SidebarPanel title="EXPORT">
        <div className="space-y-3">
          {/* Export Format & Quality Card */}
          <TargetFormatQualityCard
            targetFormat={exportFormat}
            quality={exportQuality}
            formatConfig={{
              avif: { speed: exportAvifSpeed },
              jxl: { effort: exportJxlEffort },
              png: { tinyMode: exportPngTinyMode }
            }}
            formatOptions={EXPORT_FORMAT_OPTIONS}
            supportsQuality={showQuality}
            supportsTinyMode={showTinyMode}
            onTargetFormatChange={(v: string) => setExportFormat(v as SplicingExportFormat)}
            onQualityChange={setExportQuality}
            onAvifSpeedChange={setExportAvifSpeed}
            onJxlEffortChange={setExportJxlEffort}
            onPngTinyModeChange={setExportPngTinyMode}
            disabled={false}
            isOpen={isExportFormatQualityOpen}
            onOpenChange={setIsExportFormatQualityOpen}
          />
          <FormatAdvancedSettingsCard
            targetFormat={exportFormat}
            avif={{
              qualityAlpha: exportAvifQualityAlpha,
              lossless: exportAvifLossless,
              subsample: exportAvifSubsample,
              tune: exportAvifTune,
              highAlphaQuality: exportAvifHighAlphaQuality,
              onQualityAlphaChange: setExportAvifQualityAlpha,
              onLosslessChange: setExportAvifLossless,
              onSubsampleChange: setExportAvifSubsample,
              onTuneChange: setExportAvifTune,
              onHighAlphaQualityChange: setExportAvifHighAlphaQuality
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="Export Mode"
              value={exportMode}
              options={EXPORT_MODE_OPTIONS.filter((opt) =>
                availableExportModes.includes(opt.value)
              )}
              onChange={(v) => {
                setExportMode(v as SplicingExportMode)
                if (v === "single") {
                  setExportTrimBackground(false)
                }
              }}
            />
            {exportMode !== "single" && (
              <ConcurrencySelector
                format={exportFormat}
                value={exportConcurrency}
                onChange={setExportConcurrency}
                limits={performancePreferences}
              />
            )}
          </div>
          {showTrimBackground && (
            <CheckboxCard
              icon={<Crop size={16} />}
              title="Trim Background"
              subtitle={
                exportMode === "per_col"
                  ? "Remove top and bottom padding"
                  : "Remove left and right padding"
              }
              checked={exportTrimBackground}
              onChange={setExportTrimBackground}
              theme="amber"
            />
          )}

          <SidebarCard
            icon={<FileEdit size={14} />}
            label="File renaming"
            sublabel={exportFileNamePattern}
            onClick={() => setIsRenameDialogOpen(true)}
          />
        </div>
      </SidebarPanel>

      <RenamePatternDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onSave={setExportFileNamePattern}
        initialPattern={exportFileNamePattern}
        title="Export file naming"
        presets={SPLICING_EXPORT_RENAME_PRESETS}
        availableTags={SPLICING_EXPORT_RENAME_TAGS}
        previewSample={splicingRenamePreviewSample}
        emptyPatternFallback="spliced-[Index]"
        patternPlaceholder="e.g. spliced-[Index] or [Date]-[PaddedIndex]"
        previewInputHint="Splicing export (sample dimensions & index)"
      />
    </div>
  )
}
