import type { ReactNode } from "react"
import { Tooltip } from "./tooltip"

export function TabButton({
  active,
  label,
  icon,
  onClick,
  collapsed = false
}: {
  active: boolean
  label: string
  icon: ReactNode
  onClick: () => void
  collapsed?: boolean
}) {
  const button = (
    <button
      className={`w-full flex items-center h-10 text-sm font-medium rounded-md transition-colors text-left ${
        collapsed ? "justify-center px-0" : "gap-2.5 px-3"
      } ${
        active
          ? "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
      }`}
      onClick={onClick}
      type="button">
      <span
        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors ${
          collapsed ? "mx-auto" : ""
        } ${active ? "text-sky-500" : "text-slate-400 dark:text-slate-500"}`}>
        {icon}
      </span>
      {!collapsed ? label : null}
    </button>
  )

  if (!collapsed) {
    return button
  }

  return (
    <Tooltip content={label} position="right" variant="nowrap">
      {button}
    </Tooltip>
  )
}
