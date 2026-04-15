import { Storage } from "@plasmohq/storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { BatchWatermarkConfig } from "@/options/components/batch/types"
import { DEFAULT_BATCH_WATERMARK } from "@/options/components/batch/watermark"
import {
  cloneWatermarkConfig,
  findMatchingSavedWatermarkId,
  sanitizeWatermarkForStorage
} from "@/options/components/batch/watermark-config"
import { watermarkStorage } from "@/core/indexed-db"

export type WatermarkContext = "single" | "batch"

export interface SavedWatermarkItem {
  id: string
  name: string
  config: BatchWatermarkConfig
  createdAt: number
  updatedAt: number
}

interface WatermarkStoreState {
  contextWatermarks: Record<WatermarkContext, BatchWatermarkConfig>
  contextSavedIds: Partial<Record<WatermarkContext, string>>
  savedWatermarks: SavedWatermarkItem[]
  setContextWatermark: (context: WatermarkContext, config: BatchWatermarkConfig) => void
  resetContextWatermark: (context: WatermarkContext) => void
  saveNewWatermark: (name: string, config: BatchWatermarkConfig) => string
  overwriteSavedWatermark: (savedId: string, name: string, config: BatchWatermarkConfig) => string | null
  deleteSavedWatermark: (savedId: string) => void
}

const storage = new Storage({
  area: "local"
})

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

function createDefaultContextWatermarks(): Record<WatermarkContext, BatchWatermarkConfig> {
  return {
    single: cloneWatermarkConfig(DEFAULT_BATCH_WATERMARK),
    batch: cloneWatermarkConfig(DEFAULT_BATCH_WATERMARK)
  }
}

function toNormalizedSavedWatermark(entry: SavedWatermarkItem): SavedWatermarkItem {
  return {
    ...entry,
    name: entry.name.trim() || "Untitled watermark",
    config: sanitizeWatermarkForStorage(entry.config)
  }
}

function buildContextSavedIds(
  contextWatermarks: Record<WatermarkContext, BatchWatermarkConfig>,
  savedWatermarks: SavedWatermarkItem[]
): Partial<Record<WatermarkContext, string>> {
  const singleSavedId = findMatchingSavedWatermarkId(savedWatermarks, contextWatermarks.single)
  const batchSavedId = findMatchingSavedWatermarkId(savedWatermarks, contextWatermarks.batch)

  return {
    ...(singleSavedId ? { single: singleSavedId } : {}),
    ...(batchSavedId ? { batch: batchSavedId } : {})
  }
}

function collectReferencedLogoIds(
  savedWatermarks: SavedWatermarkItem[],
  contextWatermarks: Record<WatermarkContext, BatchWatermarkConfig>
): Set<string> {
  const referencedLogoIds = new Set<string>()

  for (const watermark of savedWatermarks) {
    if (watermark.config.logoBlobId) {
      referencedLogoIds.add(watermark.config.logoBlobId)
    }
  }

  for (const context of ["single", "batch"] as WatermarkContext[]) {
    const logoId = contextWatermarks[context].logoBlobId
    if (logoId) {
      referencedLogoIds.add(logoId)
    }
  }

  return referencedLogoIds
}

function cleanupLogoIfUnused(
  previousLogoId: string | undefined,
  savedWatermarks: SavedWatermarkItem[],
  contextWatermarks: Record<WatermarkContext, BatchWatermarkConfig>
) {
  if (!previousLogoId) {
    return
  }

  const referencedLogoIds = collectReferencedLogoIds(savedWatermarks, contextWatermarks)
  if (!referencedLogoIds.has(previousLogoId)) {
    void watermarkStorage.remove(previousLogoId)
  }
}

