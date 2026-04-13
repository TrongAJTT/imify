import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"
import type {
  ColorBlindMode,
  ColorDisplayFormat,
  PreviewChannelMode
} from "@/features/inspector/types"

type ExifSortMode = "group" | "name" | "tag"

interface InspectorState {
  colorFormat: ColorDisplayFormat
  exifSortMode: ExifSortMode
  exifFilter: string
  showSensitiveOnly: boolean
  paletteCount: number
  previewChannelMode: PreviewChannelMode
  colorBlindMode: ColorBlindMode
  loupeEnabled: boolean
  loupeZoom: number
  visualAnalysisDialogOpen: boolean

  setColorFormat: (format: ColorDisplayFormat) => void
  setExifSortMode: (mode: ExifSortMode) => void
  setExifFilter: (filter: string) => void
  setShowSensitiveOnly: (show: boolean) => void
  setPaletteCount: (count: number) => void
  setPreviewChannelMode: (mode: PreviewChannelMode) => void
  setColorBlindMode: (mode: ColorBlindMode) => void
  setLoupeEnabled: (enabled: boolean) => void
  setLoupeZoom: (zoom: number) => void
  setVisualAnalysisDialogOpen: (open: boolean) => void
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
      previewChannelMode: "all",
      colorBlindMode: "none",
      loupeEnabled: true,
      loupeZoom: 8,
      visualAnalysisDialogOpen: false,

      setColorFormat: (colorFormat) => set({ colorFormat }),
      setExifSortMode: (exifSortMode) => set({ exifSortMode }),
      setExifFilter: (exifFilter) => set({ exifFilter }),
      setShowSensitiveOnly: (showSensitiveOnly) => set({ showSensitiveOnly }),
      setPaletteCount: (paletteCount) => set({ paletteCount }),
      setPreviewChannelMode: (previewChannelMode) => set({ previewChannelMode }),
      setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
      setLoupeEnabled: (loupeEnabled) => set({ loupeEnabled }),
      setLoupeZoom: (loupeZoom) => set({ loupeZoom: Math.max(2, Math.min(12, Math.round(loupeZoom))) }),
      setVisualAnalysisDialogOpen: (visualAnalysisDialogOpen) => set({ visualAnalysisDialogOpen })
    }),
    {
      name: "imify_inspector",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        colorFormat: state.colorFormat,
        exifSortMode: state.exifSortMode,
        showSensitiveOnly: state.showSensitiveOnly,
        paletteCount: state.paletteCount,
        previewChannelMode: state.previewChannelMode,
        colorBlindMode: state.colorBlindMode,
        loupeEnabled: state.loupeEnabled,
        loupeZoom: state.loupeZoom
      })
    }
  )
)
