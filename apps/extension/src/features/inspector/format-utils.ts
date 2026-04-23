import type { BasicInfo, DimensionInfo, PrivacyAlert } from "./types"
import { SENSITIVE_TAGS, AI_SOFTWARE_SIGNATURES } from "./exif-tags"
import type { ExifEntry, GpsInfo } from "./types"

export function detectFormat(file: File): BasicInfo {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""

  const FORMAT_MAP: Record<string, string> = {
    jpg: "JPEG",
    jpeg: "JPEG",
    png: "PNG",
    webp: "WebP",
    avif: "AVIF",
    gif: "GIF",
    bmp: "BMP",
    tiff: "TIFF",
    tif: "TIFF",
    ico: "ICO",
    svg: "SVG",
    jxl: "JPEG XL",
    heic: "HEIC",
    heif: "HEIF"
  }

  return {
    fileName: file.name,
    format: FORMAT_MAP[ext] ?? (ext.toUpperCase() || "Unknown"),
    mimeType: file.type || `image/${ext}`,
    fileSize: file.size
  }
}

export function computeDimensions(width: number, height: number): DimensionInfo {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const d = gcd(width, height)
  const rw = width / d
  const rh = height / d

  let aspectRatio: string
  if (rw > 100 || rh > 100) {
    const decimal = width / height
    const knownRatios: Array<[number, string]> = [
      [1, "1:1"],
      [4 / 3, "4:3"],
      [3 / 2, "3:2"],
      [16 / 9, "16:9"],
      [16 / 10, "16:10"],
      [21 / 9, "21:9"],
      [9 / 16, "9:16"],
      [3 / 4, "3:4"],
      [2 / 3, "2:3"]
    ]
    const match = knownRatios.find(([r]) => Math.abs(decimal - r) < 0.02)
    aspectRatio = match ? match[1] : `~${decimal.toFixed(2)}:1`
  } else {
    aspectRatio = `${rw}:${rh}`
  }

  const megapixels = Math.round((width * height) / 10000) / 100
  const orientation = width > height ? "landscape" : width < height ? "portrait" : "square"

  return {
    width,
    height,
    megapixels,
    aspectRatio,
    aspectRatioDecimal: width / height,
    matchedStandards: matchAspectRatio(width / height),
    orientation
  }
}

const STANDARD_RATIOS: Array<{
  ratio: number
  name: string
  uses: string
}> = [
  { ratio: 1, name: "1:1", uses: "Instagram Square, Profile Pictures" },
  { ratio: 4 / 5, name: "4:5", uses: "Instagram Portrait, Facebook Feed" },
  { ratio: 9 / 16, name: "9:16", uses: "Stories, Reels, TikTok" },
  { ratio: 2 / 3, name: "2:3", uses: "Pinterest Pin, 35mm Film" },
  { ratio: 3 / 4, name: "3:4", uses: "iPad, Tablets, Standard Photo" },
  { ratio: 3 / 2, name: "3:2", uses: "DSLR Photo, 35mm Film" },
  { ratio: 4 / 3, name: "4:3", uses: "Standard Monitor, iPad" },
  { ratio: 16 / 10, name: "16:10", uses: "MacBook Display, Widescreen" },
  { ratio: 16 / 9, name: "16:9", uses: "Full HD, YouTube, TV" },
  { ratio: 21 / 9, name: "21:9", uses: "Ultrawide Monitor, Cinema" },
  { ratio: 5 / 4, name: "5:4", uses: "Large Format Photo" },
  { ratio: 1.414, name: "1:1.414", uses: "A4/A3 Paper (ISO 216)" },
  { ratio: 1.91, name: "1.91:1", uses: "Open Graph Image, Twitter Card" },
  { ratio: 2 / 1, name: "2:1", uses: "Panoramic, Hero Banner" }
]

function matchAspectRatio(ratio: number): string[] {
  const threshold = 0.03
  const matches: string[] = []

  for (const std of STANDARD_RATIOS) {
    if (Math.abs(ratio - std.ratio) < threshold) {
      matches.push(`${std.name} - ${std.uses}`)
    }
    if (ratio !== 1 && Math.abs(1 / ratio - std.ratio) < threshold) {
      matches.push(`${std.name} (rotated) - ${std.uses}`)
    }
  }

  return matches
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size < 10 ? size.toFixed(2) : size < 100 ? size.toFixed(1) : Math.round(size)} ${units[i]}`
}

export function detectPrivacyAlerts(
  exifEntries: ExifEntry[],
  gps: GpsInfo | null,
  software: string | null
): PrivacyAlert[] {
  const alerts: PrivacyAlert[] = []

  if (gps) {
    alerts.push({
      severity: "critical",
      title: "GPS Location Embedded",
      description: `This image contains exact GPS coordinates (${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}). Anyone with this file can pinpoint where it was taken.`,
      field: "GPSLatitude"
    })
  }

  const sensitiveFound = exifEntries.filter((e) => SENSITIVE_TAGS.has(e.tagName) && e.tagName !== "GPSLatitude" && e.tagName !== "GPSLongitude")

  const cameraInfo = sensitiveFound.filter((e) => ["Make", "Model", "BodySerialNumber", "LensSerialNumber"].includes(e.tagName))
  if (cameraInfo.length > 0) {
    alerts.push({
      severity: "warning",
      title: "Camera Identity Exposed",
      description: `Device info found: ${cameraInfo.map((e) => `${e.tagName}: ${e.value}`).join(", ")}`,
      field: "Make"
    })
  }

  const personalInfo = sensitiveFound.filter((e) => ["Artist", "Copyright", "CameraOwnerName", "ImageUniqueID"].includes(e.tagName))
  if (personalInfo.length > 0) {
    alerts.push({
      severity: "warning",
      title: "Personal Information Found",
      description: `Owner data: ${personalInfo.map((e) => `${e.tagName}: ${e.value}`).join(", ")}`,
      field: "Artist"
    })
  }

  if (software) {
    const lower = software.toLowerCase()
    const aiMatch = AI_SOFTWARE_SIGNATURES.find((sig) => lower.includes(sig))
    if (aiMatch) {
      alerts.push({
        severity: "info",
        title: "AI-Generated Content Detected",
        description: `Software tag "${software}" suggests this image was generated by AI (${aiMatch}).`,
        field: "Software"
      })
    } else {
      alerts.push({
        severity: "info",
        title: "Software Signature Found",
        description: `This image was processed/created with "${software}".`,
        field: "Software"
      })
    }
  }

  return alerts
}
