"use client";

import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw, AlignLeft } from "lucide-react";
import { Button } from "@imify/ui/ui/button";
import { Tooltip } from "@imify/ui/ui/tooltip";
import {
  DEV_MODE_FEATURES,
  getFeatureRawState,
  stripStoreActions,
  type DevModeFeatureId,
} from "./dev-mode-registry";
import { useBatchStore } from "@imify/stores/stores/batch-store";
import type { OptionsTab } from "./debug-shared";
import type { DevModeSettingsAdapter } from "./dev-mode-settings-adapter";

type StoreFilter =
  | "all"
  | OptionsTab
  | "batch_global"
  | "processor"
  | "context-menu"
  | DevModeFeatureId;

interface DevModeStateViewerProps {
  activeTab: OptionsTab | null;
  settingsAdapter: DevModeSettingsAdapter;
}

export function DevModeStateViewer({
  activeTab,
  settingsAdapter,
}: DevModeStateViewerProps) {
  const [filter, setFilter] = useState<StoreFilter>(() => {
    if (activeTab === "single" || activeTab === "batch") {
      return "processor";
    }
    return activeTab ?? "all";
  });
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [settingsState, setSettingsState] = useState<unknown>(null);
  const [, setTick] = useState(0);

  // Subscribe to all registered feature stores for real-time live updates
  useEffect(() => {
    const unsubscribes = DEV_MODE_FEATURES.map((feature) => {
      if (feature.storeHook) {
        return feature.storeHook.subscribe(() => {
          setTick((t) => (t + 1) % 100000);
        });
      }
      return null;
    }).filter(Boolean);

    return () => {
      unsubscribes.forEach((unsub) => unsub?.());
    };
  }, []);

  useEffect(() => {
    let unmounted = false;
    settingsAdapter.getSettingsState().then((state) => {
      if (!unmounted) {
        setSettingsState(state);
      }
    });

    if (!settingsAdapter.subscribeSettingsState) {
      return () => {
        unmounted = true;
      };
    }

    const unsubscribe = settingsAdapter.subscribeSettingsState((state) => {
      if (!unmounted) {
        setSettingsState(state);
      }
    });

    return () => {
      unmounted = true;
      unsubscribe();
    };
  }, [settingsAdapter]);

  const allStores = useMemo<Record<string, Record<string, unknown>>>(() => {
    const storesRecord: Record<string, Record<string, unknown>> = {};

    // 1. Processor & Batch details
    const batchRaw = useBatchStore.getState() as any;
    const rootBatch = stripStoreActions(batchRaw);
    const singleConfig = batchRaw?.contextConfigs?.single || {};
    const batchConfig = batchRaw?.contextConfigs?.batch || {};
    const presets = Array.isArray(batchRaw?.presets) ? batchRaw.presets : [];
    const activePresetIds = batchRaw?.activePresetIds || {};
    const recentPresetIds = batchRaw?.recentPresetIds || {};

    storesRecord.batch_global = rootBatch;
    storesRecord.processor = {
      presets: presets.map((preset: any) => stripStoreActions(preset)),
      activePresetIds,
      recentPresetIds,
      contextConfigs: {
        single: stripStoreActions(singleConfig),
        batch: stripStoreActions(batchConfig),
      },
    };

    // 2. All other features dynamically from DEV_MODE_FEATURES registry
    for (const feature of DEV_MODE_FEATURES) {
      if (feature.id === "batch") continue;
      if (feature.storeHook) {
        const raw = getFeatureRawState(feature.id);
        if (raw) {
          storesRecord[feature.id] = raw;
        }
      }
    }

    // 3. Context Menu / Settings
    storesRecord["context-menu"] = (settingsState as any)?.context_menu || {};

    return storesRecord;
  }, [settingsState]);

  const filterOptions = useMemo<Array<{ value: StoreFilter; label: string }>>(() => {
    const options: Array<{ value: StoreFilter; label: string }> = [
      { value: "all", label: "All Stores" },
      { value: "batch_global", label: "Processor Global" },
      { value: "processor", label: "Processor" },
      { value: "context-menu", label: "Context Menu" },
    ];

    for (const feature of DEV_MODE_FEATURES) {
      if (feature.id === "batch") continue;
      if (feature.storeHook) {
        options.push({
          value: feature.id,
          label: feature.label,
        });
      }
    }

    return options;
  }, []);

  const visibleSnapshot = useMemo(() => {
    if (filter === "all") {
      return allStores;
    }
    const storeKey = filter === "single" || filter === "batch" ? "processor" : filter;
    const storeData = allStores[storeKey];
    if (!storeData) {
      return allStores;
    }
    return { [storeKey]: storeData };
  }, [allStores, filter]);

  const jsonText = useMemo(() => {
    try {
      return JSON.stringify(visibleSnapshot, null, 2);
    } catch {
      return '{ "error": "Failed to serialize state" }';
    }
  }, [visibleSnapshot]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore permission errors from clipboard API.
    }
  }, [jsonText]);

  return (
    <div className="flex flex-col gap-3 pt-0.5 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Show:
        </span>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as StoreFilter)}
          className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-[200px] sm:max-w-xs truncate"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1.5">
          <Tooltip content="Toggle word wrap">
            <Button
              type="button"
              variant={wordWrap ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs gap-1 border-slate-200 dark:border-slate-700"
              onClick={() => setWordWrap(!wordWrap)}
            >
              <AlignLeft size={11} />
              Wrap
            </Button>
          </Tooltip>
          <Tooltip content="Copy current view to clipboard">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 border-slate-200 dark:border-slate-700"
              onClick={handleCopy}
            >
              {copied ? (
                <Check size={11} className="text-emerald-500" />
              ) : (
                <Copy size={11} />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-950 overflow-hidden w-full">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/50">
          <div className="flex items-center gap-1.5">
            <RefreshCw
              size={10}
              className="text-emerald-500 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <span className="text-[10px] font-mono text-slate-400">
              Live State Monitor
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {jsonText.length.toLocaleString()} chars
          </span>
        </div>
        <pre
          className={`text-[11px] font-mono text-slate-300 leading-relaxed p-3 overflow-y-auto ${
            wordWrap
              ? "whitespace-pre-wrap break-all"
              : "whitespace-pre overflow-x-auto"
          }`}
          style={{ maxHeight: "480px" }}
        >
          {jsonText}
        </pre>
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        This view updates in real-time as you change settings. Action methods
        are excluded.
      </p>
    </div>
  );
}
