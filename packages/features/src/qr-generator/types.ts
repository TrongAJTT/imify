export type QrType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard"

export interface UrlFields {
  url: string
}

export interface TextFields {
  text: string
}

export interface EmailFields {
  to: string
  subject: string
  body: string
}

export interface PhoneFields {
  phone: string
}

export interface SmsFields {
  phone: string
  message: string
}

export interface WifiFields {
  ssid: string
  password: string
  encryption: "WPA" | "WEP" | "nopass"
  hidden?: boolean
}

export interface VCardFields {
  firstName: string
  lastName: string
  organization: string
  title: string
  phoneMobile: string
  phoneWork: string
  email: string
  url: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  addressCountry: string
  note: string
}

export interface QrDataMap {
  url: UrlFields
  text: TextFields
  email: EmailFields
  phone: PhoneFields
  sms: SmsFields
  wifi: WifiFields
  vcard: VCardFields
}

export interface QrConfig {
  type: QrType
  data: QrDataMap[QrType]
  size: number
  bgColor: string
  fgColor: string
  includeLogo: boolean
  logoUrl: string | null
  logoWidth: number
  logoHeight: number
  excavateLogo: boolean
  errorCorrectionLevel: "L" | "M" | "Q" | "H"

  // Design
  qrMargin: number
  dotType: QrDotType
  markerBorderType: QrMarkerBorderType
  markerCenterType: QrMarkerCenterType
  syncMarkerBorderColorWithForeground: boolean
  markerBorderColor: string
  syncMarkerCenterColorWithForeground: boolean
  markerCenterColor: string

  // Frame
  frameStyle: FrameStyleType
  frameText: string
  frameTextScale: number
  frameFontFamily: string
  frameFontId: string
  syncFrameColorWithForeground: boolean
  frameColor: string
  syncTextColorWithBackground: boolean
  frameTextColor: string
}

// --- DESIGN MODULE ---
export type QrDotType = "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded"
export type QrMarkerBorderType = "square" | "dot" | "extra-rounded"
export type QrMarkerCenterType = "square" | "dot"

// --- FRAME MODULE ---
export type FrameStyleType = "none" | "border" | "bottom" | "top" | "tooltip" | "ribbon"

