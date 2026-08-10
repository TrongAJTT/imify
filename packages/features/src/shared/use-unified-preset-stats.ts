import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store"
import { useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store"
import { usePatternPresetStore } from "@imify/stores/stores/pattern-preset-store"

export interface UnifiedPresetStats {
  totalCount: number
  countByModule: {
    processor: number
    splicing: number
    splitter: number
    pattern: number
  }
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
