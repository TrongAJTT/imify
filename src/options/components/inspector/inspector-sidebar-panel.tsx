import { SelectInput } from "@/options/components/ui/select-input"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { MutedText } from "@/options/components/ui/typography"
import { useInspectorStore } from "@/options/stores/inspector-store"

const COLOR_FORMAT_OPTIONS = [
  { value: "hex", label: "HEX (#RRGGBB)" },
  { value: "rgb", label: "RGB (r, g, b)" },
  { value: "hsl", label: "HSL (h, s%, l%)" }
]

const EXIF_SORT_OPTIONS = [
  { value: "group", label: "Group by category" },
  { value: "name", label: "Sort by tag name" },
  { value: "tag", label: "Sort by tag ID" }
]

const PALETTE_COUNT_OPTIONS = [
  { value: "4", label: "4 colors" },
  { value: "6", label: "6 colors" },
  { value: "8", label: "8 colors" },
  { value: "10", label: "10 colors" },
  { value: "12", label: "12 colors" }
]

export function InspectorSidebarPanel() {
  const colorFormat = useInspectorStore((s) => s.colorFormat)
  const exifSortMode = useInspectorStore((s) => s.exifSortMode)
  const showSensitiveOnly = useInspectorStore((s) => s.showSensitiveOnly)
  const paletteCount = useInspectorStore((s) => s.paletteCount)

  const setColorFormat = useInspectorStore((s) => s.setColorFormat)
  const setExifSortMode = useInspectorStore((s) => s.setExifSortMode)
  const setShowSensitiveOnly = useInspectorStore((s) => s.setShowSensitiveOnly)
  const setPaletteCount = useInspectorStore((s) => s.setPaletteCount)

  return (
    <div className="flex flex-col gap-4">
      <SidebarPanel title="DISPLAY">
        <div className="flex flex-col gap-3">
          <SelectInput
            label="Color Format"
            value={colorFormat}
            options={COLOR_FORMAT_OPTIONS}
            onChange={(v) => setColorFormat(v as "hex" | "rgb" | "hsl")}
          />
          <SelectInput
            label="Palette Colors"
            value={String(paletteCount)}
            options={PALETTE_COUNT_OPTIONS}
            onChange={(v) => setPaletteCount(Number(v))}
          />
        </div>
      </SidebarPanel>

      <SidebarPanel title="METADATA">
        <div className="flex flex-col gap-3">
          <SelectInput
            label="Sort Mode"
            value={exifSortMode}
            options={EXIF_SORT_OPTIONS}
            onChange={(v) => setExifSortMode(v as "group" | "name" | "tag")}
          />
          <CheckboxCard
            title="Sensitive Only"
            subtitle="Show only privacy-relevant tags"
            checked={showSensitiveOnly}
            onChange={setShowSensitiveOnly}
          />
        </div>
      </SidebarPanel>

      <SidebarPanel title="INFORMATION">
        <MutedText>
          All analysis is performed 100% locally in your browser. No image data is ever sent to any server.
        </MutedText>
      </SidebarPanel>
    </div>
  )
}
