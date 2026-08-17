import React from "react";
import { useTranslation } from "@imify/i18n";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui";
import { PatternAssetSettingsAccordion } from "./pattern-asset-settings-accordion";
import { PatternAssetsAccordion } from "./pattern-assets-accordion";
import { PatternBoundaryAccordion } from "./pattern-boundary-accordion";
import { PatternCanvasAccordion } from "./pattern-canvas-accordion";
import { PatternSettingsAccordion } from "./pattern-settings-accordion";
import { QuickExportSelector } from "../shared/quick-export-selector";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { PATTERN_NAMING_CONFIG, type QuickExportFormat } from "@imify/core";

interface PatternSidebarPanelProps {
  enableWideSidebarGrid?: boolean;
}

export function PatternSidebarPanel({
  enableWideSidebarGrid = false,
}: PatternSidebarPanelProps) {
  const { t } = useTranslation("pattern");

  const exportFormat = usePatternStore((s) => s.exportFormat);
  const setExportFormat = usePatternStore((s) => s.setExportFormat);
  const fileNamePattern = usePatternStore((s) => s.fileNamePattern);
  const setFileNamePattern = usePatternStore((s) => s.setFileNamePattern);

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "canvas",
      label: t("sidebar.canvas"),
      columnSpan: 2,
      content: <PatternCanvasAccordion />,
    },
    {
      id: "assets",
      label: t("sidebar.assets"),
      columnSpan: 2,
      content: <PatternAssetsAccordion />,
    },
    {
      id: "asset-settings",
      label: t("sidebar.assetSettings"),
      content: <PatternAssetSettingsAccordion />,
    },
    {
      id: "distribution-settings",
      label: t("sidebar.pattern"),
      content: <PatternSettingsAccordion />,
    },
    {
      id: "boundary-settings",
      label: t("sidebar.boundarySettings"),
      content: <PatternBoundaryAccordion />,
    },
    {
      id: "export-settings",
      label: "",
      columnSpan: 2,
      content: (
        <QuickExportSelector
          format={exportFormat}
          onFormatChange={(format: QuickExportFormat) =>
            setExportFormat(format as any)
          }
          fileNamePattern={fileNamePattern}
          onFileNamePatternChange={setFileNamePattern}
          namingConfig={PATTERN_NAMING_CONFIG}
          theme="amber"
        />
      ),
    },
  ];

  return (
    <WorkspaceConfigSidebarPanel
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
    />
  );
}
