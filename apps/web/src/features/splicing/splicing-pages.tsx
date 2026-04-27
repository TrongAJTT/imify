"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { DEFAULT_PERFORMANCE_PREFERENCES } from "@imify/features/processor/performance-preferences"
import { SplicingPresetSelectView } from "@imify/features/splicing/splicing-preset-select-view"
import { SplicingSidebarShell } from "@imify/features/splicing/splicing-sidebar-shell"
import { SplicingTab } from "@imify/features/splicing/splicing-tab"
import { useSplicingPresetStore, type SplicingPresetConfig } from "@imify/stores/stores/splicing-preset-store"
import { useSplicingStore } from "@imify/stores/stores/splicing-store"
import { WorkspaceLoadingState, WorkspaceNotFoundState } from "@imify/ui"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { useWorkspaceSettingsDialogStore } from "@imify/stores/stores/workspace-settings-dialog-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid"

function useSplicingPresetHydrated(): boolean {
  // Keep the first render deterministic across SSR/CSR to avoid hydration mismatch.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(useSplicingPresetStore.persist.hasHydrated())

    const unsubStart = useSplicingPresetStore.persist.onHydrate(() => {
      setHydrated(false)
    })
    const unsubFinish = useSplicingPresetStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })

    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  return hydrated
}

function extractSplicingPresetConfig(splicingState: any): SplicingPresetConfig {
  return {
    preset: splicingState.preset,
    primaryDirection: splicingState.primaryDirection,
    secondaryDirection: splicingState.secondaryDirection,
    gridCount: splicingState.gridCount,
    flowMaxSize: splicingState.flowMaxSize,
    flowSplitOverflow: splicingState.flowSplitOverflow,
    alignment: splicingState.alignment,
    imageAppearanceDirection: splicingState.imageAppearanceDirection,
    canvasPadding: splicingState.canvasPadding,
    mainSpacing: splicingState.mainSpacing,
    crossSpacing: splicingState.crossSpacing,
    canvasBorderRadius: splicingState.canvasBorderRadius,
    canvasBorderWidth: splicingState.canvasBorderWidth,
    canvasBorderColor: splicingState.canvasBorderColor,
    backgroundColor: splicingState.backgroundColor,
    imageResize: splicingState.imageResize,
    imageFitValue: splicingState.imageFitValue,
    imagePadding: splicingState.imagePadding,
    imagePaddingColor: splicingState.imagePaddingColor,
    imageBorderRadius: splicingState.imageBorderRadius,
    imageBorderWidth: splicingState.imageBorderWidth,
    imageBorderColor: splicingState.imageBorderColor,
    exportFormat: splicingState.exportFormat,
    exportQuality: splicingState.exportQuality,
    exportJxlEffort: splicingState.exportJxlEffort,
    exportJxlLossless: splicingState.exportJxlLossless,
    exportJxlProgressive: splicingState.exportJxlProgressive,
    exportJxlEpf: splicingState.exportJxlEpf,
    exportWebpLossless: splicingState.exportWebpLossless,
    exportWebpNearLossless: splicingState.exportWebpNearLossless,
    exportWebpEffort: splicingState.exportWebpEffort,
    exportWebpSharpYuv: splicingState.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: splicingState.exportWebpPreserveExactAlpha,
    exportAvifSpeed: splicingState.exportAvifSpeed,
    exportAvifQualityAlpha: splicingState.exportAvifQualityAlpha,
    exportAvifLossless: splicingState.exportAvifLossless,
    exportAvifSubsample: splicingState.exportAvifSubsample,
    exportAvifTune: splicingState.exportAvifTune,
    exportAvifHighAlphaQuality: splicingState.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: splicingState.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: splicingState.exportMozJpegChromaSubsampling,
    exportPngTinyMode: splicingState.exportPngTinyMode,
    exportPngCleanTransparentPixels: splicingState.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: splicingState.exportPngAutoGrayscale,
    exportPngDithering: splicingState.exportPngDithering,
    exportPngDitheringLevel: splicingState.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: splicingState.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: splicingState.exportPngOxiPngCompression,
    exportBmpColorDepth: splicingState.exportBmpColorDepth,
    exportBmpDithering: splicingState.exportBmpDithering,
    exportBmpDitheringLevel: splicingState.exportBmpDitheringLevel,
    exportTiffColorMode: splicingState.exportTiffColorMode,
    exportMode: splicingState.exportMode,
    exportTrimBackground: splicingState.exportTrimBackground,
    exportConcurrency: splicingState.exportConcurrency,
    exportFileNamePattern: splicingState.exportFileNamePattern,
    previewQualityPercent: splicingState.previewQualityPercent,
    previewShowImageNumber: splicingState.previewShowImageNumber
  }
}

