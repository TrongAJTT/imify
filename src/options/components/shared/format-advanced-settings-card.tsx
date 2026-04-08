import { AvifAdvancedSettingsCard } from "@/options/components/shared/avif-advanced-settings-card"

type AvifAdvancedProps = {
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
}

export interface FormatAdvancedSettingsCardProps {
  targetFormat: string
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
  avif?: AvifAdvancedProps
}

export function FormatAdvancedSettingsCard({
  targetFormat,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
  avif
}: FormatAdvancedSettingsCardProps) {
  if (targetFormat !== "avif" || !avif) {
    return null
  }

  return (
    <AvifAdvancedSettingsCard
      qualityAlpha={avif.qualityAlpha}
      lossless={avif.lossless}
      subsample={avif.subsample}
      tune={avif.tune}
      highAlphaQuality={avif.highAlphaQuality}
      onQualityAlphaChange={avif.onQualityAlphaChange}
      onLosslessChange={avif.onLosslessChange}
      onSubsampleChange={avif.onSubsampleChange}
      onTuneChange={avif.onTuneChange}
      onHighAlphaQualityChange={avif.onHighAlphaQualityChange}
      disabled={disabled}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
    />
  )
}
