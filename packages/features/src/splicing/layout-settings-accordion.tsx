import React from "react"
import { Rows, } from "lucide-react"
import { NumberInput } from "@imify/ui"
import { SelectField } from "./splicing-sidebar-fields"
import { AccordionCard, RadioCard } from "@imify/ui"
import type {
  SplicingAlignment,
  SplicingDirection,
  SplicingImageAppearanceDirection,
  SplicingPreset
} from "./types"
import {
  type BentoLayoutMode,
  GRID_DIRECTION_OPTIONS,
  PRESET_OPTIONS,
  STITCH_H_DIRECTION_OPTIONS,
  STITCH_V_DIRECTION_OPTIONS,
  deriveBentoLayoutMode,
  getBentoDefaultImageDirection,
  mapBentoLayoutModeToDirections
} from "./splicing-sidebar-fields"
import { BentoLayoutControls } from "./bento-layout-controls"

interface LayoutSettingsAccordionProps {
  preset: SplicingPreset
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  flowSplitOverflow: boolean
  alignment: SplicingAlignment
  imageAppearanceDirection: SplicingImageAppearanceDirection
  previewBentoFlowGroupCount: number | null
  bentoLayoutMode: BentoLayoutMode
  bentoAlignmentOptions: Array<{ value: SplicingAlignment; label: string }>

  onPresetChange: (preset: SplicingPreset) => void
  onPrimaryDirectionChange: (direction: SplicingDirection) => void
  onSecondaryDirectionChange: (direction: SplicingDirection) => void
  onGridCountChange: (count: number) => void
  onFlowMaxSizeChange: (size: number) => void
  onFlowSplitOverflowChange: (enabled: boolean) => void
  onAlignmentChange: (alignment: SplicingAlignment) => void
  onImageAppearanceDirectionChange: (direction: SplicingImageAppearanceDirection) => void
  onImageAppearanceDirectionChangeFromPreset: (direction: SplicingImageAppearanceDirection) => void
}

/**
 * Accordion for Layout Settings (Preset, Direction, Grid Controls)
 * Dynamically shows sublabel based on current preset
 */
import { useTranslation } from "@imify/i18n"

