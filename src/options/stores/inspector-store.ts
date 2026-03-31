import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"
import type { ColorDisplayFormat } from "@/features/inspector/types"

type ExifSortMode = "group" | "name" | "tag"

interface InspectorState {
  colorFormat: ColorDisplayFormat
  exifSortMode: ExifSortMode
  exifFilter: string
  showSensitiveOnly: boolean
  paletteCount: number

  setColorFormat: (format: ColorDisplayFormat) => void
  setExifSortMode: (mode: ExifSortMode) => void
  setExifFilter: (filter: string) => void
  setShowSensitiveOnly: (show: boolean) => void
  setPaletteCount: (count: number) => void
}

const storage = new Storage({ area: "local" })

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

export const useInspectorStore = create<InspectorState>()(
  persist(
    (set) => ({
      colorFormat: "hex",
      exifSortMode: "group",
      exifFilter: "",
      showSensitiveOnly: false,
      paletteCount: 8,

      setColorFormat: (colorFormat) => set({ colorFormat }),
      setExifSortMode: (exifSortMode) => set({ exifSortMode }),
      setExifFilter: (exifFilter) => set({ exifFilter }),
      setShowSensitiveOnly: (showSensitiveOnly) => set({ showSensitiveOnly }),
      setPaletteCount: (paletteCount) => set({ paletteCount })
    }),
    {
      name: "imify_inspector",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        colorFormat: state.colorFormat,
        exifSortMode: state.exifSortMode,
        showSensitiveOnly: state.showSensitiveOnly,
        paletteCount: state.paletteCount
      })
    }
  )
)
