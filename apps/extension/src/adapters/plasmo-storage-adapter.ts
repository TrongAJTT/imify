import { Storage } from "@plasmohq/storage"
import type { StorageAdapter } from "@imify/core/storage-adapter"

const extensionLocalStorage = new Storage({ area: "local" })

export const plasmoStorageAdapter: StorageAdapter = {
  async getItem(name: string): Promise<string | null> {
    const value = await extensionLocalStorage.get<string>(name)
    return typeof value === "string" ? value : null
  },
  async setItem(name: string, value: string): Promise<void> {
    await extensionLocalStorage.set(name, value)
  },
  async removeItem(name: string): Promise<void> {
    await extensionLocalStorage.remove(name)
  }
}
