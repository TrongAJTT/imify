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

const defaultLocalStorageAdapter: StorageAdapter = {
  getItem(name: string): string | null {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(name)
  },
  setItem(name: string, value: string): void {
    if (typeof window === "undefined") return
    window.localStorage.setItem(name, value)
  },
  removeItem(name: string): void {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(name)
  }
}

function getActiveAdapter(): StorageAdapter | null {
  if (activeStorageAdapter) {
    return activeStorageAdapter
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return defaultLocalStorageAdapter
  }
  return null
}

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
    const adapter = getActiveAdapter()
    if (!adapter) {
      // console.warn(`[StorageAdapter] No adapter registered. Cannot get item: ${name}`)
      return null
    }
    return adapter.getItem(name)
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const adapter = getActiveAdapter()
    if (!adapter) {
      // console.warn(`[StorageAdapter] No adapter registered. Cannot set item: ${name}`)
      return
    }
    return adapter.setItem(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    const adapter = getActiveAdapter()
    if (!adapter) {
      // console.warn(`[StorageAdapter] No adapter registered. Cannot remove item: ${name}`)
      return
    }
    return adapter.removeItem(name)
  }
}
