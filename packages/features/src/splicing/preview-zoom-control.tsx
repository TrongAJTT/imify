import { RotateCcw } from "lucide-react"
import type { RefObject } from "react"
import type { ValueScrubHandlers } from "../shared/use-value-scrubbing"
import { Tooltip } from "../shared/tooltip"
import { SPLICING_TOOLTIPS } from "./splicing-tooltips"

interface PreviewZoomControlProps {
  editingZoom: boolean
  zoom: number
  zoomDraft: string
  showPreviewReset: boolean
  zoomInputRef: RefObject<HTMLInputElement>
  onZoomDraftChange: (next: string) => void
  onCommitZoomDraft: () => void
  onCancelZoomEdit: () => void
  onResetZoom: () => void
  scrubHandlers: ValueScrubHandlers
}

export function PreviewZoomControl({
  editingZoom,
  zoom,
  zoomDraft,
  showPreviewReset,
  zoomInputRef,
  onZoomDraftChange,
  onCommitZoomDraft,
  onCancelZoomEdit,
  onResetZoom,
  scrubHandlers
}: PreviewZoomControlProps) {
  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg z-10 pointer-events-auto select-text">
      {editingZoom ? (
        <input
          ref={zoomInputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Zoom percent"
          className="w-14 rounded bg-slate-800 px-1.5 py-0.5 text-right tabular-nums text-white outline-none ring-1 ring-sky-500"
          value={zoomDraft}
          onChange={(e) => onZoomDraftChange(e.target.value.replace(/\D/g, ""))}
          onBlur={onCommitZoomDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              onCommitZoomDraft()
            }
            if (e.key === "Escape") {
              e.preventDefault()
              onCancelZoomEdit()
            }
          }}
        />
      ) : (
        <Tooltip
          variant="wide1"
          label={SPLICING_TOOLTIPS.previewZoom.label}
          content={SPLICING_TOOLTIPS.previewZoom.controlsHelp}
        >
          <button
            type="button"
            className="min-w-[2.75rem] text-left tabular-nums hover:text-sky-300"
            aria-label="Zoom percent (hold+drag to scrub, click to edit)"
            {...scrubHandlers}
          >
            {zoom}%
          </button>
        </Tooltip>
      )}
      {showPreviewReset && (
        <button
          type="button"
          onClick={onResetZoom}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors"
          aria-label="Reset zoom and pan"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  )
}



