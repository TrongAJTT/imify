import type { FillingTemplate, LayerGroup, Point2D, TextLayer, VectorLayer } from "../types"
import { buildGroupFillPolygons, getBoundsFromPoints, toWorldLayerPoints } from "../group-geometry"

export const FILL_GROUP_RUNTIME_PREFIX = "fill-group:"

export interface FillRuntimeLayerItem {
  id: string
  kind: "layer"
  name: string
  typeLabel: string
  memberLayerIds: string[]
  polygons: Point2D[][]
  bounds: { x: number; y: number; width: number; height: number }
  layer: VectorLayer
}

export interface FillRuntimeGroupItem {
  id: string
  kind: "group"
  name: string
  typeLabel: string
  memberLayerIds: string[]
  polygons: Point2D[][]
  bounds: { x: number; y: number; width: number; height: number }
  group: LayerGroup
  members: VectorLayer[]
}

export interface FillRuntimeTextItem {
  id: string
  kind: "text"
  name: string
  typeLabel: string
  memberLayerIds: string[]
  polygons: Point2D[][]
  bounds: { x: number; y: number; width: number; height: number }
  textLayer: TextLayer
}

export type FillRuntimeItem = FillRuntimeLayerItem | FillRuntimeGroupItem | FillRuntimeTextItem

export function makeFillGroupRuntimeId(groupId: string): string {
  return `${FILL_GROUP_RUNTIME_PREFIX}${groupId}`
}

export function isFillGroupRuntimeId(id: string): boolean {
  return id.startsWith(FILL_GROUP_RUNTIME_PREFIX)
}

export function parseFillGroupId(runtimeId: string): string | null {
  if (!isFillGroupRuntimeId(runtimeId)) {
    return null
  }

  return runtimeId.slice(FILL_GROUP_RUNTIME_PREFIX.length)
}

export function buildFillRuntimeItems(
  template: FillingTemplate,
  hiddenLayerIds: Set<string>
): FillRuntimeItem[] {
  const groupsById = new Map((template.groups ?? []).map((group) => [group.id, group]))
  const visibleLayers = template.layers.filter((layer) => layer.visible && !hiddenLayerIds.has(layer.id))
  const visibleMembersByGroup = new Map<string, VectorLayer[]>()

  visibleLayers.forEach((layer) => {
    if (!layer.groupId) {
      return
    }

    if (!groupsById.has(layer.groupId)) {
      return
    }

    const current = visibleMembersByGroup.get(layer.groupId) ?? []
    current.push(layer)
    visibleMembersByGroup.set(layer.groupId, current)
  })

  const consumedLayerIds = new Set<string>()
  const items: FillRuntimeItem[] = []

  for (const layer of visibleLayers) {
    if (consumedLayerIds.has(layer.id)) {
      continue
    }

    if (layer.groupId) {
      const group = groupsById.get(layer.groupId)
      const members = visibleMembersByGroup.get(layer.groupId) ?? []

      if (group && members.length >= 2) {
        members.forEach((member) => consumedLayerIds.add(member.id))

        const polygons = buildGroupFillPolygons(group, visibleLayers)
        const allPoints = polygons.flat()
        const bounds = allPoints.length > 0
          ? getBoundsFromPoints(allPoints)
          : {
              x: layer.x,
              y: layer.y,
              width: Math.max(1, layer.width),
              height: Math.max(1, layer.height),
            }

        items.push({
          id: makeFillGroupRuntimeId(group.id),
          kind: "group",
          name: group.name || "Layer Group",
          typeLabel: `Group ${members.length} layers`,
          memberLayerIds: members.map((member) => member.id),
          polygons,
          bounds,
          group,
          members,
        })

        continue
      }
    }

    consumedLayerIds.add(layer.id)

    const polygon = toWorldLayerPoints(layer)
    const bounds = polygon.length > 0
      ? getBoundsFromPoints(polygon)
      : {
          x: layer.x,
          y: layer.y,
          width: Math.max(1, layer.width),
          height: Math.max(1, layer.height),
        }

    items.push({
      id: layer.id,
      kind: "layer",
      name: layer.name || "Layer",
      typeLabel: layer.shapeType,
      memberLayerIds: [layer.id],
      polygons: [polygon],
      bounds,
      layer,
    })
  }

  const visibleTextLayers = (template.textLayers ?? []).filter(
    (tl) => tl.visible && !hiddenLayerIds.has(tl.id)
  )

  for (const tl of visibleTextLayers) {
    const polygon = [
      { x: tl.x, y: tl.y },
      { x: tl.x + tl.width, y: tl.y },
      { x: tl.x + tl.width, y: tl.y + tl.height },
      { x: tl.x, y: tl.y + tl.height },
    ]
    items.push({
      id: tl.id,
      kind: "text",
      name: tl.name || "Text Layer",
      typeLabel: "Text Layer",
      memberLayerIds: [tl.id],
      polygons: [polygon],
      bounds: {
        x: tl.x,
        y: tl.y,
        width: Math.max(1, tl.width),
        height: Math.max(1, tl.height),
      },
      textLayer: tl,
    })
  }

  return items
}

export function buildRuntimeFillStateIds(template: FillingTemplate): string[] {
  return buildFillRuntimeItems(template, new Set())
    .map((item) => item.id)
}

export function expandRuntimeOrderToVisibleLayerIds(
  runtimeOrder: string[],
  runtimeItems: FillRuntimeItem[]
): string[] {
  const itemsById = new Map(runtimeItems.map((item) => [item.id, item]))

  return runtimeOrder.flatMap((runtimeId) => itemsById.get(runtimeId)?.memberLayerIds ?? [])
}
