import { create } from "zustand"
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

  setViewMode: (mode: DiffViewMode) => void
  setAlgorithm: (algo: DiffAlgorithm) => void
  setAlignMode: (mode: DiffAlignMode) => void
  setAlignAnchor: (anchor: DiffAlignAnchor) => void
  setOverlayOpacity: (opacity: number) => void
  setSplitPosition: (position: number) => void
  setDiffThreshold: (threshold: number) => void
}

export const useDiffcheckerStore = create<DiffcheckerState>((set) => ({
  viewMode: "split",
  algorithm: "heatmap",
  alignMode: "fit-larger",
  alignAnchor: "center",
  overlayOpacity: 50,
  splitPosition: 50,
  diffThreshold: 0,

  setViewMode: (viewMode) => set({ viewMode }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setAlignMode: (alignMode) => set({ alignMode }),
  setAlignAnchor: (alignAnchor) => set({ alignAnchor }),
  setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
  setSplitPosition: (splitPosition) => set({ splitPosition }),
  setDiffThreshold: (diffThreshold) => set({ diffThreshold })
}))
