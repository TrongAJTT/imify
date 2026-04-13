import "@/style.css"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Image as ImageIcon, Settings2 } from "lucide-react"

import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Kicker, MutedText, Subheading } from "@/options/components/ui/typography"
import { runSeoAuditOnActiveTab, type SeoAuditReport } from "@/features/seo-audit"

interface LocalImagePreview {
  name: string
  size: number
  width: number
  height: number
  mimeType: string
  previewUrl: string
}

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
      .catch(() => {})

    return () => {
      disposed = true
    }
  }, [])
}

export default function SidePanelLiteApp() {
  useDarkModeFromSettings()

  const [report, setReport] = useState<SeoAuditReport | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const [localPreview, setLocalPreview] = useState<LocalImagePreview | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (localPreview?.previewUrl) {
        URL.revokeObjectURL(localPreview.previewUrl)
      }
    }
  }, [localPreview])

  const summaryLabel = useMemo(() => {
    if (!report) {
      return "No scan yet"
    }

    return `Score ${report.summary.score} • ${report.summary.totalAssets} assets`
  }, [report])

  const handleRunAudit = async () => {
    setIsScanning(true)
    setScanError(null)

    try {
      const nextReport = await runSeoAuditOnActiveTab()
      setReport(nextReport)
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Audit failed.")
    } finally {
      setIsScanning(false)
    }
  }

  const handlePickImage = async (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setLocalError("Please select an image file.")
      return
    }

    setLocalError(null)

    const nextUrl = URL.createObjectURL(file)

    try {
      const bitmap = await createImageBitmap(file)

      setLocalPreview((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl)
        }

        return {
          name: file.name,
          size: file.size,
          width: bitmap.width,
          height: bitmap.height,
          mimeType: file.type,
          previewUrl: nextUrl
        }
      })

      bitmap.close()
    } catch {
      URL.revokeObjectURL(nextUrl)
      setLocalError("Failed to decode the selected image.")
    }
  }

  const handleOpenSettings = async () => {
    await chrome.runtime.openOptionsPage()
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="space-y-3">
        <SurfaceCard className="space-y-1.5 p-4" tone="soft">
          <Kicker>Side Panel Lite Inspector</Kicker>
          <Subheading className="text-base">On-page diagnostics while browsing</Subheading>
          <MutedText className="text-xs">
            Lightweight assistant for SEO audit checks and quick local image metadata.
          </MutedText>
        </SurfaceCard>

        <SurfaceCard className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Page Scanner / SEO Audit</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{summaryLabel}</div>
            </div>
            <ClipboardList size={16} className="text-slate-400" />
          </div>

          <Button variant="primary" className="w-full" disabled={isScanning} onClick={handleRunAudit}>
            {isScanning ? "Scanning..." : "Scan Current Page"}
          </Button>

          {scanError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {scanError}
            </p>
          ) : null}

          {report ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="text-[10px] uppercase text-slate-400">Payload</div>
                <div className="font-semibold">{formatBytes(report.summary.estimatedTransferBytes)}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="text-[10px] uppercase text-slate-400">Potential Save</div>
                <div className="font-semibold">{formatBytes(report.summary.estimatedSavingsBytes)}</div>
              </div>
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Local Image Lite Inspector</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Quick metadata without opening full workspace</div>
            </div>
            <ImageIcon size={16} className="text-slate-400" />
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(event) => void handlePickImage(event.target.files?.[0])}
            className="block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />

          {localError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {localError}
            </p>
          ) : null}

          {localPreview ? (
            <div className="space-y-2">
              <img
                src={localPreview.previewUrl}
                alt={localPreview.name}
                className="h-36 w-full rounded-md border border-slate-200 object-cover dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="text-[10px] uppercase text-slate-400">File size</div>
                  <div className="font-medium">{formatBytes(localPreview.size)}</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="text-[10px] uppercase text-slate-400">Dimensions</div>
                  <div className="font-medium">
                    {localPreview.width} x {localPreview.height}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SurfaceCard>

        <Button variant="secondary" className="w-full" onClick={() => void handleOpenSettings()}>
          <Settings2 size={15} />
          Open Full Feature List
        </Button>
      </div>
    </div>
  )
}
