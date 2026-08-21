import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import { getInitialCanvasHeightPx } from "@imify/core"
import type {
  DiffAlgorithm,
  DiffAlignAnchor,
  DiffAlignMode,
  DiffViewMode,
  MultiImageLayout2,
  MultiImageLayout3,
  MultiImageLayout4
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
  imageCount: number
  multiImageLayout2: MultiImageLayout2
  multiImageLayout3: MultiImageLayout3
  multiImageLayout4: MultiImageLayout4

  setViewMode: (mode: DiffViewMode) => void
  setAlgorithm: (algo: DiffAlgorithm) => void
  setAlignMode: (mode: DiffAlignMode) => void
  setAlignAnchor: (anchor: DiffAlignAnchor) => void
  setOverlayOpacity: (opacity: number) => void
  setSplitPosition: (position: number) => void
  setDiffThreshold: (threshold: number) => void
  setContainerHeight: (height: number) => void
  setHasImage: (hasImage: boolean) => void
  setImageCount: (count: number) => void
  setMultiImageLayout2: (layout: MultiImageLayout2) => void
  setMultiImageLayout3: (layout: MultiImageLayout3) => void
  setMultiImageLayout4: (layout: MultiImageLayout4) => void
}

const DEFAULT_CONTAINER_HEIGHT = getInitialCanvasHeightPx(384)

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
      imageCount: 0,
      multiImageLayout2: "2_cols",
      multiImageLayout3: "3_cols",
      multiImageLayout4: "2x2_grid",

      setViewMode: (viewMode) => set({ viewMode }),
      setAlgorithm: (algorithm) => set({ algorithm }),
      setAlignMode: (alignMode) => set({ alignMode }),
      setAlignAnchor: (alignAnchor) => set({ alignAnchor }),
      setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
      setSplitPosition: (splitPosition) => set({ splitPosition }),
      setDiffThreshold: (diffThreshold) => set({ diffThreshold }),
      setContainerHeight: (containerHeight) => set({ containerHeight }),
      setHasImage: (hasImage) => set({ hasImage }),
      setImageCount: (imageCount) => set({ imageCount }),
      setMultiImageLayout2: (multiImageLayout2) => set({ multiImageLayout2 }),
      setMultiImageLayout3: (multiImageLayout3) => set({ multiImageLayout3 }),
      setMultiImageLayout4: (multiImageLayout4) => set({ multiImageLayout4 }),
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
        multiImageLayout2: state.multiImageLayout2,
        multiImageLayout3: state.multiImageLayout3,
        multiImageLayout4: state.multiImageLayout4,
      })
    }
  )
)
