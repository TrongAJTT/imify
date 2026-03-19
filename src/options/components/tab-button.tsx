export function TabButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean
  label: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 text-left rounded-md px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md transform scale-[1.02]"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
      onClick={onClick}
      type="button">
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {label}
    </button>
  )
}
