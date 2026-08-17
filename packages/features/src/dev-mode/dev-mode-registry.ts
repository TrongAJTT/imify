import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useSplicingStore } from "@imify/stores/stores/splicing-store"
import { useSplitterStore } from "@imify/stores/stores/splitter-store"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { usePatternStore } from "@imify/stores/stores/pattern-store"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { useQrGeneratorStore } from "@imify/stores/stores/qr-generator-store"
import { useBackgroundRemoverStore } from "@imify/stores/stores/background-remover-store"
import { useCollageMakerStore } from "@imify/stores/stores/collage-maker-store"
import { usePdfStudioStore } from "@imify/stores/stores/pdf-studio-store"
import type { StoreApi, UseBoundStore } from "zustand"

export type DevModeFeatureId =
  | "batch"
  | "splicing"
  | "splitter"
  | "filling"
  | "pattern"
  | "diffchecker"
  | "inspector"
  | "qr_generator"
  | "background_remover"
  | "collage_maker"
  | "pdf_studio"
  | "settings"
  | "performance"
  | "layout"
  | "runtime_logs"
  | "environment"

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
  { id: "qr_generator", label: "QR Code Generator", storeHook: useQrGeneratorStore },
  { id: "background_remover", label: "Background Remover", storeHook: useBackgroundRemoverStore },
  { id: "collage_maker", label: "Collage Maker", storeHook: useCollageMakerStore },
  { id: "pdf_studio", label: "PDF Studio", storeHook: usePdfStudioStore },
  { id: "settings", label: "Settings & Context Menu" },
  { id: "performance", label: "Performance Preferences" },
  { id: "layout", label: "Workspace Layout Preferences" },
  { id: "runtime_logs", label: "Runtime Console Logs" },
  { id: "environment", label: "Environment Information" },
]
