import React, { useMemo } from "react";
import { Eye, Tags } from "lucide-react";
import { AccordionCard, CheckboxCard, SelectInput } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

interface MetadataAccordionProps {
  exifSortMode: "group" | "name" | "tag";
  showSensitiveOnly: boolean;
  onExifSortModeChange: (mode: "group" | "name" | "tag") => void;
  onShowSensitiveOnlyChange: (show: boolean) => void;
}

export function MetadataAccordion(props: MetadataAccordionProps) {
  const { t } = useTranslation("inspector");

  const exifSortOptions = useMemo(
    () => [
      { value: "group", label: t("exifGroup") },
      { value: "name", label: t("exifName") },
      { value: "tag", label: t("exifTag") },
    ],
    [t],
  );

  const sortModeLabel =
    exifSortOptions.find((o) => o.value === props.exifSortMode)?.label ||
    t("exifGroup");
  const privacyText = props.showSensitiveOnly
    ? t("privacyOn")
    : t("privacyOff");
  const sublabel = `${sortModeLabel}, Privacy: ${privacyText}`;

  return (
    <AccordionCard
      icon={<Tags size={16} />}
      label={t("metadata")}
      sublabel={sublabel}
      colorTheme="purple"
      alwaysOpen
    >
      <div className="space-y-3">
        <SelectInput
          label={t("sortMode")}
          value={props.exifSortMode}
          options={exifSortOptions}
          onChange={(v) =>
            props.onExifSortModeChange(v as "group" | "name" | "tag")
          }
        />
        <CheckboxCard
          icon={<Eye size={16} />}
          title={t("sensitiveOnly")}
          subtitle={t("sensitiveOnlySubtitle")}
          checked={props.showSensitiveOnly}
          onChange={props.onShowSensitiveOnlyChange}
          colorTheme="amber"
        />
      </div>
    </AccordionCard>
  );
}
