import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react"

import type { SeoAuditAssetItem, SeoAuditReport } from "@/features/seo-audit"
import { SurfaceCard } from "@imify/ui/ui/surface-card"
import { Kicker, MutedText } from "@imify/ui/ui/typography"

interface SeoAuditResultsProps {
  report: SeoAuditReport | null
  isRunning: boolean
  error: string | null
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`
  }

  const kb = value / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function compactUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.length > 48 ? `${parsed.pathname.slice(0, 48)}...` : parsed.pathname
    return `${parsed.hostname}${path}`
  } catch {
    return url.length > 64 ? `${url.slice(0, 64)}...` : url
  }
}

function scorePillClass(level: SeoAuditReport["summary"]["level"]): string {
  if (level === "good") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
  }

  if (level === "warning") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
  }

  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
}

function levelLabel(level: SeoAuditReport["summary"]["level"]): string {
  if (level === "good") {
    return "Healthy"
  }

  if (level === "warning") {
    return "Needs Work"
  }

  return "Critical"
}

function AssetRow({ asset }: { asset: SeoAuditAssetItem }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-slate-800 dark:text-slate-100">{compactUrl(asset.url)}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {asset.source === "img" ? "img" : "bg"}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span>{formatBytes(asset.estimatedBytes ?? 0)}</span>
        {asset.estimatedSavingsBytes ? <span>Save ~{formatBytes(asset.estimatedSavingsBytes)}</span> : null}
        {asset.altStatus === "missing" ? <span>Missing alt</span> : null}
      </div>
      <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{asset.recommendation}</p>
    </div>
  )
}

export function SeoAuditResults({ report, isRunning, error }: SeoAuditResultsProps) {
  const hasData = !!report

  return (
    <SurfaceCard className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Kicker>SEO Audit Snapshot</Kicker>
          <MutedText className="text-xs">Audit-only diagnostics for the active page.</MutedText>
        </div>

        {report ? (
          <div className={`rounded-full px-2 py-1 text-[10px] font-semibold ${scorePillClass(report.summary.level)}`}>
            {levelLabel(report.summary.level)} · {report.summary.score}
          </div>
        ) : null}
      </div>

      {isRunning ? (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300">
          <Loader2 size={14} className="animate-spin" />
          Scanning DOM and image signals...
        </div>
      ) : null}

      {!isRunning && error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
          <ShieldAlert size={14} className="mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      {!isRunning && !error && !hasData ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          Run Page Scanner to generate a quick SEO image report for the current tab.
        </div>
      ) : null}

      {report ? (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Assets</div>
              <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{report.summary.totalAssets}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Missing Alt</div>
              <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{report.summary.missingAltCount}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Payload</div>
              <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{formatBytes(report.summary.estimatedTransferBytes)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Potential Save</div>
              <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{formatBytes(report.summary.estimatedSavingsBytes)}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Top Recommendations</div>
            {report.recommendations.slice(0, 3).map((tip) => (
              <div key={tip} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                {report.summary.level === "good" ? (
                  <CheckCircle2 size={13} className="mt-0.5 text-emerald-500" />
                ) : (
                  <AlertTriangle size={13} className="mt-0.5 text-amber-500" />
                )}
                <span>{tip}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Heaviest Assets</div>
            <div className="space-y-1.5">
              {report.assets.slice(0, 4).map((asset) => (
                <AssetRow key={`${asset.id}-${asset.url}`} asset={asset} />
              ))}
            </div>
          </div>

          <p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">{report.policyNote}</p>
        </>
      ) : null}
    </SurfaceCard>
  )
}
