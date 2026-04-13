import "@/style.css"

import { useEffect, useMemo, useState } from "react"
import { Sparkles } from "lucide-react"

import { PopupActionGrid } from "@/popup/components/popup-action-grid"
import { SeoAuditResults } from "@/popup/components/seo-audit-results"
import { useSeoAudit } from "@/popup/hooks/use-seo-audit"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Kicker, MutedText, Subheading } from "@/options/components/ui/typography"

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function useDarkModeFromSettings(): void {
  useEffect(() => {
    let disposed = false

    void chrome.storage.sync
      .get("imify_dark_mode")
      .then((state) => {
        if (disposed) {
          return
        }

        const isDark = Boolean(state?.imify_dark_mode)
        document.documentElement.classList.toggle("dark", isDark)
      })
      .catch(() => {
        // Popup keeps default theme when storage cannot be read.
      })

    return () => {
      disposed = true
    }
  }, [])
}

async function openSidePanelLite(): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!activeTab?.id) {
    throw new Error("No active tab is available for side panel context.")
  }

  if (!chrome.sidePanel?.setOptions || !chrome.sidePanel?.open) {
    throw new Error("Side Panel API is unavailable in this browser build.")
  }

  await chrome.sidePanel.setOptions({
    tabId: activeTab.id,
    path: "options.html?view=sidepanel",
    enabled: true
  })

  await chrome.sidePanel.open({ tabId: activeTab.id })
}

export function PopupApp() {
  useDarkModeFromSettings()

  const { report, isRunning, error, runAudit } = useSeoAudit()
  const [actionError, setActionError] = useState<string | null>(null)

  const manifestVersion = useMemo(() => chrome.runtime.getManifest().version, [])

  const handleRunScan = async () => {
    setActionError(null)
    await runAudit()
  }

  const handleOpenSidePanel = async () => {
    setActionError(null)

    try {
      await openSidePanelLite()
      window.close()
    } catch (error) {
      setActionError(toErrorMessage(error, "Failed to open Side Panel Lite Inspector."))
    }
  }

  const handleOpenSettings = async () => {
    setActionError(null)

    try {
      await chrome.runtime.openOptionsPage()
      window.close()
    } catch (error) {
      setActionError(toErrorMessage(error, "Failed to open settings page."))
    }
  }

  return (
    <div className="w-[430px] bg-slate-100 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SurfaceCard className="p-4" tone="soft">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Kicker>Imify Extension</Kicker>
              <Subheading className="text-base">SEO + Image Workflow Command Center</Subheading>
              <MutedText className="text-xs">
                Privacy-first diagnostics and inspector shortcuts without scraping features.
              </MutedText>
            </div>
            <div className="rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">Version {manifestVersion}</p>
        </SurfaceCard>

        <PopupActionGrid
          isScanRunning={isRunning}
          onRunScan={handleRunScan}
          onOpenSidePanel={handleOpenSidePanel}
          onOpenSettings={handleOpenSettings}
        />

        <SeoAuditResults report={report} isRunning={isRunning} error={error ?? actionError} />
      </div>
    </div>
  )
}
