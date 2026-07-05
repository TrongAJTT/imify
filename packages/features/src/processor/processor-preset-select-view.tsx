import React, { useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { EmptyDropCard, Shield, MutedText, Button } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { PRESET_HIGHLIGHT_COLORS } from "@imify/stores/stores/preset-colors";
import {
  useBatchStore,
  type SavedSetupPreset,
  type SetupContext,
} from "@imify/stores/stores/batch-store";
import { PresetCard } from "./preset-card";
import { SavePresetDialog } from "./save-preset-dialog";
import { WorkspaceSelectHeader } from "./workspace-select-header";

export function ProcessorPresetSelectView({
  context,
  presets,
  activePresetId,
  onOpenPreset,
  onCreatePreset,
  onUpdatePresetMeta,
  onDeletePreset,
}: {
  context: SetupContext;
  presets: SavedSetupPreset[];
  activePresetId: string | null;
  onOpenPreset: (presetId: string) => void;
  onCreatePreset: (name: string, color: string) => void;
  onUpdatePresetMeta: (payload: {
    id: string;
    name: string;
    highlightColor: string;
  }) => void;
  onDeletePreset: (presetId: string) => void;
}) {
  const { t } = useTranslation(["processor", "common"]);
  const { togglePinPreset } = useBatchStore();
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SavedSetupPreset | null>(
    null,
  );
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"processor" | "feature">(
    "processor",
  );

  const isFeaturePreset = (id: string) => {
    return (
      id.startsWith("preset_background-remover") ||
      id.startsWith("preset_splicing_") ||
      id.startsWith("preset_image-splitter_") ||
      id.startsWith("preset_filling_")
    );
  };

  const contextLabel = context === "single" ? "Single" : "Batch";
  const formats = useMemo(() => {
    return ["all", "png", "webp", "avif", "jxl", "jpg", "bmp", "ico", "tiff"];
  }, []);

  const filteredPresets = useMemo(() => {
    let list = presets;

    if (selectedType === "processor") {
      list = list.filter((p) => !isFeaturePreset(p.id));
    } else if (selectedType === "feature") {
      list = list.filter((p) => isFeaturePreset(p.id));
    }

    if (selectedFormat !== "all") {
      list = list.filter((p) => {
        const fmt =
          p.config.targetFormat === "mozjpeg" ? "jpg" : p.config.targetFormat;
        return fmt === selectedFormat;
      });
    }
    return [...list].sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinA !== pinB) {
        return pinB - pinA;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [presets, selectedFormat, selectedType]);

  const sortedPresets = filteredPresets; // Use filtered ones for display
  const openCreateDialog = () => {
    setEditingPreset(null);
    setIsSavePresetDialogOpen(true);
  };
  const openEditDialog = (preset: SavedSetupPreset) => {
    setEditingPreset(preset);
    setIsSavePresetDialogOpen(true);
  };

  const refreshPresets = async () => {
    if ((useBatchStore as any).persist?.rehydrate) {
      await (useBatchStore as any).persist.rehydrate();
    }
  };

  const handleSavePreset = (name: string, color: string) => {
    if (editingPreset) {
      onUpdatePresetMeta({ id: editingPreset.id, name, highlightColor: color });
      setEditingPreset(null);
      setIsSavePresetDialogOpen(false);
      return;
    }
    onCreatePreset(name, color);
    setIsSavePresetDialogOpen(false);
  };
  const confirmDeletePreset = (preset: SavedSetupPreset) => {
    if (
      !window.confirm(
        t("presetSelector.deleteConfirm", {
          defaultValue: `Delete preset "${preset.name}"?`,
          name: preset.name,
        }),
      )
    )
      return;
    onDeletePreset(preset.id);
  };

  const filterControl = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <Shield
        left={t("presetSelector.type", "Type")}
        size="sm"
        leftBg="bg-slate-700 dark:bg-slate-800"
        leftColor="text-white"
        rightBg="bg-slate-100 dark:bg-slate-800"
        rightColor="text-slate-600 dark:text-slate-400"
        className="border border-slate-200 dark:border-slate-700 w-full sm:w-auto"
        right={
          <div className="flex items-center gap-1.5 h-full">
            {(["processor", "feature"] as const).map((tVal, i, arr) => (
              <React.Fragment key={tVal}>
                <button
                  type="button"
                  onClick={() => setSelectedType(tVal)}
                  className={`transition-colors hover:text-sky-500 py-1 ${selectedType === tVal ? "text-sky-600 dark:text-sky-400 font-extrabold" : ""}`}
                >
                  {tVal === "processor" ? "Processor" : "Features"}
                </button>
                {i < arr.length - 1 && <span className="opacity-30">•</span>}
              </React.Fragment>
            ))}
          </div>
        }
      />
      <Shield
        left={t("presetSelector.filter", "Filter")}
        size="sm"
        leftBg="bg-slate-700 dark:bg-slate-800"
        leftColor="text-white"
        rightBg="bg-slate-100 dark:bg-slate-800"
        rightColor="text-slate-600 dark:text-slate-400"
        className="border border-slate-200 dark:border-slate-700 w-full sm:w-auto"
        right={
          <div className="flex items-center gap-1.5 h-full overflow-x-auto no-scrollbar">
            {formats.map((f, i) => (
              <React.Fragment key={f}>
                <button
                  type="button"
                  onClick={() => setSelectedFormat(f)}
                  className={`transition-colors hover:text-sky-500 py-1 shrink-0 ${selectedFormat === f ? "text-sky-600 dark:text-sky-400 font-extrabold" : ""}`}
                >
                  {f.toUpperCase()}
                </button>
                {i < formats.length - 1 && (
                  <span className="opacity-30">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        }
      />
    </div>
  );

  return (
    <div className="p-0">
      {presets.length === 0 ? (
        <EmptyDropCard
          icon={<Plus size={28} className="text-sky-500" />}
          iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none"
          title={t("presetSelector.noPresetsYet", {
            defaultValue: `No ${contextLabel.toLowerCase()} presets yet`,
            context: contextLabel.toLowerCase(),
          })}
          subtitle={t("presetSelector.createFirstMessage")}
          onClick={openCreateDialog}
        />
      ) : (
        <>
          <WorkspaceSelectHeader
            title={t("presetSelector.contextPresets", {
              defaultValue: `${contextLabel} Presets`,
              context: contextLabel,
            })}
            createLabel={t("common:add")}
            onCreate={openCreateDialog}
            createIcon={<Plus size={14} />}
            extraActions={
              <Button
                variant="secondary"
                size="sm"
                onClick={refreshPresets}
                className="gap-2 h-8 px-3"
              >
                <RotateCcw size={12} className="scale-x-[-1]" />
                <span className="hidden sm:inline">{t("common:refresh")}</span>
              </Button>
            }
          />
          <div className="mb-4 flex justify-start">{filterControl}</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {sortedPresets.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <MutedText>
                  {t(
                    "presetSelector.noPresetsMatchFilter",
                    "No presets match the selected filter.",
                  )}
                </MutedText>
              </div>
            ) : (
              sortedPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  context={context}
                  isActive={preset.id === activePresetId}
                  onSelect={() => onOpenPreset(preset.id)}
                  onEdit={() => openEditDialog(preset)}
                  onDelete={() => confirmDeletePreset(preset)}
                  onTogglePin={() => togglePinPreset(preset.id)}
                />
              ))
            )}
          </div>
        </>
      )}
      <SavePresetDialog
        isOpen={isSavePresetDialogOpen}
        onClose={() => {
          setIsSavePresetDialogOpen(false);
          setEditingPreset(null);
        }}
        onSave={handleSavePreset}
        highlightColors={PRESET_HIGHLIGHT_COLORS}
        title={
          editingPreset
            ? t("presetSelector.editPresetTitle")
            : t("presetSelector.savePresetTitle")
        }
        defaultName={
          editingPreset
            ? editingPreset.name
            : t("presetSelector.defaultPresetName", {
                defaultValue: `${contextLabel} Preset ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                context: contextLabel,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })
        }
      />
    </div>
  );
}
