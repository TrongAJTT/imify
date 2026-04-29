import React from "react"
import {
  RenamePatternDialog,
  BATCH_RENAME_PRESETS,
  BATCH_RENAME_TAGS
} from "@imify/ui"

export interface BatchRenameDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (pattern: string) => void
  initialPattern: string
}

const BATCH_PREVIEW_SAMPLE = {
  originalFileName: "vacation-photo.jpg",
  dimensions: { width: 3840, height: 2160 },
  index: 7,
  totalFiles: 100,
  outputExtension: "webp"
} as const

export function BatchRenameDialog({ isOpen, onClose, onSave, initialPattern }: BatchRenameDialogProps) {
  return (
    <RenamePatternDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      initialPattern={initialPattern}
      presets={BATCH_RENAME_PRESETS}
      availableTags={BATCH_RENAME_TAGS}
      previewSample={BATCH_PREVIEW_SAMPLE}
      emptyPatternFallback="[OriginalName]"
      patternPlaceholder="e.g. [OriginalName]_[Width]x[Height]"
    />
  )
}

