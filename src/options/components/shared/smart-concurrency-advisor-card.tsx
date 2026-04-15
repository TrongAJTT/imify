import * as Popover from "@radix-ui/react-popover"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, Gauge, Sparkles, Zap } from "lucide-react"

import type { FormatCodecOptions } from "@/core/types"
import { Button } from "@/options/components/ui/button"
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
    chip: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
    popover: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950 dark:text-amber-200",
    subtle: "text-amber-700 dark:text-amber-300",
    icon: Zap
  },
  danger: {
    chip: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
    popover: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950 dark:text-rose-200",
    subtle: "text-rose-700 dark:text-rose-300",
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

  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTriggerHoveredRef = useRef(false)
  const isContentHoveredRef = useRef(false)
  const ToneIcon = TONE_MAP[advisor.riskLevel].icon

  const clearCloseTimer = () => {
    if (!closeTimerRef.current) {
      return
    }

    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const openPopover = () => {
    clearCloseTimer()
    setOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      if (isTriggerHoveredRef.current || isContentHoveredRef.current) {
        closeTimerRef.current = null
        return
      }
      setOpen(false)
      closeTimerRef.current = null
    }, 160)
  }

  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  const riskLabel =
    advisor.riskLevel === "optimal"
      ? "Optimal"
      : advisor.riskLevel === "caution"
        ? "Pushing limits"
        : "High crash risk"

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
      <Popover.Anchor asChild>
        <button
          type="button"
          className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors ${TONE_MAP[advisor.riskLevel].chip}`}
          onMouseEnter={() => {
            isTriggerHoveredRef.current = true
            openPopover()
          }}
          onMouseLeave={() => {
            isTriggerHoveredRef.current = false
            scheduleClose()
          }}
          onFocus={() => {
            isTriggerHoveredRef.current = true
            openPopover()
          }}
          onBlur={() => {
            isTriggerHoveredRef.current = false
            scheduleClose()
          }}
          onClick={() => {
            clearCloseTimer()
            setOpen((current) => !current)
          }}
          disabled={disabled}
        >
          <Sparkles size={10} />
          <span>{advisor.advisorNameShort}</span>
          <span className="opacity-75">•</span>
          <span>{riskLabel}</span>
        </button>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={4}
          collisionPadding={10}
          className={`z-[9999] w-[320px] rounded-md border p-3 shadow-xl ${TONE_MAP[advisor.riskLevel].popover}`}
          onMouseEnter={() => {
            isContentHoveredRef.current = true
            openPopover()
          }}
          onMouseLeave={() => {
            isContentHoveredRef.current = false
            scheduleClose()
          }}
          onInteractOutside={() => {
            clearCloseTimer()
            isTriggerHoveredRef.current = false
            isContentHoveredRef.current = false
            setOpen(false)
          }}
          onEscapeKeyDown={() => {
            clearCloseTimer()
            isTriggerHoveredRef.current = false
            isContentHoveredRef.current = false
            setOpen(false)
          }}
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
                onClick={() => {
                  onOpenSettings()
                  clearCloseTimer()
                  setOpen(false)
                }}
                disabled={disabled}
                className="w-full"
              >
                Enable Smart Advisor
              </Button>
            )}
            {onApplyRecommended && selectedConcurrency !== advisor.recommended && (
              <Button
                type="button"
                size="sm"
                variant={advisor.riskLevel === "danger" ? "warning" : "outline"}
                onClick={() => {
                  onApplyRecommended(advisor.recommended)
                  clearCloseTimer()
                  setOpen(false)
                }}
                disabled={disabled}
                className="w-full mt-2"
              >
                Apply Recommended ({advisor.recommended})
              </Button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
