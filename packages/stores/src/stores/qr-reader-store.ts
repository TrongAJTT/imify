import { create } from "zustand"
import { persist } from "zustand/middleware"

interface QrReaderState {
  hasCamera: boolean | null
  lastScanResult: string | null

  setHasCamera: (has: boolean | null) => void
  setLastScanResult: (result: string | null) => void
  resetToDefault: () => void
}

export const useQrReaderStore = create<QrReaderState>()(
  persist(
    (set) => ({
      hasCamera: null,
      lastScanResult: null,

      setHasCamera: (hasCamera) => set({ hasCamera }),
      setLastScanResult: (lastScanResult) => set({ lastScanResult }),
      resetToDefault: () =>
        set({
          hasCamera: null,
          lastScanResult: null
        })
    }),
    {
      name: "imify-qr-reader-settings",
      partialize: (state) => {
        const { lastScanResult, hasCamera, ...rest } = state
        return rest
      }
    }
  )
)
