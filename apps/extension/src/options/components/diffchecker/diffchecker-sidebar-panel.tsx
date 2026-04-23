import type {
  DiffAlgorithm,
  DiffAlignAnchor,
  DiffAlignMode,
  DiffViewMode
} from "@imify/features/diffchecker/types"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { ViewModeAccordion } from "@/options/components/diffchecker/view-mode-accordion"
import { ComparisonAccordion } from "@/options/components/diffchecker/comparison-accordion"
import { AlignmentAccordion } from "@/options/components/diffchecker/alignment-accordion"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem
} from "@imify/ui/ui/workspace-config-sidebar-panel"

interface DiffcheckerSidebarPanelProps {
  enableWideSidebarGrid?: boolean
}

export function DiffcheckerSidebarPanel({ enableWideSidebarGrid = false }: DiffcheckerSidebarPanelProps) {
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
      content: <ViewModeAccordion viewMode={viewMode} onViewModeChange={setViewMode} />
    },
    {
      id: "comparison",
      content: (
        <ComparisonAccordion
          viewMode={viewMode}
          algorithm={algorithm}
          overlayOpacity={overlayOpacity}
          diffThreshold={diffThreshold}
          onAlgorithmChange={setAlgorithm}
          onOverlayOpacityChange={setOverlayOpacity}
          onDiffThresholdChange={setDiffThreshold}
        />
      )
    },
    {
      id: "alignment",
      content: (
        <AlignmentAccordion
          alignMode={alignMode}
          alignAnchor={alignAnchor}
          onAlignModeChange={setAlignMode}
          onAlignAnchorChange={setAlignAnchor}
        />
      )
    }
  ]

  return <WorkspaceConfigSidebarPanel title="DIFFCHECKER SETTINGS" items={sidebarItems} twoColumn={enableWideSidebarGrid} />
}
