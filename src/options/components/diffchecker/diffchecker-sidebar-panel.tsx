import type {
  DiffAlgorithm,
  DiffAlignAnchor,
  DiffAlignMode,
  DiffViewMode
} from "@/features/diffchecker/types"
import { RadioCard } from "@/options/components/ui/radio-card"
import { SelectInput } from "@/options/components/ui/select-input"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { MutedText } from "@/options/components/ui/typography"
import { SliderInput } from "@/options/components/ui/slider-input"
import { NumberInput } from "@/options/components/ui/number-input"
import { useDiffcheckerStore } from "@/options/stores/diffchecker-store"

const VIEW_MODES: Array<{
  value: DiffViewMode
  title: string
  subtitle: string
}> = [
  { value: "split", title: "Split", subtitle: "Drag slider to compare" },
  { value: "side_by_side", title: "Side by Side", subtitle: "View both images in parallel" },
  { value: "overlay", title: "Overlay", subtitle: "Adjust opacity to blend" },
  {
    value: "difference",
    title: "Difference",
    subtitle: "Pixel-level analysis"
  }
]

const ALGORITHM_OPTIONS = [
  { value: "heatmap", label: "Heatmap" },
  { value: "binary", label: "Binary (B/W)" }
]

const ALIGN_MODE_OPTIONS = [
  { value: "fit-larger", label: "Match Larger" },
  { value: "fit-smaller", label: "Match Smaller" },
  { value: "original", label: "Original Size" }
]

const ANCHOR_OPTIONS = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top-Left" }
]

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
    <div className="flex flex-col gap-4">
      <SidebarPanel title="VIEW MODE">
        <div className="flex flex-col gap-1.5">
          {VIEW_MODES.map((m) => (
            <RadioCard
              key={m.value}
              title={m.title}
              subtitle={m.subtitle}
              value={m.value}
              selectedValue={viewMode}
              onChange={(v) => setViewMode(v as DiffViewMode)}
            />
          ))}
        </div>
      </SidebarPanel>

      <SidebarPanel title="COMPARISON">
        <div className="flex flex-col gap-3">
          {viewMode === "overlay" && (
            <SliderInput
              label="Opacity"
              value={overlayOpacity}
              onChange={setOverlayOpacity}
              min={0}
              max={100}
              suffix="%"
            />
          )}

          {viewMode === "difference" && (
            <>
              <SelectInput
                label="Algorithm"
                value={algorithm}
                options={ALGORITHM_OPTIONS}
                onChange={(v) => setAlgorithm(v as DiffAlgorithm)}
              />
              {algorithm === "binary" && (
                <SliderInput
                  label="Threshold"
                  value={diffThreshold}
                  onChange={setDiffThreshold}
                  min={0}
                  max={128}
                />
              )}
            </>
          )}

          {viewMode === "split" && (
            <MutedText className="text-xs">
              Drag the slider on the viewer to adjust the split position.
            </MutedText>
          )}
        </div>
      </SidebarPanel>

      <SidebarPanel title="ALIGNMENT">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <SelectInput
                label="Scale Mode"
                value={alignMode}
                options={ALIGN_MODE_OPTIONS}
                onChange={(v) => setAlignMode(v as DiffAlignMode)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <SelectInput
                label="Anchor"
                value={alignAnchor}
                options={ANCHOR_OPTIONS}
                onChange={(v) => setAlignAnchor(v as DiffAlignAnchor)}
              />
            </div>
          </div>
        </div>
      </SidebarPanel>
    </div>
  )
}
