import type {
  DiffAlgorithm,
  DiffAlignAnchor,
  DiffAlignMode,
  DiffViewMode
} from "@/features/diffchecker/types"
import { useDiffcheckerStore } from "@/options/stores/diffchecker-store"
import { ViewModeAccordion } from "@/options/components/diffchecker/view-mode-accordion"
import { ComparisonAccordion } from "@/options/components/diffchecker/comparison-accordion"
import { AlignmentAccordion } from "@/options/components/diffchecker/alignment-accordion"
import { Sidebar } from "~node_modules/lucide-react/dist/lucide-react"
import { SidebarPanel } from "../ui/sidebar-panel"

export function DiffcheckerSidebarPanel() {
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

  return (
    <SidebarPanel title="Diffchecker Settings" childrenClassName="flex flex-col gap-3">
      {/* View Mode Accordion */}
      <ViewModeAccordion
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Comparison Accordion */}
      <ComparisonAccordion
        viewMode={viewMode}
        algorithm={algorithm}
        overlayOpacity={overlayOpacity}
        diffThreshold={diffThreshold}
        onAlgorithmChange={setAlgorithm}
        onOverlayOpacityChange={setOverlayOpacity}
        onDiffThresholdChange={setDiffThreshold}
      />

      {/* Alignment Accordion */}
      <AlignmentAccordion
        alignMode={alignMode}
        alignAnchor={alignAnchor}
        onAlignModeChange={setAlignMode}
        onAlignAnchorChange={setAlignAnchor}
      />
    </SidebarPanel>
  )
}
