import React from "react"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { WorkspaceConfigSidebarPanel, type WorkspaceConfigSidebarItem } from "@imify/ui"
import { ViewModeAccordion } from "./view-mode-accordion"
import { ComparisonAccordion } from "./comparison-accordion"
import { AlignmentAccordion } from "./alignment-accordion"
import { useTranslation } from "@imify/i18n"

export function DiffcheckerSidebarPanel({ enableWideSidebarGrid = false }: { enableWideSidebarGrid?: boolean }) {
  const { t } = useTranslation("diffchecker")
  const viewMode = useDiffcheckerStore((s) => s.viewMode)
  const algorithm = useDiffcheckerStore((s) => s.algorithm)
  const alignMode = useDiffcheckerStore((s) => s.alignMode)
  const alignAnchor = useDiffcheckerStore((s) => s.alignAnchor)
  const overlayOpacity = useDiffcheckerStore((s) => s.overlayOpacity)
  const diffThreshold = useDiffcheckerStore((s) => s.diffThreshold)
  const setViewMode = useDiffcheckerStore((s) => s.setViewMode)
  const setAlgorithm = useDiffcheckerStore((s) => s.setAlgorithm)
  const setAlignMode = useDiffcheckerStore((s) => s.setAlignMode)
  const setAlignAnchor = useDiffcheckerStore((s) => s.setAlignAnchor)
  const setOverlayOpacity = useDiffcheckerStore((s) => s.setOverlayOpacity)
  const setDiffThreshold = useDiffcheckerStore((s) => s.setDiffThreshold)

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "view-mode",
      label: t("viewMode"),
      content: <ViewModeAccordion viewMode={viewMode} onViewModeChange={setViewMode} />
    },
    {
      id: "comparison",
      label: t("comparison"),
      content: <ComparisonAccordion viewMode={viewMode} algorithm={algorithm} overlayOpacity={overlayOpacity} diffThreshold={diffThreshold} onAlgorithmChange={setAlgorithm} onOverlayOpacityChange={setOverlayOpacity} onDiffThresholdChange={setDiffThreshold} />
    },
    {
      id: "alignment",
      label: t("alignment"),
      content: <AlignmentAccordion alignMode={alignMode} alignAnchor={alignAnchor} onAlignModeChange={setAlignMode} onAlignAnchorChange={setAlignAnchor} />
    }
  ]

  return <WorkspaceConfigSidebarPanel title={t("diffcheckerSettings")} items={sidebarItems} twoColumn={enableWideSidebarGrid} />
}

