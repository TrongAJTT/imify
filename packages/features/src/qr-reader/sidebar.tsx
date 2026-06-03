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
} from "lucide-react";
import { useQrReaderStore } from "@imify/stores";
import { parseQrString } from "./qr-parser";
import { useToast } from "@imify/core/hooks/use-toast";

interface QrReaderSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

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
      case "url":
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
                  "noopener,noreferrer",
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
              <span
                onClick={(e) => e.stopPropagation()}
                className="inline-flex"
              >
                <Tooltip
                  variant="wide1"
                  content={`• This action will take you outside to URLVoid to check the website trustworthiness.
                    • If the link is shortened (e.g. bit.ly, tinyurl.com), URLVoid cannot scan the actual destination page. Be cautious!
                  `}
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
      case "email":
        const email = parsed.emailData;
        if (!email) return null;
        return (
          <div className="space-y-2 text-xs">
            <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                To
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                {email.to}
              </span>
            </div>
            {email.subject && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  Subject
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                  {email.subject}
                </span>
              </div>
            )}
            {email.body && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  Message Body
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-all">
                  {email.body}
                </span>
              </div>
            )}
            <Button
              onClick={() =>
                window.open(
                  `mailto:${email.to}?subject=${encodeURIComponent(email.subject || "")}&body=${encodeURIComponent(email.body || "")}`,
                )
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Mail size={14} />
              <span>Draft Email</span>
            </Button>
          </div>
        );
      case "sms":
        const sms = parsed.smsData;
        if (!sms) return null;
        return (
          <div className="space-y-2 text-xs">
            <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                Phone Number
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                {sms.phone}
              </span>
            </div>
            {sms.message && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  Message
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-350 select-all">
                  {sms.message}
                </span>
              </div>
            )}
            <Button
              onClick={() =>
                window.open(
                  `sms:${sms.phone}?body=${encodeURIComponent(sms.message || "")}`,
                )
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={14} />
              <span>Send SMS</span>
            </Button>
          </div>
        );
      case "phone":
        const num = parsed.raw.substring(4);
        return (
          <div className="space-y-3">
            <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                Phone
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                {num}
              </span>
            </div>
            <Button
              onClick={() => window.open(`tel:${num}`)}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Phone size={14} />
              <span>Call Number</span>
            </Button>
          </div>
        );
      case "wifi":
        const wifi = parsed.wifiData;
        if (!wifi) return null;
        return (
          <div className="space-y-2 text-xs">
            <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                Network SSID
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                {wifi.ssid}
              </span>
            </div>
            {wifi.password && (
              <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 relative">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  Password
                </span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-250 select-all pr-8">
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
            <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                Security Type
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-250">
                {wifi.encryption || "None"}
              </span>
            </div>
          </div>
        );
      case "vcard":
        const vcard = parsed.vcardData;
        if (!vcard) return null;
        return (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
            {vcard.name && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <User size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Name
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-250">
                    {vcard.name}
                  </span>
                </div>
              </div>
            )}
            {(vcard.title || vcard.org) && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <FileText size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Company / Title
                  </span>
                  <span className="font-medium text-slate-850 dark:text-slate-250">
                    {vcard.title ? `${vcard.title} - ` : ""}
                    {vcard.org || ""}
                  </span>
                </div>
              </div>
            )}
            {vcard.phoneMobile && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <Phone size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Mobile Phone
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                    {vcard.phoneMobile}
                  </span>
                </div>
              </div>
            )}
            {vcard.phoneWork && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <Phone size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Work Phone
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                    {vcard.phoneWork}
                  </span>
                </div>
              </div>
            )}
            {vcard.email && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <Mail size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Email
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                    {vcard.email}
                  </span>
                </div>
              </div>
            )}
            {vcard.url && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <ExternalLink size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Website
                  </span>
                  <span
                    className="font-medium text-blue-500 hover:underline cursor-pointer select-all"
                    onClick={() => window.open(vcard.url, "_blank")}
                  >
                    {vcard.url}
                  </span>
                </div>
              </div>
            )}
            {vcard.address && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <FileText size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Address
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-250 select-all">
                    {vcard.address}
                  </span>
                </div>
              </div>
            )}
            {vcard.note && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                <FileText size={14} className="mt-0.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Notes
                  </span>
                  <span className="font-medium text-slate-650 dark:text-slate-350 select-all">
                    {vcard.note}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
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
