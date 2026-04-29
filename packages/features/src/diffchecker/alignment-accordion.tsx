import React from "react";
import type { DiffAlignAnchor, DiffAlignMode } from "./types";
import { Maximize2 } from "lucide-react";
import { AccordionCard, SelectInput } from "@imify/ui";

const ALIGN_MODE_OPTIONS = [
  { value: "fit-larger", label: "Match Larger" },
  { value: "fit-smaller", label: "Match Smaller" },
  { value: "original", label: "Original Size" },
];
const ANCHOR_OPTIONS = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top-Left" },
];

export function AlignmentAccordion({
  alignMode,
  alignAnchor,
  onAlignModeChange,
  onAlignAnchorChange,
}: {
  alignMode: DiffAlignMode;
  alignAnchor: DiffAlignAnchor;
  onAlignModeChange: (mode: DiffAlignMode) => void;
  onAlignAnchorChange: (anchor: DiffAlignAnchor) => void;
}) {
  return (
    <AccordionCard
      icon={<Maximize2 size={16} />}
      label="Alignment"
      sublabel={`Scale: ${alignMode}, Anchor: ${alignAnchor}`}
      colorTheme="orange"
      alwaysOpen
    >
      <div className="space-y-3 pt-1">
        <SelectInput
          label="Scale Mode"
          value={alignMode}
          options={ALIGN_MODE_OPTIONS}
          onChange={(v) => onAlignModeChange(v as DiffAlignMode)}
        />
        <SelectInput
          label="Anchor"
          value={alignAnchor}
          options={ANCHOR_OPTIONS}
          onChange={(v) => onAlignAnchorChange(v as DiffAlignAnchor)}
        />
      </div>
    </AccordionCard>
  );
}
