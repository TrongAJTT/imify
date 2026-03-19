import { ensureStorageState } from "../features/settings"

void ensureStorageState().catch((error) => {
  console.error("[imify] Failed to initialize storage state", error)
})
