import { buildBatchContextUIPatch, type BatchContextStoreBase } from "./context-helpers"

export interface BatchUISliceState extends BatchContextStoreBase {
  isRunning: boolean
  skipDownloadConfirm: boolean
  skipOomWarning: boolean
  /** If true, do not show Image Splicing “high preview quality” warning */
  skipSplicingHeavyPreviewQualityWarning: boolean
  /** Accordion open/close state for Export Format & Quality - per context */
  isTargetFormatQualityOpen: boolean
  /** Accordion open/close state for Resize - per context */
  isResizeOpen: boolean
}

export interface BatchUISliceActions {
  setIsRunning: (value: boolean) => void
  setSkipDownloadConfirm: (value: boolean) => void
  setSkipOomWarning: (value: boolean) => void
  setSkipSplicingHeavyPreviewQualityWarning: (value: boolean) => void
  setIsTargetFormatQualityOpen: (value: boolean) => void
  setIsResizeOpen: (value: boolean) => void
}

export type BatchUISlice = BatchUISliceState & BatchUISliceActions

export function createBatchUISlice<TState extends BatchUISlice>(
  set: (fn: (state: TState) => Partial<TState> | TState) => void
): BatchUISliceActions {
  return {
    setIsRunning: (value) => set(() => ({ isRunning: value } as unknown as Partial<TState>)),
    setSkipDownloadConfirm: (value) => set(() => ({ skipDownloadConfirm: value } as unknown as Partial<TState>)),
    setSkipOomWarning: (value) => set(() => ({ skipOomWarning: value } as unknown as Partial<TState>)),
    setSkipSplicingHeavyPreviewQualityWarning: (value) =>
      set(() => ({ skipSplicingHeavyPreviewQualityWarning: value } as unknown as Partial<TState>)),
    setIsTargetFormatQualityOpen: (value) =>
      set((state) => buildBatchContextUIPatch(state, { isTargetFormatQualityOpen: value })),
    setIsResizeOpen: (value) =>
      set((state) => buildBatchContextUIPatch(state, { isResizeOpen: value })),
  }
}
