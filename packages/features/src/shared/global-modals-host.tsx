"use client";

import React from "react";
import { useConfirmationDialogStore, useToastStore } from "@imify/stores";
import { RenameInputDialog, ToastContainer } from "@imify/ui";
import { BatchDownloadConfirmDialog } from "./download-confirm-dialog";
import { OOMWarningDialog } from "../processor/batch/oom-warning-dialog";
import { SplicingHeavyPreviewQualityDialog } from "../splicing/splicing-heavy-preview-quality-dialog";
import { WhatsNewUpdateNotificationGate } from "../workspace-chrome/whats-new-update-notification-gate";

export function GlobalModalsHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);
  const downloadConfirm = useConfirmationDialogStore(
    (state) => state.downloadConfirm,
  );
  const resolveDownloadConfirm = useConfirmationDialogStore(
    (state) => state.resolveDownloadConfirm,
  );

  const oomWarning = useConfirmationDialogStore((state) => state.oomWarning);
  const resolveOomWarning = useConfirmationDialogStore(
    (state) => state.resolveOomWarning,
  );

  const heavyPreviewWarning = useConfirmationDialogStore(
    (state) => state.heavyPreviewWarning,
  );
  const resolveHeavyPreviewWarning = useConfirmationDialogStore(
    (state) => state.resolveHeavyPreviewWarning,
  );

  const renameInput = useConfirmationDialogStore((state) => state.renameInput);
  const resolveRenameInput = useConfirmationDialogStore(
    (state) => state.resolveRenameInput,
  );

  return (
    <>
      {/* 1. Download Confirmation Dialog */}
      <BatchDownloadConfirmDialog
        isOpen={downloadConfirm.isOpen}
        count={downloadConfirm.count}
        onClose={() => resolveDownloadConfirm(false)}
        onConfirm={(dontShowAgain) =>
          resolveDownloadConfirm(true, dontShowAgain)
        }
      />

      {/* 2. OOM Warning Dialog */}
      <OOMWarningDialog
        isOpen={oomWarning.isOpen}
        totalSize={oomWarning.totalSizeMB}
        recommendedSize={oomWarning.recommendedSizeMB}
        onClose={() => resolveOomWarning(false)}
        onConfirm={(dontShowAgain: boolean) =>
          resolveOomWarning(true, dontShowAgain)
        }
      />

      {/* 3. Splicing Heavy Preview Quality Warning Dialog */}
      <SplicingHeavyPreviewQualityDialog
        isOpen={heavyPreviewWarning.isOpen}
        imageCount={heavyPreviewWarning.imageCount}
        totalPixels={heavyPreviewWarning.totalPixels}
        onClose={() => resolveHeavyPreviewWarning(false)}
        onConfirm={(dontShowAgain?: boolean) =>
          resolveHeavyPreviewWarning(true, !!dontShowAgain)
        }
      />

      {/* 4. Custom Filename Rename Input Dialog */}
      <RenameInputDialog
        isOpen={renameInput.isOpen}
        renamePattern={renameInput.pattern}
        onClose={() => resolveRenameInput(null)}
        onConfirm={(value) => resolveRenameInput(value)}
      />

      {/* 5. Update Notification & Changelogs Gate */}
      <WhatsNewUpdateNotificationGate />

      {/* 6. Global Unified Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={dismissToast} />
    </>
  );
}
