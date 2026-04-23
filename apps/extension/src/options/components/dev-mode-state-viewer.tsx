import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Copy, RefreshCw } from "lucide-react"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useSplicingStore } from "@imify/stores/stores/splicing-store"
import { useSplitterStore } from "@imify/stores/stores/splitter-store"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { usePatternStore } from "@imify/stores/stores/pattern-store"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { getStorageState, onStorageStateChanged } from "@/adapters/chrome-storage-state"
import type { ExtensionStorageState } from "@imify/core/types"
import { Button } from "@imify/ui/ui/button"
import type { OptionsTab } from "@/options/shared"
import { Tooltip } from "@/options/components/tooltip"

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

type StoreFilter = "all" | OptionsTab | "batch_global"

interface DevModeStateViewerProps {
  /** The currently active tab in the main workspace — used to pre-select the filter */
  activeTab: OptionsTab | null
}

export function DevModeStateViewer({ activeTab }: DevModeStateViewerProps) {
  const [filter, setFilter] = useState<StoreFilter>(activeTab ?? "all")
  const [copied, setCopied] = useState(false)
  const [storageState, setStorageState] = useState<ExtensionStorageState | null>(null)

  useEffect(() => {
    let unmounted = false
    getStorageState().then((state) => {
      if (!unmounted) setStorageState(state)
    })
    const unsubscribe = onStorageStateChanged((state) => {
      if (!unmounted) setStorageState(state)
    })
    return () => {
      unmounted = true
      unsubscribe()
    }
  }, [])

  // Subscribe to all stores. We get the full state object (which only changes reference on actual updates)
  // instead of mapping inline to avoid infinite re-render loops caused by returning a new object every time.
  const batchState = useBatchStore()
  const splicingState = useSplicingStore()
  const splitterState = useSplitterStore()
  const fillingState = useFillingStore()
  const patternState = usePatternStore()
  const diffcheckerState = useDiffcheckerStore()
  const inspectorState = useInspectorStore()

  const allStores = useMemo<Record<string, Record<string, unknown>>>(() => {
    const rootBatch = stripActions(batchState as unknown as Record<string, unknown>)
    // Extract context configs to view them individually
    const singleConfig = (batchState as any).contextConfigs?.single || {}
    const batchConfig = (batchState as any).contextConfigs?.batch || {}

    return {
      batch_global: rootBatch,
      single: stripActions(singleConfig),
      batch: stripActions(batchConfig),
      splicing: stripActions(splicingState as unknown as Record<string, unknown>),
      splitter: stripActions(splitterState as unknown as Record<string, unknown>),
      filling: stripActions(fillingState as unknown as Record<string, unknown>),
      pattern: stripActions(patternState as unknown as Record<string, unknown>),
      diffchecker: stripActions(diffcheckerState as unknown as Record<string, unknown>),
      inspector: stripActions(inspectorState as unknown as Record<string, unknown>),
      "context-menu": storageState?.context_menu as unknown as Record<string, unknown> || {},
    }
  }, [batchState, splicingState, splitterState, fillingState, patternState, diffcheckerState, inspectorState, storageState])

  /** Map a tab id to its corresponding store key */
  const tabToStoreKey: Partial<Record<StoreFilter, keyof typeof allStores>> = {
    batch_global: "batch_global",
    single: "single",
    batch: "batch",
    "context-menu": "context-menu",
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
    const key = tabToStoreKey[filter]
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
    { value: "batch_global", label: "Processor Core (Global)" },
    { value: "single", label: "Single Processor" },
    { value: "batch", label: "Batch Processor" },
    { value: "context-menu", label: "Context Menu" },
    { value: "splicing", label: "Image Splicing" },
    { value: "splitter", label: "Image Splitter" },
    { value: "filling", label: "Image Filling" },
    { value: "pattern", label: "Pattern Generator" },
    { value: "diffchecker", label: "Difference Checker" },
    { value: "inspector", label: "Image Inspector" },
  ]

  return (
    <div className="flex flex-col gap-3 pt-0.5 w-full max-w-full overflow-hidden">
      {/* Filter selector */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Show:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as StoreFilter)}
          className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-[200px] sm:max-w-xs truncate"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1.5">
          <Tooltip content="Copy current view to clipboard">
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
          </Tooltip>
        </div>
      </div>

      {/* Live JSON viewer */}
      <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-950 overflow-hidden w-full">
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
          className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-auto p-3 whitespace-pre-wrap break-all"
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
