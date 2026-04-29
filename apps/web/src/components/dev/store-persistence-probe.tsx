"use client"

import { useMemo } from "react"
import { useShortcutPreferences } from "@imify/stores"

const TARGET_ACTION = "global.preview.zoom_mode" as const

export function StorePersistenceProbe() {
  const { getShortcutLabel, setShortcutBinding } = useShortcutPreferences()
  const currentLabel = useMemo(() => getShortcutLabel(TARGET_ACTION), [getShortcutLabel])

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Store Persistence Probe</h2>
      <p className="text-xs text-slate-600 dark:text-slate-300">
        Shortcut binding for <code>{TARGET_ACTION}</code>: <strong>{currentLabel}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShortcutBinding(TARGET_ACTION, { key: "x" })}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Set to X
        </button>
        <button
          type="button"
          onClick={() => setShortcutBinding(TARGET_ACTION, { key: "z" })}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Reset to Z
        </button>
      </div>
    </div>
  )
}
