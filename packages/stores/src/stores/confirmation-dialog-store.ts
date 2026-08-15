import { create } from "zustand"
import { APP_CONFIG } from "@imify/core"
import { useBatchStore } from "./batch-store"

interface DownloadConfirmPayload {
  isOpen: boolean
  count: number
  resolve: ((confirmed: boolean) => void) | null
}

interface OomWarningPayload {
  isOpen: boolean
  totalSizeMB: string
  recommendedSizeMB: string
  resolve: ((confirmed: boolean) => void) | null
}

interface HeavyPreviewWarningPayload {
  isOpen: boolean
  imageCount: number
  totalPixels: number
  resolve: ((confirmed: boolean) => void) | null
}

interface ConfirmationDialogState {
  downloadConfirm: DownloadConfirmPayload
  oomWarning: OomWarningPayload
  heavyPreviewWarning: HeavyPreviewWarningPayload

  // Actions for Download Confirm
  openDownloadConfirm: (count: number) => Promise<boolean>
  resolveDownloadConfirm: (confirmed: boolean, dontShowAgain?: boolean) => void

  // Actions for OOM Warning
  openOomWarning: (totalSizeMB: string, recommendedSizeMB?: string) => Promise<boolean>
  resolveOomWarning: (confirmed: boolean, dontShowAgain?: boolean) => void

  // Actions for Heavy Preview Warning
  openHeavyPreviewWarning: (imageCount: number, totalPixels: number) => Promise<boolean>
  resolveHeavyPreviewWarning: (confirmed: boolean, dontShowAgain?: boolean) => void
}

export const useConfirmationDialogStore = create<ConfirmationDialogState>((set, get) => ({
  downloadConfirm: {
    isOpen: false,
    count: 0,
    resolve: null
  },
  oomWarning: {
    isOpen: false,
    totalSizeMB: "0",
    recommendedSizeMB: String(APP_CONFIG.BATCH.OOM_WARNING_MB),
    resolve: null
  },
  heavyPreviewWarning: {
    isOpen: false,
    imageCount: 0,
    totalPixels: 0,
    resolve: null
  },

  openDownloadConfirm: (count: number) => {
    const { skipDownloadConfirm } = useBatchStore.getState()
    if (skipDownloadConfirm || count <= APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD) {
      return Promise.resolve(true)
    }

    return new Promise<boolean>((resolve) => {
      set({
        downloadConfirm: {
          isOpen: true,
          count,
          resolve
        }
      })
    })
  },

  resolveDownloadConfirm: (confirmed: boolean, dontShowAgain = false) => {
    const { downloadConfirm } = get()
    if (dontShowAgain) {
      useBatchStore.getState().setSkipDownloadConfirm(true)
    }
    if (downloadConfirm.resolve) {
      downloadConfirm.resolve(confirmed)
    }
    set({
      downloadConfirm: {
        isOpen: false,
        count: 0,
        resolve: null
      }
    })
  },

  openOomWarning: (totalSizeMB: string, recommendedSizeMB = String(APP_CONFIG.BATCH.OOM_WARNING_MB)) => {
    const { skipOomWarning } = useBatchStore.getState()
    const sizeNum = parseFloat(totalSizeMB) || 0
    if (skipOomWarning || sizeNum <= APP_CONFIG.BATCH.OOM_WARNING_MB) {
      return Promise.resolve(true)
    }

    return new Promise<boolean>((resolve) => {
      set({
        oomWarning: {
          isOpen: true,
          totalSizeMB,
          recommendedSizeMB,
          resolve
        }
      })
    })
  },

  resolveOomWarning: (confirmed: boolean, dontShowAgain = false) => {
    const { oomWarning } = get()
    if (dontShowAgain) {
      useBatchStore.getState().setSkipOomWarning(true)
    }
    if (oomWarning.resolve) {
      oomWarning.resolve(confirmed)
    }
    set({
      oomWarning: {
        isOpen: false,
        totalSizeMB: "0",
        recommendedSizeMB: String(APP_CONFIG.BATCH.OOM_WARNING_MB),
        resolve: null
      }
    })
  },

  openHeavyPreviewWarning: (imageCount: number, totalPixels: number) => {
    const { skipSplicingHeavyPreviewQualityWarning } = useBatchStore.getState()
    const isOverCount = imageCount > APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT
    const isOverPixels = totalPixels > APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS

    if (skipSplicingHeavyPreviewQualityWarning || (!isOverCount && !isOverPixels)) {
      return Promise.resolve(true)
    }

    return new Promise<boolean>((resolve) => {
      set({
        heavyPreviewWarning: {
          isOpen: true,
          imageCount,
          totalPixels,
          resolve
        }
      })
    })
  },

  resolveHeavyPreviewWarning: (confirmed: boolean, dontShowAgain = false) => {
    const { heavyPreviewWarning } = get()
    if (dontShowAgain) {
      useBatchStore.getState().setSkipSplicingHeavyPreviewQualityWarning(true)
    }
    if (heavyPreviewWarning.resolve) {
      heavyPreviewWarning.resolve(confirmed)
    }
    set({
      heavyPreviewWarning: {
        isOpen: false,
        imageCount: 0,
        totalPixels: 0,
        resolve: null
      }
    })
  }
}))

// Direct helper functions (usable in any async function without hooks)
export const confirmBatchDownload = (count: number) =>
  useConfirmationDialogStore.getState().openDownloadConfirm(count)

export const confirmOomWarning = (totalSizeMB: string | number, recommendedSizeMB?: string) =>
  useConfirmationDialogStore.getState().openOomWarning(String(totalSizeMB), recommendedSizeMB)

export const confirmHeavyPreviewWarning = (imageCount: number, totalPixels: number) =>
  useConfirmationDialogStore.getState().openHeavyPreviewWarning(imageCount, totalPixels)
