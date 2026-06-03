import { create } from "zustand"
import { persist } from "zustand/middleware"

interface QrReaderState {
  activeTab: "camera" | "import"
  hasCamera: boolean | null
  lastScanResult: string | null

  setActiveTab: (tab: "camera" | "import") => void
  setHasCamera: (has: boolean | null) => void
  setLastScanResult: (result: string | null) => void
  resetToDefault: () => void
}

export const useQrReaderStore = create<QrReaderState>()(
  persist(
    (set) => ({
      activeTab: "import",
      hasCamera: null,
      lastScanResult: null,

      setActiveTab: (activeTab) => set({ activeTab }),
      setHasCamera: (hasCamera) => set({ hasCamera }),
      setLastScanResult: (lastScanResult) => set({ lastScanResult }),
      resetToDefault: () =>
        set({
          activeTab: "import",
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
