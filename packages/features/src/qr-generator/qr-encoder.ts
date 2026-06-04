import type {
  QrType,
  QrDataMap,
  UrlFields,
  TextFields,
  EmailFields,
  PhoneFields,
  SmsFields,
  WifiFields,
  VCardFields,
  EventFields,
  MessagingFields,
} from "./types";

function escapeWifiString(val: string): string {
  return (val || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,");
}

/**
 * Folds a vCard/iCal line to max 75 octets per RFC 6350 / RFC 5545.
 * Continuation lines start with a single space.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  // First chunk: 75 chars
  chunks.push(line.substring(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(" " + line.substring(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

/**
 * Escape vCard text values: backslash, comma, semicolon, newline per RFC 6350
 */
function escapeVCardText(val: string): string {
  return (val || "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

/**
 * Convert an HTML datetime-local string (YYYY-MM-DDTHH:mm) to
 * iCal format (YYYYMMDDTHHmm00). Returns empty string if input is empty.
 */
function formatICalDate(localDateTime: string): string {
  if (!localDateTime) return "";
  // Remove dashes and colons, keep the "T" separator
  const clean = localDateTime.replace(/[-:]/g, "");
  // Append seconds if missing (HHmm -> HHmm00)
  const tIdx = clean.indexOf("T");
  if (tIdx !== -1) {
    const timePart = clean.substring(tIdx + 1);
    if (timePart.length === 4) return clean + "00";
  }
  return clean;
}

/**
 * Generate a simple UUID v4-like UID for VEVENT. Not cryptographically
 * secure, but sufficient to satisfy RFC 5545's uniqueness requirement
 * within the scope of a generated QR code.
 */
function generateUid(title: string, startDate: string): string {
  const base = `${title}-${startDate}`.replace(/\s+/g, "-").toLowerCase();
  const rand = Math.random().toString(36).substring(2, 10);
  return `${base}-${rand}@imify`;
}

export const QR_ENCODERS: {
  [K in QrType]: (data: QrDataMap[K]) => string;
} = {
  url: (data) => {
    const fields = data as UrlFields;
    let url = fields.url || "";
    if (url && !/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    return url;
  },
  text: (data) => {
    const fields = data as TextFields;
    return fields.text || "";
  },
  email: (data) => {
    const fields = data as EmailFields;
    const subject = encodeURIComponent(fields.subject || "");
    const body = encodeURIComponent(fields.body || "");

    let mailto = `mailto:${fields.to || ""}`;
    const params: string[] = [];
    if (fields.subject) params.push(`subject=${subject}`);
    if (fields.body) params.push(`body=${body}`);

    if (params.length > 0) {
      mailto += `?${params.join("&")}`;
    }
    return mailto;
  },
  phone: (data) => {
    const fields = data as PhoneFields;
    return `tel:${fields.phone || ""}`;
  },
  sms: (data) => {
    const fields = data as SmsFields;
    return `SMSTO:${fields.phone || ""}:${fields.message || ""}`;
  },
  wifi: (data) => {
    const fields = data as WifiFields;
    const ssid = escapeWifiString(fields.ssid);
    const password = escapeWifiString(fields.password);
    const encryption = fields.encryption || "nopass";
    const hidden = fields.hidden ? ";H:true" : "";
    return `WIFI:S:${ssid};T:${encryption};P:${password}${hidden};;`;
  },
  vcard: (data) => {
    const fields = (data || {}) as VCardFields;
    const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

    const fName = fields.firstName || "";
    const lName = fields.lastName || "";
    // N and FN are required by RFC 6350
    lines.push(`N:${escapeVCardText(lName)};${escapeVCardText(fName)};;;`);
    const fn = [fName, lName].filter(Boolean).join(" ").trim() || "Unknown";
    lines.push(`FN:${escapeVCardText(fn)}`);

    if (fields.organization) {
      lines.push(`ORG:${escapeVCardText(fields.organization)}`);
    }
    if (fields.title) {
      lines.push(`TITLE:${escapeVCardText(fields.title)}`);
    }

    // Phone numbers with correct TYPE parameters (RFC 6350)
    if (fields.phoneMobile) {
      lines.push(`TEL;TYPE=CELL,VOICE:${fields.phoneMobile}`);
    }
    if (fields.phoneWork) {
      lines.push(`TEL;TYPE=WORK,VOICE:${fields.phoneWork}`);
    }
    if (fields.phoneHome) {
      lines.push(`TEL;TYPE=HOME,VOICE:${fields.phoneHome}`);
    }
    if (fields.phoneFax) {
      lines.push(`TEL;TYPE=FAX:${fields.phoneFax}`);
    }

    if (fields.email) {
      lines.push(`EMAIL;TYPE=INTERNET:${fields.email}`);
    }
    if (fields.url) {
      lines.push(`URL:${fields.url}`);
    }

    // Address: ADR;TYPE=WORK:PO Box;Extended;Street;City;State;Zip;Country
    const street = fields.addressStreet || "";
    const city = fields.addressCity || "";
    const state = fields.addressState || "";
    const zip = fields.addressZip || "";
    const country = fields.addressCountry || "";
    if (street || city || state || zip || country) {
      lines.push(
        `ADR;TYPE=HOME:;;${escapeVCardText(street)};${escapeVCardText(city)};${escapeVCardText(state)};${escapeVCardText(zip)};${escapeVCardText(country)}`
      );
    }

    if (fields.note) {
      lines.push(`NOTE:${escapeVCardText(fields.note)}`);
    }

    lines.push("END:VCARD");
    // Fold long lines and join with CRLF per RFC 6350
    return lines.map(foldLine).join("\r\n");
  },
  event: (data) => {
    const fields = (data || {}) as EventFields;
    const dtStart = formatICalDate(fields.startDate);
    const dtEnd = formatICalDate(fields.endDate);

    // DTSTAMP = current UTC time (required by RFC 5545)
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dtstamp = [
      now.getUTCFullYear(),
      pad(now.getUTCMonth() + 1),
      pad(now.getUTCDate()),
      "T",
      pad(now.getUTCHours()),
      pad(now.getUTCMinutes()),
      pad(now.getUTCSeconds()),
      "Z",
    ].join("");

    const uid = generateUid(fields.title || "event", fields.startDate || dtstamp);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Imify//QR Generator//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
    ];

    if (fields.title) {
      lines.push(`SUMMARY:${escapeVCardText(fields.title)}`);
    }
    if (dtStart) lines.push(`DTSTART:${dtStart}`);
    if (dtEnd) lines.push(`DTEND:${dtEnd}`);
    if (fields.location) {
      lines.push(`LOCATION:${escapeVCardText(fields.location)}`);
    }
    if (fields.description) {
      lines.push(`DESCRIPTION:${escapeVCardText(fields.description)}`);
    }
    if (fields.url) {
      lines.push(`URL:${fields.url}`);
    }

    // VALARM — reminder before event
    const reminder = typeof fields.reminderMinutes === "number" ? fields.reminderMinutes : -1;
    if (reminder >= 0) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:Reminder: ${escapeVCardText(fields.title || "Event")}`);
      // TRIGGER is negative duration before DTSTART
      const h = Math.floor(reminder / 60);
      const m = reminder % 60;
      const trigger = h > 0 ? `-PT${h}H${m > 0 ? `${m}M` : ""}` : `-PT${m}M`;
      lines.push(`TRIGGER:${trigger}`);
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
    lines.push("END:VCALENDAR");

    // Fold long lines and join with CRLF per RFC 5545
    return lines.map(foldLine).join("\r\n");
  },
  messaging: (data) => {
    const fields = (data || {}) as MessagingFields;
    const platform = fields.platform || "whatsapp";
    const recipient = fields.recipient || "";
    const message = fields.message || "";

    if (platform === "whatsapp") {
      const cleanNum = recipient.replace(/\D/g, "");
      const text = message ? `?text=${encodeURIComponent(message)}` : "";
      return `https://wa.me/${cleanNum}${text}`;
    } else if (platform === "telegram") {
      const username = recipient.replace(/^@/, "");
      return `https://t.me/${username}`;
    } else if (platform === "zalo") {
      const cleanPhone = recipient.replace(/\D/g, "");
      return `https://zalo.me/${cleanPhone}`;
    }
    return "";
  },
};

export function encodeQrData(type: QrType, data: QrDataMap[QrType]): string {
  const encoder = QR_ENCODERS[type] as (d: typeof data) => string;
  return encoder ? encoder(data) : "";
}
