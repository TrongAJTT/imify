// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import { useCallback } from "react"
import { STORAGE_VERSION, type ContextMenuSettings, type ExtensionStorageState, type FormatConfig, type ImageFormat } from "@/core/types"
import { DEFAULT_STORAGE_STATE } from "@/features/settings"
import type { PersistedStorageState } from "@/options/shared"

type PersistedStateSetter = (
  value:
    | PersistedStorageState
    | ((current: PersistedStorageState | undefined) => PersistedStorageState)
) => Promise<void>

export function useContextMenuStateActions(setPersistedState: PersistedStateSetter) {
  const updateState = useCallback(async (
    updater: (current: ExtensionStorageState) => ExtensionStorageState
  ): Promise<void> => {
    let nextState: ExtensionStorageState | null = null

    await setPersistedState((current) => {
      const sourceState = current?.state && typeof current.state === "object"
        ? current.state
        : DEFAULT_STORAGE_STATE

      nextState = updater(sourceState)

      return {
        version: STORAGE_VERSION,
        state: nextState
      }
    })

    if (!nextState) {
      return
    }

    // Fire-and-forget: in some extension lifecycles `sendMessage()` may not resolve
    // if the background isn't ready to respond. Storage listeners still provide fallback.
    void chrome.runtime
      .sendMessage({
        type: "IMIFY_STATE_UPDATED",
        payload: nextState
      })
      .catch(() => {})
  }, [setPersistedState])

  const commitGlobalFormats = useCallback(async (
    configs: Record<ImageFormat, FormatConfig>,
    globalOrderIds: string[]
  ) => {
    await updateState((current) => ({
      ...current,
      global_formats: configs,
      context_menu: {
        ...current.context_menu,
        global_order_ids: globalOrderIds
      }
    }))
  }, [updateState])

  const commitCustomFormats = useCallback(async (customFormats: FormatConfig[]) => {
    await updateState((current) => ({
      ...current,
      custom_formats: customFormats
    }))
  }, [updateState])

  const commitContextMenuSettings = useCallback(async (
    settings: Partial<ContextMenuSettings>
  ) => {
    await updateState((current) => ({
      ...current,
      context_menu: {
        ...current.context_menu,
        ...settings
      }
    }))
  }, [updateState])

  return {
    commitGlobalFormats,
    commitCustomFormats,
    commitContextMenuSettings
  }
}
