import type { ExifEntry, ExifGroup, GpsInfo, ResolutionInfo, ColorInfo, TimeInfo } from "./types"
import { TIFF_TAGS, EXIF_TAGS, GPS_TAGS, ORIENTATION_MAP } from "./exif-tags"

interface RawIfdEntry {
  tag: number
  type: number
  count: number
  value: unknown
}

interface ParsedExifData {
  entries: ExifEntry[]
  gps: GpsInfo | null
  resolution: ResolutionInfo | null
  colorInfo: Partial<ColorInfo>
  timeInfo: Partial<TimeInfo>
  orientation: number | null
  software: string | null
}

const TYPE_SIZES: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  7: 1, // UNDEFINED
  9: 4, // SLONG
  10: 8 // SRATIONAL
}

function readRational(view: DataView, offset: number, le: boolean): number {
  const num = view.getUint32(offset, le)
  const den = view.getUint32(offset + 4, le)
  return den === 0 ? 0 : num / den
}

function readSRational(view: DataView, offset: number, le: boolean): number {
  const num = view.getInt32(offset, le)
  const den = view.getInt32(offset + 4, le)
  return den === 0 ? 0 : num / den
}

function readIfdValue(
  view: DataView,
  type: number,
  count: number,
  valueOffset: number,
  le: boolean,
  tiffStart: number
): unknown {
  const totalBytes = (TYPE_SIZES[type] ?? 1) * count
  const offset = totalBytes > 4 ? tiffStart + view.getUint32(valueOffset, le) : valueOffset

  if (offset + totalBytes > view.byteLength) return null

  switch (type) {
    case 1: // BYTE
    case 7: { // UNDEFINED
      if (count === 1) return view.getUint8(offset)
      const bytes: number[] = []
      for (let i = 0; i < count; i++) bytes.push(view.getUint8(offset + i))
      return bytes
    }
    case 2: { // ASCII
      let str = ""
      for (let i = 0; i < count; i++) {
        const ch = view.getUint8(offset + i)
        if (ch === 0) break
        str += String.fromCharCode(ch)
      }
      return str.trim()
    }
    case 3: { // SHORT
      if (count === 1) return view.getUint16(offset, le)
      const vals: number[] = []
      for (let i = 0; i < count; i++) vals.push(view.getUint16(offset + i * 2, le))
      return vals
    }
    case 4: { // LONG
      if (count === 1) return view.getUint32(offset, le)
      const vals: number[] = []
      for (let i = 0; i < count; i++) vals.push(view.getUint32(offset + i * 4, le))
      return vals
    }
    case 5: { // RATIONAL
      if (count === 1) return readRational(view, offset, le)
      const vals: number[] = []
      for (let i = 0; i < count; i++) vals.push(readRational(view, offset + i * 8, le))
      return vals
    }
    case 9: { // SLONG
      if (count === 1) return view.getInt32(offset, le)
      const vals: number[] = []
      for (let i = 0; i < count; i++) vals.push(view.getInt32(offset + i * 4, le))
      return vals
    }
    case 10: { // SRATIONAL
      if (count === 1) return readSRational(view, offset, le)
      const vals: number[] = []
      for (let i = 0; i < count; i++) vals.push(readSRational(view, offset + i * 8, le))
      return vals
    }
    default:
      return null
  }
}

function readIfd(
  view: DataView,
  offset: number,
  le: boolean,
  tiffStart: number
): RawIfdEntry[] {
  if (offset + 2 > view.byteLength) return []

  const count = view.getUint16(offset, le)
  const entries: RawIfdEntry[] = []

  for (let i = 0; i < count; i++) {
    const entryOffset = offset + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break

    const tag = view.getUint16(entryOffset, le)
    const type = view.getUint16(entryOffset + 2, le)
    const cnt = view.getUint32(entryOffset + 4, le)
    const value = readIfdValue(view, type, cnt, entryOffset + 8, le, tiffStart)

    entries.push({ tag, type, count: cnt, value })
  }

  return entries
}

function formatExifValue(value: unknown): string | number | number[] {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value
    return Math.round(value * 10000) / 10000
  }
  if (Array.isArray(value)) {
    return value.map((v) =>
      typeof v === "number" ? (Number.isInteger(v) ? v : Math.round(v * 10000) / 10000) : v
    ) as number[]
  }
  return String(value)
}

