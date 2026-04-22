import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export const DEV_MODE_STORAGE_KEY = "imify_dev_mode_enabled"

const localStorage = new Storage({ area: "local" })

export async function getDevModeEnabled(): Promise<boolean> {
  const value = await localStorage.get<boolean>(DEV_MODE_STORAGE_KEY)
  return value === true
}

export async function setDevModeEnabled(value: boolean): Promise<void> {
  await localStorage.set(DEV_MODE_STORAGE_KEY, value)
}

export function useDevModeEnabled(): [boolean, (value: boolean) => Promise<void>] {
  const [enabled, setEnabled] = useStorage<boolean>(
    { key: DEV_MODE_STORAGE_KEY, instance: localStorage },
    false
  )

  const safeEnabled = enabled === true

  return [safeEnabled, setEnabled]
}
