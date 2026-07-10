import React from "react"
import { Link, Unlink2 } from "lucide-react"

import type { LayerGroup, VectorLayer } from "./types"
import { AccordionCard, Button, CheckboxCard, TextInput } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

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
  const { t } = useTranslation("filling")

  if (!group) {
    return null
  }

  const hasEnoughMembers = members.length >= 2
  const combineAsConvexHull = Boolean(group.combineAsConvexHull)
  const disableConnectorOptions = !hasEnoughMembers || combineAsConvexHull

  return (
    <AccordionCard
      icon={<Link size={16} />}
      label={t("manualEditor.groupTitle", { defaultValue: "Layer Group" })}
      sublabel={
        members.length === 1
          ? t("manualEditor.groupMemberSingular", { count: 1, defaultValue: "1 layer" })
          : t("manualEditor.groupMemberPlural", { count: members.length, defaultValue: `${members.length} layers` })
      }
      colorTheme="orange"
      defaultOpen={true}
    >
      <div className="space-y-3">
        <div className="flex gap-2 items-end">
          <TextInput
            label={t("manualEditor.groupNameLabel", { defaultValue: "Group Name" })}
            value={group.name}
            onChange={onRenameGroup}
            placeholder={t("manualEditor.groupNamePlaceholder", { defaultValue: "Group name" })}
            className="flex-1"
          />

          <Button variant="secondary" size="sm" onClick={onUngroupSelectedLayer} className="w-full flex-1">
            <Unlink2 size={12} />
            {t("manualEditor.ungroup", { defaultValue: "Ungroup" })}
          </Button>
        </div>

        <CheckboxCard
          title={t("manualEditor.combineHullTitle", { defaultValue: "Combine into one convex hull" })}
          subtitle={t("manualEditor.combineHullDesc", { defaultValue: "Creates one merged hull from all members (includes close loop + fill interior behavior)." })}
          checked={combineAsConvexHull}
          onChange={onToggleCombineAsConvexHull}
          disabled={!hasEnoughMembers}
          theme="orange"
        />

        <CheckboxCard
          title={t("manualEditor.closeLoopTitle", { defaultValue: "Close loop (connect last to first)" })}
          subtitle={t("manualEditor.closeLoopDesc", { defaultValue: "Adds a connector hull between the last and first layer." })}
          checked={group.closeLoop}
          onChange={onToggleCloseLoop}
          disabled={disableConnectorOptions}
          theme="orange"
        />

        <CheckboxCard
          title={t("manualEditor.fillInteriorTitle", { defaultValue: "Fill interior (solid enclosed area)" })}
          subtitle={t("manualEditor.fillInteriorDesc", { defaultValue: "Fills enclosed regions created by connector hull intersections." })}
          checked={group.fillInterior}
          onChange={onToggleFillInterior}
          disabled={disableConnectorOptions}
          theme="orange"
        />
      </div>
    </AccordionCard>
  )
}
