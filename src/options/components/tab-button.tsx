import type { ReactNode } from "react"

export function TabButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 text-left rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-none translate-x-1"
          : "bg-slate-50 text-slate-600 hover:bg-slate-200/60 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
      onClick={onClick}
      type="button">
      <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors ${active ? "text-inherit" : "text-slate-400"}`}>
        {icon}
      </span>
      {label}
    </button>
  )
}
