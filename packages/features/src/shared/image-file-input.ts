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