export function LayoutSettingsAccordion({
  preset,
  primaryDirection,
  secondaryDirection,
  gridCount,
  flowMaxSize,
  flowSplitOverflow,
  alignment,
  imageAppearanceDirection,
  bentoLayoutMode,
  bentoAlignmentOptions,
  onPresetChange,
  onPrimaryDirectionChange,
  onSecondaryDirectionChange,
  onGridCountChange,
  onFlowMaxSizeChange,
  onFlowSplitOverflowChange,
  onAlignmentChange,
  onImageAppearanceDirectionChange,
  onImageAppearanceDirectionChangeFromPreset
}: LayoutSettingsAccordionProps) {
  const { t } = useTranslation("splicing")

  const translateOption = (opt: { value: string; label: string }) => {
    const key = opt.value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    return {
      value: opt.value,
      label: t(`layoutFields.${key}`, { defaultValue: opt.label })
    }
  }

  const bentoModeText = (() => {
    if (bentoLayoutMode === "vertical") return t("preset.bentoVert")
    if (bentoLayoutMode === "horizontal") return t("preset.bentoHoriz")
    if (bentoLayoutMode === "fixed_vertical") return t("preset.bentoFixedVert")
    return t("preset.bentoFixedHoriz")
  })()

  // Dynamic sublabel based on preset
  const sublabelMap: Record<SplicingPreset, string> = {
    stitch_vertical: t("preset.layoutVert"),
    stitch_horizontal: t("preset.layoutHoriz"),
    grid: `${gridCount} ${t("workspace.statsColumns")}`,
    bento: t("preset.layoutBento", { mode: bentoModeText })
  }

  const localizedPresetOptions = PRESET_OPTIONS.map((opt) => {
    let title = ""
    let subtitle = ""
    if (opt.value === "stitch_vertical") {
      title = t("preset.stitchV")
      subtitle = t("preset.stitchVDesc")
    } else if (opt.value === "stitch_horizontal") {
      title = t("preset.stitchH")
      subtitle = t("preset.stitchHDesc")
    } else if (opt.value === "grid") {
      title = t("preset.grid")
      subtitle = t("preset.gridDesc")
    } else if (opt.value === "bento") {
      title = t("preset.bento")
      subtitle = t("preset.bentoDesc")
    }
    return { ...opt, title, subtitle }
  })

  const localizedGridDirectionOptions = GRID_DIRECTION_OPTIONS.map(translateOption)
  const localizedStitchVDirectionOptions = STITCH_V_DIRECTION_OPTIONS.map(translateOption)
  const localizedStitchHDirectionOptions = STITCH_H_DIRECTION_OPTIONS.map(translateOption)

  return (
    <AccordionCard
      icon={<Rows size={16} />}
      label={t("sidebar.layout")}
      sublabel={sublabelMap[preset]}
      colorTheme="sky"
      defaultOpen={true}
    >
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-1.5">
          {localizedPresetOptions.map((opt) => (
            <RadioCard
              key={opt.value}
              icon={opt.icon}
              title={opt.title}
              subtitle={opt.subtitle}
              value={opt.value}
              selectedValue={preset}
              onChange={(v) => {
                onPresetChange(v as SplicingPreset)
                if (v === "stitch_vertical") {
                  onImageAppearanceDirectionChangeFromPreset("top_to_bottom")
                } else if (v === "stitch_horizontal") {
                  onImageAppearanceDirectionChangeFromPreset("left_to_right")
                } else if (v === "grid") {
                  onImageAppearanceDirectionChangeFromPreset("lr_tb")
                } else if (v === "bento") {
                  const mode = deriveBentoLayoutMode(primaryDirection, secondaryDirection)
                  onImageAppearanceDirectionChangeFromPreset(getBentoDefaultImageDirection(mode))
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
                flowSplitOverflow={flowSplitOverflow}
                count={gridCount}
                alignment={alignment}
                alignmentOptions={bentoAlignmentOptions}
                imageAppearanceDirection={imageAppearanceDirection}
                onLayoutModeChange={(mode: BentoLayoutMode) => {
                  const { primary, secondary } = mapBentoLayoutModeToDirections(mode)
                  onPrimaryDirectionChange(primary)
                  onSecondaryDirectionChange(secondary)
                  onImageAppearanceDirectionChange(getBentoDefaultImageDirection(mode))
                }}
                onFlowMaxSizeChange={onFlowMaxSizeChange}
                onFlowSplitOverflowChange={onFlowSplitOverflowChange}
                onCountChange={onGridCountChange}
                onAlignmentChange={onAlignmentChange}
                onImageAppearanceDirectionChange={onImageAppearanceDirectionChange}
              />
            )}

            {preset === "grid" && (
              <div className="flex gap-2 items-start">
                <div className="min-w-0 shrink-0 flex-[1]">
                  <NumberInput
                    label={t("layoutFields.columns")}
                    value={gridCount}
                    onChangeValue={onGridCountChange}
                    min={1}
                    max={20}
                  />
                </div>
                <div className="min-w-0 flex-[2]">
                  <SelectField
                    label={t("layoutFields.imageDirection")}
                    value={imageAppearanceDirection}
                    options={localizedGridDirectionOptions}
                    onChange={(v) => onImageAppearanceDirectionChange(v as SplicingImageAppearanceDirection)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {preset === "stitch_vertical" && (
          <SelectField
            label={t("layoutFields.imageDirection")}
            value={imageAppearanceDirection}
            options={localizedStitchVDirectionOptions}
            onChange={(v) => onImageAppearanceDirectionChange(v as SplicingImageAppearanceDirection)}
          />
        )}

        {preset === "stitch_horizontal" && (
          <SelectField
            label={t("layoutFields.imageDirection")}
            value={imageAppearanceDirection}
            options={localizedStitchHDirectionOptions}
            onChange={(v) => onImageAppearanceDirectionChange(v as SplicingImageAppearanceDirection)}
          />
        )}
      </div>
    </AccordionCard>
  )
}



