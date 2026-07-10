import React, { useMemo, useState } from "react";

import type { SplitterExportFormat } from "./types";
import { ColorMatchRulesAccordion } from "./color-match-rules-accordion";
import { SplitterCustomGuidesAccordion } from "./splitter-custom-guides-accordion";
import { SplitterOrderDialog } from "./splitter-order-dialog";
import { SplitterPatternSequenceAccordion } from "./splitter-pattern-sequence-accordion";
import { SplitOptionsAccordion } from "./split-options-accordion";
import { getFormatAdvancedLabel } from "../processor/format-advanced-label";
import { PresetSelector } from "../processor/preset-selector";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import { useIdentifiedPresetLoader } from "../shared/use-identified-preset-loader";
import { useSplitterStore } from "@imify/stores/stores/splitter-store";
import { useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store";
import { type SavedSetupPreset } from "@imify/stores/stores/batch-store";
import { FEATURE_PRESET_PREFIXES } from "@imify/core";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  SidebarCard,
} from "@imify/ui";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "@imify/i18n";

interface SplitterSidebarPanelProps {
  enableWideSidebarGrid?: boolean;
}

const SPLITTER_TARGET_FORMATS: SplitterExportFormat[] = [
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "tiff",
];

export function SplitterSidebarPanel({
  enableWideSidebarGrid = false,
}: SplitterSidebarPanelProps) {
  const { t } = useTranslation("splitter");

  const splitSettings = useSplitterStore((state) => state.splitSettings);
  const exportSettings = useSplitterStore((state) => state.exportSettings);
  const uiState = useSplitterStore((state) => state.uiState);
  const activePresetId = useSplitterStore((state) => state.activePresetId);

  const setSplitSettings = useSplitterStore((state) => state.setSplitSettings);
  const setUiState = useSplitterStore((state) => state.setUiState);
  const addColorRule = useSplitterStore((state) => state.addColorRule);
  const updateColorRule = useSplitterStore((state) => state.updateColorRule);
  const removeColorRule = useSplitterStore((state) => state.removeColorRule);
  const applyPreset = useSplitterStore((state) => state.applyPreset);
  const resetToDefault = useSplitterStore((state) => state.resetToDefault);

  const activeSplitterPresetId = useSplitterPresetStore(
    (state) => state.activePresetId,
  );
  const activeSplitterPreset = useSplitterPresetStore((state) =>
    state.presets.find((p) => p.id === activeSplitterPresetId),
  );

  const identifiedPresetId = `${FEATURE_PRESET_PREFIXES.IMAGE_SPLITTER}_${activeSplitterPresetId}`;
  const identifiedPresetName = `Image Splitter #${activeSplitterPreset?.name || activeSplitterPresetId}`;
  const identifiedPresetColor = activeSplitterPreset?.highlightColor || "#f97316";

  const splitterIdentifiedPreset: SavedSetupPreset = useMemo(
    () => ({
      ...VIRTUAL_DEFAULT_PNG_PRESET,
      id: identifiedPresetId,
      name: identifiedPresetName,
      highlightColor: identifiedPresetColor,
      config: {
        ...VIRTUAL_DEFAULT_PNG_PRESET.config,
        targetFormat: exportSettings.targetFormat as any,
        quality: exportSettings.quality,
        formatOptions: exportSettings.codecOptions as any,
        fileNamePattern: exportSettings.fileNamePattern,
      },
    }),
    [
      identifiedPresetId,
      identifiedPresetName,
      identifiedPresetColor,
      exportSettings,
    ],
  );

  useIdentifiedPresetLoader(
    splitterIdentifiedPreset,
    activePresetId,
    applyPreset,
  );

  const showColorRuleCard =
    splitSettings.mode === "advanced" &&
    splitSettings.advancedMethod === "color_match";
  const showPatternSequenceCard =
    splitSettings.mode === "advanced" &&
    (splitSettings.advancedMethod === "pixel_pattern" ||
      splitSettings.advancedMethod === "percent_pattern");
  const showCustomGuidesCard =
    splitSettings.mode === "advanced" &&
    splitSettings.advancedMethod === "custom_list";

  const codecOptions = exportSettings.codecOptions;
  const [isSplitOrderDialogOpen, setIsSplitOrderDialogOpen] = useState(false);

  const splitOrderSummary = useMemo(() => {
    const horizontalLabel =
      splitSettings.horizontalOrder === "left_to_right"
        ? t("leftArrowRight")
        : t("rightArrowLeft");
    const verticalLabel =
      splitSettings.verticalOrder === "top_to_bottom"
        ? t("topArrowBottom")
        : t("bottomArrowTop");

    return splitSettings.gridTraversal === "column_first"
      ? `(${verticalLabel}) -> (${horizontalLabel})`
      : `(${horizontalLabel}) -> (${verticalLabel})`;
  }, [
    splitSettings.gridTraversal,
    splitSettings.horizontalOrder,
    splitSettings.verticalOrder,
    t,
  ]);

  const formatAdvancedLabel = useMemo(
    () => getFormatAdvancedLabel(exportSettings.targetFormat),
    [exportSettings.targetFormat],
  );

  const sidebarItems: WorkspaceConfigSidebarItem[] = useMemo(() => {
    const items: WorkspaceConfigSidebarItem[] = [
      {
        id: "split-options",
        label: t("splitOptions"),
        columnSpan: 2,
        content: (
          <SplitOptionsAccordion
            settings={splitSettings}
            isOpen={uiState.isSplitOptionsOpen}
            onOpenChange={(open) => setUiState({ isSplitOptionsOpen: open })}
            onChange={setSplitSettings}
          />
        ),
      },
    ];

    if (showColorRuleCard) {
      items.push({
        id: "color-match-rules",
        label: t("colorMatchRules"),
        content: (
          <ColorMatchRulesAccordion
            rules={splitSettings.colorRules}
            isOpen={uiState.isColorMatchRulesOpen}
            onOpenChange={(open) => setUiState({ isColorMatchRulesOpen: open })}
            onAddRule={addColorRule}
            onUpdateRule={updateColorRule}
            onRemoveRule={removeColorRule}
          />
        ),
      });
    }

    if (showPatternSequenceCard) {
      items.push({
        id: "pattern-sequence",
        label: t("patternSequence"),
        columnSpan: 2,
        content: (
          <SplitterPatternSequenceAccordion
            settings={splitSettings}
            isOpen={uiState.isPatternSequenceOpen}
            onOpenChange={(open) => setUiState({ isPatternSequenceOpen: open })}
            onChange={setSplitSettings}
          />
        ),
      });
    }

    if (showCustomGuidesCard) {
      items.push({
        id: "custom-guides",
        label: t("customGuides"),
        columnSpan: 2,
        content: (
          <SplitterCustomGuidesAccordion
            settings={splitSettings}
            isOpen={uiState.isCustomGuidesOpen}
            onOpenChange={(open) => setUiState({ isCustomGuidesOpen: open })}
            onChange={setSplitSettings}
          />
        ),
      });
    }

    items.push({
      id: "output-settings",
      label: "",
      columnSpan: 2,
      content: (
        <PresetSelector
          label={t("outputSettings")}
          theme="orange"
          identifiedPreset={splitterIdentifiedPreset}
          formatFilter={SPLITTER_TARGET_FORMATS}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
          renderSidebarContent={() => (
            <div className="space-y-3">
              <SidebarCard
                label={t("splitOrder")}
                sublabel={splitOrderSummary}
                icon={<ArrowUpDown size={14} />}
                theme="orange"
                onClick={() => setIsSplitOrderDialogOpen(true)}
              />
            </div>
          )}
          tooltipContent={t("selectPresetTooltip")}
        />
      ),
    });

    return items;
  }, [
    addColorRule,
    removeColorRule,
    setSplitSettings,
    setUiState,
    showColorRuleCard,
    showCustomGuidesCard,
    showPatternSequenceCard,
    splitOrderSummary,
    splitSettings,
    uiState,
    updateColorRule,
    formatAdvancedLabel,
    activePresetId,
    identifiedPresetId,
    identifiedPresetName,
    identifiedPresetColor,
    applyPreset,
    resetToDefault,
    t,
  ]);

  return (
    <>
      <WorkspaceConfigSidebarPanel
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
      />

      <SplitterOrderDialog
        isOpen={isSplitOrderDialogOpen}
        onClose={() => setIsSplitOrderDialogOpen(false)}
        settings={{
          horizontalOrder: splitSettings.horizontalOrder,
          verticalOrder: splitSettings.verticalOrder,
          gridTraversal: splitSettings.gridTraversal,
        }}
        onChange={setSplitSettings}
      />
    </>
  );
}
