import { useEffect, useMemo, useState } from "react"
import { FileText, Monitor, Ruler, Share2, X } from "lucide-react"

import { CANVAS_SIZE_PRESETS, type CanvasSizePreset } from "@/features/filling/types"
import { BaseDialog } from "@/options/components/ui/base-dialog"
import { Button } from "@/options/components/ui/button"
import { Subheading, MutedText } from "@/options/components/ui/typography"

interface CanvasSizeDialogProps {
  isOpen: boolean
  onClose: () => void
  currentWidth: number
  currentHeight: number
  onConfirm: (preset: CanvasSizePreset) => void
}

type PresetCategory = "Paper" | "Social" | "Screen"

const CATEGORY_ORDER: PresetCategory[] = ["Paper", "Social", "Screen"]

const CATEGORY_META: Record<PresetCategory, { icon: React.ReactNode; subtitle: string }> = {
  Paper: {
    icon: <FileText size={14} className="text-sky-500" />,
    subtitle: "Print-friendly paper sizes",
  },
  Social: {
    icon: <Share2 size={14} className="text-sky-500" />,
    subtitle: "Popular social-media formats",
  },
  Screen: {
    icon: <Monitor size={14} className="text-sky-500" />,
    subtitle: "Display and presentation resolutions",
  },
}

function findPresetBySize(width: number, height: number): CanvasSizePreset | null {
  return CANVAS_SIZE_PRESETS.find((preset) => preset.width === width && preset.height === height) ?? null
}

export function CanvasSizeDialog({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  onConfirm,
}: CanvasSizeDialogProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const matchingPreset = findPresetBySize(currentWidth, currentHeight)
    setSelectedLabel(matchingPreset?.label ?? null)
  }, [currentHeight, currentWidth, isOpen])

  const selectedPreset = useMemo(() => {
    return CANVAS_SIZE_PRESETS.find((preset) => preset.label === selectedLabel) ?? null
  }, [selectedLabel])

  const presetsByCategory = useMemo(() => {
    const map = new Map<PresetCategory, CanvasSizePreset[]>()

    for (const preset of CANVAS_SIZE_PRESETS) {
      if (!(preset.category in CATEGORY_META)) {
        continue
      }

      const category = preset.category as PresetCategory
      const current = map.get(category) ?? []
      current.push(preset)
      map.set(category, current)
    }

    return map
  }, [])

  const handleApply = () => {
    if (!selectedPreset) {
      return
    }

    onConfirm(selectedPreset)
  }

  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="rounded-xl w-[680px] max-w-[96vw]">
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-sky-500" />
            <Subheading>Popular Canvas Sizes</Subheading>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <MutedText className="text-xs mb-4">
          Pick from common paper, social, and screen sizes. You can continue fine-tuning width and height manually.
        </MutedText>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 px-3 py-2 mb-4">
          {selectedPreset ? (
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPreset.label}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {selectedPreset.width} x {selectedPreset.height} px
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400">No preset selected yet</div>
          )}
        </div>

        <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
          {CATEGORY_ORDER.map((category) => {
            const presets = presetsByCategory.get(category) ?? []
            if (presets.length === 0) {
              return null
            }

            return (
              <section key={category}>
                <div className="flex items-center gap-2 mb-2">
                  {CATEGORY_META[category].icon}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {category}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {CATEGORY_META[category].subtitle}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {presets.map((preset) => {
                    const selected = selectedLabel === preset.label

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSelectedLabel(preset.label)}
                        className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                          selected
                            ? "border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-500/10"
                            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div
                          className={`text-xs font-semibold ${
                            selected
                              ? "text-sky-700 dark:text-sky-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {preset.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {preset.width} x {preset.height} px
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply} disabled={!selectedPreset}>
            Apply Size
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}
