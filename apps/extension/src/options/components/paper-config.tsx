import type { PaperSize, SupportedDPI } from "@imify/core/types"
import { DPI_OPTIONS, PAPER_OPTIONS } from "@/options/shared"
import { SelectInput } from "@imify/ui/ui/select-input"

interface PaperConfigProps {
  paperSize: PaperSize
  dpi: SupportedDPI
  disabled?: boolean
  onPaperSizeChange: (value: PaperSize) => void
  onDpiChange: (value: SupportedDPI) => void
}

export function PaperConfig({
  paperSize,
  dpi,
  disabled,
  onPaperSizeChange,
  onDpiChange
}: PaperConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-top-1 duration-200">
      <SelectInput
        label="Paper"
        value={paperSize}
        disabled={disabled}
        options={PAPER_OPTIONS.map((paper) => ({
          value: paper,
          label: paper
        }))}
        onChange={(nextValue) => onPaperSizeChange(nextValue as PaperSize)}
      />

      <SelectInput
        label="DPI"
        value={String(dpi)}
        disabled={disabled}
        options={DPI_OPTIONS.map((opt) => ({
          value: String(opt),
          label: `${opt} DPI`
        }))}
        onChange={(nextValue) => onDpiChange(Number(nextValue) as SupportedDPI)}
      />
    </div>
  )
}
