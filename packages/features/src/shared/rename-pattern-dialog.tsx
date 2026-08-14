import React, { useMemo } from "react";
import {
  RenamePatternDialog,
  type RenamePatternPreviewSample,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import type { ToolExportNamingConfig } from "@imify/core";

export interface SharedRenamePatternDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pattern: string) => void;
  initialPattern: string;
  namingConfig?: ToolExportNamingConfig;
  previewSample?: Partial<RenamePatternPreviewSample>;
  emptyPatternFallback?: string;
  title?: string;
}

const DEFAULT_FALLBACK_SAMPLE: RenamePatternPreviewSample = {
  originalFileName: "vacation-photo.jpg",
  dimensions: { width: 3840, height: 2160 },
  index: 1,
  totalFiles: 100,
  outputExtension: "webp",
};

export function SharedRenamePatternDialog({
  isOpen,
  onClose,
  onSave,
  initialPattern,
  namingConfig,
  previewSample,
  emptyPatternFallback,
  title,
}: SharedRenamePatternDialogProps) {
  const { t } = useTranslation(["processor", "common"]);

  const translatedPresets = useMemo(
    () => [
      {
        label: t("processor:renameDialog.presets.default"),
        pattern: namingConfig?.defaultPattern || "[OriginalName]",
      },
      {
        label: t("processor:renameDialog.presets.designer"),
        pattern: "[OriginalName]_[Width]x[Height]",
      },
      {
        label: t("processor:renameDialog.presets.marketing"),
        pattern: "Imify_[Date]_[OriginalName]",
      },
      {
        label: t("processor:renameDialog.presets.stamped"),
        pattern: `${namingConfig?.defaultOriginalName || "imify"}_[Date]_[Time]`,
      },
    ],
    [t, namingConfig],
  );

  const translatedTags = useMemo(
    () => [
      {
        tag: "[OriginalName]",
        label: t("processor:renameDialog.tags.originalName"),
      },
      {
        tag: "[Width]",
        label: t("processor:renameDialog.tags.width"),
      },
      {
        tag: "[Height]",
        label: t("processor:renameDialog.tags.height"),
      },
      {
        tag: "[Date]",
        label: t("processor:renameDialog.tags.date"),
      },
      {
        tag: "[Time]",
        label: t("processor:renameDialog.tags.time"),
      },
      {
        tag: "[Index]",
        label: t("processor:renameDialog.tags.index"),
      },
      {
        tag: "[PaddedIndex]",
        label: t("processor:renameDialog.tags.paddedIndex"),
      },
      {
        tag: "[Ext]",
        label: t("processor:renameDialog.tags.ext"),
      },
      {
        tag: "[Input]",
        label: t("processor:renameDialog.tags.input"),
      },
    ],
    [t],
  );

  const sample: RenamePatternPreviewSample = useMemo(
    () => ({
      originalFileName:
        previewSample?.originalFileName ||
        namingConfig?.defaultOriginalName ||
        DEFAULT_FALLBACK_SAMPLE.originalFileName,
      dimensions:
        previewSample?.dimensions ?? DEFAULT_FALLBACK_SAMPLE.dimensions,
      index: previewSample?.index ?? DEFAULT_FALLBACK_SAMPLE.index,
      totalFiles:
        previewSample?.totalFiles ?? DEFAULT_FALLBACK_SAMPLE.totalFiles,
      outputExtension:
        previewSample?.outputExtension ??
        DEFAULT_FALLBACK_SAMPLE.outputExtension,
    }),
    [previewSample, namingConfig],
  );

  const previewInputHint = t("processor:renameDialog.previewInputHint", {
    name: sample.originalFileName,
    width: sample.dimensions?.width ?? "?",
    height: sample.dimensions?.height ?? "?",
    index: sample.index,
    total: sample.totalFiles,
    defaultValue: `${sample.originalFileName} (${sample.dimensions?.width}x${sample.dimensions?.height})`,
  });

  return (
    <RenamePatternDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      initialPattern={initialPattern}
      presets={translatedPresets}
      availableTags={translatedTags}
      previewSample={sample}
      emptyPatternFallback={
        emptyPatternFallback || namingConfig?.defaultPattern || "[OriginalName]"
      }
      title={title || t("processor:renameDialog.title")}
      namingPatternLabel={t("processor:renameDialog.namingPattern")}
      quickPresetsLabel={t("processor:renameDialog.quickPresets")}
      inputLabel={t("processor:renameDialog.input")}
      outputLabel={t("processor:renameDialog.output")}
      tagListLabel={t("processor:renameDialog.tagList")}
      inputWarningLabel={t("processor:renameDialog.inputWarning")}
      cancelLabel={t("processor:renameDialog.cancel")}
      applyLabel={t("processor:renameDialog.apply")}
      patternPlaceholder={t("processor:renameDialog.placeholder")}
      previewInputHint={previewInputHint}
      originalNameNoticeLabel={t(
        "processor:renameDialog.originalNameNoticeLabel",
      )}
      originalNameNoticeDesc={t(
        "processor:renameDialog.originalNameNoticeDesc",
      )}
    />
  );
}
