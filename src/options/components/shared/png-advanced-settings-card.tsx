import { Sparkles, Eraser, Palette } from "lucide-react"

import { AccordionCard } from "@/options/components/ui/accordion-card"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"

export interface PngAdvancedSettingsCardProps {
  cleanTransparentPixels: boolean
  autoGrayscale: boolean
  onCleanTransparentPixelsChange: (value: boolean) => void
  onAutoGrayscaleChange: (value: boolean) => void
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
}

export function PngAdvancedSettingsCard({
  cleanTransparentPixels,
  autoGrayscale,
  onCleanTransparentPixelsChange,
  onAutoGrayscaleChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId
}: PngAdvancedSettingsCardProps) {
  const tags: string[] = []

  if (cleanTransparentPixels) {
    tags.push("Clean Alpha")
  }

  if (autoGrayscale) {
    tags.push("Auto Gray")
  }

  const sublabel = tags.length > 0 ? tags.join(" • ") : "Visual lossless optimizations"

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label="PNG Advanced"
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
          icon={<Eraser size={16} />}
          title="Clean Transparent Pixels"
          subtitle={cleanTransparentPixels ? "Enabled" : "Zero RGB where alpha is 0 to improve PNG compression"}
          tooltipContent="Removes hidden RGB color data from fully transparent pixels. This is visually lossless and usually reduces PNG size for logos, icons, and UI assets."
          checked={cleanTransparentPixels}
          onChange={onCleanTransparentPixelsChange}
          disabled={disabled}
          theme="amber"
        />

        <CheckboxCard
          icon={<Palette size={16} />}
          title="Auto Grayscale Detection"
          subtitle={autoGrayscale ? "Enabled" : "Prefer grayscale encode path when image has no chroma"}
          tooltipContent="When image content is grayscale, encoder can choose a smaller PNG representation. This is visually lossless and helpful for monochrome assets."
          checked={autoGrayscale}
          onChange={onAutoGrayscaleChange}
          disabled={disabled}
          theme="amber"
        />
      </div>
    </AccordionCard>
  )
}
