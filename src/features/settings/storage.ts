import {
  STORAGE_KEY,
  STORAGE_VERSION,
  type ExtensionStorageState,
  type FormatConfig,
  type ImageFormat,
  type MenuSortMode,
  type ResizeConfig
} from "@/core/types"
import { CUSTOM_FORMATS } from "@/core/format-config"
import { DEFAULT_STORAGE_STATE } from "@/features/settings/default-state"

interface PersistedStorageState {
  version: number
  state: ExtensionStorageState
}

function isStorageStateShape(value: unknown): value is ExtensionStorageState {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<ExtensionStorageState>

  return "global_formats" in candidate || "custom_formats" in candidate
}

function isImageFormat(value: unknown): value is ImageFormat {
  return (
    value === "jpg" ||
    value === "png" ||
    value === "webp" ||
    value === "avif" ||
    value === "jxl" ||
    value === "bmp" ||
    value === "ico" ||
    value === "tiff" ||
    value === "pdf"
  )
}

function isMenuSortMode(value: unknown): value is MenuSortMode {
  return (
    value === "global_then_custom" ||
    value === "custom_then_global" ||
    value === "name_a_to_z" ||
    value === "name_z_to_a" ||
    value === "name_length_asc" ||
    value === "name_length_desc"
  )
}

function isResizeConfig(value: unknown): value is ResizeConfig {
  if (!value || typeof value !== "object") {
    return false
  }

  const resize = value as ResizeConfig

  return (
    resize.mode === "none" ||
    resize.mode === "change_width" ||
    resize.mode === "change_height" ||
    resize.mode === "scale" ||
    resize.mode === "page_size"
  )
}

function isFormatConfig(value: unknown): value is FormatConfig {
  if (!value || typeof value !== "object") {
    return false
  }

  const config = value as FormatConfig

  return (
    typeof config.id === "string" &&
    typeof config.name === "string" &&
    isImageFormat(config.format) &&
    typeof config.enabled === "boolean" &&
    isResizeConfig(config.resize)
  )
}

function sanitizeState(state: unknown): ExtensionStorageState {
  if (!state || typeof state !== "object") {
    return DEFAULT_STORAGE_STATE
  }

  const candidate = state as Partial<ExtensionStorageState>
  const mergedGlobalFormats = { ...DEFAULT_STORAGE_STATE.global_formats }

  const sourceGlobalFormats = candidate.global_formats

  if (sourceGlobalFormats && typeof sourceGlobalFormats === "object") {
    for (const [format, config] of Object.entries(sourceGlobalFormats)) {
      if (isImageFormat(format) && isFormatConfig(config)) {
        mergedGlobalFormats[format] = {
          ...mergedGlobalFormats[format],
          ...config,
          format
        }
      }
    }
  }

  const customFormats = Array.isArray(candidate.custom_formats)
    ? candidate.custom_formats.filter(
        (entry): entry is FormatConfig =>
          isFormatConfig(entry) && CUSTOM_FORMATS.includes(entry.format)
      )
    : []

  return {
    global_formats: mergedGlobalFormats,
    custom_formats: customFormats,
    context_menu: {
      sort_mode: isMenuSortMode((candidate as ExtensionStorageState).context_menu?.sort_mode)
        ? (candidate as ExtensionStorageState).context_menu.sort_mode
        : DEFAULT_STORAGE_STATE.context_menu.sort_mode
    }
  }
}

function parsePersistedState(value: unknown): PersistedStorageState {
  if (typeof value === "string") {
    try {
      return parsePersistedState(JSON.parse(value))
    } catch {
      return {
        version: STORAGE_VERSION,
        state: DEFAULT_STORAGE_STATE
      }
    }
  }

  if (value && typeof value === "object" && "value" in (value as Record<string, unknown>)) {
    return parsePersistedState((value as { value: unknown }).value)
  }

  if (!value || typeof value !== "object") {
    return {
      version: STORAGE_VERSION,
      state: DEFAULT_STORAGE_STATE
    }
  }

  // Backward compatibility: older builds may have stored ExtensionStorageState directly.
  if (isStorageStateShape(value)) {
    return {
      version: STORAGE_VERSION,
      state: sanitizeState(value)
    }
  }

  const candidate = value as Partial<PersistedStorageState>

  return {
    version: typeof candidate.version === "number" ? candidate.version : STORAGE_VERSION,
    state: sanitizeState(candidate.state)
  }
}

async function readRawState(): Promise<PersistedStorageState> {
  const result = await chrome.storage.sync.get(STORAGE_KEY)

  return parsePersistedState(result[STORAGE_KEY])
}

export async function getStorageState(): Promise<ExtensionStorageState> {
  const persisted = await readRawState()

  return persisted.state
}

export async function setStorageState(state: ExtensionStorageState): Promise<void> {
  await chrome.storage.sync.set({
    [STORAGE_KEY]: {
      version: STORAGE_VERSION,
      state: sanitizeState(state)
    } satisfies PersistedStorageState
  })
}

export async function patchStorageState(
  updater: (current: ExtensionStorageState) => ExtensionStorageState
): Promise<ExtensionStorageState> {
  const current = await getStorageState()
  const next = sanitizeState(updater(current))

  await setStorageState(next)

  return next
}

export async function ensureStorageState(): Promise<ExtensionStorageState> {
  const persisted = await readRawState()

  if (persisted.version !== STORAGE_VERSION) {
    await setStorageState(persisted.state)
  }

  return persisted.state
}

export function onStorageStateChanged(
  listener: (state: ExtensionStorageState) => void
): () => void {
  const handler: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
    changes,
    areaName
  ) => {
    if (areaName !== "sync") {
      return
    }

    const change = changes[STORAGE_KEY]

    if (!change) {
      return
    }

    const parsed = parsePersistedState(change.newValue)
    listener(parsed.state)
  }

  chrome.storage.onChanged.addListener(handler)

  return () => {
    chrome.storage.onChanged.removeListener(handler)
  }
}
