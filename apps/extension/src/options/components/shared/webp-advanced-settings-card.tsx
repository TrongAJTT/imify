import { Sparkles, ShieldCheck, Palette } from "lucide-react"

import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"

export interface WebpAdvancedSettingsCardProps {
  sharpYuv: boolean
  preserveExactAlpha: boolean
  onSharpYuvChange: (value: boolean) => void
  onPreserveExactAlphaChange: (value: boolean) => void
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
}

export function WebpAdvancedSettingsCard({
  sharpYuv,
  preserveExactAlpha,
  onSharpYuvChange,
  onPreserveExactAlphaChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId
}: WebpAdvancedSettingsCardProps) {
  const tags: string[] = []

  if (sharpYuv) {
    tags.push("Sharp YUV")
  }

  if (preserveExactAlpha) {
    tags.push("Exact Alpha")
  }

  const sublabel = tags.length ? tags.join(" • ") : "Color-edge and alpha preservation"

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label="WebP Advanced"
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
          icon={<Palette size={16} />}
          title="Sharp YUV"
          subtitle={
            sharpYuv
              ? "Enabled: sharper color edges for text and UI"
              : "Improves color-edge sharpness in lossy WebP (slower encode)."
          }
          checked={sharpYuv}
          onChange={onSharpYuvChange}
          disabled={disabled}
          theme="amber"
        />

        <CheckboxCard
          icon={<ShieldCheck size={16} />}
          title="Preserve Exact Alpha"
          subtitle={
            preserveExactAlpha
              ? "Enabled: keeps hidden RGB values in transparent pixels"
              : "Keeps color data in fully transparent pixels for advanced pipelines."
          }
          checked={preserveExactAlpha}
          onChange={onPreserveExactAlphaChange}
          disabled={disabled}
          theme="amber"
        />
      </div>
    </AccordionCard>
  )
}