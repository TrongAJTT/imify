interface FeaturePlaceholderPageProps {
  title: string
  description: string
}

export function FeaturePlaceholderPage({ title, description }: FeaturePlaceholderPageProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <div className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Phase 4.3 layout scaffold complete. Feature implementation will arrive in Phase 4.4.
      </div>
    </div>
  )
}
