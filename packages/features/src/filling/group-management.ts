import { generateId, type LayerGroup, type VectorLayer } from "./types"


export function synchronizeGroupsWithLayers(
  groups: LayerGroup[],
  layers: VectorLayer[],
): LayerGroup[] {
  const layerIdsByGroup = new Map<string, string[]>()

  for (const layer of layers) {
    if (!layer.groupId) {
      continue
    }

    const current = layerIdsByGroup.get(layer.groupId) ?? []
    current.push(layer.id)
    layerIdsByGroup.set(layer.groupId, current)
  }

  return groups
    .map((group) => ({
      ...group,
      layerIds: layerIdsByGroup.get(group.id) ?? [],
      combineAsConvexHull: Boolean(group.combineAsConvexHull),
    }))
    .filter((group) => group.layerIds.length > 0)
}

export function toggleGroupForSelectedLayers({
  layers,
  groups,
  selectedLayerIds,
  defaultGroupName = "Group",
}: {
  layers: VectorLayer[]
  groups: LayerGroup[]
  selectedLayerIds: string[]
  defaultGroupName?: string
}): {
  nextLayers: VectorLayer[]
  nextGroups: LayerGroup[]
} {
  if (selectedLayerIds.length === 0) {
    return { nextLayers: layers, nextGroups: groups }
  }

  const normalizedGroups = synchronizeGroupsWithLayers(groups, layers)
  const selectedSet = new Set(selectedLayerIds)

  // Find shared group id if all selected layers belong to the exact same group
  const firstSelectedLayer = layers.find((l) => selectedSet.has(l.id))
  const firstGroupId = firstSelectedLayer?.groupId ?? null
  const selectedSharedGroupId =
    firstGroupId &&
    layers
      .filter((l) => selectedSet.has(l.id))
      .every((l) => l.groupId === firstGroupId)
      ? firstGroupId
      : null

  // If already in a shared group -> Ungroup
  if (selectedSharedGroupId) {
    const selectedGroup = normalizedGroups.find((g) => g.id === selectedSharedGroupId)
    if (!selectedGroup) {
      return { nextLayers: layers, nextGroups: normalizedGroups }
    }

    let nextLayers = layers.map((layer) => {
      if (!selectedSet.has(layer.id)) return layer
      const copy = { ...layer }
      delete copy.groupId
      return copy
    })

    const isPartialUngroup = selectedGroup.layerIds.length > selectedLayerIds.length
    if (isPartialUngroup) {
      const movingIds = new Set(selectedLayerIds)
      const movingEntries = layers
        .map((layer, index) => ({ layer, index }))
        .filter(({ layer }) => movingIds.has(layer.id))

      const nonMovingGroupIndexes = layers
        .map((layer, index) => ({ layer, index }))
        .filter(({ layer }) => layer.groupId === selectedSharedGroupId && !movingIds.has(layer.id))
        .map(({ index }) => index)

      const lastGroupIndex = Math.max(...nonMovingGroupIndexes)
      const countMovingBeforeTarget = movingEntries.filter(({ index }) => index <= lastGroupIndex).length
      const insertIndex = lastGroupIndex - countMovingBeforeTarget + 1

      const movingUngroupedLayers = movingEntries.map(({ layer }) => {
        const nextLayer = { ...layer }
        delete nextLayer.groupId
        return nextLayer
      })

      const remaining = nextLayers.filter((layer) => !movingIds.has(layer.id))
      nextLayers = [
        ...remaining.slice(0, insertIndex),
        ...movingUngroupedLayers,
        ...remaining.slice(insertIndex),
      ]
    }

    const nextGroups = synchronizeGroupsWithLayers(groups, nextLayers)
    return { nextLayers, nextGroups }
  }

  // Otherwise -> Group together
  const movingLayers = layers.filter((layer) => selectedSet.has(layer.id))
  if (movingLayers.length === 0) {
    return { nextLayers: layers, nextGroups: normalizedGroups }
  }

  const topSelectedIndex = layers.findIndex((layer) => selectedSet.has(layer.id))
  if (topSelectedIndex < 0) {
    return { nextLayers: layers, nextGroups: normalizedGroups }
  }

  const insertIndex = layers
    .slice(0, topSelectedIndex)
    .filter((layer) => !selectedSet.has(layer.id)).length

  const newGroupId = generateId("grp")
  const groupedLayers = movingLayers.map((layer) => ({
    ...layer,
    groupId: newGroupId,
  }))
  const remainingLayers = layers.filter((layer) => !selectedSet.has(layer.id))
  const nextLayers = [
    ...remainingLayers.slice(0, insertIndex),
    ...groupedLayers,
    ...remainingLayers.slice(insertIndex),
  ]

  const nextGroups = synchronizeGroupsWithLayers(
    [
      ...normalizedGroups,
      {
        id: newGroupId,
        name: `${defaultGroupName} ${normalizedGroups.length + 1}`,
        layerIds: groupedLayers.map((layer) => layer.id),
        closeLoop: false,
        fillInterior: false,
        combineAsConvexHull: false,
      },
    ],
    nextLayers,
  )

  return { nextLayers, nextGroups }
}
