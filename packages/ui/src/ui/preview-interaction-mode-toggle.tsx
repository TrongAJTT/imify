import React from "react";
import { Hand, Pause, ZoomIn } from "lucide-react";

import {
  SegmentedControl,
  type SegmentedControlOption,
} from "./segmented-control";
import { useTranslation } from "@imify/i18n";

export type PreviewInteractionMode = "zoom" | "pan" | "idle";

interface PreviewInteractionModeToggleProps {
  mode: PreviewInteractionMode;
  onChange: (mode: PreviewInteractionMode) => void;
  zoomKeyHint?: string;
  panKeyHint?: string;
  idleKeyHint?: string;
}

export function PreviewInteractionModeToggle({
  mode,
  onChange,
  zoomKeyHint = "Z",
  panKeyHint = "V",
  idleKeyHint = "N",
}: PreviewInteractionModeToggleProps) {
  const { t } = useTranslation("common");

  const zoomLabel =
    zoomKeyHint === "Unassigned"
      ? t("previewModes.zoomLabel")
      : `${t("previewModes.zoomLabel")} (${zoomKeyHint})`;
  const panLabel =
    panKeyHint === "Unassigned"
      ? t("previewModes.panLabel")
      : `${t("previewModes.panLabel")} (${panKeyHint})`;
  const idleLabel =
    idleKeyHint === "Unassigned"
      ? t("previewModes.idleLabel")
      : `${t("previewModes.idleLabel")} (${idleKeyHint})`;

  const options: SegmentedControlOption<PreviewInteractionMode>[] = [
    {
      value: "zoom",
      label: t("previewModes.zoom"),
      icon: <ZoomIn size={14} />,
      tooltipLabel: zoomLabel,
      tooltipContent: t("previewModes.zoomTooltip"),
      tooltipVariant: "nowrap",
    },
    {
      value: "pan",
      label: t("previewModes.pan"),
      icon: <Hand size={14} />,
      tooltipLabel: panLabel,
      tooltipContent: t("previewModes.panTooltip"),
      tooltipVariant: "nowrap",
    },
    {
      value: "idle",
      label: t("previewModes.idle"),
      icon: <Pause size={14} />,
      tooltipLabel: idleLabel,
      tooltipContent: t("previewModes.idleTooltip"),
      tooltipVariant: "nowrap",
    },
  ];

  return (
    <div className="hidden sm:block">
      <SegmentedControl
        value={mode}
        options={options}
        onChange={onChange}
        ariaLabel="Preview interaction mode"
      />
    </div>
  );
}

export default PreviewInteractionModeToggle;
