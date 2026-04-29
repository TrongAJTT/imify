export interface InspectorImageData {
  file: File
  url: string
  bitmap: ImageBitmap
  arrayBuffer: ArrayBuffer
}

export interface BasicInfo {
  fileName: string
  format: string
  mimeType: string
  fileSize: number
}

export interface DimensionInfo {
  width: number
  height: number
  megapixels: number
  aspectRatio: string
  aspectRatioDecimal: number
  matchedStandards: string[]
  orientation: "landscape" | "portrait" | "square"
}

export interface ResolutionInfo {
  xDpi: number
  yDpi: number
  unit: string
}

export interface ColorInfo {
  colorSpace: string
  bitDepth: number | null
  chromaSubsampling: string | null
  hasAlpha: boolean
  iccProfileName: string | null
  iccWarning: string | null
}

export interface TimeInfo {
  lastModified: Date
  exifDateTime: string | null
  exifDateTimeOriginal: string | null
  exifDateTimeDigitized: string | null
}

export interface GpsInfo {
  latitude: number
  longitude: number
  altitude: number | null
  latitudeRef: string
  longitudeRef: string
  latitudeDms: string
  longitudeDms: string
}

export interface PaletteColor {
  hex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  percentage: number
}

export type PreviewChannelMode = "all" | "red" | "green" | "blue" | "alpha"
export type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia"

export interface HistogramData {
  luminance: number[]
  red: number[]
  green: number[]
  blue: number[]
  peak: number
  shadowClipPercent: number
  highlightClipPercent: number
}

export interface WebPerformanceSuggestion {
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  estimatedSavingsPercent?: number
  recommendedFormat?: "mozjpeg" | "webp" | "avif"
}

export interface WebPerformanceReport {
  score: "good" | "needs-work" | "poor"
  summary: string
  suggestions: WebPerformanceSuggestion[]
  histogram: HistogramData
}

export interface PrivacyAlert {
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  field?: string
}

export interface ExifEntry {
  tag: number
  tagName: string
  value: string | number | number[]
  group: ExifGroup
}

export type ExifGroup = "image" | "photo" | "gps" | "icc" | "other"

export interface InspectorResult {
  basic: BasicInfo
  dimensions: DimensionInfo
  resolution: ResolutionInfo | null
  color: ColorInfo
  time: TimeInfo
  gps: GpsInfo | null
  palette: PaletteColor[]
  exifEntries: ExifEntry[]
  privacyAlerts: PrivacyAlert[]
  softwareTags: string[]
  thumbHash: string | null
  webPerformance: WebPerformanceReport
}

export type ColorDisplayFormat = "hex" | "rgb" | "hsl"
