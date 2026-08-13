import React, { useMemo, useState } from "react";

import { ColorMatchRulesAccordion } from "./color-match-rules-accordion";
import { SplitterCustomGuidesAccordion } from "./splitter-custom-guides-accordion";
import { SplitterOrderDialog } from "./splitter-order-dialog";
import { SplitterPatternSequenceAccordion } from "./splitter-pattern-sequence-accordion";
import { SplitOptionsAccordion } from "./split-options-accordion";
import { QuickExportSelector } from "../shared/quick-export-selector";
import { useSplitterStore } from "@imify/stores/stores/splitter-store";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  SidebarCard,
} from "@imify/ui";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "@imify/i18n";
import type { QuickExportFormat } from "@imify/core";

interface SplitterSidebarPanelProps {
  enableWideSidebarGrid?: boolean;
}

export function SplitterSidebarPanel({
  enableWideSidebarGrid = false,
}: SplitterSidebarPanelProps) {
  const { t } = useTranslation("splitter");

  const splitSettings = useSplitterStore((state) => state.splitSettings);
  const exportSettings = useSplitterStore((state) => state.exportSettings);
  const uiState = useSplitterStore((state) => state.uiState);

  const setSplitSettings = useSplitterStore((state) => state.setSplitSettings);
  const setExportSettings = useSplitterStore(
    (state) => state.setExportSettings,
  );
  const setUiState = useSplitterStore((state) => state.setUiState);
  const addColorRule = useSplitterStore((state) => state.addColorRule);
  const updateColorRule = useSplitterStore((state) => state.updateColorRule);
  const removeColorRule = useSplitterStore((state) => state.removeColorRule);

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
        <QuickExportSelector
          format={exportSettings.format}
          onFormatChange={(format: QuickExportFormat) =>
            setExportSettings({ format })
          }
          fileNamePattern={exportSettings.fileNamePattern}
          onFileNamePatternChange={(fileNamePattern: string) =>
            setExportSettings({ fileNamePattern })
          }
          theme="orange"
        >
          <SidebarCard
            label={t("splitOrder")}
            sublabel={splitOrderSummary}
            icon={<ArrowUpDown size={14} />}
            theme="orange"
            onClick={() => setIsSplitOrderDialogOpen(true)}
          />
        </QuickExportSelector>
      ),
    });

    return items;
  }, [
    addColorRule,
    removeColorRule,
    setSplitSettings,
    setExportSettings,
    setUiState,
    showColorRuleCard,
    showCustomGuidesCard,
    showPatternSequenceCard,
    splitOrderSummary,
    splitSettings,
    exportSettings,
    uiState,
    updateColorRule,
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
