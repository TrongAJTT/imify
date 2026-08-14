import React from "react";
import { SharedRenamePatternDialog } from "../shared/rename-pattern-dialog";
import { PROCESSOR_NAMING_CONFIG } from "@imify/core";

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
  return (
    <SharedRenamePatternDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      initialPattern={initialPattern}
      namingConfig={PROCESSOR_NAMING_CONFIG}
      previewSample={BATCH_PREVIEW_SAMPLE}
    />
  );
}
