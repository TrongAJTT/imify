import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { DisplayAccordion } from "@/options/components/inspector/display-accordion"
import { MetadataAccordion } from "@/options/components/inspector/metadata-accordion"
import { InformationAccordion } from "@/options/components/inspector/information-accordion"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem
} from "@imify/ui/ui/workspace-config-sidebar-panel"

interface InspectorSidebarPanelProps {
  enableWideSidebarGrid?: boolean
}

export function InspectorSidebarPanel({ enableWideSidebarGrid = false }: InspectorSidebarPanelProps) {
  const exifSortMode = useInspectorStore((s) => s.exifSortMode)
  const showSensitiveOnly = useInspectorStore((s) => s.showSensitiveOnly)
  const paletteCount = useInspectorStore((s) => s.paletteCount)
  const previewChannelMode = useInspectorStore((s) => s.previewChannelMode)
  const colorBlindMode = useInspectorStore((s) => s.colorBlindMode)
  const loupeEnabled = useInspectorStore((s) => s.loupeEnabled)
  const loupeZoom = useInspectorStore((s) => s.loupeZoom)

  const setExifSortMode = useInspectorStore((s) => s.setExifSortMode)
  const setShowSensitiveOnly = useInspectorStore((s) => s.setShowSensitiveOnly)
  const setPaletteCount = useInspectorStore((s) => s.setPaletteCount)
  const setPreviewChannelMode = useInspectorStore((s) => s.setPreviewChannelMode)
  const setColorBlindMode = useInspectorStore((s) => s.setColorBlindMode)
  const setLoupeEnabled = useInspectorStore((s) => s.setLoupeEnabled)
  const setLoupeZoom = useInspectorStore((s) => s.setLoupeZoom)

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "display",
      content: (
        <DisplayAccordion
          paletteCount={paletteCount}
          previewChannelMode={previewChannelMode}
          colorBlindMode={colorBlindMode}
          loupeEnabled={loupeEnabled}
          loupeZoom={loupeZoom}
          onPaletteCountChange={setPaletteCount}
          onPreviewChannelModeChange={setPreviewChannelMode}
          onColorBlindModeChange={setColorBlindMode}
          onLoupeEnabledChange={setLoupeEnabled}
          onLoupeZoomChange={setLoupeZoom}
        />
      )
    },
    {
      id: "metadata",
      content: (
        <MetadataAccordion
          exifSortMode={exifSortMode}
          showSensitiveOnly={showSensitiveOnly}
          onExifSortModeChange={setExifSortMode}
          onShowSensitiveOnlyChange={setShowSensitiveOnly}
        />
      )
    },
    {
      id: "information",
      content: <InformationAccordion />
    }
  ]

  return <WorkspaceConfigSidebarPanel title="INSPECTOR SETTINGS" items={sidebarItems} twoColumn={enableWideSidebarGrid} />
}
