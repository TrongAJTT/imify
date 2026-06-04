import React from "react";
import { Wifi } from "lucide-react";
import {
  TextInput,
  SelectInput,
  TextArea,
  CheckboxCard,
} from "@imify/ui";
import type { QrType, QrDataMap } from "./types";

interface QrFieldsFormProps {
  type: QrType;
  data: QrDataMap;
  updateDataField: <K extends QrType>(
    type: K,
    field: keyof QrDataMap[K],
    value: any
  ) => void;
}

export function QrFieldsForm({ type, data, updateDataField }: QrFieldsFormProps) {
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
          placeholder="Type your text content here..."
          value={data.text.text}
          onChange={(val) => updateDataField("text", "text", val)}
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
            placeholder="Type email body..."
            value={data.email.body}
            onChange={(val) => updateDataField("email", "body", val)}
            heightExpandMode="text"
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
            placeholder="Type your text message here..."
            value={data.sms.message}
            onChange={(val) => updateDataField("sms", "message", val)}
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
              onChange={(val) => updateDataField("vcard", "organization", val)}
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
              label="Home Phone"
              type="tel"
              placeholder="+1 555-0102"
              value={data.vcard.phoneHome}
              onChange={(val) => updateDataField("vcard", "phoneHome", val)}
            />
            <TextInput
              label="Fax"
              type="tel"
              placeholder="+1 555-0103"
              value={data.vcard.phoneFax}
              onChange={(val) => updateDataField("vcard", "phoneFax", val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label="Email"
              type="email"
              placeholder="john@example.com"
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

          <div className="border-t border-slate-100 dark:border-slate-850 pt-2 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
              Address
            </span>
            <TextInput
              label="Street Address"
              placeholder="123 Main St"
              value={data.vcard.addressStreet}
              onChange={(val) => updateDataField("vcard", "addressStreet", val)}
            />
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="City"
                placeholder="New York"
                value={data.vcard.addressCity}
                onChange={(val) => updateDataField("vcard", "addressCity", val)}
              />
              <TextInput
                label="State / Province"
                placeholder="NY"
                value={data.vcard.addressState}
                onChange={(val) =>
                  updateDataField("vcard", "addressState", val)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="Zip / Postal Code"
                placeholder="10001"
                value={data.vcard.addressZip}
                onChange={(val) => updateDataField("vcard", "addressZip", val)}
              />
              <TextInput
                label="Country"
                placeholder="USA"
                value={data.vcard.addressCountry}
                onChange={(val) =>
                  updateDataField("vcard", "addressCountry", val)
                }
              />
            </div>
            <div className="pt-1">
              <TextInput
                label="Note/Remarks"
                placeholder="Met at conference..."
                value={data.vcard.note}
                onChange={(val) => updateDataField("vcard", "note", val)}
              />
            </div>
          </div>
        </div>
      );

    case "event":
      return (
        <div className="space-y-3">
          <TextInput
            label="Event Name"
            placeholder="e.g. Tech Workshop 2026"
            value={data.event.title}
            onChange={(val) => updateDataField("event", "title", val)}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Start Date & Time"
              type="datetime-local"
              value={data.event.startDate}
              onChange={(val) => updateDataField("event", "startDate", val)}
            />
            <TextInput
              label="End Date & Time"
              type="datetime-local"
              value={data.event.endDate}
              onChange={(val) => updateDataField("event", "endDate", val)}
            />
          </div>
          <TextInput
            label="Location"
            placeholder="e.g. 123 Conference St, NY or Zoom Link"
            value={data.event.location}
            onChange={(val) => updateDataField("event", "location", val)}
          />
          <TextArea
            label="Description (Optional)"
            placeholder="Event details, agenda, or notes..."
            value={data.event.description}
            onChange={(val) => updateDataField("event", "description", val)}
            heightExpandMode="text"
            rows={3}
          />
          <TextInput
            label="Event URL (Optional)"
            type="url"
            placeholder="https://example.com/event"
            value={data.event.url}
            onChange={(val) => updateDataField("event", "url", val)}
          />
          <SelectInput
            label="Reminder Before Event"
            value={String(data.event.reminderMinutes ?? -1)}
            onChange={(val: string) =>
              updateDataField("event", "reminderMinutes", parseInt(val, 10))
            }
            options={[
              { value: "-1", label: "No reminder" },
              { value: "5", label: "5 minutes before" },
              { value: "15", label: "15 minutes before" },
              { value: "30", label: "30 minutes before" },
              { value: "60", label: "1 hour before" },
              { value: "120", label: "2 hours before" },
              { value: "1440", label: "1 day before" },
            ]}
          />
        </div>
      );

    case "messaging": {
      const platform = data.messaging.platform;
      let label = "Phone Number";
      let placeholder = "e.g. +84123456789 (include country code)";
      let typeInput = "tel";
      let description = "";

      if (platform === "telegram") {
        label = "Telegram Username";
        placeholder = "e.g. username (without @)";
        typeInput = "text";
        description = "Users scanning this QR code will resolve directly to your Telegram chat.";
      } else if (platform === "whatsapp") {
        label = "WhatsApp Number";
        placeholder = "e.g. +84123456789 (with country code)";
        typeInput = "tel";
        description = "A WhatsApp link that will open a chat screen with you, prefilled with a template message.";
      } else if (platform === "zalo") {
        label = "Zalo Phone Number";
        placeholder = "e.g. 0912345678";
        typeInput = "tel";
        description = "Users scanning this QR code will open your Zalo profile/chat.";
      }

      return (
        <div className="space-y-3">
          <SelectInput
            label="Chat Platform"
            value={data.messaging.platform}
            onChange={(val: string) =>
              updateDataField("messaging", "platform", val as any)
            }
            options={[
              { value: "whatsapp", label: "WhatsApp" },
              { value: "telegram", label: "Telegram" },
              { value: "zalo", label: "Zalo" },
            ]}
          />
          <TextInput
            label={label}
            type={typeInput}
            placeholder={placeholder}
            value={data.messaging.recipient}
            onChange={(val) => updateDataField("messaging", "recipient", val)}
          />
          {platform === "whatsapp" && (
            <TextArea
              label="Template Message (Optional)"
              placeholder="e.g. Hello, I am interested in your products!"
              value={data.messaging.message}
              onChange={(val) => updateDataField("messaging", "message", val)}
              heightExpandMode="text"
              rows={3}
            />
          )}
          {description && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-normal mt-1">
              {description}
            </span>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
