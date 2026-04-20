import { Sparkles, ScanLine } from "lucide-react"

import { TARGET_FORMAT_TOOLTIPS } from "@/options/constants/target-format-tooltips"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { SelectInput } from "@/options/components/ui/select-input"

export interface JxlAdvancedSettingsCardProps {
  progressive: boolean
  epf: 0 | 1 | 2 | 3
  onProgressiveChange: (value: boolean) => void
  onEpfChange: (value: 0 | 1 | 2 | 3) => void
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
}

function getEpfLabel(epf: 0 | 1 | 2 | 3): string {
  if (epf === 0) {
    return "EPF Off"
  }

  return `EPF ${epf}`
}

export function JxlAdvancedSettingsCard({
  progressive,
  epf,
  onProgressiveChange,
  onEpfChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId
}: JxlAdvancedSettingsCardProps) {
  const sublabel = `${progressive ? "Progressive" : "Single-pass"} • ${getEpfLabel(epf)}`

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label="JXL Advanced"
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
              ? "Enabled: previews quickly and sharpens in additional passes"
              : "Disabled: encode a single-pass codestream"
          }
          tooltipContent={TARGET_FORMAT_TOOLTIPS.jxlProgressive}
          checked={progressive}
          onChange={onProgressiveChange}
          disabled={disabled}
          theme="amber"
        />

        <SelectInput
          label="Artifact Smoothing (EPF)"
          tooltip={TARGET_FORMAT_TOOLTIPS.jxlEpf}
          value={String(epf)}
          onChange={(value) => onEpfChange(Number(value) as 0 | 1 | 2 | 3)}
          disabled={disabled}
          options={[
            { value: "0", label: "0 - Off (maximum detail)" },
            { value: "1", label: "1 - Balanced (default)" },
            { value: "2", label: "2 - Medium smoothing" },
            { value: "3", label: "3 - Strong smoothing" }
          ]}
        />
      </div>
    </AccordionCard>
  )
}
