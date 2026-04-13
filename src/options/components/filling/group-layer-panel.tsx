import { useCallback, useMemo, useState } from "react"
import { Link, Plus, Trash2 } from "lucide-react"

import type { VectorLayer, FillingTemplate, LayerGroup } from "@/features/filling/types"
import { generateId } from "@/features/filling/types"
import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { Button } from "@/options/components/ui/button"

interface GroupLayerPanelProps {
  layers: VectorLayer[]
  template: FillingTemplate
  onLayersChange: (layers: VectorLayer[]) => void
}

export function GroupLayerPanel({
  layers,
  template,
  onLayersChange,
}: GroupLayerPanelProps) {
  const updateTemplate = useFillingStore((s) => s.updateTemplate)
  const [groups, setGroups] = useState<LayerGroup[]>(template.groups ?? [])

  const ungroupedLayers = useMemo(
    () => layers.filter((l) => !l.groupId),
    [layers]
  )

  const handleAddGroup = useCallback(() => {
    const newGroup: LayerGroup = {
      id: generateId("grp"),
      name: `Group ${groups.length + 1}`,
      layerIds: [],
      closeLoop: false,
      fillInterior: false,
    }
    const updated = [...groups, newGroup]
    setGroups(updated)
    syncGroupsToTemplate(updated)
  }, [groups])

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      const updated = groups.filter((g) => g.id !== groupId)
      setGroups(updated)

      const updatedLayers = layers.map((l) =>
        l.groupId === groupId ? { ...l, groupId: undefined } : l
      )
      onLayersChange(updatedLayers)
      syncGroupsToTemplate(updated)
    },
    [groups, layers, onLayersChange]
  )

  const handleToggleLayerInGroup = useCallback(
    (groupId: string, layerId: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return

      const isInGroup = group.layerIds.includes(layerId)
      const updatedGroup = {
        ...group,
        layerIds: isInGroup
          ? group.layerIds.filter((id) => id !== layerId)
          : [...group.layerIds, layerId],
      }
      const updatedGroups = groups.map((g) => (g.id === groupId ? updatedGroup : g))
      setGroups(updatedGroups)

      const updatedLayers = layers.map((l) => {
        if (l.id === layerId) {
          return { ...l, groupId: isInGroup ? undefined : groupId }
        }
        if (l.groupId === groupId && isInGroup && l.id === layerId) {
          return { ...l, groupId: undefined }
        }
        return l
      })
      onLayersChange(updatedLayers)
      syncGroupsToTemplate(updatedGroups)
    },
    [groups, layers, onLayersChange]
  )

  const handleToggleCloseLoop = useCallback(
    (groupId: string) => {
      const updated = groups.map((g) =>
        g.id === groupId ? { ...g, closeLoop: !g.closeLoop } : g
      )
      setGroups(updated)
      syncGroupsToTemplate(updated)
    },
    [groups]
  )

  const handleToggleFillInterior = useCallback(
    (groupId: string) => {
      const updated = groups.map((g) =>
        g.id === groupId ? { ...g, fillInterior: !g.fillInterior } : g
      )
      setGroups(updated)
      syncGroupsToTemplate(updated)
    },
    [groups]
  )

  const handleRenameGroup = useCallback(
    (groupId: string, name: string) => {
      const updated = groups.map((g) =>
        g.id === groupId ? { ...g, name } : g
      )
      setGroups(updated)
      syncGroupsToTemplate(updated)
    },
    [groups]
  )

  const syncGroupsToTemplate = useCallback(
    (updatedGroups: LayerGroup[]) => {
      const updated: FillingTemplate = {
        ...template,
        groups: updatedGroups,
        updatedAt: Date.now(),
      }
      void templateStorage.save(updated)
      updateTemplate(updated)
    },
    [template, updateTemplate]
  )

  return (
    <AccordionCard
      icon={<Link size={16} />}
      label="Layer Groups"
      sublabel={`${groups.length} group${groups.length !== 1 ? "s" : ""}`}
      colorTheme="orange"
      defaultOpen={false}
    >
      <div className="space-y-3">
        <Button variant="secondary" size="sm" onClick={handleAddGroup}>
          <Plus size={12} />
          New Group
        </Button>

        {groups.length === 0 && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-2">
            No groups. Groups let you connect multiple layers together.
          </div>
        )}

        {groups.map((group) => (
          <GroupItem
            key={group.id}
            group={group}
            layers={layers}
            onToggleLayer={(layerId) => handleToggleLayerInGroup(group.id, layerId)}
            onToggleCloseLoop={() => handleToggleCloseLoop(group.id)}
            onToggleFillInterior={() => handleToggleFillInterior(group.id)}
            onRename={(name) => handleRenameGroup(group.id, name)}
            onDelete={() => handleDeleteGroup(group.id)}
          />
        ))}
      </div>
    </AccordionCard>
  )
}

function GroupItem({
  group,
  layers,
  onToggleLayer,
  onToggleCloseLoop,
  onToggleFillInterior,
  onRename,
  onDelete,
}: {
  group: LayerGroup
  layers: VectorLayer[]
  onToggleLayer: (layerId: string) => void
  onToggleCloseLoop: () => void
  onToggleFillInterior: () => void
  onRename: (name: string) => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={group.name}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 text-xs font-medium bg-transparent border-none outline-none text-slate-700 dark:text-slate-300"
        />
        <button
          type="button"
          onClick={onDelete}
          className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="space-y-0.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
          Members
        </div>
        {layers.map((layer) => {
          const isInGroup = group.layerIds.includes(layer.id)
          const isInOtherGroup = !isInGroup && layer.groupId !== undefined
          return (
            <label
              key={layer.id}
              className={`flex items-center gap-1.5 text-[11px] cursor-pointer py-0.5 ${
                isInOtherGroup ? "opacity-40" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={isInGroup}
                onChange={() => onToggleLayer(layer.id)}
                disabled={isInOtherGroup}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                {layer.name || layer.id}
              </span>
            </label>
          )
        })}
      </div>

      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
          <input
            type="checkbox"
            checked={group.closeLoop}
            onChange={onToggleCloseLoop}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <span className="text-slate-600 dark:text-slate-400">Close loop (connect last to first)</span>
        </label>
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
          <input
            type="checkbox"
            checked={group.fillInterior}
            onChange={onToggleFillInterior}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <span className="text-slate-600 dark:text-slate-400">Fill interior (solid enclosed area)</span>
        </label>
      </div>
    </div>
  )
}
