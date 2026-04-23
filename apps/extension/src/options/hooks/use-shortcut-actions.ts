import { useEffect, useRef } from "react"

import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import {
  eventMatchesShortcut,
  isShortcutEventFromEditableTarget,
  type ShortcutActionId,
} from "@/options/shared/shortcuts"

export interface ShortcutActionHandler {
  actionId: ShortcutActionId
  handler: (event: KeyboardEvent) => void
  enabled?: boolean
  allowWhenEditable?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

export function useShortcutActions(
  actions: ShortcutActionHandler[],
  enabled: boolean = true
) {
  const { preferences } = useShortcutPreferences()
  const actionsRef = useRef(actions)

  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      for (const action of actionsRef.current) {
        if (action.enabled === false) continue

        const binding = preferences[action.actionId]
        if (!binding) continue

        if (!action.allowWhenEditable && isShortcutEventFromEditableTarget(event)) {
          continue
        }

        if (!eventMatchesShortcut(event, binding)) continue

        if (action.preventDefault !== false) {
          event.preventDefault()
        }

        if (action.stopPropagation) {
          event.stopPropagation()
        }

        action.handler(event)
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled, preferences])
}
