import React from "react"
import { Sparkles, ShieldCheck, Palette } from "lucide-react"

import { AccordionCard, CheckboxCard } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

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
  const { t } = useTranslation("processor")
  const tags: string[] = []

  if (sharpYuv) {
    tags.push(t("sharpYuv"))
  }

  if (preserveExactAlpha) {
    tags.push(t("exactAlpha"))
  }

  const sublabel = tags.length ? tags.join(" • ") : t("webpAdvancedSublabel")

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label={t("webpAdvanced")}
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
          title={t("sharpYuv")}
          subtitle={t("sharpYuvSub")}
          checked={sharpYuv}
          onChange={onSharpYuvChange}
          disabled={disabled}
          theme="amber"
        />

        <CheckboxCard
          icon={<ShieldCheck size={16} />}
          title={t("exactAlpha")}
          subtitle={t("preserveExactAlphaSub")}
          checked={preserveExactAlpha}
          onChange={onPreserveExactAlphaChange}
          disabled={disabled}
          theme="amber"
        />
      </div>
    </AccordionCard>
  )
}