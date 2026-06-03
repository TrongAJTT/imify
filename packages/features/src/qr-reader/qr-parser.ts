export type ParsedQrType = "url" | "email" | "phone" | "sms" | "wifi" | "vcard" | "text"

export interface ParsedWifi {
  ssid: string
  password?: string
  encryption?: string
}

export interface ParsedEmail {
  to: string
  subject?: string
  body?: string
}

export interface ParsedSms {
  phone: string
  message?: string
}

export interface ParsedVCard {
  name?: string
  org?: string
  title?: string
  phoneMobile?: string
  phoneWork?: string
  email?: string
  url?: string
  address?: string
  note?: string
}

export interface ParsedQrResult {
  type: ParsedQrType
  raw: string
  label: string
  wifiData?: ParsedWifi
  emailData?: ParsedEmail
  smsData?: ParsedSms
  vcardData?: ParsedVCard
}

function unescapeWifiString(val: string): string {
  return (val || "").replace(/\\\\/g, "\\").replace(/\\;/g, ";").replace(/\\:/g, ":").replace(/\\,/g, ",")
}

export function parseQrString(raw: string): ParsedQrResult {
  const trimmed = (raw || "").trim()

  // 1. Check vCard
  if (/^BEGIN:VCARD/i.test(trimmed)) {
    const lines = trimmed.split(/\r?\n/)
    const result: ParsedVCard = {}
    let firstName = ""
    let lastName = ""

    lines.forEach((line) => {
      const match = line.match(/^([^:]+):(.*)$/)
      if (!match) return
      
      const key = match[1].toUpperCase()
      const val = match[2]

      if (key.startsWith("N") && !key.startsWith("NOTE")) {
        const parts = val.split(";")
        lastName = parts[0] || ""
        firstName = parts[1] || ""
      } else if (key.startsWith("FN")) {
        result.name = val
      } else if (key.startsWith("ORG")) {
        result.org = val
      } else if (key.startsWith("TITLE")) {
        result.title = val
      } else if (key.startsWith("TEL;TYPE=CELL") || (key.startsWith("TEL") && key.includes("CELL"))) {
        result.phoneMobile = val
      } else if (key.startsWith("TEL;TYPE=WORK") || (key.startsWith("TEL") && key.includes("WORK"))) {
        result.phoneWork = val
      } else if (key.startsWith("TEL") && !result.phoneMobile && !result.phoneWork) {
        result.phoneMobile = val
      } else if (key.startsWith("EMAIL")) {
        result.email = val
      } else if (key.startsWith("URL")) {
        result.url = val
      } else if (key.startsWith("ADR")) {
        // ADR:;;Street;City;State;Zip;Country
        const parts = val.split(";").map(p => p.trim()).filter(Boolean)
        result.address = parts.join(", ")
      } else if (key.startsWith("NOTE")) {
        result.note = val
      }
    })

    if (!result.name && (firstName || lastName)) {
      result.name = `${firstName} ${lastName}`.trim()
    }

    return {
      type: "vcard",
      raw,
      label: "Contact Card (vCard)",
      vcardData: result
    }
  }

  // 2. Check Wi-Fi
  if (/^WIFI:/i.test(trimmed)) {
    // Format: WIFI:S:ssid;T:encryption;P:password;;
    const content = trimmed.substring(5)
    const result: ParsedWifi = { ssid: "" }
    
    // Split by semicolons, but account for escaped semicolons
    const parts = content.split(/(?<!\\);/)
    parts.forEach((part) => {
      if (part.startsWith("S:")) {
        result.ssid = unescapeWifiString(part.substring(2))
      } else if (part.startsWith("P:")) {
        result.password = unescapeWifiString(part.substring(2))
      } else if (part.startsWith("T:")) {
        result.encryption = part.substring(2)
      }
    })

    return {
      type: "wifi",
      raw,
      label: "Wi-Fi Network Settings",
      wifiData: result
    }
  }

  // 3. Check Email
  if (/^mailto:/i.test(trimmed)) {
    const url = new URL(trimmed)
    const to = url.pathname
    const subject = url.searchParams.get("subject") || undefined
    const body = url.searchParams.get("body") || undefined
    return {
      type: "email",
      raw,
      label: "Email Message",
      emailData: { to, subject, body }
    }
  }

  // 4. Check SMS
  if (/^smsto:/i.test(trimmed)) {
    // Format: SMSTO:phone:message
    const parts = trimmed.substring(6).split(":")
    const phone = parts[0] || ""
    const message = parts.slice(1).join(":")
    return {
      type: "sms",
      raw,
      label: "SMS Message",
      smsData: { phone, message }
    }
  }

  // 5. Check Phone
  if (/^tel:/i.test(trimmed)) {
    return {
      type: "phone",
      raw,
      label: "Phone Number"
    }
  }

  // 6. Check URL
  if (/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return {
      type: "url",
      raw,
      label: "Web Link (URL)"
    }
  }

  // 7. Fallback to Plain Text
  return {
    type: "text",
    raw,
    label: "Plain Text"
  }
}
