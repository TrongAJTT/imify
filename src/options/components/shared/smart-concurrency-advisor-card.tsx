import { useMemo } from "react"
import { AlertTriangle, CheckCircle2, Gauge, Settings2, Sparkles, Wand2, Zap } from "lucide-react"

import type { FormatCodecOptions } from "@/core/types"
import { Button } from "@/options/components/ui/button"
import { ControlledPopover } from "@/options/components/ui/controlled-popover"
import {
  calculateConcurrencyAdvisor,
  type AdvisorTargetFormat,
  type ConcurrencyAdvisorResult,
  type PerformancePreferences
} from "@/options/shared/performance-preferences"

interface SmartConcurrencyAdvisorCardProps {
  advisor?: ConcurrencyAdvisorResult
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
    chip: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
    popover: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950 dark:text-emerald-200",
    subtle: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2
  },
  caution: {
    chip: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700/70 dark:bg-amber-950/20 dark:text-amber-200 dark:hover:bg-amber-900/30",
    popover: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-slate-900 dark:text-amber-100",
    subtle: "text-amber-700 dark:text-amber-200",
    icon: Zap
  },
  danger: {
    chip: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-700/70 dark:bg-rose-950/20 dark:text-rose-200 dark:hover:bg-rose-900/35",
    popover: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700/70 dark:bg-slate-900 dark:text-rose-100",
    subtle: "text-rose-700 dark:text-rose-200",
    icon: AlertTriangle
  }
} as const

export function SmartConcurrencyAdvisorCard({
  advisor: advisorOverride,
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
      advisorOverride ??
      calculateConcurrencyAdvisor({
        targetFormat,
        selectedConcurrency,
        formatOptions,
        preferences: performancePreferences
      }),
    [
      advisorOverride,
      targetFormat,
      selectedConcurrency,
      formatOptions,
      performancePreferences
    ]
  )

  const ToneIcon = TONE_MAP[advisor.riskLevel].icon

  const riskLabel =
    advisor.riskLevel === "optimal"
      ? "Optimal"
      : advisor.riskLevel === "caution"
        ? "Pushing limits"
        : "High crash risk"

  return (
    <ControlledPopover
      trigger={
        <button
          type="button"
          className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors ${TONE_MAP[advisor.riskLevel].chip}`}
          disabled={disabled}
        >
          <Sparkles size={10} />
          <span>{advisor.advisorNameShort}</span>
          <span className="opacity-75">•</span>
          <span>{riskLabel}</span>
        </button>
      }
      preset="inspector"
      contentClassName={`z-[9999] w-[320px] rounded-md border p-3 shadow-xl ${TONE_MAP[advisor.riskLevel].popover}`}
    >
      <div className="space-y-2 text-xs">
        <p className="flex items-center gap-1.5 font-semibold">
          {advisor.usingFallbackProfile ? <Gauge size={14} /> : <ToneIcon size={14} />}
          <span>{advisor.advisorName}</span>
        </p>
        <p className="font-semibold">
          Recommended: {advisor.recommended} ({advisor.recommendedMin}-{advisor.recommendedMax})
        </p>
        <p className={TONE_MAP[advisor.riskLevel].subtle}>{advisor.summaryText}</p>
        <p className="leading-relaxed">{advisor.statusText}</p>
        <p className="text-slate-600 dark:text-slate-400">{advisor.detailText}</p>
        {advisor.reasons.length > 0 && (
          <p className="leading-relaxed">
            Heavy factors: {advisor.reasons.slice(0, 3).join(", ")}
            {advisor.reasons.length > 3 ? ", ..." : ""}
          </p>
        )}
        {advisor.usingFallbackProfile && onOpenSettings && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenSettings}
            disabled={disabled}
            className="w-full border-2"
          >
            <Settings2 size={14} />
            Enable Smart Advisor
          </Button>
        )}
        {onApplyRecommended && selectedConcurrency !== advisor.recommended && (
          <Button
            type="button"
            size="sm"
            variant={advisor.riskLevel === "danger" ? "warning" : "outline"}
            onClick={() => onApplyRecommended(advisor.recommended)}
            disabled={disabled}
            className="w-full mt-2 border-2"
          >
            <Wand2 size={14} />
            Apply Recommended ({advisor.recommended})
          </Button>
        )}
      </div>
    </ControlledPopover>
  )
}
