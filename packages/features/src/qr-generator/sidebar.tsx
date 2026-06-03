import React, { useRef } from "react"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  AccordionCard,
  SliderInput,
  RadioCard,
  ColorPickerPopover,
  TextInput,
  SelectInput,
  CheckboxCard,
  Button
} from "@imify/ui"
import {
  Link as LinkIcon,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  User,
  Sliders,
  Palette,
  Image as ImageIcon,
  Trash2,
  Upload
} from "lucide-react"
import { useQrGeneratorStore } from "@imify/stores"
import type { QrType } from "./types"

interface QrGeneratorSidebarProps {
  enableWideSidebarGrid?: boolean
  autoWideSidebarGridMinWidthPx?: number | null
}

const QR_TYPE_OPTIONS = [
  { value: "url", label: "URL" },
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "vcard", label: "vCard" }
]

export function QrGeneratorSidebar({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null
}: QrGeneratorSidebarProps) {
  const {
    type,
    setType,
    data,
    updateDataField,
    size,
    setSize,
    bgColor,
    setBgColor,
    fgColor,
    setFgColor,
    includeLogo,
    setIncludeLogo,
    logoUrl,
    setLogoUrl,
    logoWidth,
    setLogoWidth,
    logoHeight,
    setLogoHeight,
    excavateLogo,
    setExcavateLogo,
    errorCorrectionLevel,
    setErrorCorrectionLevel
  } = useQrGeneratorStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png")
      const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")
      
      if (isPng || isSvg) {
        if (logoUrl) {
          URL.revokeObjectURL(logoUrl)
        }
        const url = URL.createObjectURL(file)
        setLogoUrl(url)
        setIncludeLogo(true)
      }
    }
  }

  const handleRemoveLogo = () => {
    if (logoUrl) {
      URL.revokeObjectURL(logoUrl)
    }
    setLogoUrl(null)
    setIncludeLogo(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const renderDataFields = () => {
    switch (type) {
      case "url":
        return (
          <TextInput
            label="URL Link"
            placeholder="e.g. https://google.com"
            value={data.url.url}
            onChange={(val) => updateDataField("url", "url", val)}
          />
        )
      case "text":
        return (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Plain Text</span>
            <textarea
              value={data.text.text}
              onChange={(e) => updateDataField("text", "text", e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm resize-none"
            />
          </div>
        )
      case "email":
        return (
          <div className="space-y-3">
            <TextInput
              label="Recipient Email"
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
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Email Body</span>
              <textarea
                value={data.email.body}
                onChange={(e) => updateDataField("email", "body", e.target.value)}
                placeholder="Type the message body here..."
                rows={3}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm resize-none"
              />
            </div>
          </div>
        )
      case "phone":
        return (
          <TextInput
            label="Phone Number"
            placeholder="e.g. +84123456789"
            value={data.phone.phone}
            onChange={(val) => updateDataField("phone", "phone", val)}
          />
        )
      case "sms":
        return (
          <div className="space-y-3">
            <TextInput
              label="Recipient Phone"
              placeholder="e.g. +84123456789"
              value={data.sms.phone}
              onChange={(val) => updateDataField("sms", "phone", val)}
            />
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">SMS Message</span>
              <textarea
                value={data.sms.message}
                onChange={(e) => updateDataField("sms", "message", e.target.value)}
                placeholder="Type your text message here..."
                rows={3}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm resize-none"
              />
            </div>
          </div>
        )
      case "wifi":
        return (
          <div className="space-y-3">
            <TextInput
              label="Network Name (SSID)"
              placeholder="e.g. MyHomeWifi"
              value={data.wifi.ssid}
              onChange={(val) => updateDataField("wifi", "ssid", val)}
            />
            <TextInput
              label="Password"
              placeholder="e.g. p@ssw0rd123"
              type="password"
              value={data.wifi.password}
              onChange={(val) => updateDataField("wifi", "password", val)}
            />
            <SelectInput
              label="Encryption Type"
              value={data.wifi.encryption}
              onChange={(val) => updateDataField("wifi", "encryption", val)}
              options={[
                { value: "WPA", label: "WPA/WPA2" },
                { value: "WEP", label: "WEP" },
                { value: "nopass", label: "Unsecured (No Password)" }
              ]}
            />
          </div>
        )
      case "vcard":
        return (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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
            <TextInput
              label="Organization"
              placeholder="Acme Corp"
              value={data.vcard.organization}
              onChange={(val) => updateDataField("vcard", "organization", val)}
            />
            <TextInput
              label="Job Title"
              placeholder="Developer"
              value={data.vcard.title}
              onChange={(val) => updateDataField("vcard", "title", val)}
            />
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="Mobile Phone"
                placeholder="+1 555-0100"
                value={data.vcard.phoneMobile}
                onChange={(val) => updateDataField("vcard", "phoneMobile", val)}
              />
              <TextInput
                label="Work Phone"
                placeholder="+1 555-0199"
                value={data.vcard.phoneWork}
                onChange={(val) => updateDataField("vcard", "phoneWork", val)}
              />
            </div>
            <TextInput
              label="Email Address"
              placeholder="john.doe@example.com"
              value={data.vcard.email}
              onChange={(val) => updateDataField("vcard", "email", val)}
            />
            <TextInput
              label="Website URL"
              placeholder="https://example.com"
              value={data.vcard.url}
              onChange={(val) => updateDataField("vcard", "url", val)}
            />
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Street Address</span>
              <TextInput
                label=""
                placeholder="123 Main St"
                value={data.vcard.addressStreet}
                onChange={(val) => updateDataField("vcard", "addressStreet", val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                onChange={(val) => updateDataField("vcard", "addressState", val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="ZIP/Postal Code"
                placeholder="10001"
                value={data.vcard.addressZip}
                onChange={(val) => updateDataField("vcard", "addressZip", val)}
              />
              <TextInput
                label="Country"
                placeholder="USA"
                value={data.vcard.addressCountry}
                onChange={(val) => updateDataField("vcard", "addressCountry", val)}
              />
            </div>
            <TextInput
              label="Note/Remarks"
              placeholder="Met at conference..."
              value={data.vcard.note}
              onChange={(val) => updateDataField("vcard", "note", val)}
            />
          </div>
        )
      default:
        return null
    }
  }

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "qr-data-type",
      label: "",
      content: (
        <AccordionCard
          label="QR Data & Content"
          sublabel={`Type: ${type.toUpperCase()}`}
          icon={<LinkIcon size={16} />}
          defaultOpen={true}
          colorTheme="amber"
          childrenClassName="p-3 space-y-3"
        >
          <SelectInput
            label="Select QR Type"
            value={type}
            onChange={(val) => setType(val as QrType)}
            options={QR_TYPE_OPTIONS}
          />
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {renderDataFields()}
          </div>
        </AccordionCard>
      )
    },
    {
      id: "qr-colors-design",
      label: "",
      content: (
        <AccordionCard
          label="Design & Colors"
          sublabel="Dots and background colors"
          icon={<Palette size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Foreground Color</span>
              <ColorPickerPopover
                label=""
                value={fgColor}
                onChange={setFgColor}
                enableAlpha={false}
                enableGradient={false}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Background Color</span>
              <ColorPickerPopover
                label=""
                value={bgColor}
                onChange={setBgColor}
                enableAlpha={true} // Transparent backgrounds are helpful!
                enableGradient={false}
              />
            </div>
          </div>
          <SliderInput
            label="Resolution (Size)"
            value={size}
            min={128}
            max={1024}
            step={32}
            onChange={setSize}
            suffix=" px"
          />
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Error Correction Level</span>
            <div className="grid grid-cols-4 gap-1">
              {(["L", "M", "Q", "H"] as const).map((level) => (
                <RadioCard
                  key={level}
                  title={level}
                  value={level}
                  selectedValue={errorCorrectionLevel}
                  onChange={(v) => setErrorCorrectionLevel(v as any)}
                  colorTheme="purple"
                  className="flex items-center justify-center p-1.5 h-8 text-[11px]"
                />
              ))}
            </div>
          </div>
        </AccordionCard>
      )
    },
    {
      id: "qr-logo-embed",
      label: "",
      content: (
        <AccordionCard
          label="Logo Embedding"
          sublabel={logoUrl ? "Logo Active" : "No Logo"}
          icon={<ImageIcon size={16} />}
          defaultOpen={false}
          colorTheme="sky"
          childrenClassName="p-3 space-y-3"
        >
          <CheckboxCard
            checked={includeLogo}
            onChange={setIncludeLogo}
            title="Enable Logo"
            subtitle="Overlay an image in the center"
            icon={<ImageIcon size={16} />}
          />
          {includeLogo && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".png,.svg"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {!logoUrl ? (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 text-xs py-1.5 h-8 flex items-center justify-center gap-1.5"
                    variant="secondary"
                  >
                    <Upload size={14} />
                    <span>Upload Logo (PNG/SVG)</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-10 w-10 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded p-1 flex items-center justify-center">
                      <img src={logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 text-xs py-1 h-8"
                      variant="secondary"
                    >
                      Change
                    </Button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded flex items-center justify-center border border-rose-200 dark:border-rose-900/60"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SliderInput
                  label="Logo Width"
                  value={logoWidth}
                  min={10}
                  max={120}
                  step={2}
                  onChange={setLogoWidth}
                  suffix=" px"
                />
                <SliderInput
                  label="Logo Height"
                  value={logoHeight}
                  min={10}
                  max={120}
                  step={2}
                  onChange={setLogoHeight}
                  suffix=" px"
                />
              </div>
              <CheckboxCard
                checked={excavateLogo}
                onChange={setExcavateLogo}
                title="Excavate QR Dots"
                subtitle="Removes dots behind logo for better scanning"
                icon={<Sliders size={14} />}
              />
            </div>
          )}
        </AccordionCard>
      )
    }
  ]

  return (
    <WorkspaceConfigSidebarPanel
      title="CONFIGURATION"
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
      autoTwoColumnMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  )
}
