import { createStorageStateAccessors, STORAGE_KEY } from "@imify/features/settings/storage"

// PLATFORM:extension — chrome.storage.sync implementation for shared storage accessors.
export const {
  ensureStorageState,
  getStorageState,
  onStorageStateChanged,
  patchStorageState,
  setStorageState
} = createStorageStateAccessors({
  read: async () => {
    const result = await chrome.storage.sync.get(STORAGE_KEY)
    return result[STORAGE_KEY]
  },
  write: async (rawValue: string) => {
    await chrome.storage.sync.set({
      [STORAGE_KEY]: rawValue
    })
  },
  subscribe: (listener) => {
    const handler: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      areaName
    ) => {
      if (areaName !== "sync") return
      const change = changes[STORAGE_KEY]
      if (!change) return
      listener(change.newValue)
    }

    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }
})
