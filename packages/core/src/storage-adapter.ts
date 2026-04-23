/**
 * Abstract interface for key-value storage used by Zustand persist middleware.
 * This allows stores to be platform-agnostic (working in both Extension and Web contexts).
 */
export interface StorageAdapter {
  getItem: (name: string) => Promise<string | null> | string | null
  setItem: (name: string, value: string) => Promise<void> | void
  removeItem: (name: string) => Promise<void> | void
}

let activeStorageAdapter: StorageAdapter | null = null

/**
 * Registers the global storage adapter to be used by all Zustand stores.
 * Must be called early in the application lifecycle before stores are initialized/hydrated.
 */
export function registerStorageAdapter(adapter: StorageAdapter): void {
  activeStorageAdapter = adapter
}

/**
 * Deferred storage object for Zustand persist middleware.
 * It delegates all calls to the globally registered `StorageAdapter`.
 */
export const deferredStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!activeStorageAdapter) {
      console.warn(`[StorageAdapter] No adapter registered. Cannot get item: ${name}`)
      return null
    }
    return activeStorageAdapter.getItem(name)
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!activeStorageAdapter) {
      console.warn(`[StorageAdapter] No adapter registered. Cannot set item: ${name}`)
      return
    }
    return activeStorageAdapter.setItem(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    if (!activeStorageAdapter) {
      console.warn(`[StorageAdapter] No adapter registered. Cannot remove item: ${name}`)
      return
    }
    return activeStorageAdapter.removeItem(name)
  }
}
