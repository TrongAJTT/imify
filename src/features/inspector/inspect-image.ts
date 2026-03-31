import type { InspectorResult, ColorInfo, TimeInfo } from "./types"
import { parseExifData } from "./exif-parser"
import { extractPalette } from "./color-extractor"
import { generateThumbHash } from "./thumbhash"
import { detectFormat, computeDimensions, detectPrivacyAlerts } from "./format-utils"

export async function inspectImage(
  file: File,
  bitmap: ImageBitmap,
  arrayBuffer: ArrayBuffer
): Promise<InspectorResult> {
  const basic = detectFormat(file)
  const dimensions = computeDimensions(bitmap.width, bitmap.height)

  const parsed = parseExifData(arrayBuffer, file.type)

  const resolution = parsed?.resolution ?? null
  const gps = parsed?.gps ?? null

  const color: ColorInfo = {
    colorSpace: parsed?.colorInfo.colorSpace ?? "sRGB",
    bitDepth: parsed?.colorInfo.bitDepth ?? null,
    chromaSubsampling: parsed?.colorInfo.chromaSubsampling ?? null,
    hasAlpha: parsed?.colorInfo.hasAlpha ?? (file.type === "image/png" || file.type === "image/webp"),
    iccProfileName: parsed?.colorInfo.iccProfileName ?? null,
    iccWarning: null
  }

  if (color.iccProfileName) {
    const lower = color.iccProfileName.toLowerCase()
    if (lower.includes("cmyk")) {
      color.iccWarning = "This image uses CMYK color space. It may display incorrectly on web browsers which expect sRGB."
    } else if (lower.includes("p3") || lower.includes("display p3")) {
      color.iccWarning = "This image uses Display P3 color space. Colors may appear different on devices that don't support wide gamut."
    }
  }

  const time: TimeInfo = {
    lastModified: new Date(file.lastModified),
    exifDateTime: parsed?.timeInfo.exifDateTime ?? null,
    exifDateTimeOriginal: parsed?.timeInfo.exifDateTimeOriginal ?? null,
    exifDateTimeDigitized: parsed?.timeInfo.exifDateTimeDigitized ?? null
  }

  const exifEntries = parsed?.entries ?? []

  const softwareTags: string[] = []
  if (parsed?.software) softwareTags.push(parsed.software)
  for (const entry of exifEntries) {
    if (entry.tagName === "Software" && typeof entry.value === "string" && !softwareTags.includes(entry.value)) {
      softwareTags.push(entry.value)
    }
  }

  const privacyAlerts = detectPrivacyAlerts(exifEntries, gps, parsed?.software ?? null)

  const palette = extractPalette(bitmap, 8)

  const thumbHash = generateThumbHash(bitmap)

  return {
    basic,
    dimensions,
    resolution,
    color,
    time,
    gps,
    palette,
    exifEntries,
    privacyAlerts,
    softwareTags,
    thumbHash
  }
}
