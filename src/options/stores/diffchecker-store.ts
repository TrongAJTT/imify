// PLATFORM:extension — uses @plasmohq/storage for persistence. TODO(monorepo-phase2): replace with StorageAdapter.
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"
import type {
  DiffAlgorithm,
  DiffAlignAnchor,
  DiffAlignMode,
  DiffViewMode
} from "@/features/diffchecker/types"

interface DiffcheckerState {
  viewMode: DiffViewMode
  algorithm: DiffAlgorithm
  alignMode: DiffAlignMode
  alignAnchor: DiffAlignAnchor
  overlayOpacity: number
  splitPosition: number
  diffThreshold: number
  /** Viewer container height in px (Difference Checker tab). */
  containerHeight: number

  setViewMode: (mode: DiffViewMode) => void
  setAlgorithm: (algo: DiffAlgorithm) => void
  setAlignMode: (mode: DiffAlignMode) => void
  setAlignAnchor: (anchor: DiffAlignAnchor) => void
  setOverlayOpacity: (opacity: number) => void
  setSplitPosition: (position: number) => void
  setDiffThreshold: (threshold: number) => void
  setContainerHeight: (height: number) => void
}

const storage = new Storage({ area: "local" })

// Custom Zustand storage for Plasmo Storage (JSON).
const plasmoStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await storage.get(name)
    return value ? JSON.stringify(value) : null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await storage.set(name, JSON.parse(value))
  },
  removeItem: async (name: string): Promise<void> => {
    await storage.remove(name)
  }
}

const DEFAULT_CONTAINER_HEIGHT = 384 // Tailwind `h-96`

export const useDiffcheckerStore = create<DiffcheckerState>()(
  persist(
    (set) => ({
      viewMode: "split",
      algorithm: "heatmap",
      alignMode: "fit-larger",
      alignAnchor: "center",
      overlayOpacity: 50,
      splitPosition: 50,
      diffThreshold: 0,
      containerHeight: DEFAULT_CONTAINER_HEIGHT,

      setViewMode: (viewMode) => set({ viewMode }),
      setAlgorithm: (algorithm) => set({ algorithm }),
      setAlignMode: (alignMode) => set({ alignMode }),
      setAlignAnchor: (alignAnchor) => set({ alignAnchor }),
      setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
      setSplitPosition: (splitPosition) => set({ splitPosition }),
      setDiffThreshold: (diffThreshold) => set({ diffThreshold }),
      setContainerHeight: (containerHeight) => set({ containerHeight })
    }),
    {
      name: "imify_diffchecker",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        algorithm: state.algorithm,
        alignMode: state.alignMode,
        alignAnchor: state.alignAnchor,
        overlayOpacity: state.overlayOpacity,
        splitPosition: state.splitPosition,
        diffThreshold: state.diffThreshold,
        containerHeight: state.containerHeight
      })
    }
  )
)
