import React, { useEffect, useMemo, useState } from "react";
import {
  AccordionCard,
  MutedText,
  Button,
  BaseDialog,
  Heading,
  SidebarCard,
  Shield,
  TextInput,
  LabelText,
} from "@imify/ui";
import { useImifyNavigation } from "../shared/use-imify-navigation";
import { Bookmark, Sparkles, Plus, RotateCcw, X, Check } from "lucide-react";
import {
  useBatchStore,
  type SavedSetupPreset,
} from "@imify/stores/stores/batch-store";
import { PRESET_HIGHLIGHT_COLORS } from "@imify/stores/stores/preset-colors";
import { ProcessorPresetDetail } from "./processor-preset-detail";
import { PresetCard } from "./preset-card";
import { BatchSetupSidebarPanel } from "./setup-sidebar-panel";
import { DEFAULT_PERFORMANCE_PREFERENCES } from "./performance-preferences";

interface PresetSelectorProps {
  label?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  tooltipLabel?: string;
  tooltipContent?: string;
  theme?: "pink" | "blue" | "purple" | "amber" | "sky" | "orange";
  identifiedPreset?: SavedSetupPreset;
  formatFilter?: string[];
  activePresetId: string | null;
  renderCustomSettings?: () => React.ReactNode;
  renderSidebarContent?: () => React.ReactNode;
  onSelect: (preset: SavedSetupPreset) => void;
  onReset?: () => void;
}

