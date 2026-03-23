import { getOrderedContextMenuConfigs } from "@/core/context-menu-order"
import type { ExtensionStorageState } from "@/core/types"

export const MENU_ROOT_ID = "imify_convert_root"
export const MENU_ITEM_PREFIX = "imify_format_"

let pendingRebuildState: ExtensionStorageState | null = null
let rebuildQueue: Promise<void> = Promise.resolve()

function toMenuItemId(formatConfigId: string): string {
  return `${MENU_ITEM_PREFIX}${formatConfigId}`
}

function removeAllContextMenus(): Promise<void> {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      const error = chrome.runtime.lastError
      if (error) {
        console.warn("[imify] contextMenus.removeAll warning:", error.message)
      }

      resolve()
    })
  })
}

function createContextMenuItem(options: chrome.contextMenus.CreateProperties): Promise<void> {
  return new Promise((resolve) => {
    chrome.contextMenus.create(options, () => {
      const error = chrome.runtime.lastError
      if (error && !/duplicate id/i.test(error.message)) {
        console.error("[imify] contextMenus.create failed:", error.message, options.id)
      }

      resolve()
    })
  })
}

async function rebuildContextMenuNow(state: ExtensionStorageState): Promise<void> {
  await removeAllContextMenus()

  const enabledConfigs = getOrderedContextMenuConfigs(state)

  if (enabledConfigs.length === 0) {
    return
  }

  await createContextMenuItem({
    id: MENU_ROOT_ID,
    title: "Save and Convert with Imify",
    contexts: ["image"]
  })

  for (const config of enabledConfigs) {
    await createContextMenuItem({
      id: toMenuItemId(config.id),
      parentId: MENU_ROOT_ID,
      title: config.name,
      contexts: ["image"]
    })
  }
}

export function rebuildContextMenu(state: ExtensionStorageState): Promise<void> {
  pendingRebuildState = state

  rebuildQueue = rebuildQueue.then(async () => {
    while (pendingRebuildState) {
      const nextState = pendingRebuildState
      pendingRebuildState = null
      await rebuildContextMenuNow(nextState)
    }
  })

  return rebuildQueue
}

export function extractConfigIdFromMenuItem(menuItemId: string | number): string | null {
  if (typeof menuItemId !== "string" || !menuItemId.startsWith(MENU_ITEM_PREFIX)) {
    return null
  }

  return menuItemId.slice(MENU_ITEM_PREFIX.length)
}
