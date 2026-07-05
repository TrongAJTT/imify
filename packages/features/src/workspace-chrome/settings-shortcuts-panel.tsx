import React from "react"
import { useMemo, useState } from "react"
import { RotateCcw, X } from "lucide-react"

import { ShortcutBindingInput } from "@imify/ui/ui/shortcut-binding-input"
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header"
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header"
import { Button } from "@imify/ui/ui/button"
import { TextInput } from "@imify/ui/ui/text-input"
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences"
import {
  DEFAULT_SHORTCUT_PREFERENCES,
  formatShortcutBinding,
  shortcutBindingToIdentifier,
  type ShortcutActionId,
  type ShortcutDefinition
} from "@imify/stores/shortcuts"
import { BodyText, MutedText } from "@imify/ui/index"
import { useTranslation } from "@imify/i18n"

export function SettingsShortcutsPanel({ isMobile }: { isMobile?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("")
  const {
    isLoading,
    definitions,
    preferences,
    setShortcutBinding,
    resetShortcutBinding,
    resetAllShortcutBindings
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

  const filteredGroupedDefinitions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return groupedDefinitions
    return groupedDefinitions
      .map(([category, items]) => {
        const filteredItems = items.filter((definition) => {
          const currentBindingLabel = formatShortcutBinding(preferences[definition.id]).toLowerCase()
          const defaultBindingLabel = formatShortcutBinding(
            DEFAULT_SHORTCUT_PREFERENCES[definition.id]
          ).toLowerCase()
          const searchableText = [definition.label, definition.description, definition.scope, category]
            .join(" ")
            .toLowerCase()
          return (
            searchableText.includes(normalizedQuery) ||
            currentBindingLabel.includes(normalizedQuery) ||
            defaultBindingLabel.includes(normalizedQuery)
          )
        })
        return [category, filteredItems] as const
      })
      .filter(([, items]) => items.length > 0)
  }, [groupedDefinitions, preferences, searchQuery])

  const filteredDefinitionCount = useMemo(
    () => filteredGroupedDefinitions.reduce((total, [, items]) => total + items.length, 0),
    [filteredGroupedDefinitions]
  )

  const { t } = useTranslation(["settings", "common"])

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      {!isMobile && (
        <SettingsSectionHeader
          title={t("shortcuts.sectionTitle", "Shortkeys")}
          description={t("shortcuts.sectionDesc", "Review and rebind keyboard shortcuts used across preview workspaces and Pattern Generator tools.")}
        />
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SettingsItemHeader
            title={t("shortcuts.shortcutsTitle", "KEYBOARD SHORTCUTS")}
            description={t("shortcuts.shortcutsDesc", "Click a shortcut and press a key combination. Press Esc to cancel or Backspace/Delete to clear.")}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-slate-200 dark:border-slate-700"
            onClick={resetAllShortcutBindings}
          >
            <RotateCcw size={14} />
            {t("shortcuts.resetAll", "Reset All")}
          </Button>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <TextInput
            label={t("shortcuts.searchLabel", "Search shortcuts")}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("shortcuts.searchPlaceholder", "Search by action name or key combination (e.g. Ctrl+Shift+E)")}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-slate-200 dark:border-slate-700"
            onClick={() => setSearchQuery("")}
            disabled={!searchQuery.trim()}
          >
            {t("shortcuts.clearSearch", "Clear Search")}
          </Button>
        </div>

        {!isLoading && searchQuery.trim() ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            {filteredDefinitionCount === 1
              ? t("shortcuts.showingResults", { count: filteredDefinitionCount, query: searchQuery.trim() })
              : t("shortcuts.showingResultsPlural", { count: filteredDefinitionCount, query: searchQuery.trim() })
            }
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            {t("shortcuts.loading", "Loading shortcut preferences...")}
          </div>
        ) : null}

        {!isLoading && filteredDefinitionCount === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            {t("shortcuts.noResults", "No shortcuts matched your search.")}
          </div>
        ) : null}

        {filteredGroupedDefinitions.map(([category, items]) => (
          <div key={category} className="space-y-2">
            <MutedText className="text-xs font-semibold uppercase tracking-wide">
              {t(`shortcuts.categories.${category}`, category)}
            </MutedText>
            {items.map((definition) => {
              const conflicts = conflictMap.get(definition.id) ?? []
              return (
                <div
                  key={definition.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 px-3 py-3"
                >
                  <div className="grid gap-3 md:grid-cols-2 md:items-start">
                    <div className="space-y-1">
                      <BodyText className="font-medium">{t(`shortcuts.actions.${definition.id}.label`, definition.label)}</BodyText>
                      <MutedText className="text-xs">{t(`shortcuts.actions.${definition.id}.description`, definition.description)}</MutedText>
                      <MutedText className="text-[11px]">
                        {t("shortcuts.defaultLabel", { binding: formatShortcutBinding(DEFAULT_SHORTCUT_PREFERENCES[definition.id]).replace("Unassigned", t("shortcuts.unassigned", "Unassigned")) })}
                      </MutedText>
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
                          {t("shortcuts.clear", "Clear")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={() => resetShortcutBinding(definition.id)}
                        >
                          {t("shortcuts.reset", "Reset")}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {conflicts.length ? (
                    <MutedText className="mt-2 text-xs !text-amber-700 dark:!text-amber-300">
                      {t("shortcuts.conflict", { actions: conflicts.map((actionId) => t(`shortcuts.actions.${actionId}.label`, definitionMap[actionId]?.label ?? actionId)).join(", ") })}
                    </MutedText>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </section>
    </div>
  )
}
