import type { SeoAuditReport } from "@/features/seo-audit"
import { BodyText, Kicker, MutedText, Subheading } from "@imify/ui/ui/typography"

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`
  }

  const kb = value / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(2)} MB`
}

function levelClass(level: SeoAuditReport["summary"]["level"]): string {
  if (level === "good") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
  }

  if (level === "warning") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
  }

  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
}

export function SeoAuditSnapshotInline({ report }: { report: SeoAuditReport }) {
  const topAssets = report.assets.slice(0, 6)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Subheading className="text-base leading-5">SEO Audit Snapshot</Subheading>
        </div>
        <span className={`rounded-md text-center px-2 py-1 text-[10px] font-semibold ${levelClass(report.summary.level)}`}>
          Score {report.summary.score}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <Kicker className="text-[10px]">Assets</Kicker>
          <BodyText className="font-semibold text-slate-800 dark:text-slate-100">{report.summary.totalAssets}</BodyText>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <Kicker className="text-[10px]">Potential Save</Kicker>
          <BodyText className="font-semibold text-slate-800 dark:text-slate-100">
            {formatBytes(report.summary.estimatedSavingsBytes)}
          </BodyText>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <Kicker className="text-[10px]">Missing Alt</Kicker>
          <BodyText className="font-semibold text-slate-800 dark:text-slate-100">{report.summary.missingAltCount}</BodyText>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <Kicker className="text-[10px]">Oversized</Kicker>
          <BodyText className="font-semibold text-slate-800 dark:text-slate-100">{report.summary.oversizedCount}</BodyText>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <Kicker className="text-[10px]">Insecure URL</Kicker>
          <BodyText className="font-semibold text-slate-800 dark:text-slate-100">{report.summary.insecureAssetCount}</BodyText>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <Kicker className="text-[10px]">No Lazy (below fold)</Kicker>
          <BodyText className="font-semibold text-slate-800 dark:text-slate-100">{report.summary.belowFoldWithoutLazyCount}</BodyText>
        </div>
      </div>

      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        <BodyText className="text-[12px] font-medium text-slate-800 dark:text-slate-100">Recommendations</BodyText>
        <ul className="mt-1 space-y-1">
          {(report.recommendations.length > 0 ? report.recommendations.slice(0, 3) : ["No critical SEO image issue detected."]).map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
        <BodyText className="text-[12px] font-medium text-slate-800 dark:text-slate-100">
          Top assets to review ({topAssets.length})
        </BodyText>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {topAssets.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded border border-slate-200 bg-white text-[11px] dark:border-slate-700 dark:bg-slate-900"
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className="relative h-20 w-full bg-slate-100 dark:bg-slate-800">
                <img
                  src={asset.url}
                  alt="Scanned asset preview"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  draggable={false}
                  onContextMenu={(event) => event.preventDefault()}
                />
              </div>
              <div className="px-2 py-1.5">
                <BodyText className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-100">{asset.url}</BodyText>
                <MutedText className="mt-0.5 text-[11px]">
                  {asset.source} • save {formatBytes(asset.estimatedSavingsBytes ?? 0)}
                </MutedText>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MutedText className="mt-2 text-[10px]">
        {report.policyNote}
      </MutedText>
    </section>
  )
}
