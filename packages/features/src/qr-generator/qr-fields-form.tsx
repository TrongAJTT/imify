import React from "react";
import { Wifi } from "lucide-react";
import {
  TextInput,
  SelectInput,
  TextArea,
  CheckboxCard,
  PhoneInput,
} from "@imify/ui";
import type { QrType, QrDataMap } from "./types";
import { useTranslation } from "@imify/i18n";

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
  const { t } = useTranslation("qrGenerator");
  switch (type) {
    case "url":
      return (
        <TextInput
          label={t("fields.url")}
          type="url"
          placeholder={t("fields.urlPlaceholder")}
          value={data.url.url}
          onChange={(val) => updateDataField("url", "url", val)}
        />
      );

    case "text":
      return (
        <TextArea
          label={t("fields.plainText")}
          placeholder={t("fields.plainTextPlaceholder")}
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
            label={t("fields.recipientEmail")}
            type="email"
            placeholder={t("fields.recipientEmailPlaceholder")}
            value={data.email.to}
            onChange={(val) => updateDataField("email", "to", val)}
          />
          <TextInput
            label={t("fields.subject")}
            placeholder={t("fields.subjectPlaceholder")}
            value={data.email.subject}
            onChange={(val) => updateDataField("email", "subject", val)}
          />
          <TextArea
            label={t("fields.emailBody")}
            placeholder={t("fields.emailBodyPlaceholder")}
            value={data.email.body}
            onChange={(val) => updateDataField("email", "body", val)}
            heightExpandMode="text"
            rows={4}
          />
        </div>
      );

    case "phone":
      return (
        <PhoneInput
          label={t("fields.phoneNumber")}
          placeholder={t("fields.phoneNumberPlaceholder")}
          value={data.phone.phone}
          onChange={(val) => updateDataField("phone", "phone", val)}
        />
      );

    case "sms":
      return (
        <div className="space-y-3">
          <PhoneInput
            label={t("fields.recipientPhone")}
            placeholder={t("fields.phoneNumberPlaceholder")}
            value={data.sms.phone}
            onChange={(val) => updateDataField("sms", "phone", val)}
          />
          <TextArea
            label={t("fields.smsMessage")}
            placeholder={t("fields.smsMessagePlaceholder")}
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
              label={t("fields.networkName")}
              placeholder={t("fields.networkNamePlaceholder")}
              value={data.wifi.ssid}
              onChange={(val) => updateDataField("wifi", "ssid", val)}
            />
            <SelectInput
              label={t("fields.encryptionType")}
              value={data.wifi.encryption}
              onChange={(val: string) =>
                updateDataField("wifi", "encryption", val as any)
              }
              options={[
                { value: "WPA", label: "WPA/WPA2" },
                { value: "WEP", label: "WEP" },
                { value: "nopass", label: t("fields.reminders.none") },
              ]}
            />
          </div>
          <TextInput
            label={t("fields.password")}
            placeholder={t("fields.passwordPlaceholder")}
            type="password"
            value={data.wifi.password}
            onChange={(val) => updateDataField("wifi", "password", val)}
          />
          <CheckboxCard
            checked={Boolean(data.wifi.hidden)}
            onChange={(val) => updateDataField("wifi", "hidden", val)}
            title={t("fields.hiddenSsid")}
            subtitle={t("fields.hiddenSsidDesc")}
            icon={<Wifi size={14} className="text-blue-500" />}
          />
        </div>
      );

    case "vcard":
      return (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label={t("fields.firstName")}
              placeholder={t("fields.firstNamePlaceholder")}
              value={data.vcard.firstName}
              onChange={(val) => updateDataField("vcard", "firstName", val)}
            />
            <TextInput
              label={t("fields.lastName")}
              placeholder={t("fields.lastNamePlaceholder")}
              value={data.vcard.lastName}
              onChange={(val) => updateDataField("vcard", "lastName", val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label={t("fields.organization")}
              placeholder={t("fields.organizationPlaceholder")}
              value={data.vcard.organization}
              onChange={(val) => updateDataField("vcard", "organization", val)}
            />
            <TextInput
              label={t("fields.jobTitle")}
              placeholder={t("fields.jobTitlePlaceholder")}
              value={data.vcard.title}
              onChange={(val) => updateDataField("vcard", "title", val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label={t("fields.mobilePhone")}
              type="tel"
              placeholder="+1 555-0100"
              value={data.vcard.phoneMobile}
              onChange={(val) => updateDataField("vcard", "phoneMobile", val)}
            />
            <TextInput
              label={t("fields.workPhone")}
              type="tel"
              placeholder="+1 555-0199"
              value={data.vcard.phoneWork}
              onChange={(val) => updateDataField("vcard", "phoneWork", val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label={t("fields.homePhone")}
              type="tel"
              placeholder="+1 555-0102"
              value={data.vcard.phoneHome}
              onChange={(val) => updateDataField("vcard", "phoneHome", val)}
            />
            <TextInput
              label={t("fields.fax")}
              type="tel"
              placeholder="+1 555-0103"
              value={data.vcard.phoneFax}
              onChange={(val) => updateDataField("vcard", "phoneFax", val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label={t("fields.recipientEmail")}
              type="email"
              placeholder={t("fields.recipientEmailPlaceholder")}
              value={data.vcard.email}
              onChange={(val) => updateDataField("vcard", "email", val)}
            />
            <TextInput
              label={t("fields.websiteUrl")}
              type="url"
              placeholder="https://example.com"
              value={data.vcard.url}
              onChange={(val) => updateDataField("vcard", "url", val)}
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-2 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
              {t("fields.address")}
            </span>
            <TextInput
              label={t("fields.streetAddress")}
              placeholder="123 Main St"
              value={data.vcard.addressStreet}
              onChange={(val) => updateDataField("vcard", "addressStreet", val)}
            />
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label={t("fields.city")}
                placeholder="New York"
                value={data.vcard.addressCity}
                onChange={(val) => updateDataField("vcard", "addressCity", val)}
              />
              <TextInput
                label={t("fields.stateProvince")}
                placeholder="NY"
                value={data.vcard.addressState}
                onChange={(val) =>
                  updateDataField("vcard", "addressState", val)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label={t("fields.zipCode")}
                placeholder="10001"
                value={data.vcard.addressZip}
                onChange={(val) => updateDataField("vcard", "addressZip", val)}
              />
              <TextInput
                label={t("fields.country")}
                placeholder="USA"
                value={data.vcard.addressCountry}
                onChange={(val) =>
                  updateDataField("vcard", "addressCountry", val)
                }
              />
            </div>
            <div className="pt-1">
              <TextInput
                label={t("fields.noteRemarks")}
                placeholder={t("fields.noteRemarksPlaceholder")}
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
            label={t("fields.eventName")}
            placeholder={t("fields.eventNamePlaceholder")}
            value={data.event.title}
            onChange={(val) => updateDataField("event", "title", val)}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label={t("fields.startDate")}
              type="datetime-local"
              value={data.event.startDate}
              onChange={(val) => updateDataField("event", "startDate", val)}
            />
            <TextInput
              label={t("fields.endDate")}
              type="datetime-local"
              value={data.event.endDate}
              onChange={(val) => updateDataField("event", "endDate", val)}
            />
          </div>
          <TextInput
            label={t("fields.location")}
            placeholder={t("fields.locationPlaceholder")}
            value={data.event.location}
            onChange={(val) => updateDataField("event", "location", val)}
          />
          <TextArea
            label={t("fields.descriptionOpt")}
            placeholder={t("fields.descriptionOptPlaceholder")}
            value={data.event.description}
            onChange={(val) => updateDataField("event", "description", val)}
            heightExpandMode="text"
            rows={3}
          />
          <TextInput
            label={t("fields.eventUrlOpt")}
            type="url"
            placeholder="https://example.com/event"
            value={data.event.url}
            onChange={(val) => updateDataField("event", "url", val)}
          />
          <SelectInput
            label={t("fields.reminderMinutes")}
            value={String(data.event.reminderMinutes ?? -1)}
            onChange={(val: string) =>
              updateDataField("event", "reminderMinutes", parseInt(val, 10))
            }
            options={[
              { value: "-1", label: t("fields.reminders.none") },
              { value: "5", label: t("fields.reminders.5") },
              { value: "15", label: t("fields.reminders.15") },
              { value: "30", label: t("fields.reminders.30") },
              { value: "60", label: t("fields.reminders.60") },
              { value: "120", label: t("fields.reminders.120") },
              { value: "1440", label: t("fields.reminders.1440") },
            ]}
          />
        </div>
      );

    case "messaging": {
      const platform = data.messaging.platform;
      let label = t("fields.phoneNumber");
      let placeholder = "e.g. +84123456789 (include country code)";
      let typeInput = "tel";
      let description = "";

      if (platform === "telegram") {
        label = "Telegram Username";
        placeholder = "e.g. username (without @)";
        typeInput = "text";
        description = t("fields.telegramDesc");
      } else if (platform === "whatsapp") {
        label = "WhatsApp Number";
        placeholder = "e.g. 123456789";
        typeInput = "tel";
        description = t("fields.whatsappDesc");
      } else if (platform === "zalo") {
        label = "Zalo Phone Number";
        placeholder = "e.g. 912345678";
        typeInput = "tel";
        description = t("fields.zaloDesc");
      }

      return (
        <div className="space-y-3">
          <SelectInput
            label={t("fields.chatPlatform")}
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
          {platform === "telegram" ? (
            <TextInput
              label={label}
              type={typeInput}
              placeholder={placeholder}
              value={data.messaging.recipient}
              onChange={(val) => updateDataField("messaging", "recipient", val)}
            />
          ) : (
            <PhoneInput
              label={label}
              placeholder={placeholder}
              value={data.messaging.recipient}
              onChange={(val) => updateDataField("messaging", "recipient", val)}
            />
          )}
          {platform === "whatsapp" && (
            <TextArea
              label={t("fields.templateMessageOpt")}
              placeholder={t("fields.templateMessageOptPlaceholder")}
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
