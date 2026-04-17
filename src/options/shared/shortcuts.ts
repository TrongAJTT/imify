import { Storage } from "@plasmohq/storage"

export type ShortcutActionId =
  | "fill.preview.zoom_mode"
  | "fill.preview.pan_mode"
  | "fill.preview.idle_mode"
  | "fill.customization.tab_image"
  | "fill.customization.tab_border"
  | "fill.customization.tab_layer"
  | "splicing.preview.zoom_mode"
  | "splicing.preview.pan_mode"

export interface ShortcutBinding {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}

export type ShortcutPreferences = Record<ShortcutActionId, ShortcutBinding | null>

export interface ShortcutDefinition {
  id: ShortcutActionId
  scope: "fill" | "splicing"
  category: "Fill Preview" | "Fill Customization" | "Splicing Preview"
  label: string
  description: string
}

export const SHORTCUT_PREFERENCES_KEY = "imify_shortcut_preferences_v1"

export const shortcutStorage = new Storage({ area: "sync" })

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    id: "fill.preview.zoom_mode",
    scope: "fill",
    category: "Fill Preview",
    label: "Switch to Zoom mode",
    description: "Set Fill preview interaction mode to Zoom."
  },
  {
    id: "fill.preview.pan_mode",
    scope: "fill",
    category: "Fill Preview",
    label: "Switch to Pan mode",
    description: "Set Fill preview interaction mode to Pan."
  },
  {
    id: "fill.preview.idle_mode",
    scope: "fill",
    category: "Fill Preview",
    label: "Switch to Idle mode",
    description: "Disable Fill preview wheel interaction."
  },
  {
    id: "fill.customization.tab_image",
    scope: "fill",
    category: "Fill Customization",
    label: "Open Image tab",
    description: "Show image transform/upload controls in Fill customization."
  },
  {
    id: "fill.customization.tab_border",
    scope: "fill",
    category: "Fill Customization",
    label: "Open Border tab",
    description: "Show border controls in Fill customization."
  },
  {
    id: "fill.customization.tab_layer",
    scope: "fill",
    category: "Fill Customization",
    label: "Open Layer tab",
    description: "Show layer transform controls in Fill customization."
  },
  {
    id: "splicing.preview.zoom_mode",
    scope: "splicing",
    category: "Splicing Preview",
    label: "Switch to Zoom mode",
    description: "Set Splicing preview scroll behavior to Zoom."
  },
  {
    id: "splicing.preview.pan_mode",
    scope: "splicing",
    category: "Splicing Preview",
    label: "Switch to Pan mode",
    description: "Set Splicing preview scroll behavior to Pan."
  }
]

export const SHORTCUT_DEFINITION_MAP: Record<ShortcutActionId, ShortcutDefinition> =
  SHORTCUT_DEFINITIONS.reduce<Record<ShortcutActionId, ShortcutDefinition>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {} as Record<ShortcutActionId, ShortcutDefinition>)

export const DEFAULT_SHORTCUT_PREFERENCES: ShortcutPreferences = {
  "fill.preview.zoom_mode": { key: "z" },
  "fill.preview.pan_mode": { key: "v" },
  "fill.preview.idle_mode": { key: "n" },
  "fill.customization.tab_image": { key: "1" },
  "fill.customization.tab_border": { key: "2" },
  "fill.customization.tab_layer": { key: "3" },
  "splicing.preview.zoom_mode": { key: "z" },
  "splicing.preview.pan_mode": { key: "v" }
}

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"])

function normalizeShortcutKey(rawKey: string): string {
  if (rawKey === " ") return "Space"
  if (rawKey === "Spacebar") return "Space"
  if (rawKey.length === 1) {
    return rawKey.toLowerCase()
  }
  return rawKey
}

function normalizeModifier(value: boolean | undefined): boolean {
  return value === true
}

export function normalizeShortcutBinding(
  binding: ShortcutBinding | null | undefined
): ShortcutBinding | null {
  if (!binding || typeof binding.key !== "string") return null

  const key = normalizeShortcutKey(binding.key.trim())
  if (!key) return null

  return {
    key,
    ctrlKey: normalizeModifier(binding.ctrlKey),
    shiftKey: normalizeModifier(binding.shiftKey),
    altKey: normalizeModifier(binding.altKey),
    metaKey: normalizeModifier(binding.metaKey)
  }
}

export function normalizeShortcutPreferences(
  input: Partial<Record<ShortcutActionId, ShortcutBinding | null>> | null | undefined
): ShortcutPreferences {
  const normalized = { ...DEFAULT_SHORTCUT_PREFERENCES }

  for (const definition of SHORTCUT_DEFINITIONS) {
    const customBinding = input?.[definition.id]
    if (customBinding === null) {
      normalized[definition.id] = null
      continue
    }

    const safeBinding = normalizeShortcutBinding(customBinding)
    normalized[definition.id] = safeBinding ?? DEFAULT_SHORTCUT_PREFERENCES[definition.id]
  }

  return normalized
}

export function keyboardEventToBinding(event: KeyboardEvent): ShortcutBinding | null {
  const normalizedKey = normalizeShortcutKey(event.key)
  if (!normalizedKey || MODIFIER_KEYS.has(normalizedKey)) return null

  return {
    key: normalizedKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey
  }
}

export function eventMatchesShortcut(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  const normalizedBinding = normalizeShortcutBinding(binding)
  if (!normalizedBinding) return false

  const eventKey = normalizeShortcutKey(event.key)
  if (eventKey !== normalizedBinding.key) return false

  return (
    event.ctrlKey === normalizeModifier(normalizedBinding.ctrlKey) &&
    event.shiftKey === normalizeModifier(normalizedBinding.shiftKey) &&
    event.altKey === normalizeModifier(normalizedBinding.altKey) &&
    event.metaKey === normalizeModifier(normalizedBinding.metaKey)
  )
}

export function shortcutBindingToIdentifier(binding: ShortcutBinding | null | undefined): string | null {
  const normalized = normalizeShortcutBinding(binding)
  if (!normalized) return null

  return [
    normalized.ctrlKey ? "ctrl" : "",
    normalized.shiftKey ? "shift" : "",
    normalized.altKey ? "alt" : "",
    normalized.metaKey ? "meta" : "",
    normalized.key.toLowerCase()
  ]
    .filter(Boolean)
    .join("+")
}

function formatKeyLabel(key: string): string {
  if (key.length === 1) return key.toUpperCase()
  if (key === "Space") return "Space"
  if (key === "Escape") return "Esc"
  return key
}

export function formatShortcutBinding(binding: ShortcutBinding | null | undefined): string {
  const normalized = normalizeShortcutBinding(binding)
  if (!normalized) {
    return "Unassigned"
  }

  const parts: string[] = []
  if (normalized.ctrlKey) parts.push("Ctrl")
  if (normalized.shiftKey) parts.push("Shift")
  if (normalized.altKey) parts.push("Alt")
  if (normalized.metaKey) parts.push("Meta")
  parts.push(formatKeyLabel(normalized.key))

  return parts.join("+")
}

export function isShortcutEventFromEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target
  if (!(target instanceof HTMLElement)) return false

  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}
