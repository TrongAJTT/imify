import React from "react"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { WorkspaceConfigSidebarPanel, type WorkspaceConfigSidebarItem } from "@imify/ui"
import { DisplayAccordion } from "./display-accordion"
import { MetadataAccordion } from "./metadata-accordion"
import { InformationAccordion } from "./information-accordion"

export function InspectorSidebarPanel({ enableWideSidebarGrid = false }: { enableWideSidebarGrid?: boolean }) {
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
      label: "Display",
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
      label: "Metadata",
      content: (
        <MetadataAccordion
          exifSortMode={exifSortMode}
          showSensitiveOnly={showSensitiveOnly}
          onExifSortModeChange={setExifSortMode}
          onShowSensitiveOnlyChange={setShowSensitiveOnly}
        />
      )
    },
    { id: "information", label: "Information", content: <InformationAccordion /> }
  ]

  return <WorkspaceConfigSidebarPanel title="INSPECTOR SETTINGS" items={sidebarItems} twoColumn={enableWideSidebarGrid} />
}

