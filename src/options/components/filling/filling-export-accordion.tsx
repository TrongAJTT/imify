import { Download } from "lucide-react"

import type { FillingExportFormat } from "@/features/filling/types"
import { useFillingStore } from "@/options/stores/filling-store"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { SelectInput } from "@/options/components/ui/select-input"
import { NumberInput } from "@/options/components/ui/number-input"

const FORMAT_OPTIONS: Array<{ value: FillingExportFormat; label: string }> = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jxl", label: "JPEG XL" },
  { value: "mozjpeg", label: "MozJPEG" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" },
  { value: "psd", label: "PSD (Photoshop)" },
]

const QUALITY_FORMATS = new Set(["jpg", "webp", "avif", "jxl", "mozjpeg"])

export function FillingExportAccordion() {
  const exportFormat = useFillingStore((s) => s.exportFormat)
  const exportQuality = useFillingStore((s) => s.exportQuality)
  const setExportFormat = useFillingStore((s) => s.setExportFormat)
  const setExportQuality = useFillingStore((s) => s.setExportQuality)

  return (
    <AccordionCard
      icon={<Download size={16} />}
      label="Export"
      sublabel={exportFormat.toUpperCase()}
      colorTheme="blue"
      defaultOpen={false}
    >
      <div className="space-y-3">
        <SelectInput
          label="Format"
          value={exportFormat}
          options={FORMAT_OPTIONS}
          onChange={(v) => setExportFormat(v as FillingExportFormat)}
        />

        {QUALITY_FORMATS.has(exportFormat) && (
          <NumberInput
            label="Quality"
            value={exportQuality}
            onChangeValue={setExportQuality}
            min={1}
            max={100}
            tooltip="Output quality (1-100)"
          />
        )}
      </div>
    </AccordionCard>
  )
}
