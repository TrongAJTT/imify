import React, { useMemo, useState } from "react";
import { Plus, Check } from "lucide-react";

import { EmptyDropCard } from "@imify/ui";
import { WorkspaceSelectHeader } from "../processor/workspace-select-header";
import { SplicingPresetDetail } from "./splicing-preset-detail";
import type { SavedSplicingPreset } from "@imify/stores/stores/splicing-preset-store";
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store";
import { confirmDialog, promptSavePreset } from "@imify/stores";
import { generateDefaultPresetName } from "@imify/core";
import { PRESET_HIGHLIGHT_COLORS } from "../shared/preset-colors";
import { useTranslation } from "@imify/i18n";
import { PresetActionToolbar } from "../shared/preset-action-toolbar";
import {
  QuickCollageButton,
  QuickCollageEmptyCard,
} from "../shared/quick-collage-shortcut";

interface SplicingPresetSelectViewProps {
  presets: SavedSplicingPreset[];
  activePresetId: string | null;
  onOpenPreset: (presetId: string) => void;
  onCreatePreset: (name: string, color: string) => void;
  onUpdatePresetMeta: (payload: {
    id: string;
    name: string;
    highlightColor: string;
  }) => void;
  onDeletePreset: (presetId: string) => void;
  onTogglePinPreset?: (presetId: string) => void;
}

function SplicingPresetCard({
  preset,
  isActive,
  onOpen,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  preset: SavedSplicingPreset;
  isActive: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin?: () => void;
}) {
  const { t } = useTranslation("splicing");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
        isActive
          ? "border-orange-500 bg-orange-50/70 ring-1 ring-orange-300 dark:border-orange-500 dark:bg-orange-500/10 dark:ring-orange-700"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-0 rounded-lg transition-opacity ${
          isActive ? "opacity-100" : "opacity-30 group-hover:opacity-100"
        }`}
        style={{ boxShadow: `inset 0 0 0 1.5px ${preset.highlightColor}` }}
      />

      <PresetActionToolbar
        isPinned={preset.pinned || preset.isPinned}
        onTogglePin={onTogglePin}
        onEdit={onEdit}
        onDelete={onDelete}
        alwaysVisible={isActive || preset.pinned || preset.isPinned}
      />

      <div className="relative z-10 flex min-h-[84px] w-full overflow-hidden">
        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2 flex min-w-0 items-start gap-2 pr-16">
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {preset.name}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-slate-400 dark:text-slate-500">
              {new Date(
                preset.updatedAt || preset.createdAt,
              ).toLocaleDateString()}
            </span>
            {isActive ? (
              <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <Check size={12} />
                {t("select.active")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/50 px-3 py-2 dark:border-slate-700/50">
        <SplicingPresetDetail preset={preset} />
      </div>
    </div>
  );
}

export function SplicingPresetSelectView({
  presets,
  activePresetId,
  onOpenPreset,
  onCreatePreset,
  onUpdatePresetMeta,
  onDeletePreset,
  onTogglePinPreset,
}: SplicingPresetSelectViewProps) {
  const { t } = useTranslation("splicing");

  const togglePinFromStore = useSplicingPresetStore(
    (state) => state.togglePinPreset,
  );
  const handleTogglePinPreset = onTogglePinPreset ?? togglePinFromStore;

  const sortedPresets = useMemo(
    () =>
      [...presets].sort(
        (a, b) =>
          (b.pinned || b.isPinned ? 1 : 0) - (a.pinned || a.isPinned ? 1 : 0) ||
          b.updatedAt - a.updatedAt,
      ),
    [presets],
  );

  const openCreateDialog = async () => {
    const result = await promptSavePreset({
      defaultName: generateDefaultPresetName("splicing"),
      highlightColors: PRESET_HIGHLIGHT_COLORS,
      title: t("select.savePreset"),
      featureKey: "splicing",
    });
    if (result) {
      onCreatePreset(result.name, result.color);
    }
  };

  const openEditDialog = async (preset: SavedSplicingPreset) => {
    const result = await promptSavePreset({
      defaultName: preset.name,
      highlightColors: PRESET_HIGHLIGHT_COLORS,
      title: t("select.editPreset"),
      featureKey: "splicing",
    });
    if (result) {
      onUpdatePresetMeta({
        id: preset.id,
        name: result.name,
        highlightColor: result.color,
      });
    }
  };

  const confirmDeletePreset = async (preset: SavedSplicingPreset) => {
    const shouldDelete = await confirmDialog({
      title: t("select.deleteConfirm", { name: preset.name }),
      variant: "destructive",
    });
    if (!shouldDelete) {
      return;
    }

    onDeletePreset(preset.id);
  };

  return (
    <div className="flex flex-col gap-4">
      {presets.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyDropCard
            title={t("select.noPresetsTitle", {
              defaultValue: "Chưa có preset ghép ảnh",
            })}
            subtitle={t("select.noPresetsSubtitle", {
              defaultValue:
                "Lưu cấu hình ghép ảnh yêu thích để tái sử dụng nhanh chóng",
            })}
            icon={<Plus size={28} className="text-orange-500" />}
            iconWrapperClassName="bg-orange-100 dark:bg-orange-900/30 border-transparent shadow-none"
            onClick={openCreateDialog}
          />
          <QuickCollageEmptyCard />
        </div>
      ) : (
        <>
          <WorkspaceSelectHeader
            title={t("select.title")}
            createLabel={t("select.newPreset")}
            onCreate={openCreateDialog}
            createIcon={<Plus size={14} />}
            extraActions={<QuickCollageButton />}
          />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {sortedPresets.map((preset) => (
              <SplicingPresetCard
                key={preset.id}
                preset={preset}
                isActive={preset.id === activePresetId}
                onOpen={() => onOpenPreset(preset.id)}
                onEdit={() => openEditDialog(preset)}
                onDelete={() => confirmDeletePreset(preset)}
                onTogglePin={() => handleTogglePinPreset(preset.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
