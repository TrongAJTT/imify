import React, { useState, useMemo, useEffect } from "react";
import { X, Save, FileEdit, Zap, Tags, Info } from "lucide-react";
import { SecondaryButton } from "./secondary-button";
import { Button } from "./button";
import { TextInput } from "./text-input";
import { SelectChip } from "./select-chip";
import { BaseDialog } from "./base-dialog";
import { buildSmartOutputFileName } from "@imify/core/file-name-pattern";

export interface RenamePatternPreviewSample {
  originalFileName: string;
  dimensions: { width: number; height: number } | null;
  index: number;
  totalFiles: number;
  outputExtension: string;
}

export interface RenamePatternDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pattern: string) => void;
  initialPattern: string;
  /** Dialog title (default: Advanced Renaming) */
  title?: string;
  /** Quick preset buttons */
  presets: Array<{ label: string; pattern: string }>;
  /** Tags shown in the sidebar (omit tags you do not want offered, e.g. no [OriginalName] for splicing) */
  availableTags: Array<{ tag: string; label: string }>;
  /** Sample used for live preview via {@link buildSmartOutputFileName} */
  previewSample: RenamePatternPreviewSample;
  /** When pattern is empty on save, use this instead */
  emptyPatternFallback: string;
  /** Placeholder for the pattern text field */
  patternPlaceholder?: string;
  /** Optional hint under "Input" preview line */
  previewInputHint?: string;

  // Translation props
  namingPatternLabel?: string;
  quickPresetsLabel?: string;
  inputLabel?: string;
  outputLabel?: string;
  tagListLabel?: string;
  inputWarningLabel?: string;
  cancelLabel?: string;
  applyLabel?: string;
  originalNameNoticeLabel?: string;
  originalNameNoticeDesc?: string;
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
  previewInputHint,
  namingPatternLabel = "Naming Pattern",
  quickPresetsLabel = "Quick presets",
  inputLabel = "Input",
  outputLabel = "Output",
  tagListLabel = "Tag List",
  inputWarningLabel = "Dynamic tag [Input] can only be used once.",
  cancelLabel = "Cancel",
  applyLabel = "Apply pattern",
  originalNameNoticeLabel = "Note:",
  originalNameNoticeDesc = "The [OriginalName] tag receives the input image's filename in single-image tools (Processor, Splitter, Background Remover, Upscaler). In multi-image and generative tools (Splicing, Filling, Collage Maker, Pattern Generator), it uses the tool's default identifier.",
}: RenamePatternDialogProps) {
  const [pattern, setPattern] = useState(initialPattern);

  useEffect(() => {
    if (isOpen) {
      setPattern(initialPattern);
    }
  }, [isOpen, initialPattern]);

  const isDirty = pattern !== initialPattern;

  const inputTagCount = useMemo(() => {
    const matches = pattern.match(/\[input\]/gi);
    return matches ? matches.length : 0;
  }, [pattern]);

  const hasTooManyInputs = inputTagCount > 1;

  const preview = useMemo(() => {
    return buildSmartOutputFileName({
      pattern,
      originalFileName: previewSample.originalFileName,
      dimensions: previewSample.dimensions,
      index: previewSample.index,
      totalFiles: previewSample.totalFiles,
      outputExtension: previewSample.outputExtension,
      now: new Date(),
    });
  }, [pattern, previewSample]);

  const extUpper = previewSample.outputExtension
    .replace(/^\./, "")
    .toUpperCase();

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      isDirty={isDirty}
      size="2xl"
      contentClassName="w-full overflow-hidden flex flex-col"
      header={
        <div className="px-5 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 pr-12">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-sky-100 dark:bg-sky-500/10 rounded-xl">
              <FileEdit className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              {title}
            </h3>
          </div>
        </div>
      }
      stickyHeader={true}
      footer={
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-rose-500 font-medium text-xs">
            {hasTooManyInputs && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {inputWarningLabel}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 shrink-0">
            <SecondaryButton onClick={onClose} className="px-6">
              {cancelLabel}
            </SecondaryButton>
            <Button
              onClick={() => {
                const finalPattern = pattern.trim() || emptyPatternFallback;
                onSave(finalPattern);
                onClose();
              }}
              disabled={!isDirty || hasTooManyInputs}
              className="px-6 flex items-center gap-2 shadow-lg shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {applyLabel}
            </Button>
          </div>
        </div>
      }
      stickyFooter={true}
    >
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-slate-800 flex-1 overflow-hidden">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <TextInput
            label={namingPatternLabel}
            value={pattern}
            onChange={setPattern}
            placeholder={patternPlaceholder}
            variant="large"
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Zap size={12} className="text-amber-500" />
              {quickPresetsLabel}
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {inputLabel}
                </span>
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
                <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block">
                  {outputLabel}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center text-[8px] text-sky-600 dark:text-sky-400 font-bold shrink-0 uppercase">
                    {extUpper.slice(0, 3)}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate break-all">
                    {preview}
                  </span>
                </div>
              </div>

              {/* Info notice about [OriginalName] behavior across tools */}
              <div className="rounded-lg border border-sky-200/80 bg-sky-50/70 p-3 dark:border-sky-900/50 dark:bg-sky-950/30 mt-2">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong className="font-semibold text-slate-800 dark:text-slate-200 mr-1">
                      {originalNameNoticeLabel}
                    </strong>
                    {originalNameNoticeDesc}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-56 p-6 bg-slate-50/50 dark:bg-slate-800/20 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Tags size={12} className="text-sky-500" />
            {tagListLabel}
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
                <span className="text-[10px] text-slate-400 group-hover:text-slate-500 mt-0.5 leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
}

/** Batch / Single processor: full tag set including original filename */
export const BATCH_RENAME_PRESETS: Array<{ label: string; pattern: string }> = [
  { label: "Default", pattern: "[OriginalName]" },
  { label: "Designer", pattern: "[OriginalName]_[Width]x[Height]" },
  { label: "Marketing", pattern: "Imify_[Date]_[OriginalName]" },
  { label: "SEO", pattern: "[Date]-[OriginalName]" },
];

export const BATCH_RENAME_TAGS: Array<{ tag: string; label: string }> = [
  { tag: "[OriginalName]", label: "Original filename" },
  { tag: "[Width]", label: "Image width" },
  { tag: "[Height]", label: "Image height" },
  { tag: "[Date]", label: "Current date (YYYYMMDD)" },
  { tag: "[Time]", label: "Current time (HHMMSS)" },
  { tag: "[Index]", label: "Sequence index (1, 2, 3...)" },
  { tag: "[PaddedIndex]", label: "Padded index (001, 002...)" },
  { tag: "[Ext]", label: "Target extension" },
  { tag: "[Input]", label: "Custom user input" },
];

/** Image Splicing: no original filename tag */
export const SPLICING_EXPORT_RENAME_PRESETS: Array<{
  label: string;
  pattern: string;
}> = [
  { label: "Default", pattern: "spliced-[Index]" },
  { label: "Dated", pattern: "spliced-[Index]-[Date]" },
  { label: "Sized", pattern: "spliced-[Index]-[Width]x[Height]" },
  { label: "Stamped", pattern: "[Date]-[Time]-spliced-[PaddedIndex]" },
];

export const SPLICING_EXPORT_RENAME_TAGS: Array<{
  tag: string;
  label: string;
}> = [
  { tag: "[Width]", label: "Exported image width (px)" },
  { tag: "[Height]", label: "Exported image height (px)" },
  { tag: "[Date]", label: "Current date (YYYYMMDD)" },
  { tag: "[Time]", label: "Current time (HHMMSS)" },
  { tag: "[Index]", label: "Export index (1, 2, 3...)" },
  { tag: "[PaddedIndex]", label: "Padded index (001, 002...)" },
  { tag: "[Ext]", label: "File extension" },
  { tag: "[Input]", label: "Custom user input" },
];

/** Image Splitter: keep original filename tag plus split-aware presets */
export const SPLITTER_EXPORT_RENAME_PRESETS: Array<{
  label: string;
  pattern: string;
}> = [
  { label: "Default", pattern: "split-[OriginalName]-[Index]" },
  { label: "Padded", pattern: "split-[OriginalName]-[PaddedIndex]" },
  { label: "Sized", pattern: "split-[OriginalName]-[Width]x[Height]" },
  { label: "Stamped", pattern: "[Date]-[Time]-split-[OriginalName]-[Index]" },
];

export const SPLITTER_EXPORT_RENAME_TAGS: Array<{
  tag: string;
  label: string;
}> = [
  { tag: "[OriginalName]", label: "Original filename" },
  { tag: "[Width]", label: "Exported image width (px)" },
  { tag: "[Height]", label: "Exported image height (px)" },
  { tag: "[Date]", label: "Current date (YYYYMMDD)" },
  { tag: "[Time]", label: "Current time (HHMMSS)" },
  { tag: "[Index]", label: "Split index (1, 2, 3...)" },
  { tag: "[PaddedIndex]", label: "Padded split index (001, 002...)" },
  { tag: "[Ext]", label: "File extension" },
  { tag: "[Input]", label: "Custom user input" },
];
