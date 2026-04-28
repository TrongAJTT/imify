import { create } from "zustand"
import type { FillingTemplate, ImageTransform } from "@imify/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@imify/features/filling/types"
import { buildFillRuntimeItems } from "@imify/features/filling/fill/runtime-items"

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
  groupRuntimeTransforms: Record<string, ImageTransform>
  setActiveCustomizationTab: (tab: FillCustomizationTab) => void
  initializeFillSession: (template: FillingTemplate) => void
  updateSessionTemplate: (updater: (template: FillingTemplate) => FillingTemplate) => void
  setGroupRuntimeTransform: (id: string, transform: ImageTransform) => void
  updateGroupRuntimeTransform: (id: string, partial: Partial<ImageTransform>) => void
  removeGroupRuntimeTransform: (id: string) => void
  hideLayerInFill: (layerId: string) => void
  resetFillSessionState: () => void
}

export const useFillUiStore = create<FillUiStoreState>()((set) => ({
  activeCustomizationTab: "image",
  hiddenLayerIds: [],
  sessionTemplate: null,
  groupRuntimeTransforms: {},
  setActiveCustomizationTab: (tab) => set({ activeCustomizationTab: tab }),
  initializeFillSession: (template) =>
    set(() => {
      const clonedTemplate = cloneFillingTemplate(template)
      const runtimeItems = buildFillRuntimeItems(clonedTemplate, new Set())
      const groupRuntimeTransforms = runtimeItems
        .filter((item) => item.kind === "group")
        .reduce<Record<string, ImageTransform>>((acc, item) => {
          acc[item.id] = { ...DEFAULT_IMAGE_TRANSFORM }
          return acc
        }, {})

      return {
        activeCustomizationTab: "image",
        hiddenLayerIds: [],
        sessionTemplate: clonedTemplate,
        groupRuntimeTransforms,
      }
    }),
  updateSessionTemplate: (updater) =>
    set((state) => {
      if (!state.sessionTemplate) return state
      return {
        sessionTemplate: updater(state.sessionTemplate),
      }
    }),
  setGroupRuntimeTransform: (id, transform) =>
    set((state) => ({
      groupRuntimeTransforms: {
        ...state.groupRuntimeTransforms,
        [id]: transform,
      },
    })),
  updateGroupRuntimeTransform: (id, partial) =>
    set((state) => {
      const current = state.groupRuntimeTransforms[id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
      return {
        groupRuntimeTransforms: {
          ...state.groupRuntimeTransforms,
          [id]: {
            ...current,
            ...partial,
          },
        },
      }
    }),
  removeGroupRuntimeTransform: (id) =>
    set((state) => {
      if (!state.groupRuntimeTransforms[id]) {
        return state
      }

      const next = { ...state.groupRuntimeTransforms }
      delete next[id]
      return { groupRuntimeTransforms: next }
    }),
  hideLayerInFill: (layerId) =>
    set((state) =>
      state.hiddenLayerIds.includes(layerId)
        ? state
        : { hiddenLayerIds: [...state.hiddenLayerIds, layerId] }
    ),
  resetFillSessionState: () =>
    set({ activeCustomizationTab: "image", hiddenLayerIds: [], sessionTemplate: null, groupRuntimeTransforms: {} }),
}))
