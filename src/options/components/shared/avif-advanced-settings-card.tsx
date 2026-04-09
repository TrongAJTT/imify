import { Sparkles, Layers, Scissors } from "lucide-react"

import { AccordionCard } from "@/options/components/ui/accordion-card"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"

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
          tooltipContent="When enabled, forces alpha quality to 100 to preserve sharp edges in logos and soft shadows. When disabled, you can manually adjust alpha quality for smaller file sizes at the cost of potential blurriness around edges."
          checked={highAlphaQuality}
          onChange={onHighAlphaQualityChange}
          disabled={disabled}
          theme="amber"
        />

        <NumberInput
          label="Alpha Quality"
          tooltip="Controls transparency channel quality. Leave unticked above to tune manually."
          value={typeof qualityAlpha === "number" ? qualityAlpha : 90}
          min={0}
          max={100}
          step={1}
          onChangeValue={onQualityAlphaChange}
          disabled={disabled || highAlphaQuality}
        />

        <SelectInput
          label="Chroma Subsampling"
          tooltip={`4:2:0 is smallest and ideal for photos.\n4:4:4 keeps color edges sharp for text, UI, and pixel art.`}
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
          tooltip={`Auto is balanced.\nSSIM usually looks more natural.\nPSNR may improve objective signal metrics.`}
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
