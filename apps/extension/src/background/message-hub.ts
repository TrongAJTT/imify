// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import type { ConversionProgressPayload } from "@imify/core/types"

const MESSAGE_TYPE = "CONVERT_PROGRESS"

async function trySendToTab(tabId: number, payload: ConversionProgressPayload): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: MESSAGE_TYPE,
      payload
    })

    return true
  } catch {
    return false
  }
}

export async function publishConvertProgress(
  payload: ConversionProgressPayload,
  preferredTabId?: number
): Promise<void> {
  try {
    if (typeof preferredTabId === "number") {
      const deliveredToPreferredTab = await trySendToTab(preferredTabId, payload)
      if (deliveredToPreferredTab) {
        return
      }
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const activeTabId = tabs[0]?.id

    if (!activeTabId) {
      return
    }

    await trySendToTab(activeTabId, payload)
  } catch {
    // Content script can be missing on many pages. This should not block conversion.
  }
}
