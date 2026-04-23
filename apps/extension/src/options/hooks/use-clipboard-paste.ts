import { useEffect, useRef } from "react"
import {
  fetchRemoteImagesFromUrls,
  parseHttpUrlsFromText
} from "@/features/converter/remote-image-import"

export interface UseClipboardPasteOptions {
  /**
   * Called with all image Files resolved from the paste event.
   * For image blobs this fires synchronously; for URL imports it fires after fetch.
   */
  onFiles: (files: File[]) => void

  /**
   * If provided, called with detected image URLs instead of auto-fetching them.
   * Use this when the consumer has its own URL-import / toast pipeline.
   */
  onUrls?: (urls: string[]) => void

  /** Whether the listener is active. Defaults to true. */
  enabled?: boolean

  /** Called when an auto URL-fetch starts (only relevant if onUrls is not set). */
  onFetchStart?: () => void

  /** Called when an auto URL-fetch completes (success or failure). */
  onFetchEnd?: () => void

  /** Called when auto URL-fetch fails to produce any files. */
  onError?: (message: string) => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return (
    tag === "input" ||
    tag === "textarea" ||
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']"))
  )
}

function extractImageFiles(items: DataTransferItemList): File[] {
  return Array.from(items)
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .flatMap((item) => {
      const blob = item.getAsFile()
      if (!blob) return []
      const ext = blob.type.split("/")[1] || "png"
      return [
        new File([blob], `pasted_${Date.now()}.${ext}`, {
          type: blob.type,
          lastModified: Date.now()
        })
      ]
    })
}

export function useClipboardPaste({
  onFiles,
  onUrls,
  enabled = true,
  onFetchStart,
  onFetchEnd,
  onError
}: UseClipboardPasteOptions): void {
  // Store all callbacks in refs so the stable event listener always sees fresh values.
  const onFilesRef = useRef(onFiles)
  const onUrlsRef = useRef(onUrls)
  const onFetchStartRef = useRef(onFetchStart)
  const onFetchEndRef = useRef(onFetchEnd)
  const onErrorRef = useRef(onError)

  useEffect(() => { onFilesRef.current = onFiles }, [onFiles])
  useEffect(() => { onUrlsRef.current = onUrls }, [onUrls])
  useEffect(() => { onFetchStartRef.current = onFetchStart }, [onFetchStart])
  useEffect(() => { onFetchEndRef.current = onFetchEnd }, [onFetchEnd])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    if (!enabled) return

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items?.length) return

      if (isEditableTarget(event.target)) return

      // Priority 1: clipboard contains image binary data.
      const imageFiles = extractImageFiles(items)
      if (imageFiles.length) {
        event.preventDefault()
        onFilesRef.current(imageFiles)
        return
      }

      // Priority 2: clipboard contains URL text.
      const text = event.clipboardData?.getData("text") || ""
      const urls = parseHttpUrlsFromText(text)
      if (!urls.length) return

      event.preventDefault()

      if (onUrlsRef.current) {
        // Delegate to consumer's own import pipeline.
        onUrlsRef.current(urls)
        return
      }

      // Auto-fetch when no consumer pipeline is provided.
      onFetchStartRef.current?.()
      fetchRemoteImagesFromUrls(urls)
        .then(({ files, failures }) => {
          if (files.length) {
            onFilesRef.current(files)
          } else {
            const reason = failures[0]?.reason ?? "No images could be imported from the URL(s)"
            onErrorRef.current?.(reason)
          }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to import URL"
          onErrorRef.current?.(msg)
        })
        .finally(() => {
          onFetchEndRef.current?.()
        })
    }

    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [enabled])
}
