import { Hand, Pause, ZoomIn } from "lucide-react"

import { SegmentedControl, type SegmentedControlOption } from "./segmented-control"

export type PreviewInteractionMode = "zoom" | "pan" | "idle"

interface PreviewInteractionModeToggleProps {
  mode: PreviewInteractionMode
  onChange: (mode: PreviewInteractionMode) => void
  zoomKeyHint?: string
  panKeyHint?: string
  idleKeyHint?: string
}

export function PreviewInteractionModeToggle({
  mode,
  onChange,
  zoomKeyHint = "Z",
  panKeyHint = "V",
  idleKeyHint = "N",
}: PreviewInteractionModeToggleProps) {
  const zoomLabel = zoomKeyHint === "Unassigned" ? "Zoom Mode" : `Zoom Mode (${zoomKeyHint})`
  const panLabel = panKeyHint === "Unassigned" ? "Pan Mode" : `Pan Mode (${panKeyHint})`
  const idleLabel = idleKeyHint === "Unassigned" ? "Idle Mode" : `Idle Mode (${idleKeyHint})`
  const options: SegmentedControlOption<PreviewInteractionMode>[] = [
    {
      value: "zoom",
      label: "Zoom",
      icon: <ZoomIn size={14} />,
      tooltipLabel: zoomLabel,
      tooltipContent: "Scroll wheel zooms toward cursor.",
      tooltipVariant: "nowrap"
    },
    {
      value: "pan",
      label: "Pan",
      icon: <Hand size={14} />,
      tooltipLabel: panLabel,
      tooltipContent: "Scroll wheel pans vertically. Hold Shift for horizontal pan.",
      tooltipVariant: "nowrap"
    },
    {
      value: "idle",
      label: "Idle",
      icon: <Pause size={14} />,
      tooltipLabel: idleLabel,
      tooltipContent: "Preview wheel interaction is disabled.",
      tooltipVariant: "nowrap"
    }
  ]

  return (
    <SegmentedControl
      value={mode}
      options={options}
      onChange={onChange}
      ariaLabel="Preview interaction mode"
    />
  )
}

export default PreviewInteractionModeToggle
