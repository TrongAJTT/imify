import { Save, Stamp, X } from "lucide-react"

import { BaseDialog } from "@/options/components/ui/base-dialog"
import { Button } from "@/options/components/ui/button"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { TextInput } from "@/options/components/ui/text-input"
import type { SavedWatermarkItem } from "@/options/stores/watermark-store"

export type WatermarkSaveAction = "save_new" | "overwrite"

interface WatermarkSaveDialogProps {
  isOpen: boolean
  onClose: () => void
  action: WatermarkSaveAction
  onActionChange: (action: WatermarkSaveAction) => void
  name: string
  onNameChange: (name: string) => void
  overwriteTarget: SavedWatermarkItem | null
  hasSavedItems: boolean
  onChooseOverwriteTarget: () => void
  onSave: () => void
}

export function WatermarkSaveDialog({
  isOpen,
  onClose,
  action,
  onActionChange,
  name,
  onNameChange,
  overwriteTarget,
  hasSavedItems,
  onChooseOverwriteTarget,
  onSave
}: WatermarkSaveDialogProps) {
  if (!isOpen) {
    return null
  }

  const isOverwriteMode = action === "overwrite"
  const canChooseOverwriteTarget = hasSavedItems
  const isNameDisabled = isOverwriteMode && !overwriteTarget
  const canSave = name.trim().length > 0 && (!isOverwriteMode || Boolean(overwriteTarget))

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full max-w-lg rounded-xl overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <Save size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Save Watermark</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Save current watermark as a reusable pattern.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Close save watermark dialog"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Action</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onActionChange("save_new")}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                action === "save_new"
                  ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              Save as new
            </button>
            <button
              type="button"
              onClick={() => onActionChange("overwrite")}
              disabled={!hasSavedItems}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                action === "overwrite"
                  ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              Overwrite existing
            </button>
          </div>
          {!hasSavedItems ? (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              No saved watermarks available for overwrite yet.
            </p>
          ) : null}
        </div>

        {isOverwriteMode ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Overwrite target</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Choose which saved watermark to replace.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onChooseOverwriteTarget}
                disabled={!canChooseOverwriteTarget}
              >
                <Stamp size={13} />
                Choose
              </Button>
            </div>

            <div className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs dark:border-slate-600">
              {overwriteTarget ? (
                <>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{overwriteTarget.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Updated {new Date(overwriteTarget.updatedAt || overwriteTarget.createdAt).toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No target selected yet.</p>
              )}
            </div>
          </div>
        ) : null}

        <TextInput
          label="Watermark name"
          value={name}
          onChange={onNameChange}
          placeholder="e.g. Logo Bottom Right"
          disabled={isNameDisabled}
          autoFocus={!isNameDisabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSave) {
              onSave()
            }
          }}
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
        <SecondaryButton onClick={onClose} className="px-4">
          Cancel
        </SecondaryButton>
        <Button onClick={onSave} disabled={!canSave} className="px-5">
          <Save size={14} />
          Save
        </Button>
      </div>
    </BaseDialog>
  )
}
