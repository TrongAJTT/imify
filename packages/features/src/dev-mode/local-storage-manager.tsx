"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit2,
  FileCode,
  X,
} from "lucide-react";
import { Button } from "@imify/ui/ui/button";
import { Subheading, BodyText, MutedText } from "@imify/ui/ui/typography";
import { AccordionCard } from "@imify/ui/index";

interface StorageItem {
  key: string;
  value: string;
}

type SearchTarget = "key" | "value" | "both";

export function LocalStorageManager() {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [search, setSearch] = useState("");
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("both");
  const [filterImifyOnly, setFilterImifyOnly] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // New key creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newJsonError, setNewJsonError] = useState<string | null>(null);

  // Load items from localStorage
  const loadItems = () => {
    if (typeof window === "undefined") return;
    const list: StorageItem[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        list.push({
          key,
          value: window.localStorage.getItem(key) || "",
        });
      }
    }
    setItems(list);
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Filter items based on search query, target (key/value/both) and checkbox
  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    return items
      .filter((item) => {
        if (filterImifyOnly && !item.key.toLowerCase().startsWith("imify")) {
          return false;
        }
        if (!query) return true;

        const keyMatch = item.key.toLowerCase().includes(query);
        const valueMatch = item.value.toLowerCase().includes(query);

        if (searchTarget === "key") return keyMatch;
        if (searchTarget === "value") return valueMatch;
        return keyMatch || valueMatch;
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [items, search, searchTarget, filterImifyOnly]);

  // Handle value change & validation
  const handleValueChange = (
    val: string,
    setVal: (v: string) => void,
    setError: (e: string | null) => void,
  ) => {
    setVal(val);
    const trimmed = val.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        JSON.parse(trimmed);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid JSON syntax");
      }
    } else {
      setError(null);
    }
  };

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingKey && editingTextareaRef.current) {
      editingTextareaRef.current.focus();
      // Put cursor at the end of the text
      const len = editingTextareaRef.current.value.length;
      editingTextareaRef.current.setSelectionRange(len, len);
    }
  }, [editingKey]);

  // Save key
  const handleSave = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
    setEditingKey(null);
    loadItems();
  };

  // Delete key
  const handleDelete = (key: string) => {
    if (typeof window === "undefined") return;
    if (
      window.confirm(
        `Are you sure you want to delete local storage key "${key}"?`,
      )
    ) {
      window.localStorage.removeItem(key);
      if (editingKey === key) setEditingKey(null);
      loadItems();
    }
  };

  // Create new key
  const handleCreate = () => {
    if (!newKey.trim()) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(newKey.trim(), newValue);
    setNewKey("");
    setNewValue("");
    setNewJsonError(null);
    setIsCreating(false);
    loadItems();
  };

  // Copy to clipboard
  const handleCopy = async (key: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  // Export all Imify storage as JSON file
  const handleExport = () => {
    const data: Record<string, string> = {};
    items.forEach((item) => {
      if (item.key.toLowerCase().startsWith("imify")) {
        data[item.key] = item.value;
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imify-localstorage-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (typeof data === "object" && data !== null) {
          Object.keys(data).forEach((k) => {
            window.localStorage.setItem(k, String(data[k]));
          });
          loadItems();
          alert("Import successful! Please reload the page to apply changes.");
        } else {
          alert("Invalid storage backup format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset file input
  };

  // Reset all Imify storage keys
  const handleResetAll = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all Imify local storage configs?\n\nThis will restore the app to factory settings.",
      )
    ) {
      items.forEach((item) => {
        if (item.key.toLowerCase().startsWith("imify")) {
          window.localStorage.removeItem(item.key);
        }
      });
      loadItems();
      alert("All Imify storage keys cleared. Reloading page...");
      window.location.reload();
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Subheading className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          LocalStorage Manager
        </Subheading>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 text-xs rounded-lg border-slate-200 dark:border-slate-700"
            onClick={() => {
              loadItems();
            }}
            title="Refresh list"
          >
            <RefreshCw size={12} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 text-xs rounded-lg border-slate-200 dark:border-slate-700 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={handleResetAll}
          >
            <RotateCcw size={12} />
            Reset Configs
          </Button>
        </div>
      </div>

      {/* Warning for Reactivity Caveat */}
      <AccordionCard
        icon={<AlertTriangle size={15} />}
        colorTheme="amber"
        defaultOpen={true}
        label="Reactivity Caveat"
        childrenClassName="py-2 px-3 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed"
      >
        <div>
          Zustand stores running in memory won't immediately reflect changes
          edited here. After saving, please reload the page via the browser
          refresh button or click the reload shortcut button.
        </div>
      </AccordionCard>

      {/* Main Action Bar */}
      <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
        {/* Row 1: Search Inputs & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search by ${searchTarget === "both" ? "key or value" : searchTarget}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Search Target Select */}
            <select
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value as SearchTarget)}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="key">Search keys</option>
              <option value="value">Search values</option>
              <option value="both">Search both</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Import Button */}
            <label className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-250 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-sm">
              <Upload size={13} />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            {/* Export Button */}
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 px-3 py-1.5 text-xs border-slate-250 dark:border-slate-700"
              onClick={handleExport}
            >
              <Download size={13} />
              Export JSON
            </Button>
            {/* Add New Key */}
            <Button
              size="sm"
              variant="primary"
              className="flex items-center gap-1 px-3 py-1.5 text-xs"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={13} />
              Add Key
            </Button>
          </div>
        </div>

        {/* Row 2: Checkboxes (Moved below) */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Imify Only Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterImifyOnly}
              onChange={(e) => setFilterImifyOnly(e.target.checked)}
              className="rounded text-sky-500 border-slate-350 dark:border-slate-700 focus:ring-sky-500"
            />
            <span>Imify keys only</span>
          </label>

          {/* Show Values Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showValues}
              onChange={(e) => setShowValues(e.target.checked)}
              className="rounded text-sky-500 border-slate-350 dark:border-slate-700 focus:ring-sky-500"
            />
            <span>Show values</span>
          </label>
        </div>
      </div>

      {/* New Key Form */}
      {isCreating && (
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/20 dark:border-sky-800/40 dark:bg-sky-950/10 space-y-3 animate-in slide-in-from-top-1 duration-150">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
              CREATE NEW STORAGE ENTRY
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreating(false)}
              className="h-6 w-6 p-0 rounded-full"
            >
              <X size={14} />
            </Button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Key name (e.g. imify-my-key)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-slate-800 dark:text-slate-100"
            />
            <textarea
              placeholder="Value (Plain string or JSON)"
              value={newValue}
              onChange={(e) =>
                handleValueChange(e.target.value, setNewValue, setNewJsonError)
              }
              className={`w-full h-20 px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 font-mono text-slate-800 dark:text-slate-100 ${
                newJsonError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-sky-500"
              }`}
            />
            {newJsonError && (
              <span className="block text-[10px] font-semibold text-red-500 font-mono">
                JSON Error: {newJsonError}
              </span>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreate}
              disabled={!newKey.trim() || !!newJsonError}
            >
              Create & Save
            </Button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isEditing = editingKey === item.key;
            let isJson = false;
            try {
              const trimmed = item.value.trim();
              if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                JSON.parse(trimmed);
                isJson = true;
              }
            } catch {}

            return (
              <div
                key={item.key}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col gap-3 group relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100 break-all select-all">
                      {item.key}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {isJson ? (
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30">
                          <FileCode size={9} />
                          JSON
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Raw String
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                        onClick={() => {
                          setEditingKey(item.key);
                          setEditingValue(item.value);
                          setJsonError(null);
                        }}
                        title="Edit value"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-755 dark:hover:text-slate-200"
                        onClick={() => handleCopy(item.key, item.value)}
                        title="Copy value"
                      >
                        {copiedKey === item.key ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        onClick={() => handleDelete(item.key)}
                        title="Delete key"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Value Area / Editor */}
                {isEditing ? (
                  <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                    <textarea
                      ref={editingTextareaRef}
                      value={editingValue}
                      onChange={(e) =>
                        handleValueChange(
                          e.target.value,
                          setEditingValue,
                          setJsonError,
                        )
                      }
                      className={`w-full h-36 px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 font-mono leading-relaxed text-slate-800 dark:text-slate-100 ${
                        jsonError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-200 dark:border-slate-700 focus:ring-sky-500"
                      }`}
                    />
                    {jsonError && (
                      <span className="block text-[10px] font-semibold text-red-500 font-mono">
                        JSON Error: {jsonError}
                      </span>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingKey(null);
                          setJsonError(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSave(item.key, editingValue)}
                        disabled={!!jsonError}
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  showValues && (
                    <div className="relative rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 max-h-24 overflow-y-auto select-all">
                      <pre className="font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all leading-normal">
                        {item.value || (
                          <span className="italic text-slate-350 dark:text-slate-650">
                            empty string
                          </span>
                        )}
                      </pre>
                    </div>
                  )
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center p-8 rounded-xl border border-slate-200 border-dashed dark:border-slate-800">
            <MutedText>No storage keys matching search query.</MutedText>
          </div>
        )}
      </div>
    </div>
  );
}
