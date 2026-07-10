import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface QrHistoryItem {
  id: string
  raw: string
  timestamp: number
}

interface QrReaderState {
  hasCamera: boolean | null
  lastScanResult: string | null
  savedHistory: QrHistoryItem[]

  setHasCamera: (has: boolean | null) => void
  setLastScanResult: (result: string | null) => void
  saveToHistory: (raw: string) => void
  deleteFromHistory: (id: string) => void
  clearHistory: () => void
  clearHistoryOlderThan: (days: number) => void
  resetToDefault: () => void
}

export const useQrReaderStore = create<QrReaderState>()(
  persist(
    (set) => ({
      hasCamera: null,
      lastScanResult: null,
      savedHistory: [],

      setHasCamera: (hasCamera) => set({ hasCamera }),
      setLastScanResult: (lastScanResult) => set({ lastScanResult }),
      saveToHistory: (raw) =>
        set((state) => {
          const newItem: QrHistoryItem = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            raw,
            timestamp: Date.now(),
          }
          return { savedHistory: [newItem, ...state.savedHistory] }
        }),
      deleteFromHistory: (id) =>
        set((state) => ({
          savedHistory: state.savedHistory.filter((item) => item.id !== id),
        })),
      clearHistory: () => set({ savedHistory: [] }),
      clearHistoryOlderThan: (days) =>
        set((state) => {
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
          return {
            savedHistory: state.savedHistory.filter((item) => item.timestamp >= cutoff),
          }
        }),
      resetToDefault: () =>
        set({
          hasCamera: null,
          lastScanResult: null,
          savedHistory: [],
        }),
    }),
    {
      name: "imify-qr-reader-settings",
      partialize: (state) => {
        return {
          savedHistory: state.savedHistory,
        }
      },
    }
  )
)
