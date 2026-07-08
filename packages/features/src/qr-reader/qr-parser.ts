export type ParsedQrType =
  | "url"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "vcard"
  | "event"
  | "messaging"
  | "text"

export interface ParsedWifi {
  ssid: string
  password?: string
  encryption?: string
  hidden?: boolean
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
  phoneHome?: string
  phoneFax?: string
  email?: string
  url?: string
  address?: string
  note?: string
}

export interface ParsedEvent {
  title?: string
  startDate?: string   // raw iCal string e.g. "20260604T213000"
  endDate?: string
  location?: string
  description?: string
  url?: string
  alarm?: string
}

export interface ParsedMessaging {
  platform: "whatsapp" | "telegram" | "zalo"
  recipient: string   // phone or @username
  message?: string
}

export interface ParsedQrResult {
  type: ParsedQrType
  raw: string
  label: string
  wifiData?: ParsedWifi
  emailData?: ParsedEmail
  smsData?: ParsedSms
  vcardData?: ParsedVCard
  eventData?: ParsedEvent
  messagingData?: ParsedMessaging
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function unescapeWifiString(val: string): string {
  return (val || "")
    .replace(/\\\\/g, "\\")
    .replace(/\\;/g, ";")
    .replace(/\\:/g, ":")
    .replace(/\\,/g, ",")
}

/**
 * Unescape vCard / iCal text values (backslash sequences per RFC 6350).
 */
function unescapeVCardText(val: string): string {
  return (val || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

/**
 * Strip parameter block from a property key.
 * e.g. "TEL;TYPE=CELL,VOICE" → "TEL"
 *      "N;CHARSET=UTF-8"      → "N"
 */
function stripParams(key: string): string {
  return key.split(";")[0].toUpperCase()
}

/**
 * Get the raw parameter string from a property key (everything after first ";").
 */
function getParams(key: string): string {
  const idx = key.indexOf(";")
  return idx === -1 ? "" : key.substring(idx + 1).toUpperCase()
}

/**
 * Format an iCal date string for display.
 * Input: "20260604T213000" or "20260604T213000Z"
 * Output: "2026-06-04 21:30"
 */
export function formatICalDateForDisplay(raw: string): string {
  if (!raw) return ""
  const clean = raw.replace("Z", "")
  const datePart = clean.substring(0, 8)
  const timePart = clean.substring(9, 13) // HHmm

  const year = datePart.substring(0, 4)
  const month = datePart.substring(4, 6)
  const day = datePart.substring(6, 8)

  if (!timePart || timePart.length < 4) {
    return `${year}-${month}-${day}`
  }
  const hh = timePart.substring(0, 2)
  const mm = timePart.substring(2, 4)
  return `${year}-${month}-${day} ${hh}:${mm}`
}

export function formatICalTrigger(trigger: string, t: any): string {
  if (!trigger) return "";
  const clean = trigger.trim();
  if (/^PT0S$/i.test(clean)) {
    return t("sidebar.fields.alarmOptions.atTime", "Vào lúc diễn ra sự kiện");
  }

  const match = clean.match(/^([+-]?)P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!match) return clean;

  const sign = match[1];
  const days = match[2] ? parseInt(match[2], 10) : 0;
  const hours = match[3] ? parseInt(match[3], 10) : 0;
  const minutes = match[4] ? parseInt(match[4], 10) : 0;
  const seconds = match[5] ? parseInt(match[5], 10) : 0;

  const isBefore = sign === "" || sign === "-";

  let timeStr = "";
  if (days > 0) {
    timeStr = t("sidebar.fields.alarmOptions.days", { count: days }, `${days} ngày`);
  } else if (hours > 0) {
    timeStr = t("sidebar.fields.alarmOptions.hours", { count: hours }, `${hours} giờ`);
  } else if (minutes > 0) {
    timeStr = t("sidebar.fields.alarmOptions.minutes", { count: minutes }, `${minutes} phút`);
  } else if (seconds > 0) {
    timeStr = t("sidebar.fields.alarmOptions.seconds", { count: seconds }, `${seconds} giây`);
  }

  if (timeStr) {
    return isBefore
      ? t("sidebar.fields.alarmOptions.before", { time: timeStr }, `${timeStr} trước`)
      : t("sidebar.fields.alarmOptions.after", { time: timeStr }, `${timeStr} sau`);
  }

  return clean;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseQrString(raw: string): ParsedQrResult {
  const trimmed = (raw || "").trim()

  // 1. vCard ----------------------------------------------------------------
  if (/^BEGIN:VCARD/i.test(trimmed)) {
    // Unfold continuation lines (RFC 6350: CRLF or LF followed by a space/tab)
    const unfolded = trimmed.replace(/\r?\n[ \t]/g, "")
    const lines = unfolded.split(/\r?\n/)
    const result: ParsedVCard = {}
    let firstName = ""
    let lastName = ""

    for (const line of lines) {
      const colonIdx = line.indexOf(":")
      if (colonIdx === -1) continue

      const rawKey = line.substring(0, colonIdx)
      const val = line.substring(colonIdx + 1).trim()
      const baseKey = stripParams(rawKey)
      const params = getParams(rawKey)

      if (baseKey === "N") {
        const parts = val.split(";")
        lastName = unescapeVCardText(parts[0] || "")
        firstName = unescapeVCardText(parts[1] || "")
      } else if (baseKey === "FN") {
        result.name = unescapeVCardText(val)
      } else if (baseKey === "ORG") {
        result.org = unescapeVCardText(val)
      } else if (baseKey === "TITLE") {
        result.title = unescapeVCardText(val)
      } else if (baseKey === "TEL") {
        if (params.includes("CELL") || params.includes("MOBILE")) {
          result.phoneMobile = val
        } else if (params.includes("FAX")) {
          result.phoneFax = val
        } else if (params.includes("HOME")) {
          result.phoneHome = val
        } else if (params.includes("WORK")) {
          result.phoneWork = val
        } else if (!result.phoneMobile) {
          result.phoneMobile = val
        }
      } else if (baseKey === "EMAIL") {
        result.email = val
      } else if (baseKey === "URL") {
        result.url = val
      } else if (baseKey === "ADR") {
        const parts = val.split(";").map((p) => unescapeVCardText(p).trim()).filter(Boolean)
        result.address = parts.join(", ")
      } else if (baseKey === "NOTE") {
        result.note = unescapeVCardText(val)
      }
    }

    if (!result.name && (firstName || lastName)) {
      result.name = `${firstName} ${lastName}`.trim()
    }

    return {
      type: "vcard",
      raw,
      label: "Contact Card (vCard)",
      vcardData: result,
    }
  }

  // 2. Calendar Event (iCal / VCALENDAR) ------------------------------------
  if (/^BEGIN:VCALENDAR/i.test(trimmed)) {
    const unfolded = trimmed.replace(/\r?\n[ \t]/g, "")
    const lines = unfolded.split(/\r?\n/)
    const result: ParsedEvent = {}
    let inEvent = false
    let inAlarm = false

    for (const line of lines) {
      const upper = line.toUpperCase()
      if (upper === "BEGIN:VEVENT") { inEvent = true; continue }
      if (upper === "END:VEVENT") { inEvent = false; continue }
      if (upper === "BEGIN:VALARM") { inAlarm = true; continue }
      if (upper === "END:VALARM") { inAlarm = false; continue }
      if (!inEvent) continue

      const colonIdx = line.indexOf(":")
      if (colonIdx === -1) continue

      const rawKey = line.substring(0, colonIdx)
      const val = line.substring(colonIdx + 1).trim()
      const baseKey = stripParams(rawKey)

      if (inAlarm) {
        if (baseKey === "TRIGGER") {
          result.alarm = val
        }
      } else {
        if (baseKey === "SUMMARY") result.title = unescapeVCardText(val)
        else if (baseKey === "DTSTART") result.startDate = val
        else if (baseKey === "DTEND") result.endDate = val
        else if (baseKey === "LOCATION") result.location = unescapeVCardText(val)
        else if (baseKey === "DESCRIPTION") result.description = unescapeVCardText(val)
        else if (baseKey === "URL") result.url = val
      }
    }

    return {
      type: "event",
      raw,
      label: "Calendar Event",
      eventData: result,
    }
  }

  // 3. Wi-Fi ----------------------------------------------------------------
  if (/^WIFI:/i.test(trimmed)) {
    const content = trimmed.substring(5)
    const result: ParsedWifi = { ssid: "" }
    const parts = content.split(/(?<!\\);/)

    for (const part of parts) {
      if (part.startsWith("S:")) result.ssid = unescapeWifiString(part.substring(2))
      else if (part.startsWith("P:")) result.password = unescapeWifiString(part.substring(2))
      else if (part.startsWith("T:")) result.encryption = part.substring(2)
      else if (part.startsWith("H:")) result.hidden = part.substring(2).toLowerCase() === "true"
    }

    return { type: "wifi", raw, label: "Wi-Fi Network Settings", wifiData: result }
  }

  // 4. Email ----------------------------------------------------------------
  if (/^mailto:/i.test(trimmed)) {
    const url = new URL(trimmed)
    const to = url.pathname
    const subject = url.searchParams.get("subject") || undefined
    const body = url.searchParams.get("body") || undefined
    return { type: "email", raw, label: "Email Message", emailData: { to, subject, body } }
  }

  // 5. SMS ------------------------------------------------------------------
  if (/^smsto:/i.test(trimmed)) {
    const parts = trimmed.substring(6).split(":")
    const phone = parts[0] || ""
    const message = parts.slice(1).join(":")
    return { type: "sms", raw, label: "SMS Message", smsData: { phone, message: message || undefined } }
  }

  // 6. Phone ----------------------------------------------------------------
  if (/^tel:/i.test(trimmed)) {
    return { type: "phone", raw, label: "Phone Number" }
  }

  // 7. Messaging deep links -------------------------------------------------
  // WhatsApp: https://wa.me/1234567890?text=Hello
  const waMatch = trimmed.match(/^https?:\/\/wa\.me\/([^?]+)(\?text=(.*))?/i)
  if (waMatch) {
    const recipient = waMatch[1] || ""
    const message = waMatch[3] ? decodeURIComponent(waMatch[3]) : undefined
    return {
      type: "messaging",
      raw,
      label: "WhatsApp Message",
      messagingData: { platform: "whatsapp", recipient, message },
    }
  }

  // Telegram: https://t.me/username  or  tg://resolve?domain=username
  const tgMatchHttps = trimmed.match(/^https?:\/\/t\.me\/([^?/]+)/i)
  const tgMatchDeep = trimmed.match(/^tg:\/\/resolve\?domain=([^&]+)/i)
  if (tgMatchHttps || tgMatchDeep) {
    const recipient = (tgMatchHttps?.[1] || tgMatchDeep?.[1] || "").replace(/^@/, "")
    return {
      type: "messaging",
      raw,
      label: "Telegram Message",
      messagingData: { platform: "telegram", recipient },
    }
  }

  // Zalo: https://zalo.me/phone
  const zaloMatch = trimmed.match(/^https?:\/\/zalo\.me\/([0-9+]+)/i)
  if (zaloMatch) {
    const recipient = zaloMatch[1] || ""
    return {
      type: "messaging",
      raw,
      label: "Zalo Message",
      messagingData: { platform: "zalo", recipient },
    }
  }

  // 8. URL ------------------------------------------------------------------
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^([\da-z.-]+)\.([\da-z]{2,6})([/?].*)?$/i.test(trimmed)
  ) {
    return { type: "url", raw, label: "Web Link (URL)" }
  }

  // 9. Plain Text -----------------------------------------------------------
  return { type: "text", raw, label: "Plain Text" }
}
