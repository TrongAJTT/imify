import React from "react"
import { AlertTriangle, BarChart3, CheckCircle2, Gauge } from "lucide-react"
import { Button } from "@imify/ui"
import { type WebPerformanceReport } from "./types"
import { InfoSection } from "./info-section"
import { useTranslation } from "@imify/i18n"

function compressBins(values: number[], chunkSize = 4): number[] {
  const compressed: number[] = []
  for (let index = 0; index < values.length; index += chunkSize) {
    let sum = 0
    for (let offset = 0; offset < chunkSize; offset += 1) sum += values[index + offset] ?? 0
    compressed.push(sum)
  }
  return compressed
}

function toPath(values: number[], width: number, height: number): string {
  const peak = Math.max(...values, 1)
  return values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width
    const y = height - (value / peak) * height
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(" ")
}

export function WebPerformanceCard({ report, onOptimizeNow }: { report: WebPerformanceReport; onOptimizeNow?: (recommendedFormat?: "mozjpeg" | "webp" | "avif") => void }) {
  const { t } = useTranslation("inspector")
  const luminanceBins = compressBins(report.histogram.luminance, 4)
  const redBins = compressBins(report.histogram.red, 4)
  const greenBins = compressBins(report.histogram.green, 4)
  const blueBins = compressBins(report.histogram.blue, 4)

  const scoreBadge = (score: WebPerformanceReport["score"]) => {
    if (score === "good") return { icon: <CheckCircle2 size={13} />, className: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200 dark:border-emerald-800", label: t("scoreGood") }
    if (score === "needs-work") return { icon: <Gauge size={13} />, className: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-800", label: t("scoreNeedsWork") }
    return { icon: <AlertTriangle size={13} />, className: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/25 border border-rose-200 dark:border-rose-800", label: t("scorePoor") }
  }

  const getLocalizedSummary = (summary: string) => {
    if (summary === "Looks web-friendly for most scenarios.") return t("summaryGood")
    if (summary === "Good base quality, but there is room to optimize payload.") return t("summaryNeedsWork")
    if (summary === "High performance risk detected for web delivery.") return t("summaryPoor")
    return summary
  }

  const getLocalizedSuggestion = (title: string, desc: string) => {
    if (title === "Image is heavy for Web LCP") {
      const match = desc.match(/([\d.]+)\s*MB/)
      const mb = match ? match[1] : ""
      return {
        title: t("suggestions.heavyLcpTitle"),
        description: t("suggestions.heavyLcpDesc", { mb })
      }
    }
    if (title === "Image could be optimized further") {
      const match = desc.match(/([\d.]+)\s*MB/)
      const mb = match ? match[1] : ""
      return {
        title: t("suggestions.optimizeFurtherTitle"),
        description: t("suggestions.optimizeFurtherDesc", { mb })
      }
    }
    if (title === "PNG without transparency detected") {
      return {
        title: t("suggestions.pngNoAlphaTitle"),
        description: t("suggestions.pngNoAlphaDesc")
      }
    }
    if (title === "Modern format opportunity") {
      return {
        title: t("suggestions.modernFormatTitle"),
        description: t("suggestions.modernFormatDesc")
      }
    }
    if (title === "Large dimension source") {
      const match = desc.match(/([\d.]+)\s*MP/)
      const mp = match ? match[1] : ""
      return {
        title: t("suggestions.largeDimensionTitle"),
        description: t("suggestions.largeDimensionDesc", { mp })
      }
    }
    if (title === "Possible highlight clipping") {
      const match = desc.match(/([\d.]+)\s*%/)
      const percent = match ? match[1] : ""
      return {
        title: t("suggestions.highlightClippingTitle"),
        description: t("suggestions.highlightClippingDesc", { percent })
      }
    }
    if (title === "Possible shadow clipping") {
      const match = desc.match(/([\d.]+)\s*%/)
      const percent = match ? match[1] : ""
      return {
        title: t("suggestions.shadowClippingTitle"),
        description: t("suggestions.shadowClippingDesc", { percent })
      }
    }
    return { title, description: desc }
  }

  const badge = scoreBadge(report.score)
  const primaryRecommendation = report.suggestions.find((item) => item.recommendedFormat)
  const chartWidth = 280
  const chartHeight = 72

  return (
    <InfoSection title={t("webPerformanceAdvisor")} icon={<BarChart3 size={13} />} defaultOpen>
      <div className="space-y-3">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>{badge.icon}{badge.label}</div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{getLocalizedSummary(report.summary)}</p>
        <div className="rounded-md border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-900/50">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[72px] w-full">
            <path d={toPath(luminanceBins, chartWidth, chartHeight)} fill="none" stroke="currentColor" className="text-slate-500 dark:text-slate-300" strokeWidth="1.6" />
            <path d={toPath(redBins, chartWidth, chartHeight)} fill="none" stroke="rgba(244,63,94,0.7)" strokeWidth="1" />
            <path d={toPath(greenBins, chartWidth, chartHeight)} fill="none" stroke="rgba(34,197,94,0.7)" strokeWidth="1" />
            <path d={toPath(blueBins, chartWidth, chartHeight)} fill="none" stroke="rgba(59,130,246,0.7)" strokeWidth="1" />
          </svg>
        </div>
        {report.suggestions.length > 0 ? (
          <div className="space-y-2">
            {report.suggestions.map((suggestion, index) => {
              const localized = getLocalizedSuggestion(suggestion.title, suggestion.description)
              return (
                <div key={`${suggestion.title}_${index}`} className="rounded-md border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/30">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{localized.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{localized.description}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-600 dark:text-slate-300">{t("noWarnings")}</div>
        )}
        {onOptimizeNow && primaryRecommendation?.recommendedFormat ? <Button type="button" variant="primary" size="sm" onClick={() => onOptimizeNow(primaryRecommendation.recommendedFormat)} className="w-full">{t("optimizeNow", { format: primaryRecommendation.recommendedFormat.toUpperCase() })}</Button> : null}
      </div>
    </InfoSection>
  )
}
