import type { ConversionProgressPayload } from "@/core/types"

const MESSAGE_TYPE = "CONVERT_PROGRESS"

export async function publishConvertProgress(
  payload: ConversionProgressPayload
): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const activeTabId = tabs[0]?.id

    if (!activeTabId) {
      return
    }

    await chrome.tabs.sendMessage(activeTabId, {
      type: MESSAGE_TYPE,
      payload
    })
  } catch {
    // Content script can be missing on many pages. This should not block conversion.
  }
}
