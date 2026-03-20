import type { ImageFormat } from "@/core/types"

function stripExtension(name: string): string {
  const trimmed = name.trim()
  const lastDot = trimmed.lastIndexOf(".")

  if (lastDot <= 0) {
    return trimmed || "image"
  }

  return trimmed.slice(0, lastDot)
}

export function getCanonicalExtension(format: ImageFormat): string {
  return format === "jpg" ? "jpg" : format
}

export function toOutputFilename(nameOrBase: string, format: ImageFormat): string {
  const base = stripExtension(nameOrBase) || "image"
  const ext = getCanonicalExtension(format)

  return `${base}.${ext}`
}

function rewriteDataUrlMime(dataUrl: string, mimeType: string): string {
  return dataUrl.replace(/^data:[^;]+;/i, `data:${mimeType};`)
}

export function blobToDownloadDataUrl(blob: Blob, format: ImageFormat): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error("Unable to convert Blob to data URL"))
    }

    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Invalid FileReader output"))
        return
      }

      // If we use image/jpeg, Windows may save it as .jfif.
      // But using image/jpg breaks the "Save As" dialog type filter.
      // We will keep it as image/jpeg, and handle the extension strictly via filename.
      if (format === "jpg") {
        resolve(rewriteDataUrlMime(reader.result, "image/jpeg"))
        return
      }

      resolve(reader.result)
    }

    reader.readAsDataURL(blob)
  })
}