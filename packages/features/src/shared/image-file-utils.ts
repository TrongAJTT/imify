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
