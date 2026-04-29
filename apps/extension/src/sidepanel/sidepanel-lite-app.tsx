// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import "@/style.css"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { bootstrapExtensionAdapters } from "@/adapters/bootstrap-extension-adapters"
import { fetchRemoteImageAsFile } from "@imify/engine/converter/remote-image-import"

import { inspectImage, type InspectorResult } from "@imify/features/inspector"
import { BasicInfoCard, ColorInspectorCard, ExifTableCard, VisualAnalysisDialog } from "@imify/features/inspector"
import { BodyText } from "@imify/ui/ui/typography"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { useImifyDarkMode } from "@/options/shared/use-imify-dark-mode"
import { SidepanelDropInputCard } from "@/sidepanel/components/sidepanel-drop-input-card"
import { SidepanelSharedAppbar } from "@/sidepanel/components/sidepanel-shared-appbar"

bootstrapExtensionAdapters()

async function switchSidepanel(view: "inspector" | "audit"): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!activeTab?.id || !chrome.sidePanel?.setOptions || !chrome.sidePanel?.open) {
    return
  }

  await chrome.sidePanel.setOptions({
    tabId: activeTab.id,
    path: `sidepanel.html?panel=${view}`,
    enabled: true
  })
  await chrome.sidePanel.open({ tabId: activeTab.id })
}

export default function SidePanelLiteApp() {
  const { isDark, toggleDarkMode } = useImifyDarkMode()
  const paletteCount = useInspectorStore((state) => state.paletteCount)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<InspectorResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const urlRef = useRef<string | null>(null)
  const bitmapRef = useRef<ImageBitmap | null>(null)

  const cleanupResources = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }

    if (bitmapRef.current) {
      bitmapRef.current.close()
      bitmapRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanupResources()
    }
  }, [cleanupResources])

  const handlePickFile = useCallback(async (file: File | undefined) => {
    cleanupResources()

    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setResult(null)
      setError(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setResult(null)
      setError("Please select a valid image file.")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    const nextUrl = URL.createObjectURL(file)

    try {
      const bitmap = await createImageBitmap(file)
      const buffer = await file.arrayBuffer()
      const nextResult = await inspectImage(file, bitmap, buffer, { paletteCount })

      urlRef.current = nextUrl
      bitmapRef.current = bitmap

      setSelectedFile(file)
      setPreviewUrl(nextUrl)
      setResult(nextResult)
    } catch {
      URL.revokeObjectURL(nextUrl)
      setSelectedFile(null)
      setPreviewUrl(null)
      setResult(null)
      setError("Failed to inspect the selected image.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [cleanupResources, paletteCount])

  const handleOpenSettings = useCallback(async () => {
    await chrome.runtime.openOptionsPage()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const importUrl = params.get("importUrl")

    if (!importUrl) {
      return
    }

    params.delete("importUrl")
    const nextSearch = params.toString()
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`
    window.history.replaceState(null, "", nextUrl)

    void (async () => {
      try {
        const file = await fetchRemoteImageAsFile(importUrl)
        await handlePickFile(file)
      } catch {
        setError("Unable to import image URL for inspection.")
      }
    })()
  }, [handlePickFile])

  return (
    <div className="min-h-screen bg-slate-100 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="space-y-3">
        <SidepanelSharedAppbar
          isDark={isDark}
          onToggleDarkMode={toggleDarkMode}
          onOpenOptions={() => void handleOpenSettings()}
          activeView="inspector"
          onSwitchView={(view) => void switchSidepanel(view)}
          title="Imify Lite Inspector"
          subtitle="Drag, inspect, optimize"
        />

        <SidepanelDropInputCard
          selectedFileName={selectedFile?.name ?? null}
          isAnalyzing={isAnalyzing}
          onPickFile={(file) => void handlePickFile(file)}
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            <BodyText className="text-xs text-red-700 dark:text-red-300">{error}</BodyText>
          </div>
        ) : null}

        {isAnalyzing ? (
          <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-300">
            <Loader2 size={14} className="animate-spin" />
            <BodyText className="text-xs text-sky-700 dark:text-sky-300">
              Processing image metadata and color profile...
            </BodyText>
          </div>
        ) : null}

        {result && selectedFile && previewUrl ? (
          <>
            <BasicInfoCard
              basic={result.basic}
              dimensions={result.dimensions}
              resolution={result.resolution}
              time={result.time}
              imageUrl={previewUrl}
            />

            <ColorInspectorCard color={result.color} palette={result.palette} />

            <ExifTableCard entries={result.exifEntries} />

            <VisualAnalysisDialog imageUrl={previewUrl} alt={selectedFile.name} />
          </>
        ) : null}
      </div>
    </div>
  )
}
