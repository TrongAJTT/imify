import { Hand, Pause, ZoomIn } from "lucide-react"

import { Tooltip } from "@/options/components/tooltip"

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

  const buttonClass = (isActive: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`

  return (
    <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-1 gap-1">
      <Tooltip label={zoomLabel} content="Scroll wheel zooms toward cursor." variant="nowrap">
        <button
          type="button"
          onClick={() => onChange("zoom")}
          className={buttonClass(mode === "zoom")}
          aria-pressed={mode === "zoom"}
        >
          <ZoomIn size={14} />
          <span>Zoom</span>
        </button>
      </Tooltip>

      <Tooltip
        label={panLabel}
        content="Scroll wheel pans vertically. Hold Shift for horizontal pan."
        variant="nowrap"
      >
        <button
          type="button"
          onClick={() => onChange("pan")}
          className={buttonClass(mode === "pan")}
          aria-pressed={mode === "pan"}
        >
          <Hand size={14} />
          <span>Pan</span>
        </button>
      </Tooltip>

      <Tooltip
        label={idleLabel}
        content="Preview wheel interaction is disabled."
        variant="nowrap"
      >
        <button
          type="button"
          onClick={() => onChange("idle")}
          className={buttonClass(mode === "idle")}
          aria-pressed={mode === "idle"}
        >
          <Pause size={14} />
          <span>Idle</span>
        </button>
      </Tooltip>
    </div>
  )
}

export default PreviewInteractionModeToggle
