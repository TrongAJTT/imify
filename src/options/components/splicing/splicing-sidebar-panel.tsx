import { QUALITY_FORMATS } from "@/core/format-config"
import type {
  SplicingAlignment,
  SplicingDirection,
  SplicingExportFormat,
  SplicingExportMode,
  SplicingImageResize,
  SplicingPreset
} from "@/features/splicing/types"
import { NumberInput } from "@/options/components/ui/number-input"
import { RadioCard } from "@/options/components/ui/radio-card"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { LabelText } from "@/options/components/ui/typography"
import { QualityInput } from "@/options/components/quality-input"
import { useSplicingStore } from "@/options/stores/splicing-store"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"

const PRESET_OPTIONS: Array<{ value: SplicingPreset; title: string; subtitle: string }> = [
  { value: "stitch_vertical", title: "Stitch V", subtitle: "Top to bottom" },
  { value: "stitch_horizontal", title: "Stitch H", subtitle: "Left to right" },
  { value: "grid", title: "Grid", subtitle: "N columns" },
  { value: "bento", title: "Bento", subtitle: "Flow or columns" }
]

type BentoLayoutMode = "vertical" | "horizontal" | "fixed_vertical"

const BENTO_LAYOUT_OPTIONS: Array<{ value: BentoLayoutMode; label: string }> = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "fixed_vertical", label: "Fixed Vertical" }
]

function deriveBentoLayoutMode(
  primary: SplicingDirection,
  secondary: SplicingDirection
): BentoLayoutMode {
  if (primary === "horizontal" && secondary === "vertical") return "fixed_vertical"
  if (primary === "vertical" && secondary === "vertical") return "vertical"
  if (primary === "horizontal" && secondary === "horizontal") return "horizontal"
  return "vertical"
}

const ALIGNMENT_OPTIONS: Array<{ value: SplicingAlignment; label: string }> = [
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
  { value: "center", label: "Center" },
  { value: "spaceBetween", label: "Space Between" },
  { value: "spaceAround", label: "Space Around" },
  { value: "spaceEvenly", label: "Space Evenly" }
]

const RESIZE_OPTIONS: Array<{ value: SplicingImageResize; label: string }> = [
  { value: "original", label: "Original" },
  { value: "fit_width", label: "Fit Width" },
  { value: "fit_height", label: "Fit Height" }
]

const EXPORT_FORMAT_OPTIONS: Array<{ value: SplicingExportFormat; label: string }> = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jxl", label: "JXL" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" }
]

const EXPORT_MODE_OPTIONS: Array<{ value: SplicingExportMode; label: string }> = [
  { value: "single", label: "Single Image" },
  { value: "per_row", label: "Per Row" },
  { value: "per_col", label: "Per Column" }
]

function getAvailableExportModes(preset: SplicingPreset, bentoMode?: BentoLayoutMode): SplicingExportMode[] {
  if (preset === "stitch_vertical" || preset === "stitch_horizontal") {
    return ["single"]
  }
  if (preset === "grid") {
    return ["single", "per_row", "per_col"]
  }
  if (preset === "bento") {
    if (bentoMode === "vertical" || bentoMode === "fixed_vertical") {
      return ["single", "per_col"]
    }
    if (bentoMode === "horizontal") {
      return ["single", "per_row"]
    }
  }
  return ["single"]
}

