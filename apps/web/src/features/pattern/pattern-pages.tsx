"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { PatternPresetSelectView } from "@imify/features/pattern/pattern-preset-select-view"
import { PatternSidebarShell } from "@imify/features/pattern/pattern-sidebar-shell"
import {
  clonePatternPresetConfig,
  type PatternPresetConfig,
  usePatternPresetStore,
} from "@imify/stores/stores/pattern-preset-store"
import { usePatternStore } from "@imify/stores/stores/pattern-store"
import { WorkspaceLoadingState, WorkspaceNotFoundState } from "@imify/ui"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"

const AUTO_SAVE_DELAY_MS = 420
const PatternTab = dynamic(
  () => import("@imify/features/pattern/pattern-tab").then((module) => module.PatternTab),
  { ssr: false }
)

function usePatternPresetHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(usePatternPresetStore.persist.hasHydrated())
    const unsubStart = usePatternPresetStore.persist.onHydrate(() => setHydrated(false))
    const unsubFinish = usePatternPresetStore.persist.onFinishHydration(() => setHydrated(true))
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  return hydrated
}

function extractPatternPresetConfig(patternState: ReturnType<typeof usePatternStore.getState>): PatternPresetConfig {
  return clonePatternPresetConfig({
    canvas: patternState.canvas,
    settings: patternState.settings,
    exportFormat: patternState.exportFormat,
    exportQuality: patternState.exportQuality,
    exportJxlEffort: patternState.exportJxlEffort,
    exportJxlLossless: patternState.exportJxlLossless,
    exportJxlProgressive: patternState.exportJxlProgressive,
    exportJxlEpf: patternState.exportJxlEpf,
    exportAvifSpeed: patternState.exportAvifSpeed,
    exportAvifQualityAlpha: patternState.exportAvifQualityAlpha,
    exportAvifLossless: patternState.exportAvifLossless,
    exportAvifSubsample: patternState.exportAvifSubsample,
    exportAvifTune: patternState.exportAvifTune,
    exportAvifHighAlphaQuality: patternState.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: patternState.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: patternState.exportMozJpegChromaSubsampling,
    exportPngTinyMode: patternState.exportPngTinyMode,
    exportPngCleanTransparentPixels: patternState.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: patternState.exportPngAutoGrayscale,
    exportPngDithering: patternState.exportPngDithering,
    exportPngDitheringLevel: patternState.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: patternState.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: patternState.exportPngOxiPngCompression,
    exportWebpLossless: patternState.exportWebpLossless,
    exportWebpNearLossless: patternState.exportWebpNearLossless,
    exportWebpEffort: patternState.exportWebpEffort,
    exportWebpSharpYuv: patternState.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: patternState.exportWebpPreserveExactAlpha,
    exportBmpColorDepth: patternState.exportBmpColorDepth,
    exportBmpDithering: patternState.exportBmpDithering,
    exportBmpDitheringLevel: patternState.exportBmpDitheringLevel,
    exportTiffColorMode: patternState.exportTiffColorMode,
  })
}

function applyPatternPresetConfig(config: PatternPresetConfig): void {
  const nextConfig = clonePatternPresetConfig(config)

  usePatternStore.setState((state) => ({
    ...state,
    canvas: {
      ...nextConfig.canvas,
      backgroundImageUrl: null,
    },
    settings: nextConfig.settings,
    visualBoundaryVisibility: {
      inbound: false,
      outbound: false,
    },
    activeVisualBoundary: null,
    exportFormat: nextConfig.exportFormat,
    exportQuality: nextConfig.exportQuality,
    exportJxlEffort: nextConfig.exportJxlEffort,
    exportJxlLossless: nextConfig.exportJxlLossless,
    exportJxlProgressive: nextConfig.exportJxlProgressive,
    exportJxlEpf: nextConfig.exportJxlEpf,
    exportAvifSpeed: nextConfig.exportAvifSpeed,
    exportAvifQualityAlpha: nextConfig.exportAvifQualityAlpha,
    exportAvifLossless: nextConfig.exportAvifLossless,
    exportAvifSubsample: nextConfig.exportAvifSubsample,
    exportAvifTune: nextConfig.exportAvifTune,
    exportAvifHighAlphaQuality: nextConfig.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: nextConfig.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: nextConfig.exportMozJpegChromaSubsampling,
    exportPngTinyMode: nextConfig.exportPngTinyMode,
    exportPngCleanTransparentPixels: nextConfig.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: nextConfig.exportPngAutoGrayscale,
    exportPngDithering: nextConfig.exportPngDithering,
    exportPngDitheringLevel: nextConfig.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: nextConfig.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: nextConfig.exportPngOxiPngCompression,
    exportWebpLossless: nextConfig.exportWebpLossless,
    exportWebpNearLossless: nextConfig.exportWebpNearLossless,
    exportWebpEffort: nextConfig.exportWebpEffort,
    exportWebpSharpYuv: nextConfig.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: nextConfig.exportWebpPreserveExactAlpha,
    exportBmpColorDepth: nextConfig.exportBmpColorDepth,
    exportBmpDithering: nextConfig.exportBmpDithering,
    exportBmpDitheringLevel: nextConfig.exportBmpDitheringLevel,
    exportTiffColorMode: nextConfig.exportTiffColorMode,
  }))
}

