import type { FillingExportConfig } from "@imify/features/filling/types"
import { buildActiveFormatOptions } from "./active-format-options"
import type { FillingStoreState } from "./filling-store"

export function buildActiveFillingFormatOptions(
  store: FillingStoreState
): FillingExportConfig["formatOptions"] {
  const { exportSettings } = store

  return buildActiveFormatOptions(exportSettings.targetFormat, exportSettings.codecOptions)
}
