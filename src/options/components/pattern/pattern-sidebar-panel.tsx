import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { PatternAssetSettingsAccordion } from "@/options/components/pattern/pattern-asset-settings-accordion"
import { PatternAssetsAccordion } from "@/options/components/pattern/pattern-assets-accordion"
import { PatternBoundaryAccordion } from "@/options/components/pattern/pattern-boundary-accordion"
import { PatternCanvasAccordion } from "@/options/components/pattern/pattern-canvas-accordion"
import { PatternExportAccordion } from "@/options/components/pattern/pattern-export-accordion"
import { PatternSettingsAccordion } from "@/options/components/pattern/pattern-settings-accordion"

export function PatternSidebarPanel() {
  return (
    <div className="flex flex-col gap-1">
      <SidebarPanel title="CONFIGURATION" childrenClassName="flex flex-col gap-3">
        <PatternCanvasAccordion />
        <PatternAssetsAccordion />
        <PatternAssetSettingsAccordion />
        <PatternSettingsAccordion />
        <PatternBoundaryAccordion />
        <PatternExportAccordion />
      </SidebarPanel>
    </div>
  )
}