function SelectField({ label, value, options, onChange }: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <LabelText className="text-xs">{label}</LabelText>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function SplicingSidebarPanel() {
  const preset = useSplicingStore((s) => s.preset)
  const primaryDirection = useSplicingStore((s) => s.primaryDirection)
  const secondaryDirection = useSplicingStore((s) => s.secondaryDirection)
  const gridCount = useSplicingStore((s) => s.gridCount)
  const flowMaxSize = useSplicingStore((s) => s.flowMaxSize)
  const alignment = useSplicingStore((s) => s.alignment)

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

  const exportMode = useSplicingStore((s) => s.exportMode)
  const exportTrimBackground = useSplicingStore((s) => s.exportTrimBackground)
  const exportFormat = useSplicingStore((s) => s.exportFormat)
  const exportQuality = useSplicingStore((s) => s.exportQuality)
  const exportPngTinyMode = useSplicingStore((s) => s.exportPngTinyMode)
  const exportConcurrency = useSplicingStore((s) => s.exportConcurrency)

  const setPreset = useSplicingStore((s) => s.setPreset)
  const setPrimaryDirection = useSplicingStore((s) => s.setPrimaryDirection)
  const setSecondaryDirection = useSplicingStore((s) => s.setSecondaryDirection)
  const setGridCount = useSplicingStore((s) => s.setGridCount)
  const setFlowMaxSize = useSplicingStore((s) => s.setFlowMaxSize)
  const setAlignment = useSplicingStore((s) => s.setAlignment)
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
  const setExportPngTinyMode = useSplicingStore((s) => s.setExportPngTinyMode)
  const setExportMode = useSplicingStore((s) => s.setExportMode)
  const setExportTrimBackground = useSplicingStore((s) => s.setExportTrimBackground)
  const setExportConcurrency = useSplicingStore((s) => s.setExportConcurrency)

  const bentoLayoutMode = deriveBentoLayoutMode(primaryDirection, secondaryDirection)
  const bentoIsFlow =
    bentoLayoutMode === "vertical" || bentoLayoutMode === "horizontal"
  const availableExportModes = getAvailableExportModes(preset, preset === "bento" ? bentoLayoutMode : undefined)
  const showTrimBackground = exportMode !== "single"
  const showQuality = QUALITY_FORMATS.includes(exportFormat)
  const showTinyMode = exportFormat === "png"

  return (
    <div className="flex flex-col gap-4">
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
                onChange={(v) => setPreset(v as SplicingPreset)}
              />
            ))}
          </div>

          {(preset === "bento" || preset === "grid") && (
            <div className="space-y-3">
              {preset === "bento" && (
                <>
                  <div className="grid grid-cols-2 gap-2 items-start">
                    <SelectField
                      label="Layout"
                      value={bentoLayoutMode}
                      options={BENTO_LAYOUT_OPTIONS}
                      onChange={(v) => {
                        const mode = v as BentoLayoutMode
                        if (mode === "vertical") {
                          setPrimaryDirection("vertical")
                          setSecondaryDirection("vertical")
                        } else if (mode === "horizontal") {
                          setPrimaryDirection("horizontal")
                          setSecondaryDirection("horizontal")
                        } else {
                          setPrimaryDirection("horizontal")
                          setSecondaryDirection("vertical")
                        }
                      }}
                    />
                    {bentoIsFlow ? (
                      <NumberInput
                        label={
                          bentoLayoutMode === "vertical"
                            ? "Max Height (px)"
                            : "Max Width (px)"
                        }
                        value={flowMaxSize}
                        onChangeValue={setFlowMaxSize}
                        min={100}
                        max={99999}
                        step={50}
                      />
                    ) : (
                      <NumberInput
                        label="Count"
                        value={gridCount}
                        onChangeValue={setGridCount}
                        min={1}
                        max={20}
                      />
                    )}
                  </div>
                  {bentoIsFlow && (
                    <SelectField
                      label="Image Alignment"
                      value={alignment}
                      options={ALIGNMENT_OPTIONS}
                      onChange={(v) => setAlignment(v as SplicingAlignment)}
                    />
                  )}
                </>
              )}

              {preset === "grid" && (
                <NumberInput
                  label="Columns"
                  value={gridCount}
                  onChangeValue={setGridCount}
                  min={1}
                  max={20}
                />
              )}
            </div>
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
          <div className="grid grid-cols-2 items-start gap-2">
            <SelectField
              label="Resize"
              value={imageResize}
              options={RESIZE_OPTIONS}
              onChange={(v) => setImageResize(v as SplicingImageResize)}
            />
            {imageResize !== "original" ? (
              <NumberInput
                label={imageResize === "fit_width" ? "Target Width (px)" : "Target Height (px)"}
                value={imageFitValue}
                onChangeValue={setImageFitValue}
                min={1}
                max={10000}
                step={10}
              />
            ) : (
              <div />
            )}
          </div>
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
          <div className="grid grid-cols-2 items-start gap-2">
            <SelectField
              label="Format"
              value={exportFormat}
              options={EXPORT_FORMAT_OPTIONS}
              onChange={(v) => setExportFormat(v as SplicingExportFormat)}
            />
            {showQuality ? (
              <QualityInput
                label="Quality"
                value={exportQuality}
                onChange={setExportQuality}
              />
            ) : (
              <div />
            )}
          </div>
          {showTinyMode && (
            <CheckboxCard
              title="TinyPNG Mode"
              subtitle="Quantize to reduce file size"
              checked={exportPngTinyMode}
              onChange={setExportPngTinyMode}
            />
          )}
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
              <NumberInput
                label="Concurrency"
                value={exportConcurrency}
                onChangeValue={setExportConcurrency}
                min={1}
                max={5}
              />
            )}
          </div>
          {showTrimBackground && (
            <CheckboxCard
              title="Trim Background"
              subtitle={
                exportMode === "per_col"
                  ? "Remove top and bottom padding"
                  : "Remove left and right padding"
              }
              checked={exportTrimBackground}
              onChange={setExportTrimBackground}
            />
          )}
        </div>
      </SidebarPanel>
    </div>
  )
}
