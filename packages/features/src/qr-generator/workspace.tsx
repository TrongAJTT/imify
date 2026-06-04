import React, { useRef, useState, useEffect } from "react";
import {
  Download,
  RotateCcw,
  Link,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  User,
} from "lucide-react";
import {
  Button,
  SecondaryButton,
  TextInput,
  SelectChip,
  Subheading,
  MutedText,
  SelectInput,
  TextArea,
  CheckboxCard,
} from "@imify/ui";
import { useQrGeneratorStore } from "@imify/stores";
import { encodeQrData } from "./qr-encoder";
import { downloadWithFilename } from "../processor/processor-utils";
import { useToast } from "@imify/core/hooks/use-toast";
import { renderMasterCanvas, exportAsSvg } from "./qr-render-engine";
import type { QrType } from "./types";

const QR_TYPE_OPTIONS = [
  { value: "url", label: "URL" },
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "vcard", label: "vCard" },
] as const;

const QR_TYPE_ICONS: Record<string, React.ReactNode> = {
  url: <Link size={13} />,
  text: <FileText size={13} />,
  email: <Mail size={13} />,
  phone: <Phone size={13} />,
  sms: <MessageSquare size={13} />,
  wifi: <Wifi size={13} />,
  vcard: <User size={13} />,
};

