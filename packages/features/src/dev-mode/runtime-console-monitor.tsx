"use client";

import React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  RefreshCw,
  Trash2,
  AlignLeft,
  SlidersHorizontal,
} from "lucide-react";
import { Button, ToggleSwitch, Tooltip, AccordionCard } from "@imify/ui";
import { useRuntimeLogStore } from "./runtime-log-collector";

export function RuntimeConsoleMonitor() {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const runtimeLogs = useRuntimeLogStore((state) => state.entries);
  const clearRuntimeLogs = useRuntimeLogStore((state) => state.clear);

  const [enabledLevels, setEnabledLevels] = useState<{
    [key: string]: boolean;
  }>({ log: true, warn: true, error: true });

  const logCounts = useMemo(() => {
    let log = 0;
    let warn = 0;
    let error = 0;
    for (const entry of runtimeLogs) {
      const lvl = entry.level.toLowerCase();
      if (lvl === "log") log++;
      else if (lvl === "warn") warn++;
      else if (lvl === "error") error++;
    }
    return { log, warn, error };
  }, [runtimeLogs]);

  const filteredLogs = useMemo(() => {
    return runtimeLogs.filter((entry) => {
      const lvl = entry.level.toLowerCase();
      return enabledLevels[lvl] !== false;
    });
  }, [runtimeLogs, enabledLevels]);

  const logText = useMemo(() => {
    if (filteredLogs.length === 0) {
      return "";
    }
    return filteredLogs
      .map(
        (entry) =>
          `[${entry.timestamp}] [${entry.source}] [${entry.level.toUpperCase()}] ${entry.route} :: ${entry.message}`,
      )
      .join("\n");
  }, [filteredLogs]);

  const handleCopyRuntimeLogs = useCallback(async () => {
    if (!logText) return;
    try {
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore permission errors from clipboard API.
    }
  }, [logText]);

  const handleExportRuntimeLogs = useCallback(() => {
    if (!logText) return;
    const blob = new Blob([logText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `imify-runtime-console-${dateStr}.log`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [logText]);

  return (
    <div className="flex flex-col gap-3 pt-0.5 w-full max-w-full overflow-hidden">
      <AccordionCard
        label="Filter levels"
        defaultOpen={true}
        icon={<SlidersHorizontal size={16} />}
        childrenClassName="py-2 pl-5 w-full"
      >
        <ToggleSwitch
          label={`LOG (${logCounts.log})`}
          description="Capture standard output logs."
          checked={enabledLevels.log}
          onChange={(val) =>
            setEnabledLevels((prev) => ({ ...prev, log: val }))
          }
        />
        <ToggleSwitch
          label={`WARN (${logCounts.warn})`}
          description="Capture warning event logs."
          checked={enabledLevels.warn}
          onChange={(val) =>
            setEnabledLevels((prev) => ({ ...prev, warn: val }))
          }
        />
        <ToggleSwitch
          label={`ERROR (${logCounts.error})`}
          description="Capture critical error and exception logs."
          checked={enabledLevels.error}
          onChange={(val) =>
            setEnabledLevels((prev) => ({ ...prev, error: val }))
          }
        />
        {/* <div className="flex flex-col  items-stretch pb-1">
        </div> */}
      </AccordionCard>

      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Runtime Logs:
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {filteredLogs.length === runtimeLogs.length
            ? `${runtimeLogs.length.toLocaleString()} entries`
            : `${filteredLogs.length.toLocaleString()} / ${runtimeLogs.length.toLocaleString()} entries`}
        </span>
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
          <Tooltip content="Copy runtime logs to clipboard">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 border-slate-200 dark:border-slate-700"
              onClick={handleCopyRuntimeLogs}
              disabled={!filteredLogs.length}
            >
              {copied ? (
                <Check size={11} className="text-emerald-500" />
              ) : (
                <Copy size={11} />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </Tooltip>
          <Tooltip content="Clear captured runtime logs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 border-slate-200 dark:border-slate-700"
              onClick={clearRuntimeLogs}
              disabled={!runtimeLogs.length}
            >
              <Trash2 size={11} />
              Clear
            </Button>
          </Tooltip>
          <Tooltip content="Export runtime logs as .log file">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 border-slate-200 dark:border-slate-700"
              onClick={handleExportRuntimeLogs}
              disabled={!filteredLogs.length}
            >
              <Download size={11} />
              Export
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-950 overflow-hidden w-full">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/50 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <RefreshCw
              size={10}
              className="text-violet-400 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <span className="text-[10px] font-mono text-slate-400">
              Runtime Console Monitor
            </span>
          </div>
        </div>
        <pre
          className={`text-[11px] font-mono text-slate-300 leading-relaxed p-3 ${
            wordWrap
              ? "whitespace-pre-wrap break-all"
              : "whitespace-pre overflow-auto"
          }`}
          style={{ maxHeight: "560px" }}
        >
          {logText || "No runtime logs captured yet."}
        </pre>
      </div>
    </div>
  );
}
