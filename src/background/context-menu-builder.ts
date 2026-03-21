import { getOrderedContextMenuConfigs } from "@/core/context-menu-order"
import type { ExtensionStorageState } from "@/core/types"

export const MENU_ROOT_ID = "imify_convert_root"
export const MENU_ITEM_PREFIX = "imify_format_"

function toMenuItemId(formatConfigId: string): string {
  return `${MENU_ITEM_PREFIX}${formatConfigId}`
}

export async function rebuildContextMenu(state: ExtensionStorageState): Promise<void> {
  await chrome.contextMenus.removeAll()

  const enabledConfigs = getOrderedContextMenuConfigs(state)

  if (enabledConfigs.length === 0) {
    return
  }

  chrome.contextMenus.create({
    id: MENU_ROOT_ID,
    title: "Save and Convert with Imify",
    contexts: ["image"]
  })

  for (const config of enabledConfigs) {
    chrome.contextMenus.create({
      id: toMenuItemId(config.id),
      parentId: MENU_ROOT_ID,
      title: config.name,
      contexts: ["image"]
    })
  }
}

export function extractConfigIdFromMenuItem(menuItemId: string | number): string | null {
  if (typeof menuItemId !== "string" || !menuItemId.startsWith(MENU_ITEM_PREFIX)) {
    return null
  }

  return menuItemId.slice(MENU_ITEM_PREFIX.length)
}
