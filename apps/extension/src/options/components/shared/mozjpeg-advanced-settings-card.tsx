import { Sparkles, ScanLine, Palette } from "lucide-react"

import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { SelectInput } from "@imify/ui/ui/select-input"
import { PROCESSOR_TOOLTIPS } from "@/options/constants/processor-tooltips"

export interface MozJpegAdvancedSettingsCardProps {
  progressive: boolean
  chromaSubsampling: 0 | 1 | 2
  onProgressiveChange: (value: boolean) => void
  onChromaSubsamplingChange: (value: 0 | 1 | 2) => void
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
}

function chromaSubsamplingLabel(value: 0 | 1 | 2): string {
  if (value === 1) {
    return "4:2:2"
  }

  return "4:2:0"
}

export function MozJpegAdvancedSettingsCard({
  progressive,
  chromaSubsampling,
  onProgressiveChange,
  onChromaSubsamplingChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId
}: MozJpegAdvancedSettingsCardProps) {
  const sublabel = `${progressive ? "Progressive" : "Baseline"} • Chroma ${chromaSubsamplingLabel(chromaSubsampling)}`

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label="MozJPEG Advanced"
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
          icon={<ScanLine size={16} />}
          title="Progressive Loading"
          subtitle={
            progressive
              ? "Enabled: loads blurry-to-sharp in multiple scans"
              : "Disabled: baseline JPEG scan"
          }
          tooltipContent={PROCESSOR_TOOLTIPS.shared.mozjpegAdvanced.progressiveLoading}
          checked={progressive}
          onChange={onProgressiveChange}
          disabled={disabled}
          theme="amber"
        />

        <SelectInput
          label="Color Resolution (Chroma)"
          tooltipContent={PROCESSOR_TOOLTIPS.shared.mozjpegAdvanced.colorResolution}
          value={String(chromaSubsampling)}
          onChange={(value) => onChromaSubsamplingChange(Number(value) as 0 | 1 | 2)}
          disabled={disabled}
          options={[
            { value: "2", label: "Standard (4:2:0) - Smallest file size" },
            { value: "1", label: "Balanced (4:2:2) - Better color accuracy" }
          ]}
        />
      </div>
    </AccordionCard>
  )
}