export const useWatermarkStore = create<WatermarkStoreState>()(
  persist(
    (set) => ({
      contextWatermarks: createDefaultContextWatermarks(),
      contextSavedIds: {},
      savedWatermarks: [],
      setContextWatermark: (context, config) =>
        set((state) => {
          const previousConfig = state.contextWatermarks[context]
          const nextContextWatermarks = {
            ...state.contextWatermarks,
            [context]: cloneWatermarkConfig(config)
          }

          cleanupLogoIfUnused(previousConfig.logoBlobId, state.savedWatermarks, nextContextWatermarks)

          return {
            contextWatermarks: nextContextWatermarks,
            contextSavedIds: buildContextSavedIds(nextContextWatermarks, state.savedWatermarks)
          }
        }),
      resetContextWatermark: (context) =>
        set((state) => {
          const previousConfig = state.contextWatermarks[context]
          const nextContextWatermarks = {
            ...state.contextWatermarks,
            [context]: cloneWatermarkConfig(DEFAULT_BATCH_WATERMARK)
          }

          cleanupLogoIfUnused(previousConfig.logoBlobId, state.savedWatermarks, nextContextWatermarks)

          return {
            contextWatermarks: nextContextWatermarks,
            contextSavedIds: buildContextSavedIds(nextContextWatermarks, state.savedWatermarks)
          }
        }),
      saveNewWatermark: (name, config) => {
        const timestamp = Date.now()
        const savedId = `watermark_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

        set((state) => {
          const nextSavedWatermarks = [
            {
              id: savedId,
              name: name.trim(),
              config: sanitizeWatermarkForStorage(config),
              createdAt: timestamp,
              updatedAt: timestamp
            },
            ...state.savedWatermarks
          ]

          return {
            savedWatermarks: nextSavedWatermarks,
            contextSavedIds: buildContextSavedIds(state.contextWatermarks, nextSavedWatermarks)
          }
        })

        return savedId
      },
      overwriteSavedWatermark: (savedId, name, config) => {
        let didOverwrite = false
        let previousLogoId: string | undefined

        set((state) => {
          const existingWatermark = state.savedWatermarks.find((entry) => entry.id === savedId)
          if (!existingWatermark) {
            return state
          }

          didOverwrite = true
          previousLogoId = existingWatermark.config.logoBlobId

          const nextSavedWatermarks = state.savedWatermarks.map((entry) =>
            entry.id === savedId
              ? {
                  ...entry,
                  name: name.trim(),
                  config: sanitizeWatermarkForStorage(config),
                  updatedAt: Date.now()
                }
              : entry
          )

          cleanupLogoIfUnused(previousLogoId, nextSavedWatermarks, state.contextWatermarks)

          return {
            savedWatermarks: nextSavedWatermarks,
            contextSavedIds: buildContextSavedIds(state.contextWatermarks, nextSavedWatermarks)
          }
        })

        return didOverwrite ? savedId : null
      },
      deleteSavedWatermark: (savedId) =>
        set((state) => {
          const existingWatermark = state.savedWatermarks.find((entry) => entry.id === savedId)
          if (!existingWatermark) {
            return state
          }

          const nextSavedWatermarks = state.savedWatermarks.filter((entry) => entry.id !== savedId)

          cleanupLogoIfUnused(existingWatermark.config.logoBlobId, nextSavedWatermarks, state.contextWatermarks)

          return {
            savedWatermarks: nextSavedWatermarks,
            contextSavedIds: buildContextSavedIds(state.contextWatermarks, nextSavedWatermarks)
          }
        })
    }),
    {
      name: "imify-watermark-library",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        savedWatermarks: state.savedWatermarks.map(toNormalizedSavedWatermark)
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<WatermarkStoreState> | undefined
        const hydratedSavedWatermarks = Array.isArray(persisted?.savedWatermarks)
          ? persisted.savedWatermarks.map(toNormalizedSavedWatermark)
          : []

        const defaultContextWatermarks = createDefaultContextWatermarks()

        return {
          ...currentState,
          contextWatermarks: defaultContextWatermarks,
          savedWatermarks: hydratedSavedWatermarks,
          contextSavedIds: buildContextSavedIds(defaultContextWatermarks, hydratedSavedWatermarks)
        }
      }
    }
  )
)
