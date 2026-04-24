"use client"

import { usePatternPresetStore } from "@imify/stores/stores/pattern-preset-store"
import { PresetLandingPage, PresetWorkPage } from "@/features/presets/preset-flow-pages"

export function PatternLandingPage() {
  const presets = usePatternPresetStore((state) => state.presets)
  const ensureDefaultPreset = usePatternPresetStore((state) => state.ensureDefaultPreset)

  return (
    <PresetLandingPage
      title="Pattern Generator"
      routeBase="/pattern-generator"
      presets={presets}
      ensureDefaultPreset={ensureDefaultPreset}
    />
  )
}

export function PatternWorkPage({ presetId }: { presetId: string }) {
  const presets = usePatternPresetStore((state) => state.presets)
  const activePresetId = usePatternPresetStore((state) => state.activePresetId)
  const applyPreset = usePatternPresetStore((state) => state.applyPreset)
  const setPresetViewMode = usePatternPresetStore((state) => state.setPresetViewMode)
  const workspaceState = { activePresetId, presetCount: presets.length }

  return (
    <PresetWorkPage
      title="Pattern Generator"
      routeBase="/pattern-generator"
      presetId={presetId}
      presets={presets}
      workspaceState={workspaceState}
      applyPreset={applyPreset}
      setPresetViewMode={setPresetViewMode}
    />
  )
}
