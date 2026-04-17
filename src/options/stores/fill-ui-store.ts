import { create } from "zustand"
import type { FillingTemplate } from "@/features/filling/types"

export type FillCustomizationTab = "image" | "border" | "layer"

function cloneFillingTemplate(template: FillingTemplate): FillingTemplate {
  return {
    ...template,
    layers: template.layers.map((layer) => ({
      ...layer,
      points: layer.points.map((point) => ({ ...point })),
    })),
    groups: (template.groups ?? []).map((group) => ({
      ...group,
      layerIds: [...group.layerIds],
    })),
  }
}

interface FillUiStoreState {
  activeCustomizationTab: FillCustomizationTab
  hiddenLayerIds: string[]
  sessionTemplate: FillingTemplate | null
  setActiveCustomizationTab: (tab: FillCustomizationTab) => void
  initializeFillSession: (template: FillingTemplate) => void
  updateSessionTemplate: (updater: (template: FillingTemplate) => FillingTemplate) => void
  hideLayerInFill: (layerId: string) => void
  resetFillSessionState: () => void
}

export const useFillUiStore = create<FillUiStoreState>()((set) => ({
  activeCustomizationTab: "image",
  hiddenLayerIds: [],
  sessionTemplate: null,
  setActiveCustomizationTab: (tab) => set({ activeCustomizationTab: tab }),
  initializeFillSession: (template) =>
    set({
      activeCustomizationTab: "image",
      hiddenLayerIds: [],
      sessionTemplate: cloneFillingTemplate(template),
    }),
  updateSessionTemplate: (updater) =>
    set((state) => {
      if (!state.sessionTemplate) return state
      return {
        sessionTemplate: updater(state.sessionTemplate),
      }
    }),
  hideLayerInFill: (layerId) =>
    set((state) =>
      state.hiddenLayerIds.includes(layerId)
        ? state
        : { hiddenLayerIds: [...state.hiddenLayerIds, layerId] }
    ),
  resetFillSessionState: () =>
    set({ activeCustomizationTab: "image", hiddenLayerIds: [], sessionTemplate: null }),
}))
