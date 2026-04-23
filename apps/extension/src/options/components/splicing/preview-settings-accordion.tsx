import { Eye } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { SelectInput } from "@imify/ui/ui/select-input"
import { MutedText } from "@imify/ui/ui/typography"
import { PREVIEW_QUALITY_PERCENTS } from "@imify/stores/stores/splicing-store"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"

interface PreviewSettingsAccordionProps {
  previewQualityPercent: number
  previewShowImageNumber: boolean
  onPreviewQualityChange: (next: number) => void
  onPreviewShowImageNumberChange: (next: boolean) => void
}

export function PreviewSettingsAccordion({
  previewQualityPercent,
  previewShowImageNumber,
  onPreviewQualityChange,
  onPreviewShowImageNumberChange
}: PreviewSettingsAccordionProps) {
  const sublabel = `Quality: ${previewQualityPercent}%${previewShowImageNumber ? ", Numbers: On" : ""}`

  return (
    <AccordionCard
      icon={<Eye size={16} />}
      label="Preview Settings"
      sublabel={sublabel}
      colorTheme="sky"
      defaultOpen={false}
    >
      <div className="space-y-3">
        <div className="col-span-1">
          <SelectInput
            label="Preview Image Quality (%)"
            value={String(previewQualityPercent)}
            options={PREVIEW_QUALITY_PERCENTS.map((pct) => ({
              value: String(pct),
              label: `${pct}%`
            }))}
            onChange={(nextValue) => onPreviewQualityChange(Number(nextValue))}
          />
          <MutedText className="text-xs mt-2">
            The higher the quality, the longer the preview will take to load.
          </MutedText>
        </div>

        <CheckboxCard
            title="Show image numbers on preview"
            subtitle="Match image order with the strip."
            checked={previewShowImageNumber}
            onChange={(checked) => onPreviewShowImageNumberChange(checked)}
            className="h-fit"
          />
      </div>
    </AccordionCard>
  )
}
