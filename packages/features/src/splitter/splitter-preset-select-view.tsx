import React, { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useTranslation } from "@imify/i18n";

import { WorkspaceSelectHeader } from "../processor/workspace-select-header";
import { EmptyDropCard } from "@imify/ui";
import { SplitterPresetDetail } from "./splitter-preset-detail";
import type { SavedSplitterPreset } from "@imify/stores/stores/splitter-preset-store";
import { useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store";
import { confirmDialog, promptSavePreset } from "@imify/stores";
import { generateDefaultPresetName } from "@imify/core";
import { PRESET_HIGHLIGHT_COLORS } from "../shared/preset-colors";
import { PresetActionToolbar } from "../shared/preset-action-toolbar";

interface SplitterPresetSelectViewProps {
  presets: SavedSplitterPreset[];
  activePresetId: string | null;
  onOpenPreset: (presetId: string) => void;
  onCreatePreset: (name: string, color: string) => void;
  onUpdatePresetMeta: (payload: {
    id: string;
    name: string;
    highlightColor: string;
  }) => void;
  onDeletePreset: (presetId: string) => void;
}

function SplitterPresetCard({
  preset,
  isActive,
  onOpen,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  preset: SavedSplitterPreset;
  isActive: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
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
      className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        isActive
          ? "border-cyan-500 bg-cyan-50/70 ring-1 ring-cyan-300 dark:border-cyan-500 dark:bg-cyan-500/10 dark:ring-cyan-700"
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
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400">
                <Check size={12} />
                Active
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/50 px-3 py-2 dark:border-slate-700/50">
        <SplitterPresetDetail preset={preset} />
      </div>
    </div>
  );
}

export function SplitterPresetSelectView({
  presets,
  activePresetId,
  onOpenPreset,
  onCreatePreset,
  onUpdatePresetMeta,
  onDeletePreset,
}: SplitterPresetSelectViewProps) {
  const { t } = useTranslation("splitter");

  const togglePinPreset = useSplitterPresetStore(
    (state) => state.togglePinPreset,
  );

  const sortedPresets = useMemo(
    () =>
      [...presets].sort((a, b) => {
        const pinA = a.pinned ? 1 : 0;
        const pinB = b.pinned ? 1 : 0;
        if (pinA !== pinB) {
          return pinB - pinA;
        }
        return b.updatedAt - a.updatedAt;
      }),
    [presets],
  );

  const openCreateDialog = async () => {
    const result = await promptSavePreset({
      defaultName: generateDefaultPresetName("splitter"),
      highlightColors: PRESET_HIGHLIGHT_COLORS,
      title: t("saveSplitterPreset"),
      featureKey: "splitter",
    });
    if (result) {
      onCreatePreset(result.name, result.color);
    }
  };

  const openEditDialog = async (preset: SavedSplitterPreset) => {
    const result = await promptSavePreset({
      defaultName: preset.name,
      highlightColors: PRESET_HIGHLIGHT_COLORS,
      title: t("editSplitterPreset"),
      featureKey: "splitter",
    });
    if (result) {
      onUpdatePresetMeta({
        id: preset.id,
        name: result.name,
        highlightColor: result.color,
      });
    }
  };

  const confirmDeletePreset = async (preset: SavedSplitterPreset) => {
    const shouldDelete = await confirmDialog({
      title: t("deleteConfirm", { name: preset.name }),
      variant: "destructive",
    });
    if (!shouldDelete) {
      return;
    }

    onDeletePreset(preset.id);
  };

  return (
    <div className="p-0">
      {sortedPresets.length === 0 ? (
        <EmptyDropCard
          icon={<Plus size={28} className="text-cyan-500" />}
          iconWrapperClassName="bg-cyan-100 dark:bg-cyan-900/30 border-transparent shadow-none"
          title={t("noPresetsTitle")}
          subtitle={t("noPresetsSubtitle")}
          onClick={openCreateDialog}
        />
      ) : (
        <>
          <WorkspaceSelectHeader
            title={t("title")}
            createLabel={t("newPreset")}
            onCreate={openCreateDialog}
            createIcon={<Plus size={14} />}
          />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {sortedPresets.map((preset) => (
              <SplitterPresetCard
                key={preset.id}
                preset={preset}
                isActive={preset.id === activePresetId}
                onOpen={() => onOpenPreset(preset.id)}
                onEdit={() => openEditDialog(preset)}
                onDelete={() => confirmDeletePreset(preset)}
                onTogglePin={() => togglePinPreset(preset.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
