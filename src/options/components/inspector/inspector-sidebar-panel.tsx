import { useInspectorStore } from "@/options/stores/inspector-store"
import { DisplayAccordion } from "@/options/components/inspector/display-accordion"
import { MetadataAccordion } from "@/options/components/inspector/metadata-accordion"
import { InformationAccordion } from "@/options/components/inspector/information-accordion"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"

export function InspectorSidebarPanel() {
  const exifSortMode = useInspectorStore((s) => s.exifSortMode)
  const showSensitiveOnly = useInspectorStore((s) => s.showSensitiveOnly)
  const paletteCount = useInspectorStore((s) => s.paletteCount)

  const setExifSortMode = useInspectorStore((s) => s.setExifSortMode)
  const setShowSensitiveOnly = useInspectorStore((s) => s.setShowSensitiveOnly)
  const setPaletteCount = useInspectorStore((s) => s.setPaletteCount)

  return (
    <SidebarPanel title="INSPECTOR SETTINGS" childrenClassName="flex flex-col gap-3">
      {/* Display Accordion */}
      <DisplayAccordion
        paletteCount={paletteCount}
        onPaletteCountChange={setPaletteCount}
      />

      {/* Metadata Accordion */}
      <MetadataAccordion
        exifSortMode={exifSortMode}
        showSensitiveOnly={showSensitiveOnly}
        onExifSortModeChange={setExifSortMode}
        onShowSensitiveOnlyChange={setShowSensitiveOnly}
      />

      {/* Information Accordion */}
      <InformationAccordion />
    </SidebarPanel>
  )
}
