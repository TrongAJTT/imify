"use client"

import { isCommonImageFile } from "./image-file-utils"
import { useClipboardPaste } from "./use-clipboard-paste"

type ClipboardImageMode = "single" | "multiple"

interface UseClipboardImageIntakeOptions {
  onImages: (files: File[]) => void
  onUrls?: (urls: string[]) => void
  enabled?: boolean
  mode?: ClipboardImageMode
  onFetchStart?: () => void
  onFetchEnd?: () => void
  onError?: (message: string) => void
}

export function useClipboardImageIntake({
  onImages,
  onUrls,
  enabled = true,
  mode = "multiple",
  onFetchStart,
  onFetchEnd,
  onError,
}: UseClipboardImageIntakeOptions): void {
  useClipboardPaste({
    enabled,
    onUrls,
    onFetchStart,
    onFetchEnd,
    onError,
    onFiles: (files) => {
      const imageFiles = files.filter((file) => isCommonImageFile(file))
      if (!imageFiles.length) {
        return
      }

      if (mode === "single") {
        onImages([imageFiles[0]])
        return
      }

      onImages(imageFiles)
    },
  })
}
