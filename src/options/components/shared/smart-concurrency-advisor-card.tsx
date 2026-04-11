import { useMemo } from "react"
import { AlertTriangle, CheckCircle2, Gauge, Zap } from "lucide-react"

import type { FormatCodecOptions } from "@/core/types"
import { Button } from "@/options/components/ui/button"
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
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
        <div className="flex items-start gap-2">
          <Gauge size={14} className="mt-0.5 shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Smart Concurrency Advisor is off</p>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">Enable advisor in Settings to get hardware-aware recommendations for current export format and advanced encoder options.</p>
            {onOpenSettings && (
              <div className="pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onOpenSettings}
                  disabled={disabled}
                >
                  Open Settings
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const tone = TONE_MAP[advisor.riskLevel]
  const ToneIcon = tone.icon

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${tone.wrapper}`}>
      <div className="flex items-start gap-2">
        <ToneIcon size={14} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">Smart Concurrency Advisor</p>
          <p className={tone.subtle}>{advisor.summaryText}</p>
          <p className="text-[11px] font-semibold">
            Recommended: {advisor.recommended} ({advisor.recommendedMin}-{advisor.recommendedMax})
          </p>
          <p className="leading-relaxed">{advisor.statusText}</p>
          <p className={tone.subtle}>{advisor.detailText}</p>
          {advisor.reasons.length > 0 && (
            <p className="leading-relaxed">
              Heavy factors: {advisor.reasons.slice(0, 3).join(", ")}
              {advisor.reasons.length > 3 ? ", ..." : ""}
            </p>
          )}
          {onApplyRecommended && selectedConcurrency !== advisor.recommended && (
            <div className="pt-1">
              <Button
                type="button"
                size="sm"
                variant={advisor.riskLevel === "danger" ? "warning" : "outline"}
                onClick={() => onApplyRecommended(advisor.recommended)}
                disabled={disabled}
              >
                Apply Recommended ({advisor.recommended})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
