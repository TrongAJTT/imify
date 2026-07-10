import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import { persistLanguage, resolveInitialLanguage } from "@imify/i18n"
import i18n from "i18next"

interface I18nState {
  language: string
  setLanguage: (lang: string) => void
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: resolveInitialLanguage(),
      setLanguage: (lang) => {
        persistLanguage(lang)
        i18n.changeLanguage(lang)
        set({ language: lang })
      }
    }),
    {
      name: "imify_language",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => ({
        language: state.language
      })
    }
  )
)
