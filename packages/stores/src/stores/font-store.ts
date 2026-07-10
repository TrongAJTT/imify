import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import { fontStorage, type FontStorageEntry } from "@imify/core/indexed-db"

export interface FontMeta {
  id: string
  name: string
  source: "google" | "custom"
  weight: number
  fileSize: number
  addedAt: number
}

interface FontStoreState {
  installedFonts: FontMeta[]
  isLoadingFonts: boolean
  addFont: (entry: FontStorageEntry) => Promise<void>
  removeFont: (id: string) => Promise<void>
  loadInstalledFonts: () => Promise<void>
  resetToDefault: () => Promise<void>
}

const loadedFontFaces = new Map<string, FontFace>()

function loadFontIntoDocument(id: string, name: string, data: ArrayBuffer) {
  if (typeof window === "undefined" || !("fonts" in document)) {
    return
  }
  try {
    unloadFontFromDocument(id)
    const blob = new Blob([data], { type: "font/woff2" })
    const url = URL.createObjectURL(blob)
    const fontFace = new FontFace(name, `url(${url})`)
    fontFace.load().then((loadedFace) => {
      document.fonts.add(loadedFace)
      loadedFontFaces.set(id, loadedFace)
    }).catch((err) => {
      console.error(`Failed to load font face ${name}:`, err)
    })
  } catch (error) {
    console.error(`Failed to create font face ${name}:`, error)
  }
}

function unloadFontFromDocument(id: string) {
  if (typeof window === "undefined" || !("fonts" in document)) {
    return
  }
  const fontFace = loadedFontFaces.get(id)
  if (fontFace) {
    document.fonts.delete(fontFace)
    loadedFontFaces.delete(id)
  }
}

export const useFontStore = create<FontStoreState>()(
  persist(
    (set, get) => ({
      installedFonts: [],
      isLoadingFonts: false,

      addFont: async (entry) => {
        try {
          await fontStorage.save(entry)
          loadFontIntoDocument(entry.id, entry.name, entry.data)
          
          set((state) => {
            const meta: FontMeta = {
              id: entry.id,
              name: entry.name,
              source: entry.source,
              weight: entry.weight,
              fileSize: entry.fileSize,
              addedAt: entry.addedAt
            }
            const filtered = state.installedFonts.filter((f) => f.id !== meta.id)
            return { installedFonts: [...filtered, meta] }
          })
        } catch (error) {
          console.error("Failed to add font:", error)
          throw error
        }
      },

      removeFont: async (id) => {
        try {
          await fontStorage.remove(id)
          unloadFontFromDocument(id)
          
          set((state) => ({
            installedFonts: state.installedFonts.filter((f) => f.id !== id)
          }))
        } catch (error) {
          console.error("Failed to remove font:", error)
          throw error
        }
      },

      loadInstalledFonts: async () => {
        set({ isLoadingFonts: true })
        try {
          const fonts = await fontStorage.getAll()
          
          // Load all fonts into browser document.fonts
          for (const f of fonts) {
            loadFontIntoDocument(f.id, f.name, f.data)
          }
          
          const installedFonts: FontMeta[] = fonts.map((f) => ({
            id: f.id,
            name: f.name,
            source: f.source,
            weight: f.weight,
            fileSize: f.fileSize,
            addedAt: f.addedAt
          }))
          
          set({ installedFonts, isLoadingFonts: false })
        } catch (error) {
          console.error("Failed to load installed fonts from IndexedDB:", error)
          set({ installedFonts: [], isLoadingFonts: false })
        }
      },

      resetToDefault: async () => {
        set({ isLoadingFonts: true })
        try {
          const fonts = await fontStorage.getAll()
          for (const f of fonts) {
            unloadFontFromDocument(f.id)
          }
          await fontStorage.clear()
          set({ installedFonts: [], isLoadingFonts: false })
        } catch (error) {
          console.error("Failed to clear fonts from IndexedDB:", error)
          set({ isLoadingFonts: false })
        }
      }
    }),
    {
      name: "imify-font-store",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => ({
        installedFonts: state.installedFonts
      })
    }
  )
)