export function SplicingLandingPage() {
  const enableWideSidebarGrid = useWideSidebarGridEnabled()
  const openSettingsDialog = useWorkspaceSettingsDialogStore((state) => state.openSettingsDialog)
  const router = useRouter()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const setPresetViewMode = useSplicingPresetStore((state) => state.setPresetViewMode)
  const ensureDefaultPreset = useSplicingPresetStore((state) => state.ensureDefaultPreset)
  const saveCurrentPreset = useSplicingPresetStore((state) => state.saveCurrentPreset)
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset)
  const updatePresetMeta = useSplicingPresetStore((state) => state.updatePresetMeta)
  const deletePreset = useSplicingPresetStore((state) => state.deletePreset)
  const presets = useSplicingPresetStore((state) => state.presets)
  const isRehydrated = useSplicingPresetHydrated()
  const previewQualityHandlerRef = useRef<((next: number) => void) | null>(null)
  const splicingState = useSplicingStore()

  const sidebar = useMemo(
    () => (
      <SplicingSidebarShell
        performancePreferences={DEFAULT_PERFORMANCE_PREFERENCES}
        onPreviewQualityChange={(next) => {
          const handler = previewQualityHandlerRef.current
          if (handler) {
            handler(next)
            return
          }
          useSplicingStore.getState().setPreviewQualityPercent(next)
        }}
        onOpenSettings={() => openSettingsDialog("performance")}
        enableWideSidebarGrid={enableWideSidebarGrid}
      />
    ),
    [enableWideSidebarGrid, openSettingsDialog]
  )

  useWorkspaceSidebar(sidebar)

  useEffect(() => {
    setHeaderSection("Image Splicing")
    setHeaderActions(null)
    setHeaderBreadcrumb(<FeatureBreadcrumb compact rootToolId="splicing" />)
    return () => resetHeader()
  }, [resetHeader, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  useEffect(() => {
    if (!isRehydrated) {
      return
    }
    ensureDefaultPreset()
    setPresetViewMode("select")
  }, [ensureDefaultPreset, isRehydrated, setPresetViewMode])

  if (!isRehydrated) {
    return <WorkspaceLoadingState title="Loading splicing presets..." />
  }

  return (
    <SplicingPresetSelectView
      presets={presets}
      activePresetId={null}
      onOpenPreset={(id) => {
        applyPreset(id)
        router.push(`/splicing/work?id=${id}`)
      }}
      onCreatePreset={(name, color) => {
        const config = extractSplicingPresetConfig(splicingState)
        const createdId = saveCurrentPreset({ name, highlightColor: color, config })
        router.push(`/splicing/work?id=${createdId}`)
      }}
      onUpdatePresetMeta={updatePresetMeta}
      onDeletePreset={deletePreset}
    />
  )
}

export function SplicingWorkPage({ presetId }: { presetId: string }) {
  const enableWideSidebarGrid = useWideSidebarGridEnabled()
  const openSettingsDialog = useWorkspaceSettingsDialogStore((state) => state.openSettingsDialog)
  const router = useRouter()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset)
  const setPresetViewMode = useSplicingPresetStore((state) => state.setPresetViewMode)
  const presets = useSplicingPresetStore((state) => state.presets)
  const isRehydrated = useSplicingPresetHydrated()
  const previewQualityHandlerRef = useRef<((next: number) => void) | null>(null)

  const sidebar = useMemo(
    () => (
      <SplicingSidebarShell
        performancePreferences={DEFAULT_PERFORMANCE_PREFERENCES}
        onPreviewQualityChange={(next) => {
          const handler = previewQualityHandlerRef.current
          if (handler) {
            handler(next)
            return
          }
          useSplicingStore.getState().setPreviewQualityPercent(next)
        }}
        onOpenSettings={() => openSettingsDialog("performance")}
        enableWideSidebarGrid={enableWideSidebarGrid}
      />
    ),
    [enableWideSidebarGrid, openSettingsDialog]
  )

  useWorkspaceSidebar(sidebar)

  const preset = useMemo(
    () => presets.find((entry) => entry.id === presetId) ?? null,
    [presetId, presets]
  )

  useEffect(() => {
    setHeaderSection("Image Splicing")
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="splicing"
        activeLabel={preset?.name ?? null}
        onRootClick={() => router.push("/splicing")}
      />
    )
    return () => resetHeader()
  }, [preset?.name, resetHeader, router, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  useEffect(() => {
    if (!isRehydrated || !preset) {
      return
    }
    applyPreset(preset.id)
    setPresetViewMode("workspace")
  }, [applyPreset, isRehydrated, preset, setPresetViewMode])

  if (!isRehydrated) {
    return <WorkspaceLoadingState title="Loading splicing workspace..." />
  }

  if (!preset) {
    return (
      <WorkspaceNotFoundState
        title="Preset not found"
        message="This splicing preset id does not exist."
        action={
          <Link href="/splicing" className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Back to preset list
          </Link>
        }
      />
    )
  }

  return (
    <SplicingTab
      onRegisterPreviewQualityChangeHandler={(handler) => {
        previewQualityHandlerRef.current = handler
      }}
    />
  )
}
