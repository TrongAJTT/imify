"use client";

import React from "react";
import { BaseDialog } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { AssetCollagePresetsTab } from "../workspace-chrome/asset-tabs/asset-collage-presets-tab";

export interface CollagePresetManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollagePresetManageDialog({
  isOpen,
  onClose,
}: CollagePresetManageDialogProps) {
  const { t } = useTranslation(["collageMaker", "workspace"]);

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      mobileFullscreen
      className="h-[calc(100dvh-4rem)]"
      contentClassName="w-full h-full max-h-none overflow-hidden flex flex-col p-4"
    >
      <AssetCollagePresetsTab />
    </BaseDialog>
  );
}
