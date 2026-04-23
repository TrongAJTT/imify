// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import "@/style.css"

import { Clock3, Loader2, ScanSearch } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { runSeoAuditOnActiveTab, saveSeoAuditSnapshot } from "@/features/seo-audit"
import { Button } from "@/options/components/ui/button"
import { BodyText, Kicker } from "@/options/components/ui/typography"
import { useImifyDarkMode } from "@/options/shared/use-imify-dark-mode"
import { SeoAuditSnapshotInline } from "@/sidepanel/components/seo-audit-snapshot-inline"
import { SidepanelSharedAppbar } from "@/sidepanel/components/sidepanel-shared-appbar"
import { useSeoAuditSnapshot } from "@/sidepanel/hooks/use-seo-audit-snapshot"
import { Tooltip } from "@/options/components/tooltip"

async function switchSidepanel(view: "inspector" | "audit"): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!activeTab?.id || !chrome.sidePanel?.setOptions || !chrome.sidePanel?.open) {
    return
  }

  await chrome.sidePanel.setOptions({
    tabId: activeTab.id,
    path: `options.html?view=sidepanel&panel=${view}`,
    enabled: true
  })
  await chrome.sidePanel.open({ tabId: activeTab.id })
}

export default function SidepanelAuditSnapshotApp() {
  const { isDark, toggleDarkMode } = useImifyDarkMode()
  const { snapshot, isLoading, refreshSnapshot } = useSeoAuditSnapshot()
  const [isScanning, setIsScanning] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleOpenSettings = useCallback(async () => {
    await chrome.runtime.openOptionsPage()
  }, [])

  const handleScanNow = useCallback(async () => {
    setActionError(null)
    setIsScanning(true)
    try {
      const report = await runSeoAuditOnActiveTab()
      await saveSeoAuditSnapshot(report)
      await refreshSnapshot()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to run SEO audit scan.")
    } finally {
      setIsScanning(false)
    }
  }, [refreshSnapshot])

  const statusText = useMemo(() => {
    if (isLoading) {
      return "Loading saved snapshot state."
    }
    if (!snapshot) {
      return "No scan has been run yet."
    }
    return `${snapshot.pageTitle || snapshot.pageUrl}`
  }, [isLoading, snapshot])

  const scanTimeLabel = useMemo(() => {
    if (!snapshot?.scannedAtIso) {
      return "Never scanned"
    }

    const scannedAt = new Date(snapshot.scannedAtIso)
    if (Number.isNaN(scannedAt.getTime())) {
      return "Unknown scan time"
    }

    const now = new Date()
    const isSameDay =
      scannedAt.getFullYear() === now.getFullYear() &&
      scannedAt.getMonth() === now.getMonth() &&
      scannedAt.getDate() === now.getDate()

    if (isSameDay) {
      return scannedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }

    return scannedAt.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }, [snapshot])

  return (
    <div className="min-h-screen bg-slate-100 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="space-y-3">
        <SidepanelSharedAppbar
          isDark={isDark}
          onToggleDarkMode={toggleDarkMode}
          onOpenOptions={() => void handleOpenSettings()}
          activeView="audit"
          onSwitchView={(view) => void switchSidepanel(view)}
          title="SEO Audit Snapshot"
          subtitle="Review scan results"
        />

        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Kicker className="text-[11px]">Scan status</Kicker>
          <BodyText className="mt-1 font-medium text-slate-800 dark:text-slate-100">{statusText}</BodyText>
          <div className="mt-2 flex items-center gap-2">
            <Button
              onClick={() => void handleScanNow()}
              disabled={isScanning}
              className="h-8 rounded-lg px-3 text-xs"
            >
              {isScanning ? <Loader2 size={14} className="mr-1 animate-spin" /> : <ScanSearch size={14} className="mr-1" />}
              {isScanning ? "Scanning..." : "Scan now"}
            </Button>
            <Tooltip content={`Last scanned: ${scanTimeLabel}`}>
            <div className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              <Clock3 size={12} className="mr-1.5" />
              {scanTimeLabel}
            </div>
            </Tooltip>
          </div>
        </section>

        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            <BodyText className="text-xs text-red-700 dark:text-red-300">{actionError}</BodyText>
          </div>
        ) : null}

        {snapshot ? (
          <SeoAuditSnapshotInline report={snapshot} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <BodyText className="text-xs text-slate-600 dark:text-slate-300">
              No scan data yet. Click "Scan now" to create your first snapshot.
            </BodyText>
          </div>
        )}
      </div>
    </div>
  )
}

