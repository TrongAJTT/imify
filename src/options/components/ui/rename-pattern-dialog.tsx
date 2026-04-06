import { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Save, FileEdit, Zap, Tags } from "lucide-react"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { Button } from "@/options/components/ui/button"
import { TextInput } from "@/options/components/ui/text-input"
import { SelectChip } from "@/options/components/ui/select-chip"
import { buildSmartOutputFileName } from "@/options/components/batch/pipeline"
import { useKeyPress } from "@/options/hooks/use-key-press"

export interface RenamePatternPreviewSample {
  originalFileName: string
  dimensions: { width: number; height: number } | null
  index: number
  totalFiles: number
  outputExtension: string
}

export interface RenamePatternDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (pattern: string) => void
  initialPattern: string
  /** Dialog title (default: Advanced Renaming) */
  title?: string
  /** Quick preset buttons */
  presets: Array<{ label: string; pattern: string }>
  /** Tags shown in the sidebar (omit tags you do not want offered, e.g. no [OriginalName] for splicing) */
  availableTags: Array<{ tag: string; label: string }>
  /** Sample used for live preview via {@link buildSmartOutputFileName} */
  previewSample: RenamePatternPreviewSample
  /** When pattern is empty on save, use this instead */
  emptyPatternFallback: string
  /** Placeholder for the pattern text field */
  patternPlaceholder?: string
  /** Optional hint under "Input" preview line */
  previewInputHint?: string
}

export function RenamePatternDialog({
  isOpen,
  onClose,
  onSave,
  initialPattern,
  title = "Advanced Renaming",
  presets,
  availableTags,
  previewSample,
  emptyPatternFallback,
  patternPlaceholder = "e.g. [OriginalName]_[Width]x[Height]",
  previewInputHint
}: RenamePatternDialogProps) {
  const [pattern, setPattern] = useState(initialPattern)

  useKeyPress("Escape", onClose, isOpen)

  useEffect(() => {
    if (isOpen) {
      setPattern(initialPattern)
    }
  }, [isOpen, initialPattern])

  const preview = useMemo(() => {
    return buildSmartOutputFileName({
      pattern,
      originalFileName: previewSample.originalFileName,
      dimensions: previewSample.dimensions,
      index: previewSample.index,
      totalFiles: previewSample.totalFiles,
      outputExtension: previewSample.outputExtension,
      now: new Date()
    })
  }, [pattern, previewSample])

  if (!isOpen) return null

  if (typeof document === "undefined") {
    return null
  }

  const extUpper = previewSample.outputExtension.replace(/^\./, "").toUpperCase()

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 dark:bg-sky-500/10 rounded-xl">
              <FileEdit className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-slate-800">
          <div className="flex-1 p-6 space-y-6">
            <TextInput
              label="Naming Pattern"
              value={pattern}
              onChange={setPattern}
              placeholder={patternPlaceholder}
              variant="large"
            />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Zap size={12} className="text-amber-500" />
                Quick presets
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {presets.map((preset) => (
                  <SelectChip
                    key={preset.label}
                    label={preset.label}
                    isActive={pattern === preset.pattern}
                    onClick={() => setPattern(preset.pattern)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Input</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0">
                      {extUpper.slice(0, 3)}
                    </div>
                    <span className="text-xs text-slate-500 truncate italic">
                      {previewInputHint ??
                        `${previewSample.originalFileName} (${previewSample.dimensions?.width ?? "?"}x${
                          previewSample.dimensions?.height ?? "?"
                        }, ${previewSample.index} of ${previewSample.totalFiles})`}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block">Output</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center text-[8px] text-sky-600 dark:text-sky-400 font-bold shrink-0 uppercase">
                      {extUpper.slice(0, 3)}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate break-all">
                      {preview}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-56 p-6 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Tags size={12} className="text-sky-500" />
              Dynamic Tags
            </div>
            <div className="space-y-2">
              {availableTags.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => setPattern((p) => p + item.tag)}
                  className="flex flex-col w-full text-left p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all group"
                >
                  <code className="text-[11px] font-bold text-sky-600 dark:text-sky-400 group-hover:text-sky-500">
                    {item.tag}
                  </code>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-500 mt-0.5 leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
          <SecondaryButton onClick={onClose} className="px-6">
            Cancel
          </SecondaryButton>
          <Button
            onClick={() => {
              const finalPattern = pattern.trim() || emptyPatternFallback
              onSave(finalPattern)
              onClose()
            }}
            className="px-6 flex items-center gap-2 shadow-lg shadow-sky-500/10"
          >
            <Save className="w-4 h-4" />
            Apply pattern
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Batch / Single processor: full tag set including original filename */
export const BATCH_RENAME_PRESETS: Array<{ label: string; pattern: string }> = [
  { label: "Default", pattern: "[OriginalName]" },
  { label: "Designer", pattern: "[OriginalName]_[Width]x[Height]" },
  { label: "Marketing", pattern: "Imify_[Date]_[OriginalName]" },
  { label: "SEO", pattern: "[Date]-[OriginalName]" }
]

export const BATCH_RENAME_TAGS: Array<{ tag: string; label: string }> = [
  { tag: "[OriginalName]", label: "Original filename" },
  { tag: "[Width]", label: "Image width" },
  { tag: "[Height]", label: "Image height" },
  { tag: "[Date]", label: "Current date (YYYYMMDD)" },
  { tag: "[Time]", label: "Current time (HHMMSS)" },
  { tag: "[Index]", label: "Sequence index (1, 2, 3...)" },
  { tag: "[PaddedIndex]", label: "Padded index (001, 002...)" },
  { tag: "[Ext]", label: "Target extension" }
]

/** Image Splicing: no original filename tag */
export const SPLICING_EXPORT_RENAME_PRESETS: Array<{ label: string; pattern: string }> = [
  { label: "Default", pattern: "spliced-[Index]" },
  { label: "Dated", pattern: "spliced-[Index]-[Date]" },
  { label: "Sized", pattern: "spliced-[Index]-[Width]x[Height]" },
  { label: "Stamped", pattern: "[Date]-[Time]-spliced-[PaddedIndex]" }
]

export const SPLICING_EXPORT_RENAME_TAGS: Array<{ tag: string; label: string }> = [
  { tag: "[Width]", label: "Exported image width (px)" },
  { tag: "[Height]", label: "Exported image height (px)" },
  { tag: "[Date]", label: "Current date (YYYYMMDD)" },
  { tag: "[Time]", label: "Current time (HHMMSS)" },
  { tag: "[Index]", label: "Export index (1, 2, 3...)" },
  { tag: "[PaddedIndex]", label: "Padded index (001, 002...)" },
  { tag: "[Ext]", label: "File extension" }
]
