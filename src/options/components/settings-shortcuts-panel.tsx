import { useMemo } from "react"
import { RotateCcw, X } from "lucide-react"

import { ShortcutBindingInput } from "@/options/components/ui/shortcut-binding-input"
import { SettingsItemHeader } from "@/options/components/ui/settings-item-header"
import { SettingsSectionHeader } from "@/options/components/ui/settings-section-header"
import { Button } from "@/options/components/ui/button"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import {
  DEFAULT_SHORTCUT_PREFERENCES,
  formatShortcutBinding,
  shortcutBindingToIdentifier,
  type ShortcutActionId,
  type ShortcutDefinition,
} from "@/options/shared/shortcuts"

export function SettingsShortcutsPanel() {
  const {
    isLoading,
    definitions,
    preferences,
    setShortcutBinding,
    resetShortcutBinding,
    resetAllShortcutBindings,
  } = useShortcutPreferences()

  const groupedDefinitions = useMemo(() => {
    const grouped = new Map<ShortcutDefinition["category"], ShortcutDefinition[]>()

    for (const definition of definitions) {
      const current = grouped.get(definition.category) ?? []
      current.push(definition)
      grouped.set(definition.category, current)
    }

    return Array.from(grouped.entries())
  }, [definitions])

  const conflictMap = useMemo(() => {
    const actionToConflicts = new Map<ShortcutActionId, ShortcutActionId[]>()

    const definitionsByScope = new Map<ShortcutDefinition["scope"], ShortcutDefinition[]>()
    for (const definition of definitions) {
      const scopedList = definitionsByScope.get(definition.scope) ?? []
      scopedList.push(definition)
      definitionsByScope.set(definition.scope, scopedList)
    }

    for (const scopedDefinitions of definitionsByScope.values()) {
      const shortcutIdToActions = new Map<string, ShortcutActionId[]>()

      for (const definition of scopedDefinitions) {
        const identifier = shortcutBindingToIdentifier(preferences[definition.id])
        if (!identifier) continue

        const list = shortcutIdToActions.get(identifier) ?? []
        list.push(definition.id)
        shortcutIdToActions.set(identifier, list)
      }

      for (const actionIds of shortcutIdToActions.values()) {
        if (actionIds.length <= 1) continue

        for (const actionId of actionIds) {
          actionToConflicts.set(
            actionId,
            actionIds.filter((id) => id !== actionId)
          )
        }
      }
    }

    return actionToConflicts
  }, [definitions, preferences])

  const definitionMap = useMemo(() => {
    return definitions.reduce<Record<ShortcutActionId, ShortcutDefinition>>((acc, definition) => {
      acc[definition.id] = definition
      return acc
    }, {} as Record<ShortcutActionId, ShortcutDefinition>)
  }, [definitions])

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <SettingsSectionHeader
        title="Shortkeys"
        description="Review and rebind keyboard shortcuts used in Fill and Splicing workspaces."
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SettingsItemHeader
            title="KEYBOARD SHORTCUTS"
            description="Click a shortcut and press a key combination. Press Esc to cancel or Backspace/Delete to clear."
          />

          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-slate-200 dark:border-slate-700"
            onClick={resetAllShortcutBindings}
          >
            <RotateCcw size={14} />
            Reset All
          </Button>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            Loading shortcut preferences...
          </div>
        )}

        {groupedDefinitions.map(([category, items]) => (
          <div key={category} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {category}
            </p>

            {items.map((definition) => {
              const conflicts = conflictMap.get(definition.id) ?? []
              const hasConflict = conflicts.length > 0

              return (
                <div
                  key={definition.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 px-3 py-3"
                >
                  <div className="grid gap-3 md:grid-cols-2 md:items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {definition.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {definition.description}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Default: {formatShortcutBinding(DEFAULT_SHORTCUT_PREFERENCES[definition.id])}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <ShortcutBindingInput
                        value={preferences[definition.id]}
                        onChange={(nextBinding) => setShortcutBinding(definition.id, nextBinding)}
                      />

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={() => setShortcutBinding(definition.id, null)}
                          disabled={!preferences[definition.id]}
                        >
                          <X size={14} />
                          Clear
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={() => resetShortcutBinding(definition.id)}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>

                  {hasConflict && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      Conflict with: {conflicts.map((actionId) => definitionMap[actionId]?.label ?? actionId).join(", ")}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </section>
    </div>
  )
}