export function QrGeneratorWorkspace() {
  const store = useQrGeneratorStore();
  const {
    type,
    setType,
    data,
    updateDataField,
    size,
    bgColor,
    fgColor,
    logoUrl,
    logoWidth,
    logoHeight,
    excavateLogo,
    errorCorrectionLevel,
    resetToDefault,

    // Design state
    qrMargin,
    dotType,
    markerBorderType,
    markerCenterType,
    syncMarkerBorderColorWithForeground,
    markerBorderColor,
    syncMarkerCenterColorWithForeground,
    markerCenterColor,

    // Frame state
    frameStyle,
    frameText,
    frameTextScale,
    frameFontFamily,
    frameFontId,
    syncFrameColorWithForeground,
    frameColor,
    syncTextColorWithBackground,
    frameTextColor,
  } = store;

  const { success, error } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Encode the current state's field values to the standard raw string
  const rawQrValue = encodeQrData(type, data[type]);
  const hasContent = rawQrValue.trim().length > 0;

  const getQrConfig = () => {
    const state = useQrGeneratorStore.getState();
    return {
      ...state,
      data: state.data[state.type],
    };
  };

  // Update preview canvas
  useEffect(() => {
    let active = true;
    if (!hasContent) return;

    async function updatePreview() {
      try {
        const config = getQrConfig();
        const canvas = await renderMasterCanvas(config, rawQrValue);
        if (!active) return;

        const previewCanvas = previewCanvasRef.current;
        if (previewCanvas) {
          previewCanvas.width = canvas.width;
          previewCanvas.height = canvas.height;
          const ctx = previewCanvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(canvas, 0, 0);
          }
        }
      } catch (err) {
        console.error("Failed to render QR preview:", err);
      }
    }

    updatePreview();
    return () => {
      active = false;
    };
  }, [
    rawQrValue,
    hasContent,
    size,
    bgColor,
    fgColor,
    logoUrl,
    logoWidth,
    logoHeight,
    excavateLogo,
    errorCorrectionLevel,
    qrMargin,
    dotType,
    markerBorderType,
    markerCenterType,
    syncMarkerBorderColorWithForeground,
    markerBorderColor,
    syncMarkerCenterColorWithForeground,
    markerCenterColor,
    frameStyle,
    frameText,
    frameTextScale,
    frameFontFamily,
    frameFontId,
    syncFrameColorWithForeground,
    frameColor,
    syncTextColorWithBackground,
    frameTextColor,
  ]);

  const downloadSVG = async () => {
    try {
      setIsDownloading(true);
      const config = getQrConfig();
      const svgText = await exportAsSvg(config, rawQrValue);

      const blob = new Blob([svgText], {
        type: "image/svg+xml;charset=utf-8",
      });

      await downloadWithFilename(blob, `imify-qr-${type}.svg`);
      success("Export Successful", "QR code downloaded as SVG");
    } catch (err) {
      error("Export Failed", "Could not download the QR code as SVG");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPNG = async () => {
    try {
      setIsDownloading(true);
      const config = getQrConfig();
      const canvas = await renderMasterCanvas(config, rawQrValue);

      canvas.toBlob(async (blob) => {
        if (blob) {
          await downloadWithFilename(blob, `imify-qr-${type}.png`);
          success("Export Successful", "QR code downloaded as PNG");
        } else {
          error("Export Failed", "Could not export canvas to blob");
        }
        setIsDownloading(false);
      }, "image/png");
    } catch (err) {
      error("Export Failed", "Could not download the QR code as PNG");
      setIsDownloading(false);
    }
  };

  const downloadWebP = async () => {
    try {
      setIsDownloading(true);
      const config = getQrConfig();
      const canvas = await renderMasterCanvas(config, rawQrValue);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            await downloadWithFilename(blob, `imify-qr-${type}.webp`);
            success("Export Successful", "QR code downloaded as WebP");
          } else {
            error("Export Failed", "Could not export canvas to blob");
          }
          setIsDownloading(false);
        },
        "image/webp",
        1.0,
      );
    } catch (err) {
      error("Export Failed", "Could not download the QR code as WebP");
      setIsDownloading(false);
    }
  };

  const renderDataFields = () => {
    switch (type) {
      case "url":
        return (
          <TextInput
            label="URL Link"
            type="url"
            placeholder="e.g. https://google.com"
            value={data.url.url}
            onChange={(val) => updateDataField("url", "url", val)}
          />
        );
      case "text":
        return (
          <TextArea
            label="Plain Text"
            value={data.text.text}
            onChange={(val) => updateDataField("text", "text", val)}
            placeholder="Type your message here..."
            heightExpandMode="slider"
            rows={6}
          />
        );
      case "email":
        return (
          <div className="space-y-3">
            <TextInput
              label="Recipient Email"
              type="email"
              placeholder="e.g. contact@example.com"
              value={data.email.to}
              onChange={(val) => updateDataField("email", "to", val)}
            />
            <TextInput
              label="Subject"
              placeholder="e.g. Hello there"
              value={data.email.subject}
              onChange={(val) => updateDataField("email", "subject", val)}
            />
            <TextArea
              label="Email Body"
              value={data.email.body}
              onChange={(val) => updateDataField("email", "body", val)}
              placeholder="Type the message body here..."
              heightExpandMode="slider"
              rows={4}
            />
          </div>
        );
      case "phone":
        return (
          <TextInput
            label="Phone Number"
            type="tel"
            placeholder="e.g. +84123456789"
            value={data.phone.phone}
            onChange={(val) => updateDataField("phone", "phone", val)}
          />
        );
      case "sms":
        return (
          <div className="space-y-3">
            <TextInput
              label="Recipient Phone"
              type="tel"
              placeholder="e.g. +84123456789"
              value={data.sms.phone}
              onChange={(val) => updateDataField("sms", "phone", val)}
            />
            <TextArea
              label="SMS Message"
              value={data.sms.message}
              onChange={(val) => updateDataField("sms", "message", val)}
              placeholder="Type your text message here..."
              rows={4}
              heightExpandMode="text"
            />
          </div>
        );
      case "wifi":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Network Name (SSID)"
                placeholder="e.g. MyHomeWifi"
                value={data.wifi.ssid}
                onChange={(val) => updateDataField("wifi", "ssid", val)}
              />
              <SelectInput
                label="Encryption Type"
                value={data.wifi.encryption}
                onChange={(val: string) =>
                  updateDataField("wifi", "encryption", val as any)
                }
                options={[
                  { value: "WPA", label: "WPA/WPA2" },
                  { value: "WEP", label: "WEP" },
                  { value: "nopass", label: "Unsecured (No Password)" },
                ]}
              />
            </div>
            <TextInput
              label="Password"
              placeholder="e.g. p@ssw0rd123"
              type="password"
              value={data.wifi.password}
              onChange={(val) => updateDataField("wifi", "password", val)}
            />
            <CheckboxCard
              checked={Boolean(data.wifi.hidden)}
              onChange={(val) => updateDataField("wifi", "hidden", val)}
              title="Hidden SSID"
              subtitle="This Wi-Fi network's SSID is hidden (not broadcasting)"
              icon={<Wifi size={14} className="text-blue-500" />}
            />
          </div>
        );
      case "vcard":
        return (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="First Name"
                placeholder="John"
                value={data.vcard.firstName}
                onChange={(val) => updateDataField("vcard", "firstName", val)}
              />
              <TextInput
                label="Last Name"
                placeholder="Doe"
                value={data.vcard.lastName}
                onChange={(val) => updateDataField("vcard", "lastName", val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="Organization"
                placeholder="Acme Corp"
                value={data.vcard.organization}
                onChange={(val) =>
                  updateDataField("vcard", "organization", val)
                }
              />
              <TextInput
                label="Job Title"
                placeholder="Developer"
                value={data.vcard.title}
                onChange={(val) => updateDataField("vcard", "title", val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="Mobile Phone"
                type="tel"
                placeholder="+1 555-0100"
                value={data.vcard.phoneMobile}
                onChange={(val) => updateDataField("vcard", "phoneMobile", val)}
              />
              <TextInput
                label="Work Phone"
                type="tel"
                placeholder="+1 555-0199"
                value={data.vcard.phoneWork}
                onChange={(val) => updateDataField("vcard", "phoneWork", val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="Email Address"
                placeholder="john.doe@example.com"
                value={data.vcard.email}
                onChange={(val) => updateDataField("vcard", "email", val)}
              />
              <TextInput
                label="Website URL"
                type="url"
                placeholder="https://example.com"
                value={data.vcard.url}
                onChange={(val) => updateDataField("vcard", "url", val)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Street Address
              </span>
              <TextInput
                label=""
                placeholder="123 Main St"
                value={data.vcard.addressStreet}
                onChange={(val) =>
                  updateDataField("vcard", "addressStreet", val)
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <TextInput
                label="City"
                placeholder="New York"
                value={data.vcard.addressCity}
                onChange={(val) => updateDataField("vcard", "addressCity", val)}
              />
              <TextInput
                label="State/Province"
                placeholder="NY"
                value={data.vcard.addressState}
                onChange={(val) =>
                  updateDataField("vcard", "addressState", val)
                }
              />
              <TextInput
                label="ZIP Code"
                placeholder="10001"
                value={data.vcard.addressZip}
                onChange={(val) => updateDataField("vcard", "addressZip", val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="Country"
                placeholder="USA"
                value={data.vcard.addressCountry}
                onChange={(val) =>
                  updateDataField("vcard", "addressCountry", val)
                }
              />
              <TextInput
                label="Note/Remarks"
                placeholder="Met at conference..."
                value={data.vcard.note}
                onChange={(val) => updateDataField("vcard", "note", val)}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      {/* Main Workspace split panel (3:2 ratio on desktop, stacked on mobile) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start h-full">
          {/* Left Column: Data Type selector and Content Inputs (3/5 width) */}
          <div className="lg:col-span-3 shadow-sm space-y-4 relative pl-1">
            <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
              <Subheading>QR GENERATOR</Subheading>
              <MutedText className="text-xs">
                Choose type and fill in QR details
              </MutedText>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Select QR Type
              </span>
              <div className="flex flex-wrap gap-2">
                {QR_TYPE_OPTIONS.map((opt) => (
                  <SelectChip
                    key={opt.value}
                    label={opt.label}
                    isActive={type === opt.value}
                    onClick={() => setType(opt.value as QrType)}
                    icon={QR_TYPE_ICONS[opt.value]}
                  />
                ))}
              </div>
            </div>

            {/* Float Reset Button in the top-right corner */}
            <div className="absolute top-[-5px] right-3">
              <SecondaryButton
                onClick={resetToDefault}
                className="text-xs h-8 flex items-center gap-1.5 px-3"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </SecondaryButton>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
              {renderDataFields()}
            </div>
          </div>

          {/* Right Column: Preview canvas and download buttons (2/5 width) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-6">
            {hasContent ? (
              <div className="w-full flex flex-col items-center space-y-4">
                {/* Visual QR Container */}
                <div
                  className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center aspect-square w-full"
                  style={{
                    // Checkerboard background in case QR background color is transparent
                    backgroundImage:
                      bgColor === "transparent" ||
                      bgColor.startsWith("rgba(0,0,0,0)")
                        ? "linear-gradient(45deg, #efefef 25%, transparent 25%), linear-gradient(-45deg, #efefef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #efefef 75%), linear-gradient(-45deg, transparent 75%, #efefef 75%)"
                        : undefined,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <canvas
                      ref={previewCanvasRef}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* Download and Export Buttons */}
                <div className="w-full grid grid-cols-3 gap-2">
                  <Button
                    onClick={downloadPNG}
                    disabled={isDownloading}
                    className="text-xs h-9 flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>PNG</span>
                  </Button>
                  <Button
                    onClick={downloadSVG}
                    disabled={isDownloading}
                    className="text-xs h-9 flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>SVG</span>
                  </Button>
                  <Button
                    onClick={downloadWebP}
                    disabled={isDownloading}
                    className="text-xs h-9 flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>WebP</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 shadow-sm aspect-square">
                <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 mb-4">
                  <Download size={22} />
                </div>
                <Subheading className="text-sm font-semibold mb-1">
                  No QR Content
                </Subheading>
                <MutedText className="text-xs max-w-[240px]">
                  Fill in the data fields on the left to generate and preview
                  your custom QR code.
                </MutedText>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
