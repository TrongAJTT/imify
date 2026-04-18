import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { PatternAssetsAccordion } from "@/options/components/pattern/pattern-assets-accordion"
import { PatternCanvasAccordion } from "@/options/components/pattern/pattern-canvas-accordion"
import { PatternExportAccordion } from "@/options/components/pattern/pattern-export-accordion"
import { PatternSettingsAccordion } from "@/options/components/pattern/pattern-settings-accordion"

export function PatternSidebarPanel() {
  return (
    <div className="flex flex-col gap-1">
      <SidebarPanel title="CONFIGURATION" childrenClassName="flex flex-col gap-3">
        <PatternCanvasAccordion />
        <PatternAssetsAccordion />
        <PatternSettingsAccordion />
        <PatternExportAccordion />
      </SidebarPanel>
    </div>
  )
}
