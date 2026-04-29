const IMAGE_MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
  "image/jxl": "jxl",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico"
}

export interface RemoteImageImportFailure {
  url: string
  reason: string
}

function toFilenameSafePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_")
}

function extensionFromMimeType(type: string): string {
  const normalized = type.split(";")[0].trim().toLowerCase()
  if (normalized in IMAGE_MIME_EXTENSION_MAP) {
    return IMAGE_MIME_EXTENSION_MAP[normalized]
  }

  const matched = /^image\/([a-z0-9.+-]+)$/i.exec(normalized)
  return matched?.[1]?.toLowerCase() || "png"
}

function extractFilenameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return plainMatch?.[1] || null
}

function inferFilename(url: string, mimeType: string, fallbackIndex: number, contentDisposition?: string | null): string {
  const extension = extensionFromMimeType(mimeType)
  const fromDisposition = extractFilenameFromContentDisposition(contentDisposition ?? null)

  if (fromDisposition) {
    const safe = toFilenameSafePart(fromDisposition)
    if (/\.[a-z0-9]+$/i.test(safe)) {
      return safe
    }

    return `${safe}.${extension}`
  }

  try {
    const parsed = new URL(url)
    const basename = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "")
    const safe = toFilenameSafePart(basename)

    if (safe) {
      if (/\.[a-z0-9]+$/i.test(safe)) {
        return safe
      }

      return `${safe}.${extension}`
    }
  } catch {
    // Ignore URL parsing failures and fallback to generated name.
  }

  return `remote-${Date.now()}-${fallbackIndex + 1}.${extension}`
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function parseHttpUrlsFromText(value: string): string[] {
  if (!value.trim()) {
    return []
  }

  const urls = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^https?:\/\//i.test(line))
    .filter((line) => {
      try {
        const parsed = new URL(line)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
      } catch {
        return false
      }
    })

  return Array.from(new Set(urls))
}

export async function fetchRemoteImageAsFile(url: string, fallbackIndex = 0): Promise<File> {
  let response: Response

  try {
    response = await fetch(url)
  } catch {
    throw new Error("Could not fetch this URL. Check the URL and network connection.")
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status} ${response.statusText})`)
  }

  const contentTypeHeader = response.headers.get("content-type") || ""
  const mimeType = contentTypeHeader.split(";")[0].trim().toLowerCase()

  if (!mimeType.startsWith("image/")) {
    throw new Error("This URL does not point to a direct image file.")
  }

  const blob = await response.blob()
  const filename = inferFilename(url, mimeType, fallbackIndex, response.headers.get("content-disposition"))

  return new File([blob], filename, {
    type: mimeType || blob.type || "image/png",
    lastModified: Date.now()
  })
}

export async function fetchRemoteImagesFromUrls(urls: string[]): Promise<{
  files: File[]
  failures: RemoteImageImportFailure[]
}> {
  const settled = await Promise.allSettled(
    urls.map((url, index) => fetchRemoteImageAsFile(url, index))
  )

  const files: File[] = []
  const failures: RemoteImageImportFailure[] = []

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      files.push(result.value)
      return
    }

    failures.push({
      url: urls[index],
      reason: toErrorMessage(result.reason, "Unable to import this URL")
    })
  })

  return {
    files,
    failures
  }
}
