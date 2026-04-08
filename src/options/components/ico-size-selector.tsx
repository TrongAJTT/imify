import { ICO_SIZE_OPTIONS } from "@/core/format-config"
import { LabelText } from "@/options/components/ui/typography"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { Package, Gift } from "lucide-react"

export function IcoSizeSelector({
  sizes,
  generateWebIconKit,
  disabled,
  title = "ICO output sizes",
  onToggleSize,
  onToggleWebKit
}: {
  sizes: number[]
  generateWebIconKit: boolean
  disabled?: boolean
  title?: string
  onToggleSize: (size: number) => void
  onToggleWebKit: (next: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <LabelText className="text-xs">{title}</LabelText>
      
      <div className="grid grid-cols-2 gap-2">
        {ICO_SIZE_OPTIONS.map((option) => (
          <CheckboxCard
            key={option.value}
            icon={<Package size={16} />}
            checked={sizes.includes(option.value)}
            disabled={disabled}
            onChange={() => onToggleSize(option.value)}
            title={option.label}
            subtitle={option.note}
            variant="sky"
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
          tooltip="Generate full icon set including favicon.ico and PNG files for Apple/Android"
          variant="primary"
          className="border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200"
          />
      </div>
    </div>
  )
}

