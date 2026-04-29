import { Sparkles, Layers, Scissors } from "lucide-react"

import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { PROCESSOR_TOOLTIPS } from "@/options/constants/processor-tooltips"

export interface AvifAdvancedSettingsCardProps {
  qualityAlpha?: number
  lossless: boolean
  subsample: 1 | 2 | 3
  tune: "auto" | "ssim" | "psnr"
  highAlphaQuality: boolean
  onQualityAlphaChange: (value: number) => void
  onLosslessChange: (value: boolean) => void
  onSubsampleChange: (value: 1 | 2 | 3) => void
  onTuneChange: (value: "auto" | "ssim" | "psnr") => void
  onHighAlphaQualityChange: (value: boolean) => void
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
}

function getSubsampleLabel(value: 1 | 2 | 3): string {
  if (value === 3) {
    return "4:4:4"
  }

  if (value === 2) {
    return "4:2:2"
  }

  return "4:2:0"
}

function getTuneLabel(value: "auto" | "ssim" | "psnr"): string {
  if (value === "ssim") {
    return "SSIM"
  }

  if (value === "psnr") {
    return "PSNR"
  }

  return "Auto"
}

export function AvifAdvancedSettingsCard({
  qualityAlpha,
  lossless,
  subsample,
  tune,
  highAlphaQuality,
  onQualityAlphaChange,
  onLosslessChange,
  onSubsampleChange,
  onTuneChange,
  onHighAlphaQualityChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId
}: AvifAdvancedSettingsCardProps) {
  const alphaLabel = highAlphaQuality
    ? "High Alpha"
    : typeof qualityAlpha === "number"
      ? `Alpha ${qualityAlpha}`
      : "Alpha Auto"

  const sublabel = `${alphaLabel} • ${getSubsampleLabel(subsample)} • ${getTuneLabel(tune)}${lossless ? " • Lossless" : ""}`

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label="AVIF Advanced"
      sublabel={sublabel}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
      colorTheme="amber"
    >
      <div className="space-y-3">
        <CheckboxCard
          icon={<Scissors size={16} />}
          title="Keep sharp edges for transparent images"
          subtitle={
            highAlphaQuality
              ? "Enabled: alpha quality forced to 100"
              : "Use this when logos or soft shadows lose edge clarity"
          }
          tooltipLabel="Keep sharp edges for transparent images"
          tooltipContent={PROCESSOR_TOOLTIPS.shared.avifAdvanced.keepSharpEdges}
          checked={highAlphaQuality}
          onChange={onHighAlphaQualityChange}
          disabled={disabled}
          theme="amber"
        />

        <NumberInput
          label="Alpha Quality"
          tooltipContent={PROCESSOR_TOOLTIPS.shared.avifAdvanced.alphaQuality}
          value={typeof qualityAlpha === "number" ? qualityAlpha : 90}
          min={0}
          max={100}
          step={1}
          onChangeValue={onQualityAlphaChange}
          disabled={disabled || highAlphaQuality}
        />

        <SelectInput
          label="Chroma Subsampling"
          tooltipContent={PROCESSOR_TOOLTIPS.shared.avifAdvanced.chromaSubsampling}
          value={String(subsample)}
          onChange={(value) => onSubsampleChange(Number(value) as 1 | 2 | 3)}
          disabled={disabled}
          options={[
            { value: "1", label: "4:2:0 - Smallest file (default)" },
            { value: "2", label: "4:2:2 - Balanced chroma detail" },
            { value: "3", label: "4:4:4 - Full chroma detail" }
          ]}
        />

        <SelectInput
          label="Tune"
          tooltipContent={PROCESSOR_TOOLTIPS.shared.avifAdvanced.tune}
          value={tune}
          onChange={(value) => onTuneChange(value as "auto" | "ssim" | "psnr")}
          disabled={disabled}
          options={[
            { value: "auto", label: "Auto" },
            { value: "ssim", label: "SSIM - Perceptual quality" },
            { value: "psnr", label: "PSNR - Signal fidelity" }
          ]}
        />

        <CheckboxCard
          icon={<Layers size={16} />}
          title="Lossless"
          subtitle="Preserve exact pixels (larger files, best for PNG-like assets)"
          checked={lossless}
          onChange={onLosslessChange}
          disabled={disabled}
          theme="amber"
        />
      </div>
    </AccordionCard>
  )
}
