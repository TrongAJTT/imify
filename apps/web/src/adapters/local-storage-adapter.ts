import type { StorageAdapter } from "@imify/core/storage-adapter"

export const localStorageAdapter: StorageAdapter = {
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
