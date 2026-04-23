import { StorePersistenceProbe } from "@/components/dev/store-persistence-probe"

export default function Home() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Imify Web</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Shared web shell is ready. Select a workspace from the header navigation.
      </p>
      <StorePersistenceProbe />
    </div>
  )
}