export function PresetSelector({
  label = "Select Preset",
  sublabel,
  icon = <Bookmark size={16} />,
  tooltipLabel,
  tooltipContent,
  theme = "blue",
  identifiedPreset,
  formatFilter,
  activePresetId,
  renderCustomSettings,
  renderSidebarContent,
  onSelect,
  onReset,
}: PresetSelectorProps) {
  const { presets, saveCurrentPreset, targetFormat } = useBatchStore();

  const isTargetFormatAllowed = useMemo(() => {
    if (!formatFilter) return true;
    const normalizedTarget = targetFormat === "jpg" ? "mozjpeg" : targetFormat;
    return formatFilter.some((f) => {
      const normalizedFilter = f === "jpg" ? "mozjpeg" : f;
      return normalizedFilter === normalizedTarget;
    });
  }, [formatFilter, targetFormat]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"select" | "custom">("select");

  // Form Custom Creation State (simplified to basic metadata)
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState("#0ea5e9");

  useEffect(() => {
    if (isDialogOpen) {
      if (identifiedPreset) {
        setCustomName(identifiedPreset.name);
        setCustomColor(identifiedPreset.highlightColor);
      } else {
        setCustomName(
          `Custom Preset ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        );
        setCustomColor(PRESET_HIGHLIGHT_COLORS[0] ?? "#0ea5e9");
      }
      setActiveTab("select");
    }
  }, [isDialogOpen, identifiedPreset]);

  const handleCreateAndApply = () => {
    const createdId = saveCurrentPreset({
      id: identifiedPreset?.id,
      name: customName.trim() || "Custom Preset",
      highlightColor: customColor,
    });

    // Synchronously retrieve the newly created preset object from the store and apply it
    const newPreset = useBatchStore.getState().presets.find((p) => p.id === createdId);
    if (newPreset) {
      onSelect(newPreset);
    }

    setIsDialogOpen(false);
  };

  const formats = useMemo(() => {
    const baseFormats = [
      "all",
      "png",
      "webp",
      "avif",
      "jxl",
      "jpg",
      "bmp",
      "ico",
      "tiff",
    ];
    if (!formatFilter) return baseFormats;

    // Include 'all' plus any format allowed by formatFilter
    return [
      "all",
      ...baseFormats.slice(1).filter((f) => {
        const target = f === "jpg" ? "mozjpeg" : f;
        return formatFilter.includes(target);
      }),
    ];
  }, [formatFilter]);

  // Filter and sort presets by context "single" and optional format filter + dialog filter
  const sortedAvailablePresets = useMemo(() => {
    const list = presets.filter((p) => {
      const contextMatch = true;
      const propFormatMatch =
        !formatFilter || formatFilter.includes(p.config.targetFormat);

      let dialogFormatMatch = true;
      if (selectedFormat !== "all") {
        const fmt =
          p.config.targetFormat === "mozjpeg" ? "jpg" : p.config.targetFormat;
        dialogFormatMatch = fmt === selectedFormat;
      }

      return contextMatch && propFormatMatch && dialogFormatMatch;
    });

    return [...list].sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinA !== pinB) {
        return pinB - pinA;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [presets, formatFilter, selectedFormat]);

  const activePreset = activePresetId
    ? presets.find((p) => p.id === activePresetId)
    : activePresetId === null && identifiedPreset
      ? identifiedPreset
      : null;

  const { openSingleProcessor } = useImifyNavigation();

  const handleCreatePreset = () => {
    openSingleProcessor();
  };

  const refreshPresets = async () => {
    // Manually trigger a rehydration of the presets list from storage.
    // This allows picking up new presets from other tabs without a full page reload.
    if ((useBatchStore as any).persist?.rehydrate) {
      await (useBatchStore as any).persist.rehydrate();
    }
  };

  return (
    <>
      <div className="space-y-2">
        <AccordionCard
          label={label}
          sublabel={
            sublabel ||
            (activePreset
              ? `Active: ${activePreset.name}`
              : "No preset selected")
          }
          icon={icon}
          defaultOpen={true}
          colorTheme={theme}
          childrenClassName="p-3 space-y-3"
        >
          <div
            className="space-y-3"
            style={
              {
                "--preset-color": activePreset?.highlightColor || "#3b82f6",
              } as React.CSSProperties
            }
          >
            <SidebarCard
              label={activePreset ? activePreset.name : "Choose a Preset..."}
              sublabel={
                activePreset
                  ? `Format: ${activePreset.config.targetFormat.toUpperCase()}`
                  : "No preset selected"
              }
              icon={<Bookmark size={14} />}
              theme={theme}
              onClick={() => setIsDialogOpen(true)}
              className="border-dashed"
              tooltipLabel={tooltipLabel}
              tooltipContent={tooltipContent}
            />

            {activePreset && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles
                      size={12}
                      className={
                        theme === "pink" ? "text-pink-500" : "text-blue-500"
                      }
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Configuration Details
                    </span>
                  </div>
                  {onReset && identifiedPreset && activePresetId !== null && (
                    <button
                      onClick={onReset}
                      className="text-[10px] font-medium text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-0.5"
                    >
                      <RotateCcw size={10} />
                      Reset
                    </button>
                  )}
                </div>

                <ProcessorPresetDetail
                  preset={activePreset}
                  context="single"
                  alwaysVibrant={true}
                />

                {renderSidebarContent && (
                  <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    {renderSidebarContent()}
                  </div>
                )}
              </div>
            )}
          </div>
        </AccordionCard>
      </div>

      <BaseDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <div className="flex flex-col h-[800px] max-h-[90vh]">
          {/* Header with Segment Control */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Bookmark
                className={theme === "pink" ? "text-pink-500" : "text-blue-500"}
                size={20}
              />
              <Heading className="text-lg whitespace-nowrap hidden sm:block">
                {label}
              </Heading>
            </div>

            {/* Segment Button for switching tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("select")}
                className={`px-3.5 py-1.5 rounded-md transition-all ${
                  activeTab === "select"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Select Preset
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`px-3.5 py-1.5 rounded-md transition-all ${
                  activeTab === "custom"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Custom Create
              </button>
            </div>

            <button
              onClick={() => setIsDialogOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 -mr-2"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {activeTab === "select" ? (
              <>
                {/* Format Filter Shield (Relocated to Content) */}
                <div className="flex justify-start">
                  <Shield
                    left="Filter"
                    size="sm"
                    leftBg="bg-slate-700 dark:bg-slate-800"
                    leftColor="text-white"
                    rightBg="bg-slate-100 dark:bg-slate-800"
                    rightColor="text-slate-600 dark:text-slate-400"
                    className="border border-slate-200 dark:border-slate-700"
                    right={
                      <div className="flex items-center gap-1.5 h-full">
                        {formats.map((f, i) => (
                          <React.Fragment key={f}>
                            <button
                              type="button"
                              onClick={() => setSelectedFormat(f)}
                              className={`transition-colors hover:text-sky-500 py-1 ${selectedFormat === f ? "text-sky-600 dark:text-sky-400 font-extrabold" : ""}`}
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

                {sortedAvailablePresets.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {sortedAvailablePresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        context="single"
                        isActive={preset.id === activePresetId}
                        showActions={false}
                        onSelect={() => {
                          onSelect(preset);
                          setIsDialogOpen(false);
                        }}
                        onTogglePin={undefined} // Enforce static (non-interactive) Pin in dialog
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Bookmark size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      No Presets Found
                    </h3>
                    <MutedText className="max-w-[280px] mb-6">
                      You haven't saved any Single Processor presets for the
                      required formats ({formatFilter?.join(", ") || "any"}).
                    </MutedText>
                    <Button
                      onClick={handleCreatePreset}
                      variant="primary"
                      className="gap-2"
                    >
                      <Plus size={16} />
                      Create Your First And Refresh
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Custom Create Tab View */
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Basic Info: Preset Name & Color */}
                {!identifiedPreset && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Preset Name */}
                    <TextInput
                      label="Preset Name"
                      value={customName}
                      onChange={(e) => setCustomName(e)}
                      placeholder="e.g., Social WebP High Quality"
                      className="w-full"
                    />

                    {/* Highlight Color */}
                    <div className="space-y-2">
                      <LabelText className="text-xs">Accent Color</LabelText>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_HIGHLIGHT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCustomColor(color)}
                            className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                              customColor === color
                                ? "border-slate-800 ring-2 ring-slate-800/10 dark:border-slate-100"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select accent color ${color}`}
                          >
                            {customColor === color && (
                              <Check
                                size={12}
                                className="text-white drop-shadow-sm"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuration Panel Section (Embedded Native Sidebar Panel) */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <BatchSetupSidebarPanel
                    performancePreferences={DEFAULT_PERFORMANCE_PREFERENCES}
                    onOpenSettings={() => {}}
                    enableWideSidebarGrid={true}
                  />
                  {renderCustomSettings && renderCustomSettings()}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {activeTab === "select" && onReset && identifiedPreset && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onReset();
                    setIsDialogOpen(false);
                  }}
                  className="gap-2 h-9 shrink-0"
                >
                  <RotateCcw size={14} />
                  Reset
                </Button>
              )}
              {activeTab === "select" && (
                <Button
                  variant="secondary"
                  onClick={refreshPresets}
                  className="gap-2 h-9 shrink-0"
                >
                  <RotateCcw size={14} className="scale-x-[-1]" />
                  Refresh
                </Button>
              )}
              {activeTab === "custom" && !isTargetFormatAllowed && (
                <div className="flex items-center gap-2 text-rose-500 font-medium text-xs animate-in fade-in slide-in-from-left-2 duration-250 truncate">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    Format{" "}
                    {(targetFormat === "mozjpeg"
                      ? "MozJPEG"
                      : targetFormat
                    ).toUpperCase()}{" "}
                    is not supported. (Supported:{" "}
                    {formatFilter
                      ?.map((f) =>
                        (f === "mozjpeg" ? "MozJPEG" : f).toUpperCase(),
                      )
                      .join(", ")}
                    )
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                className="h-9"
              >
                Close
              </Button>
              {activeTab === "custom" && (
                <Button
                  variant="primary"
                  onClick={handleCreateAndApply}
                  disabled={!customName.trim() || !isTargetFormatAllowed}
                  className="h-9 font-bold px-5"
                >
                  {identifiedPreset ? "Save & Apply" : "Create & Apply"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </BaseDialog>
    </>
  );
}