function classifyTag(tagName: string, tagGroup: "tiff" | "exif" | "gps"): ExifGroup {
  if (tagGroup === "gps") return "gps"
  if (tagGroup === "exif") return "photo"

  const imageKeys = [
    "ImageWidth", "ImageHeight", "BitsPerSample", "Compression",
    "PhotometricInterpretation", "Orientation", "SamplesPerPixel",
    "XResolution", "YResolution", "ResolutionUnit",
    "YCbCrSubSampling", "YCbCrPositioning"
  ]
  if (imageKeys.includes(tagName)) return "image"

  return "other"
}

function convertDmsToDecimal(degrees: number, minutes: number, seconds: number, ref: string): number {
  let decimal = degrees + minutes / 60 + seconds / 3600
  if (ref === "S" || ref === "W") decimal = -decimal
  return decimal
}

function formatDms(degrees: number, minutes: number, seconds: number, ref: string): string {
  return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${ref}`
}

function parseGpsFromEntries(entries: RawIfdEntry[]): GpsInfo | null {
  const map = new Map<number, unknown>()
  for (const e of entries) map.set(e.tag, e.value)

  const lat = map.get(0x0002)
  const lon = map.get(0x0004)
  const latRef = map.get(0x0001) as string | undefined
  const lonRef = map.get(0x0003) as string | undefined

  if (!Array.isArray(lat) || !Array.isArray(lon) || !latRef || !lonRef) return null
  if (lat.length < 3 || lon.length < 3) return null

  const latitude = convertDmsToDecimal(lat[0], lat[1], lat[2], latRef)
  const longitude = convertDmsToDecimal(lon[0], lon[1], lon[2], lonRef)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const altVal = map.get(0x0006)
  const altRef = map.get(0x0005) as number | undefined
  let altitude: number | null = null
  if (typeof altVal === "number") {
    altitude = altRef === 1 ? -altVal : altVal
  }

  return {
    latitude,
    longitude,
    altitude,
    latitudeRef: latRef,
    longitudeRef: lonRef,
    latitudeDms: formatDms(lat[0], lat[1], lat[2], latRef),
    longitudeDms: formatDms(lon[0], lon[1], lon[2], lonRef)
  }
}

function parseJpegExif(buffer: ArrayBuffer): ParsedExifData | null {
  const view = new DataView(buffer)

  if (view.byteLength < 4) return null
  if (view.getUint16(0) !== 0xFFD8) return null

  let offset = 2
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset)
    if (marker === 0xFFDA) break // Start of Scan

    const segLen = view.getUint16(offset + 2)

    if (marker === 0xFFE1) {
      const exifHeader = view.getUint32(offset + 4)
      if (exifHeader === 0x45786966) { // "Exif"
        return parseTiffData(buffer, offset + 10)
      }
    }

    offset += 2 + segLen
  }

  return null
}

function parseTiffData(buffer: ArrayBuffer, tiffStart: number): ParsedExifData | null {
  const view = new DataView(buffer)
  if (tiffStart + 8 > view.byteLength) return null

  const byteOrder = view.getUint16(tiffStart)
  const le = byteOrder === 0x4949 // II = little-endian

  const magic = view.getUint16(tiffStart + 2, le)
  if (magic !== 42) return null

  const ifd0Offset = view.getUint32(tiffStart + 4, le)

  const entries: ExifEntry[] = []
  let gps: GpsInfo | null = null
  let resolution: ResolutionInfo | null = null
  const colorInfo: Partial<ColorInfo> = {}
  const timeInfo: Partial<TimeInfo> = {}
  let orientation: number | null = null
  let software: string | null = null

  const ifd0Entries = readIfd(view, tiffStart + ifd0Offset, le, tiffStart)

  let xRes: number | null = null
  let yRes: number | null = null
  let resUnit = 2

  for (const entry of ifd0Entries) {
    const tagName = TIFF_TAGS[entry.tag] ?? `Tag_0x${entry.tag.toString(16).toUpperCase()}`

    if (entry.tag === 0x8769) {
      const exifOffset = entry.value as number
      if (typeof exifOffset === "number") {
        const exifEntries = readIfd(view, tiffStart + exifOffset, le, tiffStart)
        for (const exifEntry of exifEntries) {
          const exifTagName = EXIF_TAGS[exifEntry.tag] ?? `Tag_0x${exifEntry.tag.toString(16).toUpperCase()}`

          if (exifEntry.tag === 0xA001) {
            const cs = exifEntry.value as number
            colorInfo.colorSpace = cs === 1 ? "sRGB" : cs === 65535 ? "Uncalibrated" : `Unknown (${cs})`
          }

          if (exifEntry.tag === 0x9003) timeInfo.exifDateTimeOriginal = exifEntry.value as string
          if (exifEntry.tag === 0x9004) timeInfo.exifDateTimeDigitized = exifEntry.value as string

          entries.push({
            tag: exifEntry.tag,
            tagName: exifTagName,
            value: formatExifValue(exifEntry.value),
            group: classifyTag(exifTagName, "exif")
          })
        }
      }
      continue
    }

    if (entry.tag === 0x8825) {
      const gpsOffset = entry.value as number
      if (typeof gpsOffset === "number") {
        const gpsEntries = readIfd(view, tiffStart + gpsOffset, le, tiffStart)
        gps = parseGpsFromEntries(gpsEntries)

        for (const gpsEntry of gpsEntries) {
          const gpsTagName = GPS_TAGS[gpsEntry.tag] ?? `GPS_0x${gpsEntry.tag.toString(16).toUpperCase()}`
          entries.push({
            tag: gpsEntry.tag,
            tagName: gpsTagName,
            value: formatExifValue(gpsEntry.value),
            group: "gps"
          })
        }
      }
      continue
    }

    if (entry.tag === 0x0112) {
      orientation = entry.value as number
    }

    if (entry.tag === 0x0131) {
      software = entry.value as string
    }

    if (entry.tag === 0x0132) {
      timeInfo.exifDateTime = entry.value as string
    }

    if (entry.tag === 0x011A) xRes = entry.value as number
    if (entry.tag === 0x011B) yRes = entry.value as number
    if (entry.tag === 0x0128) resUnit = entry.value as number

    if (entry.tag === 0x0102) {
      const bits = entry.value
      if (typeof bits === "number") colorInfo.bitDepth = bits
      else if (Array.isArray(bits) && bits.length > 0) colorInfo.bitDepth = bits[0]
    }

    if (entry.tag === 0x0212) {
      const sub = entry.value
      if (Array.isArray(sub) && sub.length === 2) {
        colorInfo.chromaSubsampling = `YCbCr${sub[0]}:${sub[1] === 1 ? "4:4:4" : sub[1] === 2 ? "4:2:2" : "4:2:0"}`
      }
    }

    entries.push({
      tag: entry.tag,
      tagName,
      value: formatExifValue(entry.value),
      group: classifyTag(tagName, "tiff")
    })
  }

  if (xRes !== null && yRes !== null) {
    const unitLabel = resUnit === 2 ? "dpi" : resUnit === 3 ? "dpcm" : "unknown"
    resolution = { xDpi: Math.round(xRes), yDpi: Math.round(yRes), unit: unitLabel }
  }

  return { entries, gps, resolution, colorInfo, timeInfo, orientation, software }
}

function parseWebpExif(buffer: ArrayBuffer): ParsedExifData | null {
  const view = new DataView(buffer)
  if (view.byteLength < 12) return null

  const riff = view.getUint32(0)
  const webp = view.getUint32(8)
  if (riff !== 0x52494646 || webp !== 0x57454250) return null

  let offset = 12
  while (offset + 8 < view.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    )
    const chunkSize = view.getUint32(offset + 4, true)

    if (chunkId === "EXIF") {
      const exifStart = offset + 8
      if (exifStart + 6 <= view.byteLength) {
        let tiffOffset = exifStart
        if (view.getUint32(tiffOffset) === 0x45786966) {
          tiffOffset += 6
        }
        return parseTiffData(buffer, tiffOffset)
      }
    }

    offset += 8 + chunkSize + (chunkSize % 2)
  }

  return null
}

function parsePngMetadata(buffer: ArrayBuffer): ParsedExifData | null {
  const view = new DataView(buffer)
  if (view.byteLength < 8) return null

  const sig = view.getUint32(0)
  if (sig !== 0x89504E47) return null

  const entries: ExifEntry[] = []
  let resolution: ResolutionInfo | null = null
  const colorInfo: Partial<ColorInfo> = {}
  let offset = 8

  while (offset + 8 < view.byteLength) {
    const length = view.getUint32(offset)
    const typeCode = view.getUint32(offset + 4)
    const typeStr = String.fromCharCode(
      (typeCode >> 24) & 0xFF,
      (typeCode >> 16) & 0xFF,
      (typeCode >> 8) & 0xFF,
      typeCode & 0xFF
    )

    const dataStart = offset + 8

    if (typeStr === "IHDR" && length >= 13) {
      const bitDepth = view.getUint8(dataStart + 8)
      const colorType = view.getUint8(dataStart + 9)
      colorInfo.bitDepth = bitDepth
      colorInfo.hasAlpha = colorType === 4 || colorType === 6

      const colorTypeMap: Record<number, string> = {
        0: "Grayscale",
        2: "RGB",
        3: "Indexed",
        4: "Grayscale+Alpha",
        6: "RGBA"
      }
      colorInfo.colorSpace = colorTypeMap[colorType] ?? `Type ${colorType}`
    }

    if (typeStr === "pHYs" && length >= 9) {
      const pxPerUnitX = view.getUint32(dataStart)
      const pxPerUnitY = view.getUint32(dataStart + 4)
      const unit = view.getUint8(dataStart + 8)

      if (unit === 1) {
        resolution = {
          xDpi: Math.round(pxPerUnitX / 39.3701),
          yDpi: Math.round(pxPerUnitY / 39.3701),
          unit: "dpi"
        }
      }
    }

    if (typeStr === "iCCP" && length > 2) {
      let nameEnd = dataStart
      while (nameEnd < dataStart + length && view.getUint8(nameEnd) !== 0) nameEnd++
      const profileName = new TextDecoder().decode(new Uint8Array(buffer, dataStart, nameEnd - dataStart))
      colorInfo.iccProfileName = profileName
    }

    if (typeStr === "tEXt" && length > 0) {
      const chunk = new Uint8Array(buffer, dataStart, length)
      let sep = chunk.indexOf(0)
      if (sep === -1) sep = chunk.length
      const key = new TextDecoder().decode(chunk.slice(0, sep))
      const val = new TextDecoder().decode(chunk.slice(sep + 1))
      entries.push({ tag: 0, tagName: key, value: val, group: "other" })
    }

    if (typeStr === "iTXt" && length > 0) {
      const chunk = new Uint8Array(buffer, dataStart, Math.min(length, view.byteLength - dataStart))
      let sep = chunk.indexOf(0)
      if (sep === -1) sep = chunk.length
      const key = new TextDecoder().decode(chunk.slice(0, sep))
      const rest = chunk.slice(sep + 1)
      const secondNull = rest.indexOf(0)
      if (secondNull !== -1) {
        const thirdNull = rest.indexOf(0, secondNull + 1)
        if (thirdNull !== -1) {
          const fourthNull = rest.indexOf(0, thirdNull + 1)
          const valueStart = fourthNull !== -1 ? fourthNull + 1 : thirdNull + 1
          const val = new TextDecoder().decode(rest.slice(valueStart))
          entries.push({ tag: 0, tagName: key, value: val, group: "other" })
        }
      }
    }

    if (typeStr === "eXIf" && length > 0) {
      const tiffResult = parseTiffData(buffer, dataStart)
      if (tiffResult) {
        return {
          ...tiffResult,
          entries: [...entries, ...tiffResult.entries],
          resolution: tiffResult.resolution ?? resolution,
          colorInfo: { ...colorInfo, ...tiffResult.colorInfo }
        }
      }
    }

    if (typeStr === "IEND") break

    offset += 12 + length
  }

  return {
    entries,
    gps: null,
    resolution,
    colorInfo,
    timeInfo: {},
    orientation: null,
    software: null
  }
}

export function parseExifData(buffer: ArrayBuffer, mimeType: string): ParsedExifData | null {
  try {
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      return parseJpegExif(buffer)
    }
    if (mimeType === "image/png") {
      return parsePngMetadata(buffer)
    }
    if (mimeType === "image/webp") {
      return parseWebpExif(buffer)
    }
    return null
  } catch {
    return null
  }
}

export { ORIENTATION_MAP }
