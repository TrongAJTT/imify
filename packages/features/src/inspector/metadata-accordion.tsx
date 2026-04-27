import React from "react"
import { Eye, Tags } from "lucide-react"
import { AccordionCard, CheckboxCard, SelectInput } from "@imify/ui"

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

export function MetadataAccordion(props: MetadataAccordionProps) {
  const sortModeLabel = EXIF_SORT_OPTIONS.find((o) => o.value === props.exifSortMode)?.label || "Group by category"
  const sublabel = `${sortModeLabel}, Privacy: ${props.showSensitiveOnly ? "On" : "Off"}`
  return (
    <AccordionCard icon={<Tags size={16} />} label="Metadata" sublabel={sublabel} colorTheme="purple" alwaysOpen>
      <div className="space-y-3">
        <SelectInput label="Sort Mode" value={props.exifSortMode} options={EXIF_SORT_OPTIONS} onChange={(v) => props.onExifSortModeChange(v as "group" | "name" | "tag")} />
        <CheckboxCard icon={<Eye size={16} />} title="Sensitive Only" subtitle="Show only privacy-relevant tags" checked={props.showSensitiveOnly} onChange={props.onShowSensitiveOnlyChange} theme="amber" />
      </div>
    </AccordionCard>
  )
}

