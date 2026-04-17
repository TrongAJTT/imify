import { create } from "zustand"

export type FillCustomizationTab = "image" | "border" | "layer"

interface FillUiStoreState {
  activeCustomizationTab: FillCustomizationTab
  hiddenLayerIds: string[]
  setActiveCustomizationTab: (tab: FillCustomizationTab) => void
  hideLayerInFill: (layerId: string) => void
  resetFillSessionState: () => void
}

export const useFillUiStore = create<FillUiStoreState>()((set) => ({
  activeCustomizationTab: "image",
  hiddenLayerIds: [],
  setActiveCustomizationTab: (tab) => set({ activeCustomizationTab: tab }),
  hideLayerInFill: (layerId) =>
    set((state) =>
      state.hiddenLayerIds.includes(layerId)
        ? state
        : { hiddenLayerIds: [...state.hiddenLayerIds, layerId] }
    ),
  resetFillSessionState: () => set({ activeCustomizationTab: "image", hiddenLayerIds: [] }),
}))
