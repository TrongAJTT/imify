import React, { useMemo } from "react";
import { Palette } from "lucide-react";
import type { ColorBlindMode, PreviewChannelMode } from "./types";
import {
  AccordionCard,
  CheckboxCard,
  SelectInput,
  SliderInput,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";

interface DisplayAccordionProps {
  paletteCount: number;
  previewChannelMode: PreviewChannelMode;
  colorBlindMode: ColorBlindMode;
  loupeEnabled: boolean;
  loupeZoom: number;
  onPaletteCountChange: (count: number) => void;
  onPreviewChannelModeChange: (mode: PreviewChannelMode) => void;
  onColorBlindModeChange: (mode: ColorBlindMode) => void;
  onLoupeEnabledChange: (enabled: boolean) => void;
  onLoupeZoomChange: (zoom: number) => void;
}

export function DisplayAccordion(props: DisplayAccordionProps) {
  const { t } = useTranslation("inspector");

  const channelOptions = useMemo(
    () => [
      { value: "all" as const, label: t("channelAll") },
      { value: "red" as const, label: t("channelRed") },
      { value: "green" as const, label: t("channelGreen") },
      { value: "blue" as const, label: t("channelBlue") },
      { value: "alpha" as const, label: t("channelAlpha") },
    ],
    [t],
  );

  const colorBlindOptions = useMemo(
    () => [
      { value: "none" as const, label: t("normalVision") },
      { value: "protanopia" as const, label: t("protanopia") },
      { value: "deuteranopia" as const, label: t("deuteranopia") },
      { value: "tritanopia" as const, label: t("tritanopia") },
    ],
    [t],
  );

  const sublabel = `${t("colorsCount", { count: props.paletteCount })} • ${props.previewChannelMode.toUpperCase()}`;

  return (
    <AccordionCard
      icon={<Palette size={16} />}
      label={t("display")}
      sublabel={sublabel}
      colorTheme="blue"
      alwaysOpen
    >
      <div className="space-y-3">
        <SliderInput
          label={t("paletteColors")}
          value={props.paletteCount}
          onChange={props.onPaletteCountChange}
          min={4}
          max={12}
          step={2}
        />
        <SelectInput
          label={t("previewChannel")}
          value={props.previewChannelMode}
          options={channelOptions}
          onChange={(value) =>
            props.onPreviewChannelModeChange(value as PreviewChannelMode)
          }
        />
        <SelectInput
          label={t("colorBlindSim")}
          value={props.colorBlindMode}
          options={colorBlindOptions}
          onChange={(value) =>
            props.onColorBlindModeChange(value as ColorBlindMode)
          }
        />
        <CheckboxCard
          title={t("enableLoupe")}
          subtitle={t("loupeSubtitle")}
          checked={props.loupeEnabled}
          onChange={props.onLoupeEnabledChange}
          colorTheme="blue"
        />
        {props.loupeEnabled ? (
          <SliderInput
            label={t("loupeZoom")}
            value={props.loupeZoom}
            onChange={props.onLoupeZoomChange}
            min={2}
            max={12}
            step={1}
            suffix="x"
          />
        ) : null}
      </div>
    </AccordionCard>
  );
}
