import { useEffect, useRef } from "react";
import { useBatchStore, type SavedSetupPreset } from "@imify/stores/stores/batch-store";

/**
 * Hook to automatically apply a feature-specific identified preset on mount.
 * This ensures that if the user has saved a configuration for a specific feature,
 * it takes priority over the generic default.
 */
export function useIdentifiedPresetLoader(
  identifiedPreset: SavedSetupPreset | undefined,
  activePresetId: string | null,
  applyPreset: (preset: SavedSetupPreset) => void,
) {
  const { presets } = useBatchStore();
  const isHydrated = useBatchStore((s) => (s as any)._hasHydrated);
  const appliedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isHydrated || !identifiedPreset) return;

    if (activePresetId && activePresetId !== identifiedPreset.id) {
      // User selected a custom preset; reset ref so identified preset can reload if cleared
      appliedIdRef.current = null;
      return;
    }

    if (appliedIdRef.current === identifiedPreset.id) {
      return;
    }

    if (!activePresetId) {
      appliedIdRef.current = identifiedPreset.id;
      const storePreset = presets.find((p) => p.id === identifiedPreset.id);
      applyPreset(storePreset || identifiedPreset);
    }
  }, [isHydrated, identifiedPreset?.id, activePresetId, applyPreset, presets]);
}
