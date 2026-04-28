import { ChevronDown, ChevronUp, Eye, Telescope, Sparkles } from "lucide-react"
import { useState } from "react"
import type { SeoAuditReport } from "@/features/seo-audit"
import { SEO_AUDIT_TOOLTIPS } from "@/features/seo-audit/tooltips"
import { Tooltip } from "@/options/components/tooltip"
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
  const [isAssetsCollapsed, setIsAssetsCollapsed] = useState(true)
  const sortedAssets = [...report.assets].sort(
    (left, right) => (right.estimatedSavingsBytes ?? 0) - (left.estimatedSavingsBytes ?? 0)
  )
  const topRecommendations =
    report.recommendations.length > 0 ? report.recommendations.slice(0, 3) : ["No critical SEO image issue detected."]
  const handleOpenInspector = async (assetUrl: string) => {
    if (typeof chrome === "undefined" || !chrome.tabs?.query || !chrome.sidePanel?.setOptions || !chrome.sidePanel?.open) {
      return
    }

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!activeTab?.id) {
      return
    }

    const params = new URLSearchParams({
      view: "sidepanel",
      panel: "inspector",
      importUrl: assetUrl
    })

    await chrome.sidePanel.setOptions({
      tabId: activeTab.id,
      path: `options.html?${params.toString()}`,
      enabled: true
    })
    await chrome.sidePanel.open({ tabId: activeTab.id })
  }

  const handleOpenSingleProcessor = (assetUrl: string) => {
    if (typeof chrome === "undefined" || !chrome.tabs?.create || !chrome.runtime?.getURL) {
      return
    }

    const params = new URLSearchParams({
      tab: "single",
      importUrl: assetUrl
    })

    void chrome.tabs.create({
      url: chrome.runtime.getURL(`options.html?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-2">
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

        <MutedText className="mt-2 text-[10px]">{report.policyNote}</MutedText>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Subheading className="text-base leading-5">Recommendations</Subheading>
        <ul className="mt-1 space-y-1 text-[12px] text-slate-600 dark:text-slate-300">
          {topRecommendations.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Subheading className="text-base leading-5">Assets to review ({sortedAssets.length})</Subheading>
            <Tooltip
              content={SEO_AUDIT_TOOLTIPS.scanScopeContent}
              label={SEO_AUDIT_TOOLTIPS.scanScopeLabel}
              variant="wide2"
            >
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Asset scan rules"
              >
                <Telescope size={16} />
              </button>
            </Tooltip>
          </div>
          <button
            type="button"
            onClick={() => setIsAssetsCollapsed((current) => !current)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={isAssetsCollapsed ? "Expand assets list" : "Collapse assets list"}
            title={isAssetsCollapsed ? "Expand" : "Collapse"}
          >
            {isAssetsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
        <div className={`mt-2 ${isAssetsCollapsed ? "max-h-[24rem] overflow-y-auto pr-1" : ""}`}>
          <div className="grid grid-cols-2 gap-2">
          {sortedAssets.map((asset) => (
            <div
              key={asset.id}
              className="group overflow-hidden rounded border border-slate-200 bg-white text-[11px] dark:border-slate-700 dark:bg-slate-900"
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Tooltip content={SEO_AUDIT_TOOLTIPS.inspectAction} variant="nowrap">
                    <button
                      type="button"
                      onClick={() => void handleOpenInspector(asset.url)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/80 text-white transition-colors hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      aria-label="Inspect"
                    >
                      <Eye size={12} />
                    </button>
                  </Tooltip>
                  <Tooltip content={SEO_AUDIT_TOOLTIPS.optimizeAction} variant="nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenSingleProcessor(asset.url)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/80 text-white transition-colors hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      aria-label="Optimize now"
                    >
                      <Sparkles size={12} />
                    </button>
                  </Tooltip>
                </div>
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
      </section>
    </div>
  )
}
