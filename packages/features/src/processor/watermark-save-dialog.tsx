import React from "react";
import { Save, Stamp, X } from "lucide-react";

import {
  BaseDialog,
  Button,
  SecondaryButton,
  TextInput,
  Subheading,
  BodyText,
  MutedText,
  LabelText,
  SegmentedControl,
} from "@imify/ui";
import type { SavedWatermarkItem } from "@imify/stores/stores/watermark-store";
import { useTranslation } from "@imify/i18n";

export type WatermarkSaveAction = "save_new" | "overwrite";

interface WatermarkSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: WatermarkSaveAction;
  onActionChange: (action: WatermarkSaveAction) => void;
  name: string;
  onNameChange: (name: string) => void;
  overwriteTarget: SavedWatermarkItem | null;
  hasSavedItems: boolean;
  onChooseOverwriteTarget: () => void;
  onSave: () => void;
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
  onSave,
}: WatermarkSaveDialogProps) {
  const { t } = useTranslation("processor");

  if (!isOpen) {
    return null;
  }

  const isOverwriteMode = action === "overwrite";
  const canChooseOverwriteTarget = hasSavedItems;
  const isNameDisabled = isOverwriteMode && !overwriteTarget;
  const canSave =
    name.trim().length > 0 && (!isOverwriteMode || Boolean(overwriteTarget));

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full max-w-lg mx-auto rounded-xl overflow-hidden flex flex-col"
      header={
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <Save size={18} />
            </div>
            <div className="min-w-0">
              <Subheading className="text-sm font-bold leading-tight">
                {t("watermarkDialog.saveTitle", "Save Watermark")}
              </Subheading>
              <MutedText className="text-[11px] leading-tight mt-0.5">
                {t(
                  "watermarkDialog.saveDesc",
                  "Save current watermark as a reusable pattern.",
                )}
              </MutedText>
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
      }
      stickyHeader={true}
      footer={
        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <SecondaryButton onClick={onClose} className="px-4">
            {t("watermarkDialog.cancel", "Cancel")}
          </SecondaryButton>
          <Button onClick={onSave} disabled={!canSave} className="px-5">
            <Save size={14} />
            {t("watermarkDialog.save", "Save")}
          </Button>
        </div>
      }
      stickyFooter={true}
    >
      <div className="space-y-4 p-5 min-h-[35vh]">
        <div className="space-y-1">
          <LabelText className="text-xs">
            {t("watermarkDialog.saveAction", "Action")}
          </LabelText>
          <SegmentedControl
            value={action}
            onChange={(v) => onActionChange(v as WatermarkSaveAction)}
            options={[
              {
                value: "save_new",
                label: t("watermarkDialog.saveNew", "Save as new"),
              },
              {
                value: "overwrite",
                label: t(
                  "watermarkDialog.overwriteExisting",
                  "Overwrite existing",
                ),
                tooltipContent: !hasSavedItems
                  ? t(
                      "watermarkDialog.noSavedWatermarks",
                      "No saved watermarks available for overwrite yet.",
                    )
                  : undefined,
              },
            ]}
            buttonClassName="min-w-[120px] justify-center text-xs py-1.5"
            colorTheme="sky"
          />
          {!hasSavedItems && action === "overwrite" && (
            <MutedText className="text-[10px] italic mt-1 px-1">
              {t(
                "watermarkDialog.noSavedWatermarks",
                "No saved watermarks available for overwrite yet.",
              )}
            </MutedText>
          )}
        </div>

        {isOverwriteMode ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <BodyText className="text-xs font-bold">
                  {t("watermarkDialog.overwriteTarget", "Overwrite target")}
                </BodyText>
                <MutedText className="text-[11px] mt-0.5">
                  {t(
                    "watermarkDialog.chooseTarget",
                    "Choose which saved watermark to replace.",
                  )}
                </MutedText>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onChooseOverwriteTarget}
                disabled={!canChooseOverwriteTarget}
              >
                <Stamp size={13} />
                {t("watermarkDialog.chooseBtn", "Choose")}
              </Button>
            </div>

            <div className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs dark:border-slate-600">
              {overwriteTarget ? (
                <div className="flex flex-col gap-0.5">
                  <BodyText className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    {overwriteTarget.name}
                  </BodyText>
                  <MutedText className="text-[10px]">
                    {t("watermarkDialog.savedOn", "Saved on")}{" "}
                    {new Date(
                      overwriteTarget.updatedAt || overwriteTarget.createdAt,
                    ).toLocaleString()}
                  </MutedText>
                </div>
              ) : (
                <MutedText className="text-xs italic py-1">
                  {t(
                    "watermarkDialog.noTargetSelected",
                    "No target selected yet.",
                  )}
                </MutedText>
              )}
            </div>
          </div>
        ) : null}

        <TextInput
          label={t("watermarkDialog.watermarkName", "Watermark name")}
          value={name}
          onChange={onNameChange}
          placeholder="e.g. Logo Bottom Right"
          disabled={isNameDisabled}
          autoFocus={!isNameDisabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSave) {
              onSave();
            }
          }}
        />
      </div>
    </BaseDialog>
  );
}
