import { Tags } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { SelectInput } from "@imify/ui/ui/select-input"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { Eye } from "lucide-react"

const EXIF_SORT_OPTIONS = [
  { value: "group", label: "Group by category" },
  { value: "name", label: "Sort by tag name" },
  { value: "tag", label: "Sort by tag ID" }
]

interface MetadataAccordionProps {
  exifSortMode: "group" | "name" | "tag"
  showSensitiveOnly: boolean
  onExifSortModeChange: (mode: "group" | "name" | "tag") => void
  onShowSensitiveOnlyChange: (show: boolean) => void
}

export function MetadataAccordion({
  exifSortMode,
  showSensitiveOnly,
  onExifSortModeChange,
  onShowSensitiveOnlyChange
}: MetadataAccordionProps) {
  const sortModeLabel = EXIF_SORT_OPTIONS.find((o) => o.value === exifSortMode)?.label || "Group by category"
  const privacyStatus = showSensitiveOnly ? "On" : "Off"
  const sublabel = `${sortModeLabel}, Privacy: ${privacyStatus}`

  return (
    <AccordionCard
      icon={<Tags size={16} />}
      label="Metadata"
      sublabel={sublabel}
      colorTheme="purple"
      alwaysOpen={true}
    >
      <div className="space-y-3 ">
        <SelectInput
          label="Sort Mode"
          value={exifSortMode}
          options={EXIF_SORT_OPTIONS}
          onChange={(v) => onExifSortModeChange(v as "group" | "name" | "tag")}
        />
        <CheckboxCard
          icon={<Eye size={16} />}
          title="Sensitive Only"
          subtitle="Show only privacy-relevant tags"
          checked={showSensitiveOnly}
          onChange={onShowSensitiveOnlyChange}
          theme="amber"
        />
      </div>
    </AccordionCard>
  )
}
