import { useMemo, useState } from "react"

type OptionsTab = "global" | "custom" | "batch"

const TAB_ITEMS: Array<{ id: OptionsTab; label: string }> = [
  { id: "global", label: "Global Formats" },
  { id: "custom", label: "Custom Formats" },
  { id: "batch", label: "Batch Converter" }
]

function TabButton({
  active,
  label,
  onClick
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
      onClick={onClick}
      type="button">
      {label}
    </button>
  )
}

function SectionPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </section>
  )
}

export default function OptionsPage() {
  const [activeTab, setActiveTab] = useState<OptionsTab>("global")

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "global":
        return (
          <SectionPlaceholder
            title="Global Formats"
            description="Phase 1 complete: storage contracts are ready. Next step is binding these controls to chrome.storage.sync."
          />
        )
      case "custom":
        return (
          <SectionPlaceholder
            title="Custom Formats"
            description="CRUD table and dynamic form by ResizeMode will be implemented in the next phase."
          />
        )
      case "batch":
        return (
          <SectionPlaceholder
            title="Batch Converter"
            description="Dropzone, queue list, and per-file progress will be added after converter engine is finished."
          />
        )
      default:
        return null
    }
  }, [activeTab])

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Imify</p>
          <h1 className="mt-2 text-3xl font-bold">Image Save and Convert</h1>
          <p className="mt-2 text-sm text-slate-600">
            Privacy-first, 100% client-side image conversion and resizing.
          </p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => (
            <TabButton
              key={tab.id}
              active={tab.id === activeTab}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>

        <div className="mt-6">{tabContent}</div>
      </div>
    </main>
  )
}
