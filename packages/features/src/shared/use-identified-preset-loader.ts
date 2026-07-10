import { useEffect } from "react"
import { useBatchStore, type SavedSetupPreset } from "@imify/stores/stores/batch-store"

/**
 * Hook to automatically apply a feature-specific identified preset on mount.
 * This ensures that if the user has saved a configuration for a specific feature,
 * it takes priority over the generic default.
 */
export function useIdentifiedPresetLoader(
  identifiedPreset: SavedSetupPreset | undefined,
  activePresetId: string | null,
  applyPreset: (preset: SavedSetupPreset) => void
) {
  const { presets } = useBatchStore()
  const isHydrated = useBatchStore((s) => (s as any)._hasHydrated)

  useEffect(() => {
    // Wait for store to hydrate to avoid applying template if a saved version exists
    if (!isHydrated) return

    // If we have an identified preset and no preset is currently active,
    // try to find it in the store, otherwise use the provided template.
    if (identifiedPreset && !activePresetId) {
      const storePreset = presets.find((p) => p.id === identifiedPreset.id)
      applyPreset(storePreset || identifiedPreset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, identifiedPreset?.id])
}
