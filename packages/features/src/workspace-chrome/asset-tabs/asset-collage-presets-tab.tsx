"use client";

import React, { useState } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { Button, BodyText, MutedText } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { confirmDialog, toast } from "@imify/stores";
import { useCollagePresetStore } from "@imify/stores/stores/collage-preset-store";
import { COLLAGE_LAYOUT_PRESETS } from "../../collage-maker/config";
import { CollagePresetGrid } from "../../collage-maker/collage-preset-grid";

export function AssetCollagePresetsTab() {
  const { t } = useTranslation(["workspace", "collageMaker", "common"]);
  const customPresets = useCollagePresetStore((state) => state.presets);
  const reorderPresets = useCollagePresetStore((state) => state.reorderPresets);
  const resetPresetOrder = useCollagePresetStore(
    (state) => state.resetPresetOrder,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const totalCustom = customPresets.length;
  const totalDefault = COLLAGE_LAYOUT_PRESETS.length;

  const handleResetOrder = async () => {
    const confirmed = await confirmDialog({
      title: t("assets.collagePresets.refreshConfirm"),
      description: t("assets.collagePresets.refreshDesc"),
    });

    if (confirmed) {
      // Sort custom presets back by creation time descending (newest first)
      const sorted = [...customPresets].sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      reorderPresets(sorted);
      resetPresetOrder();
      setRefreshKey((k) => k + 1);
      toast.success(t("assets.collagePresets.refreshSuccess"));
    }
  };

  return (
    <div
      key={refreshKey}
      className="flex flex-col h-full overflow-hidden bg-slate-50/80 dark:bg-slate-950/40"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Header Info Banner matching AI Models tab */}
          <div className="bg-white dark:bg-amber-500/10 p-5 rounded-xl flex gap-4 border border-slate-200 dark:border-amber-500/20 shadow-sm">
            <LayoutGrid className="text-amber-500 shrink-0" size={20} />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <BodyText className="text-sm font-bold text-slate-800 dark:text-amber-300">
                  {t("assets.collagePresets.managementTitle")}
                </BodyText>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/40 border border-amber-100 dark:border-amber-700">
                    <Sparkles
                      size={11}
                      className="text-amber-600 dark:text-amber-400"
                    />
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-tight">
                      {totalCustom} custom
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                      {totalDefault} built-in
                    </span>
                  </div>
                </div>
              </div>
              <MutedText className="text-xs text-slate-600 dark:text-amber-400/80 leading-relaxed">
                {t("assets.collagePresets.managementDesc")}
              </MutedText>
            </div>
          </div>

          {/* Main Grid View */}
          <CollagePresetGrid
            allowReorder={true}
            allowRename={true}
            allowDelete={true}
            wideGrid={true}
          />
        </div>
      </div>

      {/* Footer matching AI Models tab */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <MutedText className="text-xs italic font-medium text-slate-500">
          {t("assets.collagePresets.reorderHint")}
        </MutedText>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetOrder}
          className="h-9 px-4 text-xs font-bold border-slate-200 hover:bg-slate-50 transition-colors"
        >
          {t("common:refresh")}
        </Button>
      </div>
    </div>
  );
}
