export { initI18n, ALL_NAMESPACES } from "./i18n-instance"
export { resolveInitialLanguage } from "./language-resolution"
export {
  persistLanguage,
  loadPersistedLanguage,
  clearPersistedLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage
} from "./language-storage"
export {
  devModePostProcessor,
  setShowI18nDebugKeys,
  getShowI18nDebugKeys
} from "./dev-mode-processor"
export {
  calculateCompletionRate,
  calculateOverallCompletionRate,
  calculateCompletionDetails,
  calculateOverallCompletionDetails,
  type CompletionDetails
} from "./completion-calculator"
export {
  importLanguageAtRuntime,
  generateEmptyLanguageTemplate,
  getRuntimeLanguages,
  type LanguageMeta
} from "./runtime-import"
export {
  getAvailableLanguages,
  type LanguageInfo
} from "./language-info"

// Re-export key components/hooks from react-i18next so callers don't have to import it separately
export {
  useTranslation,
  Trans,
  Translation,
  withTranslation,
  I18nextProvider
} from "react-i18next"
