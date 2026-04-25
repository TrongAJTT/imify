import React from "react"
import { Link, Unlink2 } from "lucide-react"

import type { LayerGroup, VectorLayer } from "./types"
import { AccordionCard, Button, CheckboxCard, TextInput } from "@imify/ui"

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
        <div className="flex gap-2 items-end">
          <TextInput
            label="Group Name"
            value={group.name}
            onChange={onRenameGroup}
            placeholder="Group name"
            className="flex-1"
          />

          <Button variant="secondary" size="sm" onClick={onUngroupSelectedLayer} className="w-full flex-1">
            <Unlink2 size={12} />
            Ungroup
          </Button>
        </div>

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
