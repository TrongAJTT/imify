// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import "@/style.css"

import { useState } from "react"
import { bootstrapExtensionAdapters } from "@/adapters/bootstrap-extension-adapters"

import { PopupActionGrid } from "@/popup/components/popup-action-grid"
import { useSeoAudit } from "@/popup/hooks/use-seo-audit"
import { useImifyDarkMode } from "@/options/shared/use-imify-dark-mode"
import { Expand, Moon, Sun, X } from "lucide-react"
import { Button } from "@imify/ui/ui/button"
import { FEATURE_MEDIA_ASSETS } from "@imify/features/shared/media-assets"

bootstrapExtensionAdapters()

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}
async function openSidePanelLite(panel: "inspector" | "audit"): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!activeTab?.id) {
    throw new Error("No active tab is available for side panel context.")
  }

  if (!chrome.sidePanel?.setOptions || !chrome.sidePanel?.open) {
    throw new Error("Side Panel API is unavailable in this browser build.")
  }

  await chrome.sidePanel.setOptions({
    tabId: activeTab.id,
    path: `options.html?view=sidepanel&panel=${encodeURIComponent(panel)}`,
    enabled: true
  })

  await chrome.sidePanel.open({ tabId: activeTab.id })
}

export function PopupApp() {
  const { isDark, toggleDarkMode } = useImifyDarkMode()
  const { isRunning, error, runAudit } = useSeoAudit()
  const [actionError, setActionError] = useState<string | null>(null)

  const handleRunScan = async () => {
    setActionError(null)

    try {
      const report = await runAudit()
      const { saveSeoAuditSnapshot } = await import("@/features/seo-audit")
      await saveSeoAuditSnapshot(report)
      await openSidePanelLite("audit")
      window.close()
    } catch (error) {
      setActionError(toErrorMessage(error, "Failed to scan current page for SEO audit."))
    }
  }

  const handleOpenSidePanel = async () => {
    setActionError(null)

    try {
      await openSidePanelLite("inspector")
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
    <div className="w-[410px] p-1 bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={FEATURE_MEDIA_ASSETS.brand.imifyLogoPng}
              alt="Imify"
              className="h-8 w-8 rounded-lg shadow-sm"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Imify</div>
              <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">Powerful Image Toolkit</div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleDarkMode}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => void handleOpenSettings()}
              title="Open full feature list"
              aria-label="Open full feature list"
            >
              <Expand size={15} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.close()}
              title="Close popup"
              aria-label="Close popup"
            >
              <X size={15} />
            </Button>
          </div>
        </header>

        <div className="px-2.5 pt-2.5">
          <p className="px-1 text-[18px] text-slate-500 dark:text-slate-400">
            Choose an action for this page.
          </p>
        </div>

        <PopupActionGrid
          isScanRunning={isRunning}
          onRunScan={handleRunScan}
          onOpenSidePanel={handleOpenSidePanel}
          onOpenSettings={handleOpenSettings}
        />

        {error || actionError ? (
          <div className="mx-3 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error ?? actionError}
          </div>
        ) : null}
      </div>
    </div>
  )
}
