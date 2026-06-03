import type { QrType, QrDataMap, UrlFields, TextFields, EmailFields, PhoneFields, SmsFields, WifiFields, VCardFields } from "./types"

function escapeWifiString(val: string): string {
  return (val || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/,/g, "\\,")
}

export const QR_ENCODERS: {
  [K in QrType]: (data: QrDataMap[K]) => string
} = {
  url: (data) => {
    const fields = data as UrlFields
    let url = fields.url || ""
    if (url && !/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }
    return url
  },
  text: (data) => {
    const fields = data as TextFields
    return fields.text || ""
  },
  email: (data) => {
    const fields = data as EmailFields
    const to = encodeURIComponent(fields.to || "")
    const subject = encodeURIComponent(fields.subject || "")
    const body = encodeURIComponent(fields.body || "")
    
    let mailto = `mailto:${fields.to || ""}`
    const params: string[] = []
    if (fields.subject) params.push(`subject=${subject}`)
    if (fields.body) params.push(`body=${body}`)
    
    if (params.length > 0) {
      mailto += `?${params.join("&")}`
    }
    return mailto
  },
  phone: (data) => {
    const fields = data as PhoneFields
    return `tel:${fields.phone || ""}`
  },
  sms: (data) => {
    const fields = data as SmsFields
    // Format SMSTO:num:msg
    return `SMSTO:${fields.phone || ""}:${fields.message || ""}`
  },
  wifi: (data) => {
    const fields = data as WifiFields
    const ssid = escapeWifiString(fields.ssid)
    const password = escapeWifiString(fields.password)
    const encryption = fields.encryption || "nopass"
    return `WIFI:S:${ssid};T:${encryption};P:${password};;`
  },
  vcard: (data) => {
    const fields = data as VCardFields
    const lines = ["BEGIN:VCARD", "VERSION:3.0"]
    
    const fName = fields.firstName || ""
    const lName = fields.lastName || ""
    if (fName || lName) {
      lines.push(`N:${lName};${fName};;;`)
      lines.push(`FN:${fName} ${lName}`.trim())
    }
    
    if (fields.organization) lines.push(`ORG:${fields.organization}`)
    if (fields.title) lines.push(`TITLE:${fields.title}`)
    if (fields.phoneMobile) lines.push(`TEL;TYPE=CELL:${fields.phoneMobile}`)
    if (fields.phoneWork) lines.push(`TEL;TYPE=WORK:${fields.phoneWork}`)
    if (fields.email) lines.push(`EMAIL;TYPE=PREF,INTERNET:${fields.email}`)
    if (fields.url) lines.push(`URL:${fields.url}`)
    
    const street = fields.addressStreet || ""
    const city = fields.addressCity || ""
    const state = fields.addressState || ""
    const zip = fields.addressZip || ""
    const country = fields.addressCountry || ""
    if (street || city || state || zip || country) {
      lines.push(`ADR;TYPE=WORK:;;${street};${city};${state};${zip};${country}`)
    }
    
    if (fields.note) lines.push(`NOTE:${fields.note}`)
    
    lines.push("END:VCARD")
    return lines.join("\n")
  }
}

export function encodeQrData(type: QrType, data: QrDataMap[QrType]): string {
  const encoder = QR_ENCODERS[type] as (d: typeof data) => string
  return encoder ? encoder(data) : ""
}
