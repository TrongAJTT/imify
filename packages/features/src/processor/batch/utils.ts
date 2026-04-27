import { toOutputFilename } from "@imify/core/download-utils"
import { APP_CONFIG } from "@imify/core/config"
import type { ConversionProgressPayload, FormatConfig } from "@imify/core/types"
import { downloadWithFilename, formatBytes, withBatchResize } from "../processor-utils"

export const MAX_FILE_SIZE_BYTES = APP_CONFIG.BATCH.MAX_FILE_SIZE_MB * 1024 * 1024
export const MAX_TOTAL_QUEUE_BYTES = APP_CONFIG.BATCH.OOM_WARNING_MB * 1024 * 1024

export { downloadWithFilename, formatBytes, withBatchResize }

export function toMb(sizeInBytes: number): number {
  return Math.round(sizeInBytes / 1024 / 1024)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function publishProgressToActiveTab(payload: ConversionProgressPayload): Promise<void> {
  const maybeChrome = (globalThis as unknown as {
    chrome?: {
      tabs?: {
        query?: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number }>>
        sendMessage?: (tabId: number, message: unknown) => Promise<void>
      }
    }
  }).chrome

  if (!maybeChrome?.tabs?.query || !maybeChrome.tabs.sendMessage) {
    return
  }

  try {
    const tabs = await maybeChrome.tabs.query({ active: true, currentWindow: true })
    const activeTabId = tabs[0]?.id
    if (!activeTabId) {
      return
    }
    await maybeChrome.tabs.sendMessage(activeTabId, { type: "CONVERT_PROGRESS", payload })
  } catch {
    // Shared-safe no-op when runtime messaging is unavailable.
  }
}

export async function notifyProgress(
  id: string,
  fileName: string,
  config: FormatConfig,
  status: ConversionProgressPayload["status"],
  percent: number,
  message?: string
): Promise<void> {
  await publishProgressToActiveTab({
    id,
    fileName: toOutputFilename(fileName, config.format),
    targetFormat: config.format,
    status,
    percent,
    message
  })
}
