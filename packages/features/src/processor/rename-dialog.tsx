import React, { useMemo } from "react";
import { RenamePatternDialog } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export interface BatchRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pattern: string) => void;
  initialPattern: string;
}

const BATCH_PREVIEW_SAMPLE = {
  originalFileName: "vacation-photo.jpg",
  dimensions: { width: 3840, height: 2160 },
  index: 7,
  totalFiles: 100,
  outputExtension: "webp",
} as const;

export function BatchRenameDialog({
  isOpen,
  onClose,
  onSave,
  initialPattern,
}: BatchRenameDialogProps) {
  const { t } = useTranslation("processor");

  const translatedPresets = useMemo(
    () => [
      { label: t("renameDialog.presets.default"), pattern: "[OriginalName]" },
      {
        label: t("renameDialog.presets.designer"),
        pattern: "[OriginalName]_[Width]x[Height]",
      },
      {
        label: t("renameDialog.presets.marketing"),
        pattern: "Imify_[Date]_[OriginalName]",
      },
      {
        label: t("renameDialog.presets.seo"),
        pattern: "[Date]-[OriginalName]",
      },
    ],
    [t],
  );

  const translatedTags = useMemo(
    () => [
      { tag: "[OriginalName]", label: t("renameDialog.tags.originalName") },
      { tag: "[Width]", label: t("renameDialog.tags.width") },
      { tag: "[Height]", label: t("renameDialog.tags.height") },
      { tag: "[Date]", label: t("renameDialog.tags.date") },
      { tag: "[Time]", label: t("renameDialog.tags.time") },
      { tag: "[Index]", label: t("renameDialog.tags.index") },
      { tag: "[PaddedIndex]", label: t("renameDialog.tags.paddedIndex") },
      { tag: "[Ext]", label: t("renameDialog.tags.ext") },
      { tag: "[Input]", label: t("renameDialog.tags.input") },
    ],
    [t],
  );

  const previewInputHint = t("renameDialog.previewInputHint", {
    name: BATCH_PREVIEW_SAMPLE.originalFileName,
    width: BATCH_PREVIEW_SAMPLE.dimensions.width,
    height: BATCH_PREVIEW_SAMPLE.dimensions.height,
    index: BATCH_PREVIEW_SAMPLE.index,
    total: BATCH_PREVIEW_SAMPLE.totalFiles,
  });

  return (
    <RenamePatternDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      initialPattern={initialPattern}
      presets={translatedPresets}
      availableTags={translatedTags}
      previewSample={BATCH_PREVIEW_SAMPLE}
      emptyPatternFallback="[OriginalName]"
      title={t("renameDialog.title")}
      namingPatternLabel={t("renameDialog.namingPattern")}
      quickPresetsLabel={t("renameDialog.quickPresets")}
      inputLabel={t("renameDialog.input")}
      outputLabel={t("renameDialog.output")}
      tagListLabel={t("renameDialog.tagList")}
      inputWarningLabel={t("renameDialog.inputWarning")}
      cancelLabel={t("renameDialog.cancel")}
      applyLabel={t("renameDialog.apply")}
      patternPlaceholder={t("renameDialog.placeholder")}
      previewInputHint={previewInputHint}
    />
  );
}
