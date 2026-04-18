import { Link, Unlink2 } from "lucide-react"

import type { LayerGroup, VectorLayer } from "@/features/filling/types"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { Button } from "@/options/components/ui/button"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { TextInput } from "@/options/components/ui/text-input"

interface GroupLayerPanelProps {
  group: LayerGroup | null
  members: VectorLayer[]
  onUngroupSelectedLayer: () => void
  onRenameGroup: (name: string) => void
  onToggleCombineAsConvexHull: (checked: boolean) => void
  onToggleCloseLoop: (checked: boolean) => void
  onToggleFillInterior: (checked: boolean) => void
}

export function GroupLayerPanel({
  group,
  members,
  onUngroupSelectedLayer,
  onRenameGroup,
  onToggleCombineAsConvexHull,
  onToggleCloseLoop,
  onToggleFillInterior,
}: GroupLayerPanelProps) {
  if (!group) {
    return null
  }

  const hasEnoughMembers = members.length >= 2
  const combineAsConvexHull = Boolean(group.combineAsConvexHull)
  const disableConnectorOptions = !hasEnoughMembers || combineAsConvexHull

  return (
    <AccordionCard
      icon={<Link size={16} />}
      label="Layer Group"
      sublabel={`${members.length} layer${members.length !== 1 ? "s" : ""}`}
      colorTheme="orange"
      defaultOpen={true}
    >
      <div className="space-y-3">
        <TextInput
          label="Group Name"
          value={group.name}
          onChange={onRenameGroup}
          placeholder="Group name"
        />

        <Button variant="secondary" size="sm" onClick={onUngroupSelectedLayer} className="w-full">
          <Unlink2 size={12} />
          Ungroup Selected Layer
        </Button>

        {/* List of layer members of group, hide for now */}

        {/* <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Members</div>
          {members.length === 0 ? (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">No layers in this group.</div>
          ) : (
            <div className="space-y-0.5">
              {members.map((layer, index) => (
                <div key={layer.id} className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {index + 1}. {layer.name || layer.id}
                </div>
              ))}
            </div>
          )}
        </div> */}

        <CheckboxCard
          title="Combine into one convex hull"
          subtitle="Creates one merged hull from all members (includes close loop + fill interior behavior)."
          checked={combineAsConvexHull}
          onChange={onToggleCombineAsConvexHull}
          disabled={!hasEnoughMembers}
          theme="orange"
        />

        <CheckboxCard
          title="Close loop (connect last to first)"
          subtitle="Adds a connector hull between the last and first layer."
          checked={group.closeLoop}
          onChange={onToggleCloseLoop}
          disabled={disableConnectorOptions}
          theme="orange"
        />

        <CheckboxCard
          title="Fill interior (solid enclosed area)"
          subtitle="Fills enclosed regions created by connector hull intersections."
          checked={group.fillInterior}
          onChange={onToggleFillInterior}
          disabled={disableConnectorOptions}
          theme="orange"
        />
      </div>
    </AccordionCard>
  )
}
