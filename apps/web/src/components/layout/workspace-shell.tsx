interface WorkspaceShellProps {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

export function WorkspaceShell({ children, rightSidebar }: WorkspaceShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 px-4 py-4">
      <section className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {children}
      </section>
      <aside className="hidden w-80 shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
        {rightSidebar ?? (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Configuration Sidebar</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Shared right sidebar placeholder for upcoming feature routes.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}
