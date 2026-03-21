import type { ExtensionStorageState, FormatConfig, MenuSortMode } from "@/core/types"

function enabledConfigs(state: ExtensionStorageState): FormatConfig[] {
  return [...Object.values(state.global_formats), ...state.custom_formats].filter((config) => config.enabled)
}

function compareByName(a: FormatConfig, b: FormatConfig): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
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
  return sortContextMenuConfigs(enabledConfigs(state), mode)
}
