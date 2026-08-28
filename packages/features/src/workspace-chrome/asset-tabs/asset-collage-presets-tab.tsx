"use client";

import React, { useState } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { AccordionCard, Button, MutedText } from "@imify/ui";
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
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        <div className="space-y-4 md:space-y-6 pt-6">
          {/* Header Info Accordion Card */}
          <AccordionCard
            icon={<LayoutGrid size={16} />}
            label={t("assets.collagePresets.managementTitle")}
            sublabel={
              t("assets.collagePresets.managementDesc").length > 80
                ? `${t("assets.collagePresets.managementDesc").slice(0, 80)}...`
                : t("assets.collagePresets.managementDesc")
            }
            colorTheme="amber"
            defaultOpen={
              typeof window !== "undefined" ? window.innerWidth >= 640 : true
            }
          >
            <div className="space-y-2">
              <MutedText className="text-xs text-slate-600 dark:text-amber-400/80 leading-relaxed">
                {t("assets.collagePresets.managementDesc")}
              </MutedText>
              <div className="flex items-center justify-end gap-1.5 pt-1">
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
          </AccordionCard>

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
