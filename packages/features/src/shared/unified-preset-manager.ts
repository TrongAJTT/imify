import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store"
import { useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store"
import { usePatternPresetStore } from "@imify/stores/stores/pattern-preset-store"

export type PresetModuleType = "processor" | "splicing" | "splitter" | "pattern"

export interface UnifiedPresetSummary {
  id: string
  name: string
  module: PresetModuleType
  highlightColor: string
  createdAt: number
  updatedAt: number
  pinned?: boolean
}

export interface UnifiedPresetStats {
  totalCount: number
  countByModule: Record<PresetModuleType, number>
}

export function useUnifiedPresetStats(): UnifiedPresetStats {
  const batchPresets = useBatchStore((state) => state.presets)
  const splicingPresets = useSplicingPresetStore((state) => state.presets)
  const splitterPresets = useSplitterPresetStore((state) => state.presets)
  const patternPresets = usePatternPresetStore((state) => state.presets)

  const processorCount = batchPresets?.length || 0
  const splicingCount = splicingPresets?.length || 0
  const splitterCount = splitterPresets?.length || 0
  const patternCount = patternPresets?.length || 0

  return {
    totalCount: processorCount + splicingCount + splitterCount + patternCount,
    countByModule: {
      processor: processorCount,
      splicing: splicingCount,
      splitter: splitterCount,
      pattern: patternCount
    }
  }
}

export function useUnifiedPresets(): {
  presets: UnifiedPresetSummary[]
  stats: UnifiedPresetStats
} {
  const batchPresets = useBatchStore((state) => state.presets)
  const splicingPresets = useSplicingPresetStore((state) => state.presets)
  const splitterPresets = useSplitterPresetStore((state) => state.presets)
  const patternPresets = usePatternPresetStore((state) => state.presets)

  const stats = useUnifiedPresetStats()

  const processorSummaries: UnifiedPresetSummary[] = (batchPresets || []).map((p) => ({
    id: p.id,
    name: p.name,
    module: "processor",
    highlightColor: p.highlightColor,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    pinned: p.pinned
  }))

  const splicingSummaries: UnifiedPresetSummary[] = (splicingPresets || []).map((p) => ({
    id: p.id,
    name: p.name,
    module: "splicing",
    highlightColor: p.highlightColor,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }))

  const splitterSummaries: UnifiedPresetSummary[] = (splitterPresets || []).map((p) => ({
    id: p.id,
    name: p.name,
    module: "splitter",
    highlightColor: p.highlightColor,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }))

  const patternSummaries: UnifiedPresetSummary[] = (patternPresets || []).map((p) => ({
    id: p.id,
    name: p.name,
    module: "pattern",
    highlightColor: p.highlightColor,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }))

  const presets = [
    ...processorSummaries,
    ...splicingSummaries,
    ...splitterSummaries,
    ...patternSummaries
  ]

  return {
    presets,
    stats
  }
}

export function useUnifiedPresetActions() {
  const deleteBatchPreset = useBatchStore((state) => state.deletePreset)
  const deleteSplicingPreset = useSplicingPresetStore((state) => state.deletePreset)
  const deleteSplitterPreset = useSplitterPresetStore((state) => state.deletePreset)
  const deletePatternPreset = usePatternPresetStore((state) => state.deletePreset)

  const deletePreset = (id: string, module: PresetModuleType) => {
    switch (module) {
      case "processor":
        deleteBatchPreset?.(id)
        break
      case "splicing":
        deleteSplicingPreset?.(id)
        break
      case "splitter":
        deleteSplitterPreset?.(id)
        break
      case "pattern":
        deletePatternPreset?.(id)
        break
    }
  }

  return {
    deletePreset
  }
}
