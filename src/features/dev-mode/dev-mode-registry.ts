import { useBatchStore } from "@/options/stores/batch-store"
import { useSplicingStore } from "@/options/stores/splicing-store"
import { useSplitterStore } from "@/options/stores/splitter-store"
import { useFillingStore } from "@/options/stores/filling-store"
import { usePatternStore } from "@/options/stores/pattern-store"
import { useDiffcheckerStore } from "@/options/stores/diffchecker-store"
import { useInspectorStore } from "@/options/stores/inspector-store"
import type { StoreApi, UseBoundStore } from "zustand"

export type DevModeFeatureId =
  | "batch"
  | "splicing"
  | "splitter"
  | "filling"
  | "pattern"
  | "diffchecker"
  | "inspector"
  | "settings"
  | "performance"
  | "layout"

export interface DevModeFeatureDef {
  id: DevModeFeatureId
  label: string
  /** The Zustand store hook if this feature is backed by a Zustand store */
  storeHook?: UseBoundStore<StoreApi<any>>
}

/**
 * Standardized registry for all Developer Mode features.
 * Used automatically by Export/Import dialogs and state serializers.
 */
export const DEV_MODE_FEATURES: DevModeFeatureDef[] = [
  { id: "batch", label: "Processor (Single/Batch)", storeHook: useBatchStore },
  { id: "splicing", label: "Image Splicing", storeHook: useSplicingStore },
  { id: "splitter", label: "Image Splitter", storeHook: useSplitterStore },
  { id: "filling", label: "Image Filling", storeHook: useFillingStore },
  { id: "pattern", label: "Pattern Generator", storeHook: usePatternStore },
  { id: "diffchecker", label: "Difference Checker", storeHook: useDiffcheckerStore },
  { id: "inspector", label: "Image Inspector", storeHook: useInspectorStore },
  { id: "settings", label: "Settings & Context Menu" },
  { id: "performance", label: "Performance Preferences" },
  { id: "layout", label: "Workspace Layout Preferences" },
]
