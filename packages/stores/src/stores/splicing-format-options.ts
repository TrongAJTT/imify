import type { SplicingExportConfig } from "@imify/features/splicing/types"
import { buildActiveFormatOptions } from "./active-format-options"
import type { SplicingStoreState } from "./splicing-store"

export function buildActiveSplicingFormatOptions(
  store: SplicingStoreState
): SplicingExportConfig["formatOptions"] {
  const { exportSettings } = store

  return buildActiveFormatOptions(exportSettings.targetFormat, exportSettings.codecOptions)
}
