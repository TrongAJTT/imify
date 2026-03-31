import type { ExtensionStorageState, FormatConfig, MenuSortMode } from "@/core/types"

function compareByName(a: FormatConfig, b: FormatConfig): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
}

function orderGlobalConfigs(state: ExtensionStorageState): FormatConfig[] {
  const allGlobal = Object.values(state.global_formats)
  const byId = new Map(allGlobal.map((config) => [config.id, config]))
  const orderedFromSettings = state.context_menu?.global_order_ids ?? []
  const used = new Set<string>()
  const ordered: FormatConfig[] = []

  for (const id of orderedFromSettings) {
    const match = byId.get(id)
    if (!match || used.has(id)) {
      continue
    }

    used.add(id)
    ordered.push(match)
  }

  for (const config of allGlobal) {
    if (!used.has(config.id)) {
      ordered.push(config)
    }
  }

  return ordered
}

function enabledGlobalConfigs(state: ExtensionStorageState): FormatConfig[] {
  return orderGlobalConfigs(state).filter((config) => config.enabled)
}

function enabledCustomConfigs(state: ExtensionStorageState): FormatConfig[] {
  return state.custom_formats.filter((config) => config.enabled)
}

export function sortContextMenuConfigs(configs: FormatConfig[], mode: MenuSortMode): FormatConfig[] {
  if (mode === "global_then_custom") {
    return [...configs].sort((a, b) => {
      const aIsGlobal = a.id.startsWith("global_")
      const bIsGlobal = b.id.startsWith("global_")
      if (aIsGlobal !== bIsGlobal) {
        return aIsGlobal ? -1 : 1
      }

      return compareByName(a, b)
    })
  }

  if (mode === "custom_then_global") {
    return [...configs].sort((a, b) => {
      const aIsCustom = a.id.startsWith("custom_")
      const bIsCustom = b.id.startsWith("custom_")
      if (aIsCustom !== bIsCustom) {
        return aIsCustom ? -1 : 1
      }

      return compareByName(a, b)
    })
  }

  if (mode === "name_a_to_z") {
    return [...configs].sort(compareByName)
  }

  if (mode === "name_z_to_a") {
    return [...configs].sort((a, b) => compareByName(b, a))
  }

  if (mode === "name_length_asc") {
    return [...configs].sort((a, b) => a.name.length - b.name.length || compareByName(a, b))
  }

  return [...configs].sort((a, b) => b.name.length - a.name.length || compareByName(a, b))
}

export function getOrderedContextMenuConfigs(state: ExtensionStorageState): FormatConfig[] {
  const mode = state.context_menu?.sort_mode ?? "global_then_custom"
  const globals = enabledGlobalConfigs(state)
  const customs = enabledCustomConfigs(state)

  if (mode === "global_then_custom") {
    return [...globals, ...customs]
  }

  if (mode === "custom_then_global") {
    return [...customs, ...globals]
  }

  return sortContextMenuConfigs([...globals, ...customs], mode)
}
