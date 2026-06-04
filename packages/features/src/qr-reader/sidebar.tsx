import React, { useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  AccordionCard,
  Button,
  SecondaryButton,
  Tooltip,
  MutedText,
  ToastContainer,
} from "@imify/ui";
import {
  Copy,
  ExternalLink,
  User,
  Wifi,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  Eye,
  EyeOff,
  Sliders,
  ShieldCheck,
  HelpCircle,
  Calendar,
  MapPin,
  AlignLeft,
  MessageCircle,
  Clock,
  Printer,
} from "lucide-react";
import { useQrReaderStore } from "@imify/stores";
import { parseQrString, formatICalDateForDisplay } from "./qr-parser";
import { useToast } from "@imify/core/hooks/use-toast";

interface QrReaderSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

// ---------------------------------------------------------------------------
// Small reusable field row
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
      {icon && (
        <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`text-xs font-medium select-all break-all leading-snug ${
            onClick
              ? "text-blue-500 hover:underline cursor-pointer"
              : "text-slate-800 dark:text-slate-250"
          } ${mono ? "font-mono" : ""}`}
          onClick={onClick}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// Platform display helpers
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

export function QrReaderSidebar({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null,
}: QrReaderSidebarProps) {
  const { lastScanResult } = useQrReaderStore();
  const { toasts, success, error, hide } = useToast();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        success("Copied", "Copied to clipboard successfully");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        error("Error", "Failed to copy to clipboard");
      });
  };

  if (!lastScanResult) {
    return (
      <>
        <WorkspaceConfigSidebarPanel
          title="SCAN RESULTS"
          items={[
            {
              id: "no-result",
              label: "",
              content: (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-center space-y-2">
                  <MutedText className="text-xs font-medium">
                    No scan result yet.
                  </MutedText>
                  <MutedText className="text-[10px]">
                    Scan a QR code using your camera, screen capture, or import an
                    image file to display decoded information here.
                  </MutedText>
                </div>
              ),
            },
          ]}
          twoColumn={false}
        />
        <ToastContainer toasts={toasts} onRemove={hide} />
      </>
    );
  }

  const parsed = parseQrString(lastScanResult);

  const renderStructuredData = () => {
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
              success(
                "Copied URL",
                "Copied URL to clipboard. Redirecting to URLVoid..."
              );
              setTimeout(() => {
                window.open(
                  "https://www.urlvoid.com/",
                  "_blank",
                  "noopener,noreferrer"
                );
              }, 2000);
            })
            .catch(() => {
              error("Error", "Failed to copy URL to clipboard");
            });
        };

        return (
          <div className="space-y-2">
            <Button
              onClick={() =>
                window.open(cleanUrl, "_blank", "noopener,noreferrer")
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>Open Link in Browser</span>
            </Button>
            <SecondaryButton
              onClick={handleCheckReputation}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Check URL Reputation</span>
              <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                <Tooltip
                  variant="wide1"
                  content={`• This action will take you outside to URLVoid to check the website trustworthiness.\n• If the link is shortened (e.g. bit.ly, tinyurl.com), URLVoid cannot scan the actual destination page. Be cautious!`}
                >
                  <HelpCircle
                    size={13}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-help"
                  />
                </Tooltip>
              </span>
            </SecondaryButton>
          </div>
        );
      }

      // ── EMAIL ─────────────────────────────────────────────────────────────
      case "email": {
        const email = parsed.emailData;
        if (!email) return null;
        return (
          <div className="space-y-2 text-xs">
            <FieldRow label="To" value={email.to} />
            {email.subject && <FieldRow label="Subject" value={email.subject} />}
            {email.body && <FieldRow label="Message Body" value={email.body} />}
            <Button
              onClick={() =>
                window.open(
                  `mailto:${email.to}?subject=${encodeURIComponent(email.subject || "")}&body=${encodeURIComponent(email.body || "")}`
                )
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Mail size={14} />
              <span>Draft Email</span>
            </Button>
          </div>
        );
      }

      // ── SMS ───────────────────────────────────────────────────────────────
      case "sms": {
        const sms = parsed.smsData;
        if (!sms) return null;
        return (
          <div className="space-y-2 text-xs">
            <FieldRow label="Phone Number" value={sms.phone} />
            {sms.message && <FieldRow label="Message" value={sms.message} />}
            <Button
              onClick={() =>
                window.open(
                  `sms:${sms.phone}?body=${encodeURIComponent(sms.message || "")}`
                )
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={14} />
              <span>Send SMS</span>
            </Button>
          </div>
        );
      }

      // ── PHONE ─────────────────────────────────────────────────────────────
      case "phone": {
        const num = parsed.raw.substring(4);
        return (
          <div className="space-y-3">
            <FieldRow label="Phone" value={num} />
            <Button
              onClick={() => window.open(`tel:${num}`)}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Phone size={14} />
              <span>Call Number</span>
            </Button>
          </div>
        );
      }

      // ── WIFI ──────────────────────────────────────────────────────────────
      case "wifi": {
        const wifi = parsed.wifiData;
        if (!wifi) return null;
        return (
          <div className="space-y-2 text-xs">
            <FieldRow
              icon={<Wifi size={14} />}
              label="Network SSID"
              value={wifi.ssid}
            />
            {wifi.password && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 relative">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  Password
                </span>
                <span className="font-mono font-medium text-xs text-slate-800 dark:text-slate-250 select-all pr-8">
                  {showPassword ? wifi.password : "••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 bottom-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
            <FieldRow
              label="Security Type"
              value={wifi.encryption || "None"}
            />
            {wifi.hidden !== undefined && (
              <FieldRow
                label="Hidden SSID"
                value={wifi.hidden ? "Yes" : "No"}
              />
            )}
            {wifi.password && (
              <SecondaryButton
                onClick={() => copyToClipboard(wifi.password!)}
                className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Copy size={14} />
                <span>Copy Password</span>
              </SecondaryButton>
            )}
          </div>
        );
      }

      // ── VCARD ─────────────────────────────────────────────────────────────
      case "vcard": {
        const vcard = parsed.vcardData;
        if (!vcard) return null;
        return (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 text-xs">
            {vcard.name && (
              <FieldRow
                icon={<User size={14} />}
                label="Name"
                value={vcard.name}
              />
            )}
            {(vcard.title || vcard.org) && (
              <FieldRow
                icon={<FileText size={14} />}
                label="Company / Title"
                value={[vcard.title, vcard.org].filter(Boolean).join(" — ")}
              />
            )}
            {vcard.phoneMobile && (
              <FieldRow
                icon={<Phone size={14} />}
                label="Mobile Phone"
                value={vcard.phoneMobile}
                onClick={() => window.open(`tel:${vcard.phoneMobile}`)}
              />
            )}
            {vcard.phoneWork && (
              <FieldRow
                icon={<Phone size={14} />}
                label="Work Phone"
                value={vcard.phoneWork}
                onClick={() => window.open(`tel:${vcard.phoneWork}`)}
              />
            )}
            {vcard.phoneHome && (
              <FieldRow
                icon={<Phone size={14} />}
                label="Home Phone"
                value={vcard.phoneHome}
                onClick={() => window.open(`tel:${vcard.phoneHome}`)}
              />
            )}
            {vcard.phoneFax && (
              <FieldRow
                icon={<Printer size={14} />}
                label="Fax"
                value={vcard.phoneFax}
              />
            )}
            {vcard.email && (
              <FieldRow
                icon={<Mail size={14} />}
                label="Email"
                value={vcard.email}
                onClick={() => window.open(`mailto:${vcard.email}`)}
              />
            )}
            {vcard.url && (
              <FieldRow
                icon={<ExternalLink size={14} />}
                label="Website"
                value={vcard.url}
                onClick={() => window.open(vcard.url, "_blank")}
              />
            )}
            {vcard.address && (
              <FieldRow
                icon={<MapPin size={14} />}
                label="Address"
                value={vcard.address}
              />
            )}
            {vcard.note && (
              <FieldRow
                icon={<AlignLeft size={14} />}
                label="Notes"
                value={vcard.note}
              />
            )}
            <div className="flex gap-2 pt-1">
              {vcard.phoneMobile && (
                <Button
                  onClick={() => window.open(`tel:${vcard.phoneMobile}`)}
                  className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </Button>
              )}
              {vcard.email && (
                <Button
                  onClick={() => window.open(`mailto:${vcard.email}`)}
                  className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
                >
                  <Mail size={14} />
                  <span>Email</span>
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
          <div className="space-y-2 text-xs">
            {ev.title && (
              <FieldRow
                icon={<Calendar size={14} />}
                label="Event Name"
                value={ev.title}
              />
            )}
            {(startDisplay || endDisplay) && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Clock size={11} />
                  Date & Time
                </span>
                <div className="mt-1 space-y-0.5">
                  {startDisplay && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 shrink-0">From</span>
                      <span className="font-medium text-slate-800 dark:text-slate-250">{startDisplay}</span>
                    </div>
                  )}
                  {endDisplay && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 shrink-0">To</span>
                      <span className="font-medium text-slate-800 dark:text-slate-250">{endDisplay}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {ev.location && (
              <FieldRow
                icon={<MapPin size={14} />}
                label="Location"
                value={ev.location}
              />
            )}
            {ev.description && (
              <FieldRow
                icon={<AlignLeft size={14} />}
                label="Description"
                value={ev.description}
              />
            )}
            {ev.url && (
              <FieldRow
                icon={<ExternalLink size={14} />}
                label="Event URL"
                value={ev.url}
                onClick={() => window.open(ev.url, "_blank")}
              />
            )}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => {
                  const blob = new Blob([parsed.raw], {
                    type: "text/calendar;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${ev.title || "event"}.ics`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Calendar size={14} />
                <span>Save .ics File</span>
              </Button>
              {ev.url && (
                <SecondaryButton
                  onClick={() => window.open(ev.url, "_blank")}
                  className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>Open URL</span>
                </SecondaryButton>
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
          <div className="space-y-2 text-xs">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.color}`}>
              <MessageCircle size={12} />
              {meta.label}
            </div>
            <FieldRow
              icon={<User size={14} />}
              label={msg.platform === "telegram" ? "Username" : "Phone Number"}
              value={msg.recipient}
            />
            {msg.message && (
              <FieldRow
                icon={<AlignLeft size={14} />}
                label="Template Message"
                value={msg.message}
              />
            )}
            <Button
              onClick={openLink}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={14} />
              <span>Open in {meta.label}</span>
            </Button>
          </div>
        );
      }

      // ── TEXT (fallback) ───────────────────────────────────────────────────
      case "text":
      default:
        return (
          <div className="space-y-3">
            <Button
              onClick={() => copyToClipboard(lastScanResult)}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Copy size={14} />
              <span>Copy Text</span>
            </Button>
          </div>
        );
    }
  };

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "structured-view",
      label: "",
      content: (
        <AccordionCard
          label="Parsed Actions"
          sublabel="Quick shortcuts for parsed data"
          icon={<Sliders size={16} />}
          alwaysOpen={true}
          colorTheme="sky"
          childrenClassName="p-3 space-y-3"
        >
          {renderStructuredData()}
        </AccordionCard>
      ),
    },
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        title="SCAN RESULTS"
        items={sidebarItems}
        twoColumn={false}
      />
      <ToastContainer toasts={toasts} onRemove={hide} />
    </>
  );
}
