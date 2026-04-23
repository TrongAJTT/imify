import { useState } from "react"
import { AlertTriangle } from "lucide-react"

import { APP_CONFIG } from "@imify/core/config"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { Button } from "@imify/ui/ui/button"
import { BodyText, Subheading, MutedText } from "@imify/ui/ui/typography"

interface SplicingHeavyPreviewQualityDialogProps {
  isOpen: boolean
  nextQualityPercent: number
  imageCount: number
  totalPixels: number
  onClose: () => void
  onConfirm: () => void
}

export function SplicingHeavyPreviewQualityDialog({
  isOpen,
  nextQualityPercent,
  imageCount,
  totalPixels,
  onClose,
  onConfirm
}: SplicingHeavyPreviewQualityDialogProps) {
  const setSkipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (s) => s.setSkipSplicingHeavyPreviewQualityWarning
  )
  const [dontShowAgain, setDontShowAgain] = useState(false)

  if (!isOpen) return null

  const fmtM = (n: number) => (n / 1_000_000).toFixed(1)
  const { HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT, HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS } =
    APP_CONFIG.SPLICING

  const handleConfirm = () => {
    if (dontShowAgain) {
      setSkipSplicingHeavyPreviewQualityWarning(true)
    }
    onConfirm()
    setDontShowAgain(false)
  }

  const handleClose = () => {
    onClose()
    setDontShowAgain(false)
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 shrink-0">
                <AlertTriangle size={26} />
              </div>
              <Subheading className="text-xl">High preview quality</Subheading>
            </div>
            <BodyText className="text-slate-600 dark:text-slate-400">
              Preview quality <span className="font-semibold text-slate-900 dark:text-white">{nextQualityPercent}%</span>{" "}
              will decode and scale larger bitmaps, which may slow down (or even freeze) the page on big sets.
            </BodyText>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li>
                Images loaded:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{imageCount}</span> (warning if over{" "}
                {HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT})
              </li>
              <li>
                Combined pixel area:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  ~{fmtM(totalPixels)}M px²
                </span>{" "}
                (warning if over ~{fmtM(HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS)}M px²)
              </li>
            </ul>
            <label className="flex items-center gap-2.5 cursor-pointer group w-fit select-none pt-2">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-500/20 w-4 h-4 cursor-pointer transition-all"
              />
              <MutedText className="text-xs group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                Don&apos;t show this warning again
              </MutedText>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80">
          <Button variant="secondary" onClick={handleClose} className="text-sm px-4">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="text-sm px-5 bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20">
            Use {nextQualityPercent}% quality
          </Button>
        </div>
      </div>
    </div>
  )
}
