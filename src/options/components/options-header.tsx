interface HeaderProps {
  isLoading: boolean
  isDark: boolean
  onToggleDark: () => void
  onOpenAbout: () => void
  onOpenDonate: () => void
}

export function OptionsHeader({
  isLoading,
  isDark,
  onToggleDark,
  onOpenAbout,
  onOpenDonate
}: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
      <div className="flex items-center gap-3">
        <img 
          src={require("url:@assets/icon.png")} 
          alt="Imify Logo" 
          className="w-10 h-10 rounded-lg shadow-sm bg-white dark:bg-slate-800 p-1"
        />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-none">Imify</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white leading-none">Save and Convert Images</h1>
          {isLoading ? <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Loading settings...</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDark}
          className="p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          title="Toggle Dark Mode"
          type="button"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
        <button
          onClick={onOpenAbout}
          className="p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          title="About Imify"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        <button
          aria-label="Open donate dialog"
          className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 transition-colors"
          onClick={onOpenDonate}
          title="Donate"
          type="button">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
      </div>
    </header>
  )
}
