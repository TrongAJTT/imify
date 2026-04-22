import { useCallback, useMemo, useState } from "react"
import { Copy, Check, RefreshCw } from "lucide-react"
import { useBatchStore } from "@/options/stores/batch-store"
import { useSplicingStore } from "@/options/stores/splicing-store"
import { useSplitterStore } from "@/options/stores/splitter-store"
import { useFillingStore } from "@/options/stores/filling-store"
import { usePatternStore } from "@/options/stores/pattern-store"
import { useDiffcheckerStore } from "@/options/stores/diffchecker-store"
import { useInspectorStore } from "@/options/stores/inspector-store"
import { Button } from "@/options/components/ui/button"
import type { OptionsTab } from "@/options/shared"

/** Strip action functions (any property that is a function) from a store snapshot */
function stripActions(state: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(state)) {
    if (typeof v !== "function") {
      out[k] = v
    }
  }
  return out
}

type StoreFilter = "all" | OptionsTab

interface DevModeStateViewerProps {
  /** The currently active tab in the main workspace — used to pre-select the filter */
  activeTab: OptionsTab | null
}

export function DevModeStateViewer({ activeTab }: DevModeStateViewerProps) {
  const [filter, setFilter] = useState<StoreFilter>(activeTab ?? "all")
  const [copied, setCopied] = useState(false)

  // Subscribe to all stores. We get the full state object (which only changes reference on actual updates)
  // instead of mapping inline to avoid infinite re-render loops caused by returning a new object every time.
  const batchState = useBatchStore()
  const splicingState = useSplicingStore()
  const splitterState = useSplitterStore()
  const fillingState = useFillingStore()
  const patternState = usePatternStore()
  const diffcheckerState = useDiffcheckerStore()
  const inspectorState = useInspectorStore()

  const allStores = useMemo<Record<string, Record<string, unknown>>>(() => ({
    batch: stripActions(batchState as unknown as Record<string, unknown>),
    splicing: stripActions(splicingState as unknown as Record<string, unknown>),
    splitter: stripActions(splitterState as unknown as Record<string, unknown>),
    filling: stripActions(fillingState as unknown as Record<string, unknown>),
    pattern: stripActions(patternState as unknown as Record<string, unknown>),
    diffchecker: stripActions(diffcheckerState as unknown as Record<string, unknown>),
    inspector: stripActions(inspectorState as unknown as Record<string, unknown>),
  }), [batchState, splicingState, splitterState, fillingState, patternState, diffcheckerState, inspectorState])

  /** Map a tab id to its corresponding store key */
  const tabToStoreKey: Partial<Record<OptionsTab, keyof typeof allStores>> = {
    single: "batch",
    batch: "batch",
    splicing: "splicing",
    splitter: "splitter",
    filling: "filling",
    pattern: "pattern",
    diffchecker: "diffchecker",
    inspector: "inspector",
  }

  const visibleSnapshot = useMemo(() => {
    if (filter === "all") {
      return allStores
    }
    const key = tabToStoreKey[filter as OptionsTab]
    if (key) {
      return { [key]: allStores[key] }
    }
    return allStores
  }, [filter, allStores])

  const jsonText = useMemo(() => {
    try {
      return JSON.stringify(visibleSnapshot, null, 2)
    } catch {
      return '{ "error": "Failed to serialize state" }'
    }
  }, [visibleSnapshot])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [jsonText])

  const filterOptions: Array<{ value: StoreFilter; label: string }> = [
    { value: "all", label: "All Stores" },
    { value: "single", label: "Processor (Single/Batch)" },
    { value: "splicing", label: "Image Splicing" },
    { value: "splitter", label: "Image Splitter" },
    { value: "filling", label: "Image Filling" },
    { value: "pattern", label: "Pattern Generator" },
    { value: "diffchecker", label: "Difference Checker" },
    { value: "inspector", label: "Image Inspector" },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Filter selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Show:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as StoreFilter)}
          className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs gap-1 border-slate-200 dark:border-slate-700"
            onClick={handleCopy}
          >
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Live JSON viewer */}
      <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-950 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/50">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={10} className="text-emerald-500 animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-[10px] font-mono text-slate-400">Live State Monitor</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {jsonText.length.toLocaleString()} chars
          </span>
        </div>
        <pre
          className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-auto p-3"
          style={{ maxHeight: "380px" }}
        >
          {jsonText}
        </pre>
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        This view updates in real-time as you change settings. Action methods are excluded.
      </p>
    </div>
  )
}
