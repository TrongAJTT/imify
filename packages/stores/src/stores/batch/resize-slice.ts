import type { ResizeQuickStats } from "@imify/core/resize-quick-stats"
import type { PaperSize, ResizeApplyTo, ResizeResamplingAlgorithm, SupportedDPI } from "@imify/core/types"
import type {
  BatchResizeAnchor,
  BatchResizeAspectMode,
  BatchResizeFitMode,
  BatchResizeMode,
  SetupContext,
} from "../batch-types"
import {
  createDefaultContextConfigs,
  createDefaultSourceState,
  toAspectRatioLabel,
} from "../batch-normalizer"
import { buildBatchContextFieldPatch, type BatchContextStoreBase } from "./context-helpers"

export interface ResizeSliceState extends BatchContextStoreBase {
  resizeMode: BatchResizeMode
  resizeValue: number
  resizeApplyTo: ResizeApplyTo
  resizeWidth: number
  resizeHeight: number
  resizeAspectMode: BatchResizeAspectMode
  resizeAspectRatio: string
  resizeAnchor: BatchResizeAnchor
  resizeFitMode: BatchResizeFitMode
  resizeContainBackground: string
  resizeResamplingAlgorithm: ResizeResamplingAlgorithm
  resizeSourceWidth: number
  resizeSourceHeight: number
  resizeSyncVersion: number
  resizeQuickStats: ResizeQuickStats
  paperSize: PaperSize
  dpi: SupportedDPI
  sourceStateByContext: Record<SetupContext, { width: number; height: number; syncVersion: number }>
}

export interface ResizeSliceActions {
  setResizeMode: (value: BatchResizeMode) => void
  setResizeValue: (value: number) => void
  setResizeApplyTo: (value: ResizeApplyTo) => void
  setResizeWidth: (value: number) => void
  setResizeHeight: (value: number) => void
  setResizeAspectMode: (value: BatchResizeAspectMode) => void
  setResizeAspectRatio: (value: string) => void
  setResizeAnchor: (value: BatchResizeAnchor) => void
  setResizeFitMode: (value: BatchResizeFitMode) => void
  setResizeContainBackground: (value: string) => void
  setResizeResamplingAlgorithm: (value: ResizeResamplingAlgorithm) => void
  syncResizeToSource: (width: number, height: number) => void
  setResizeQuickStats: (value: ResizeQuickStats) => void
  setPaperSize: (value: PaperSize) => void
  setDpi: (value: SupportedDPI) => void
}

export type ResizeSlice = ResizeSliceState & ResizeSliceActions

export function createResizeSlice<TState extends ResizeSlice>(
  set: (fn: (state: TState) => Partial<TState> | TState) => void
): ResizeSliceActions {
  return {
    setResizeMode: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeMode", value)),
    setResizeValue: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeValue", value)),
    setResizeApplyTo: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeApplyTo", value)),
    setResizeWidth: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeWidth", value)),
    setResizeHeight: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeHeight", value)),
    setResizeAspectMode: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeAspectMode", value)),
    setResizeAspectRatio: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeAspectRatio", value)),
    setResizeAnchor: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeAnchor", value)),
    setResizeFitMode: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeFitMode", value)),
    setResizeContainBackground: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeContainBackground", value)),
    setResizeResamplingAlgorithm: (value) => set((state) => buildBatchContextFieldPatch(state, "resizeResamplingAlgorithm", value)),
    syncResizeToSource: (width, height) =>
      set((state) => {
        const setupContext = state.setupContext
        const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
        const sourceStateByContext = (state as any).sourceStateByContext ?? createDefaultSourceState()
        const nextWidth = Math.max(1, Math.round(width))
        const nextHeight = Math.max(1, Math.round(height))
        const nextSyncVersion = (sourceStateByContext[setupContext]?.syncVersion ?? 0) + 1
        const nextConfig = {
          ...contextConfigs[setupContext],
          resizeWidth: nextWidth,
          resizeHeight: nextHeight,
          resizeAspectMode: "original" as const,
          resizeAspectRatio: toAspectRatioLabel(nextWidth, nextHeight),
          resizeAnchor: "width" as const
        }

        return {
          resizeSourceWidth: nextWidth,
          resizeSourceHeight: nextHeight,
          resizeWidth: nextWidth,
          resizeHeight: nextHeight,
          resizeAspectMode: "original",
          resizeAspectRatio: toAspectRatioLabel(nextWidth, nextHeight),
          resizeAnchor: "width",
          resizeSyncVersion: nextSyncVersion,
          contextConfigs: {
            ...contextConfigs,
            [setupContext]: nextConfig
          },
          sourceStateByContext: {
            ...sourceStateByContext,
            [setupContext]: {
              width: nextWidth,
              height: nextHeight,
              syncVersion: nextSyncVersion
            }
          }
        } as unknown as Partial<TState>
      }),
    setResizeQuickStats: (value) => set(() => ({ resizeQuickStats: value } as Partial<TState>)),
    setPaperSize: (value) => set((state) => buildBatchContextFieldPatch(state, "paperSize", value)),
    setDpi: (value) => set((state) => buildBatchContextFieldPatch(state, "dpi", value)),
  }
}
