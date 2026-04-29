import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type {
  DiffAlgorithm,
  DiffAlignAnchor,
  DiffAlignMode,
  DiffViewMode
} from "@imify/features/diffchecker/types"

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
  hasImage: boolean

  setViewMode: (mode: DiffViewMode) => void
  setAlgorithm: (algo: DiffAlgorithm) => void
  setAlignMode: (mode: DiffAlignMode) => void
  setAlignAnchor: (anchor: DiffAlignAnchor) => void
  setOverlayOpacity: (opacity: number) => void
  setSplitPosition: (position: number) => void
  setDiffThreshold: (threshold: number) => void
  setContainerHeight: (height: number) => void
  setHasImage: (hasImage: boolean) => void
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
      hasImage: false,

      setViewMode: (viewMode) => set({ viewMode }),
      setAlgorithm: (algorithm) => set({ algorithm }),
      setAlignMode: (alignMode) => set({ alignMode }),
      setAlignAnchor: (alignAnchor) => set({ alignAnchor }),
      setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
      setSplitPosition: (splitPosition) => set({ splitPosition }),
      setDiffThreshold: (diffThreshold) => set({ diffThreshold }),
      setContainerHeight: (containerHeight) => set({ containerHeight }),
      setHasImage: (hasImage) => set({ hasImage })
    }),
    {
      name: "imify_diffchecker",
      storage: createJSONStorage(() => deferredStorage),
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
