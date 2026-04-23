import { ICO_SIZE_OPTIONS } from "@imify/core/format-config"
import { LabelText, CheckboxCard } from "@imify/ui"
import { Gift, Sparkles } from "lucide-react"
import { PROCESSOR_TOOLTIPS } from "./processor-tooltips"

export function IcoSizeSelector({
  sizes,
  generateWebIconKit,
  optimizeInternalPngLayers = false,
  disabled,
  title = "ICO output sizes",
  onToggleSize,
  onToggleWebKit,
  onToggleOptimizeInternalPngLayers = () => undefined
}: {
  sizes: number[]
  generateWebIconKit: boolean
  optimizeInternalPngLayers?: boolean
  disabled?: boolean
  title?: string
  onToggleSize: (size: number) => void
  onToggleWebKit: (next: boolean) => void
  onToggleOptimizeInternalPngLayers?: (next: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <LabelText className="text-xs">{title}</LabelText>
      
      <div className="grid grid-cols-2 gap-2">
        {ICO_SIZE_OPTIONS.map((option) => (
          <CheckboxCard
            key={option.value}
            checked={sizes.includes(option.value)}
            disabled={disabled}
            onChange={() => onToggleSize(option.value)}
            title={option.label}
            subtitle={option.note}
            theme="blue"
          />
        ))}
      </div>

      <div className="pt-1">
        <CheckboxCard
          icon={<Gift size={16} />}
          checked={generateWebIconKit}
          disabled={disabled}
          onChange={onToggleWebKit}
          title="Generate Web Toolkit"
          tooltipContent={PROCESSOR_TOOLTIPS.shared.icoSizeSelector.generateWebToolkit}
          theme="amber"
        />

        <div className="mt-2">
          <CheckboxCard
            icon={<Sparkles size={16} />}
            checked={optimizeInternalPngLayers}
            disabled={disabled}
            onChange={onToggleOptimizeInternalPngLayers}
            title="Optimize internal PNG layers"
            subtitle="Smaller file size"
            tooltipContent={PROCESSOR_TOOLTIPS.shared.icoSizeSelector.optimizeInternalPngLayers}
            theme="blue"
          />
        </div>
      </div>
    </div>
  )
}

