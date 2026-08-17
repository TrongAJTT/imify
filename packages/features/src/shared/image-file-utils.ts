const COMMON_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "avif",
  "bmp",
  "gif",
  "tif",
  "tiff",
  "jxl",
  "ico",
] as const

const COMMON_IMAGE_EXTENSION_PATTERN = new RegExp(
  `\\.(${COMMON_IMAGE_EXTENSIONS.join("|")})$`,
  "i"
)

export const COMMON_IMAGE_ACCEPT = COMMON_IMAGE_EXTENSIONS.map((extension) => `.${extension}`).join(",")
export const COMMON_IMAGE_ACCEPT_WITH_SVG = `${COMMON_IMAGE_ACCEPT},.svg`

export function isCommonImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true
  }

  return COMMON_IMAGE_EXTENSION_PATTERN.test(file.name)
}

export function hasFileDragPayload(dataTransfer: DataTransfer): boolean {
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return true
  }

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    return Array.from(dataTransfer.items).some((item) => item.kind === "file")
  }

  return Array.from(dataTransfer.types ?? []).includes("Files")
}

export function getFirstCommonImageFileFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const directFile = dataTransfer.files?.[0]
  if (directFile && isCommonImageFile(directFile)) {
    return directFile
  }

  if (dataTransfer.items) {
    for (const item of Array.from(dataTransfer.items)) {
      if (item.kind !== "file") {
        continue
      }

      const file = item.getAsFile()
      if (file && isCommonImageFile(file)) {
        return file
      }
    }
  }

  return null
}

export async function sanitizeFile(file: File): Promise<File> {
  const extMatch = /\.([a-z0-9]+)$/i.exec(file.name)
  const ext = extMatch ? extMatch[1].toLowerCase() : ""
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    bmp: "image/bmp",
    gif: "image/gif",
    tif: "image/tiff",
    tiff: "image/tiff"
  }
  const resolvedMime = mimeMap[ext] || file.type || "image/jpeg"

  try {
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) resolve(reader.result)
        else reject(new Error("Empty buffer result"))
      }
      reader.onerror = () => reject(reader.error || new Error("Read error"))
      reader.readAsArrayBuffer(file)
    })

    return new File([buffer], file.name, {
      type: resolvedMime,
      lastModified: file.lastModified
    })
  } catch (e) {
    console.warn("Failed to sanitize file, returning original", e)
    return file
  }
}

// @TODO: investigate GPU allocation limits and silent black texture failure on Chromium Android WebView.
export async function decodeFileToImageSource(file: File): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to decode image source"))
    }
    img.src = url
  })
}

export async function createThumbnailUrl(
  file: File,
  maxWidth = 200,
  quality = 0.7
): Promise<string> {
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") {
    return URL.createObjectURL(file);
  }

  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: maxWidth,
      resizeQuality: "low",
    });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return URL.createObjectURL(file);
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });
    return URL.createObjectURL(blob);
  } catch {
    return URL.createObjectURL(file);
  }
}


