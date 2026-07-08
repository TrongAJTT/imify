import React, { useState } from "react";
import { parseQrString, formatICalDateForDisplay, formatICalTrigger } from "./qr-parser";
import { Button, Tooltip } from "@imify/ui";
import { useToast } from "@imify/core/hooks/use-toast";
import { useTranslation } from "@imify/i18n";
import {
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  Wifi,
  Eye,
  EyeOff,
  User,
  Calendar,
  MessageCircle,
  Copy,
  Printer,
  MapPin,
  AlignLeft,
  Clock,
  FileText,
  Bell,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Small reusable field row for structured QR data display
// ---------------------------------------------------------------------------
function FieldRow({
  icon,
  label,
  value,
  mono = false,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
      {icon && <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`text-xs font-medium select-all break-all leading-snug ${
            onClick
              ? "text-blue-500 hover:underline cursor-pointer"
              : "text-slate-800 dark:text-slate-200"
          } ${mono ? "font-mono" : ""}`}
          onClick={onClick}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

const PLATFORM_META: Record<
  string,
  { label: string; color: string; iconColor: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    color:
      "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    iconColor: "text-green-500",
  },
  telegram: {
    label: "Telegram",
    color:
      "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    iconColor: "text-sky-500",
  },
  zalo: {
    label: "Zalo",
    color:
      "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
};

interface QrActionsPanelProps {
  raw: string;
  className?: string;
  buttonSizeClassName?: string;
}

export function QrActionsPanel({
  raw,
  className,
  buttonSizeClassName = "text-xs h-9",
}: QrActionsPanelProps) {
  const { t } = useTranslation("qrReader");
  const { success, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        success(t("workspace.copied"), t("sidebar.copied"));
      })
      .catch(() => {
        error(t("workspace.errorHeader"), t("workspace.copyFailed"));
      });
  };

  const parsed = parseQrString(raw);

  switch (parsed.type) {
    // ── URL ──────────────────────────────────────────────────────────────
    case "url": {
      const cleanUrl = parsed.raw.startsWith("http")
        ? parsed.raw
        : `https://${parsed.raw}`;

      const handleCheckReputation = () => {
        navigator.clipboard
          .writeText(cleanUrl)
          .then(() => {
            success(t("sidebar.copiedUrl"), t("sidebar.redirectingUrlVoid"));
            setTimeout(() => {
              window.open(
                "https://www.urlvoid.com/",
                "_blank",
                "noopener,noreferrer",
              );
            }, 2000);
          })
          .catch(() => {
            error(t("workspace.errorHeader"), t("sidebar.copyUrlFailed"));
          });
      };

      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <Button
            onClick={() =>
              window.open(cleanUrl, "_blank", "noopener,noreferrer")
            }
            className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
          >
            <ExternalLink size={14} />
            <span>{t("sidebar.openBrowserLink")}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={handleCheckReputation}
            className={`w-full flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${buttonSizeClassName}`}
          >
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>{t("sidebar.checkReputation")}</span>
            <span onClick={(e) => e.stopPropagation()} className="inline-flex ml-1">
              <Tooltip variant="wide1" content={t("sidebar.urlVoidTooltip")}>
                <HelpCircle
                  size={13}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-help"
                />
              </Tooltip>
            </span>
          </Button>
        </div>
      );
    }

    // ── EMAIL ─────────────────────────────────────────────────────────────
    case "email": {
      const email = parsed.emailData;
      if (!email) return null;
      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <div className="flex flex-col gap-2">
            <FieldRow label={t("sidebar.fields.to")} value={email.to} />
            {email.subject && (
              <FieldRow
                label={t("sidebar.fields.subject")}
                value={email.subject}
              />
            )}
          </div>
          {email.body && (
            <FieldRow label={t("sidebar.fields.body")} value={email.body} />
          )}
          <Button
            onClick={() =>
              window.open(
                `mailto:${email.to}?subject=${encodeURIComponent(email.subject || "")}&body=${encodeURIComponent(email.body || "")}`,
              )
            }
            className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
          >
            <Mail size={14} />
            <span>{t("sidebar.draftEmail")}</span>
          </Button>
        </div>
      );
    }

    // ── SMS ───────────────────────────────────────────────────────────────
    case "sms": {
      const sms = parsed.smsData;
      if (!sms) return null;
      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <div className="flex flex-col gap-2">
            <FieldRow label={t("sidebar.fields.phone")} value={sms.phone} />
            {sms.message && (
              <FieldRow
                label={t("sidebar.fields.message")}
                value={sms.message}
              />
            )}
          </div>
          <Button
            onClick={() =>
              window.open(
                `sms:${sms.phone}?body=${encodeURIComponent(sms.message || "")}`,
              )
            }
            className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
          >
            <MessageSquare size={14} />
            <span>{t("sidebar.sendSms")}</span>
          </Button>
        </div>
      );
    }

    // ── PHONE ─────────────────────────────────────────────────────────────
    case "phone": {
      const num = parsed.raw.startsWith("tel:")
        ? parsed.raw.substring(4)
        : parsed.raw;
      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <FieldRow label={t("sidebar.fields.phone")} value={num} />
          <Button
            onClick={() => window.open(`tel:${num}`)}
            className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
          >
            <Phone size={14} />
            <span>{t("sidebar.callNumber")}</span>
          </Button>
        </div>
      );
    }

    // ── WIFI ──────────────────────────────────────────────────────────────
    case "wifi": {
      const wifi = parsed.wifiData;
      if (!wifi) return null;
      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <div className="flex flex-col gap-2">
            <FieldRow
              icon={<Wifi size={14} />}
              label={t("sidebar.fields.ssid")}
              value={wifi.ssid}
            />
            {wifi.password && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 relative">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {t("sidebar.fields.password")}
                </span>
                <span className="font-mono font-medium text-xs text-slate-800 dark:text-slate-2050 select-all pr-8">
                  {showPassword ? wifi.password : "••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 bottom-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <FieldRow
              label={t("sidebar.fields.encryption")}
              value={wifi.encryption || t("sidebar.no")}
            />
            {wifi.hidden !== undefined && (
              <FieldRow
                label={t("sidebar.fields.hidden")}
                value={wifi.hidden ? t("sidebar.yes") : t("sidebar.no")}
              />
            )}
          </div>
          {wifi.password && (
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(wifi.password!)}
              className={`w-full flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${buttonSizeClassName}`}
            >
              <Copy size={14} />
              <span>{t("sidebar.copyPassword")}</span>
            </Button>
          )}
        </div>
      );
    }

    // ── VCARD ─────────────────────────────────────────────────────────────
    case "vcard": {
      const vcard = parsed.vcardData;
      if (!vcard) return null;
      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
            {vcard.name && (
              <FieldRow
                icon={<User size={14} />}
                label={t("sidebar.fields.name")}
                value={vcard.name}
              />
            )}
            {(vcard.title || vcard.org) && (
              <FieldRow
                icon={<FileText size={14} />}
                label={t("sidebar.fields.companyTitle")}
                value={[vcard.title, vcard.org].filter(Boolean).join(" — ")}
              />
            )}
            {vcard.phoneMobile && (
              <FieldRow
                icon={<Phone size={14} />}
                label={t("sidebar.fields.phoneMobile")}
                value={vcard.phoneMobile}
                onClick={() => window.open(`tel:${vcard.phoneMobile}`)}
              />
            )}
            {vcard.phoneWork && (
              <FieldRow
                icon={<Phone size={14} />}
                label={t("sidebar.fields.phoneWork")}
                value={vcard.phoneWork}
                onClick={() => window.open(`tel:${vcard.phoneWork}`)}
              />
            )}
            {vcard.phoneHome && (
              <FieldRow
                icon={<Phone size={14} />}
                label={t("sidebar.fields.phoneHome")}
                value={vcard.phoneHome}
                onClick={() => window.open(`tel:${vcard.phoneHome}`)}
              />
            )}
            {vcard.phoneFax && (
              <FieldRow
                icon={<Printer size={14} />}
                label={t("sidebar.fields.phoneFax")}
                value={vcard.phoneFax}
              />
            )}
            {vcard.email && (
              <FieldRow
                icon={<Mail size={14} />}
                label={t("sidebar.fields.email")}
                value={vcard.email}
                onClick={() => window.open(`mailto:${vcard.email}`)}
              />
            )}
            {vcard.url && (
              <FieldRow
                icon={<ExternalLink size={14} />}
                label={t("sidebar.fields.url")}
                value={vcard.url}
                onClick={() => window.open(vcard.url, "_blank")}
              />
            )}
            {vcard.address && (
              <FieldRow
                icon={<MapPin size={14} />}
                label={t("sidebar.fields.address")}
                value={vcard.address}
              />
            )}
            {vcard.note && (
              <FieldRow
                icon={<AlignLeft size={14} />}
                label={t("sidebar.fields.note")}
                value={vcard.note}
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            {vcard.phoneMobile && (
              <Button
                onClick={() => window.open(`tel:${vcard.phoneMobile}`)}
                className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
              >
                <Phone size={14} />
                <span>{t("sidebar.call")}</span>
              </Button>
            )}
            {vcard.email && (
              <Button
                onClick={() => window.open(`mailto:${vcard.email}`)}
                className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
              >
                <Mail size={14} />
                <span>{t("sidebar.email")}</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    // ── EVENT ─────────────────────────────────────────────────────────────
    case "event": {
      const ev = parsed.eventData;
      if (!ev) return null;

      const startDisplay = ev.startDate
        ? formatICalDateForDisplay(ev.startDate)
        : undefined;
      const endDisplay = ev.endDate
        ? formatICalDateForDisplay(ev.endDate)
        : undefined;

      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <div className="flex flex-col gap-2">
            {ev.title && (
              <FieldRow
                icon={<Calendar size={14} />}
                label={t("sidebar.fields.eventTitle")}
                value={ev.title}
              />
            )}
            {(startDisplay || endDisplay) && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-855">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Clock size={11} />
                  {t("sidebar.fields.dateTime")}
                </span>
                <div className="mt-1 space-y-0.5">
                  {startDisplay && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 shrink-0">
                        {t("sidebar.fields.from")}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {startDisplay}
                      </span>
                    </div>
                  )}
                  {endDisplay && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 shrink-0">
                        {t("sidebar.fields.toTime", "Đến")}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {endDisplay}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {ev.location && (
              <FieldRow
                icon={<MapPin size={14} />}
                label={t("sidebar.fields.location")}
                value={ev.location}
              />
            )}
            {ev.description && (
              <FieldRow
                icon={<AlignLeft size={14} />}
                label={t("sidebar.fields.description")}
                value={ev.description}
              />
            )}
            {ev.alarm && (
              <FieldRow
                icon={<Bell size={14} />}
                label={t("sidebar.fields.alarm", "Nhắc nhở")}
                value={formatICalTrigger(ev.alarm, t)}
              />
            )}
          </div>
          {ev.url && (
            <FieldRow
              icon={<ExternalLink size={14} />}
              label={t("sidebar.fields.url")}
              value={ev.url}
              onClick={() => window.open(ev.url, "_blank")}
            />
          )}
          <div className="flex flex-col gap-1.5 pt-1">
            <Button
              onClick={() => {
                const blob = new Blob([raw], {
                  type: "text/calendar;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${ev.title || "event"}.ics`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
            >
              <Calendar size={14} />
              <span>{t("sidebar.saveIcs")}</span>
            </Button>
            {ev.url && (
              <Button
                variant="secondary"
                onClick={() => window.open(ev.url, "_blank")}
                className={`w-full flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${buttonSizeClassName}`}
              >
                <ExternalLink size={14} />
                <span>{t("sidebar.openUrl")}</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    // ── MESSAGING ─────────────────────────────────────────────────────────
    case "messaging": {
      const msg = parsed.messagingData;
      if (!msg) return null;

      const meta = PLATFORM_META[msg.platform] ?? PLATFORM_META["whatsapp"];

      const openLink = () => {
        window.open(parsed.raw, "_blank", "noopener,noreferrer");
      };

      return (
        <div className={`flex flex-col gap-2 mt-1 ${className || ""}`}>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.color}`}
          >
            <MessageCircle size={12} />
            {meta.label}
          </div>
          <div className="flex flex-col gap-2">
            <FieldRow
              icon={<User size={14} />}
              label={
                msg.platform === "telegram"
                  ? t("sidebar.fields.recipient")
                  : t("sidebar.fields.phone")
              }
              value={msg.recipient}
            />
            {msg.message && (
              <FieldRow
                icon={<AlignLeft size={14} />}
                label={t("sidebar.fields.message")}
                value={msg.message}
              />
            )}
          </div>
          <Button
            onClick={openLink}
            className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
          >
            <MessageCircle size={14} />
            <span>
              {t("sidebar.openInPlatform", { platform: meta.label })}
            </span>
          </Button>
        </div>
      );
    }

    // ── TEXT (fallback) ───────────────────────────────────────────────────
    case "text":
    default:
      return (
        <div className={`space-y-3 mt-1 ${className || ""}`}>
          <Button
            onClick={() => copyToClipboard(raw)}
            className={`w-full flex items-center justify-center gap-1.5 ${buttonSizeClassName}`}
          >
            <Copy size={14} />
            <span>{t("sidebar.copyText")}</span>
          </Button>
        </div>
      );
  }
}
