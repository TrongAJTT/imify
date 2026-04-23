/**
 * @deprecated Use `dev-mode-store.ts` directly.
 * This shim re-exports the cross-platform Zustand-based implementation so
 * all existing import paths continue to resolve during the Phase 0 migration.
 * Will be removed when the monorepo restructure reaches Phase 2.
 */
export {
  DEV_MODE_STORAGE_KEY,
  getDevModeEnabled,
  setDevModeEnabled,
  useDevModeEnabled,
} from "./dev-mode-store"
