import { useMemo } from "react"
import { AlertTriangle, CheckCircle2, Gauge, Zap } from "lucide-react"

import type { FormatCodecOptions } from "@/core/types"
import { Button } from "@/options/components/ui/button"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import {
  calculateConcurrencyAdvisor,
  type AdvisorTargetFormat,
  type PerformancePreferences
} from "@/options/shared/performance-preferences"

interface SmartConcurrencyAdvisorCardProps {
  targetFormat: AdvisorTargetFormat
  selectedConcurrency: number
  formatOptions?: FormatCodecOptions
  performancePreferences: PerformancePreferences
  onApplyRecommended?: (value: number) => void
  onOpenSettings?: () => void
  disabled?: boolean
}

const TONE_MAP = {
  optimal: {
    wrapper: "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
    subtle: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2
  },
  caution: {
    wrapper: "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
    subtle: "text-amber-700 dark:text-amber-300",
    icon: Zap
  },
  danger: {
    wrapper: "border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200",
    subtle: "text-rose-700 dark:text-rose-300",
    icon: AlertTriangle
  }
} as const

export function SmartConcurrencyAdvisorCard({
  targetFormat,
  selectedConcurrency,
  formatOptions,
  performancePreferences,
  onApplyRecommended,
  onOpenSettings,
  disabled
}: SmartConcurrencyAdvisorCardProps) {
  const advisor = useMemo(
    () =>
      calculateConcurrencyAdvisor({
        targetFormat,
        selectedConcurrency,
        formatOptions,
        preferences: performancePreferences
      }),
    [targetFormat, selectedConcurrency, formatOptions, performancePreferences]
  )

  if (!advisor.enabled) {
    return (
      <AccordionCard
        icon={<Gauge size={16} />}
        label="Smart Concurrency Advisor"
        sublabel="Disabled - click to enable"
        colorTheme="sky"
        defaultOpen={false}
      >
        <div className="space-y-2 text-sm">
          <p className="text-slate-700 dark:text-slate-300">
            Enable advisor in Settings to get hardware-aware recommendations for current export format and advanced encoder options.
          </p>
          {onOpenSettings && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onOpenSettings}
              disabled={disabled}
              className="w-full"
            >
              Open Settings
            </Button>
          )}
        </div>
      </AccordionCard>
    )
  }

  const colorThemeMap = {
    optimal: "blue" as const,
    caution: "amber" as const,
    danger: "orange" as const
  }
  const ToneIcon = TONE_MAP[advisor.riskLevel].icon

  return (
    <AccordionCard
      icon={<ToneIcon size={16} />}
      label="Smart Concurrency Advisor"
      sublabel={`${advisor.riskLevel === "optimal" ? "Optimal" : advisor.riskLevel === "caution" ? "Pushing limits" : "High crash risk"}: ${advisor.recommended} (${advisor.recommendedMin}-${advisor.recommendedMax})`}
      colorTheme={colorThemeMap[advisor.riskLevel]}
      defaultOpen={advisor.riskLevel !== "optimal"}
    >
      <div className="space-y-2 text-xs">
        <p className="text-slate-600 dark:text-slate-400">{advisor.summaryText}</p>
        <p className="font-semibold">
          Recommended: {advisor.recommended} ({advisor.recommendedMin}-{advisor.recommendedMax})
        </p>
        <p className="leading-relaxed">{advisor.statusText}</p>
        <p className="text-slate-600 dark:text-slate-400">{advisor.detailText}</p>
        {advisor.reasons.length > 0 && (
          <p className="leading-relaxed">
            Heavy factors: {advisor.reasons.slice(0, 3).join(", ")}
            {advisor.reasons.length > 3 ? ", ..." : ""}
          </p>
        )}
        {onApplyRecommended && selectedConcurrency !== advisor.recommended && (
          <Button
            type="button"
            size="sm"
            variant={advisor.riskLevel === "danger" ? "warning" : "outline"}
            onClick={() => onApplyRecommended(advisor.recommended)}
            disabled={disabled}
            className="w-full mt-2"
          >
            Apply Recommended ({advisor.recommended})
          </Button>
        )}
      </div>
    </AccordionCard>
  )
}
