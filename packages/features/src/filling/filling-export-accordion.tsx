import React from "react"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { SelectInput } from "@imify/ui/ui/select-input"
import { NumberInput } from "@imify/ui/ui/number-input"
import type { FillingExportFormat } from "@imify/features/filling/types"
import { Settings2 } from "lucide-react"

const FORMAT_OPTIONS = [
  { value: "jpg", label: "JPG" },
  { value: "mozjpeg", label: "MozJPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jxl", label: "JXL" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" },
]

export function FillingExportAccordion() {
  const exportFormat = useFillingStore((s) => s.exportFormat)
  const exportQuality = useFillingStore((s) => s.exportQuality)
  const setExportFormat = useFillingStore((s) => s.setExportFormat)
  const setExportQuality = useFillingStore((s) => s.setExportQuality)

  return (
    <AccordionCard icon={<Settings2 size={16} />} label="Export" sublabel={exportFormat.toUpperCase()} colorTheme="amber">
      <div className="space-y-2">
        <SelectInput
          label="Format"
          value={exportFormat}
          options={FORMAT_OPTIONS}
          onChange={(value) => setExportFormat(value as FillingExportFormat)}
        />
        <NumberInput label="Quality" value={exportQuality} onChangeValue={setExportQuality} min={1} max={100} />
      </div>
    </AccordionCard>
  )
}