export function PatternLandingPage() {
  const router = useRouter()
  const isHydrated = usePatternPresetHydrated()
  const presets = usePatternPresetStore((state) => state.presets)
  const ensureDefaultPreset = usePatternPresetStore((state) => state.ensureDefaultPreset)
  const setPresetViewMode = usePatternPresetStore((state) => state.setPresetViewMode)
  const saveCurrentPreset = usePatternPresetStore((state) => state.saveCurrentPreset)
  const applyPreset = usePatternPresetStore((state) => state.applyPreset)
  const updatePresetMeta = usePatternPresetStore((state) => state.updatePresetMeta)
  const togglePresetPin = usePatternPresetStore((state) => state.togglePresetPin)
  const deletePreset = usePatternPresetStore((state) => state.deletePreset)
  const patternState = usePatternStore()

  useWorkspaceSidebar(<PatternSidebarShell />)

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    ensureDefaultPreset()
    setPresetViewMode("select")
  }, [ensureDefaultPreset, isHydrated, setPresetViewMode])

  if (!isHydrated) {
    return <WorkspaceLoadingState title="Loading pattern presets..." />
  }

  return (
    <PatternPresetSelectView
      presets={presets}
      activePresetId={null}
      onOpenPreset={(id) => {
        const preset = presets.find((entry) => entry.id === id)
        if (!preset) return
        applyPatternPresetConfig(preset.config)
        applyPreset(id)
        router.push(`/pattern-generator/work?id=${id}`)
      }}
      onCreatePreset={(name, color) => {
        const createdId = saveCurrentPreset({
          name,
          highlightColor: color,
          config: extractPatternPresetConfig(patternState),
        })
        router.push(`/pattern-generator/work?id=${createdId}`)
      }}
      onUpdatePresetMeta={updatePresetMeta}
      onTogglePresetPin={togglePresetPin}
      onDeletePreset={deletePreset}
    />
  )
}

export function PatternWorkPage({ presetId }: { presetId: string }) {
  const isHydrated = usePatternPresetHydrated()
  const router = useRouter()
  const presets = usePatternPresetStore((state) => state.presets)
  const activePresetId = usePatternPresetStore((state) => state.activePresetId)
  const applyPreset = usePatternPresetStore((state) => state.applyPreset)
  const setPresetViewMode = usePatternPresetStore((state) => state.setPresetViewMode)
  const syncActivePresetConfig = usePatternPresetStore((state) => state.syncActivePresetConfig)
  const ensureDefaultPreset = usePatternPresetStore((state) => state.ensureDefaultPreset)
  const appliedPresetIdRef = useRef<string | null>(null)
  const patternState = usePatternStore()

  useWorkspaceSidebar(<PatternSidebarShell />)

  const preset = useMemo(
    () => presets.find((entry) => entry.id === presetId) ?? null,
    [presetId, presets]
  )

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    if (presets.length === 0) {
      ensureDefaultPreset()
    }
  }, [ensureDefaultPreset, isHydrated, presets.length])

  useEffect(() => {
    if (!isHydrated || !preset) {
      return
    }
    if (appliedPresetIdRef.current === preset.id) {
      return
    }
    applyPatternPresetConfig(preset.config)
    applyPreset(preset.id)
    setPresetViewMode("workspace")
    appliedPresetIdRef.current = preset.id
  }, [applyPreset, isHydrated, preset, setPresetViewMode])

  useEffect(() => {
    if (!isHydrated || !preset || activePresetId !== preset.id) {
      return
    }

    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(extractPatternPresetConfig(patternState))
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePresetId, isHydrated, patternState, preset, syncActivePresetConfig])

  useEffect(() => {
    if (!isHydrated || preset) {
      return
    }
    if (presets.length > 0) {
      setPresetViewMode("select")
      router.push("/pattern-generator")
    }
  }, [isHydrated, preset, presets.length, router, setPresetViewMode])

  if (!isHydrated) {
    return <WorkspaceLoadingState title="Loading pattern workspace..." />
  }

  if (!preset) {
    return (
      <WorkspaceNotFoundState
        title="Preset not found"
        message="This pattern preset id does not exist."
        action={
          <Link href="/pattern-generator" className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Back to preset list
          </Link>
        }
      />
    )
  }

  if (activePresetId !== preset.id) {
    return <WorkspaceLoadingState title="Loading pattern workspace..." />
  }

  return <PatternTab />
}
