import React, { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Database, Search, ShieldAlert } from "lucide-react"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { SENSITIVE_TAGS } from "./exif-tags"
import { type ExifEntry, type ExifGroup } from "./types"
import { InfoSection } from "./info-section"

const GROUP_LABELS: Record<ExifGroup, string> = { image: "Image", photo: "Photo / Camera", gps: "GPS", icc: "ICC Profile", other: "Other" }
const GROUP_ORDER: ExifGroup[] = ["image", "photo", "gps", "icc", "other"]

function ExifValueCell({ value }: { value: string | number | number[] }) {
  const [expanded, setExpanded] = useState(false)
  const displayValue = Array.isArray(value) ? value.join(", ") : String(value)
  const isLong = displayValue.length > 60
  return <td className="max-w-[260px] break-all px-3 py-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">{isLong && !expanded ? <span>{displayValue.slice(0, 60)}...<button type="button" onClick={() => setExpanded(true)} className="ml-1 text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"><ChevronDown size={10} className="inline" /></button></span> : isLong ? <span>{displayValue}<button type="button" onClick={() => setExpanded(false)} className="ml-1 text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"><ChevronUp size={10} className="inline" /></button></span> : displayValue}</td>
}

export function ExifTableCard({ entries }: { entries: ExifEntry[] }) {
  const exifSortMode = useInspectorStore((s) => s.exifSortMode)
  const showSensitiveOnly = useInspectorStore((s) => s.showSensitiveOnly)
  const [filter, setFilter] = useState("")
  const filtered = useMemo(() => {
    let result = entries
    if (showSensitiveOnly) result = result.filter((e) => SENSITIVE_TAGS.has(e.tagName))
    if (filter.trim()) {
      const lower = filter.toLowerCase()
      result = result.filter((e) => e.tagName.toLowerCase().includes(lower) || String(e.value).toLowerCase().includes(lower))
    }
    if (exifSortMode === "name") result = [...result].sort((a, b) => a.tagName.localeCompare(b.tagName))
    else if (exifSortMode === "tag") result = [...result].sort((a, b) => a.tag - b.tag)
    return result
  }, [entries, exifSortMode, filter, showSensitiveOnly])
  const grouped = useMemo(() => {
    if (exifSortMode !== "group") return null
    const groups = new Map<ExifGroup, ExifEntry[]>()
    for (const e of filtered) { const list = groups.get(e.group) ?? []; list.push(e); groups.set(e.group, list) }
    return groups
  }, [filtered, exifSortMode])

  const renderTable = (items: ExifEntry[]) => items.length === 0 ? <div className="flex items-center justify-center py-8"><span className="text-sm text-slate-500 dark:text-slate-400">No metadata tags found</span></div> : (
    <table className="w-full text-left">
      <thead><tr className="border-b border-slate-100 dark:border-slate-700/50"><th className="w-[160px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tag</th><th className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Value</th></tr></thead>
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">{items.map((entry, i) => <tr key={`${entry.tag}-${i}`} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${SENSITIVE_TAGS.has(entry.tagName) ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}><td className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">{SENSITIVE_TAGS.has(entry.tagName) ? <ShieldAlert size={10} className="mr-1 inline text-red-400" /> : null}{entry.tagName}</td><ExifValueCell value={entry.value} /></tr>)}</tbody>
    </table>
  )

  return (
    <InfoSection title="METADATA" icon={<Database size={13} />} badge={<span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">{filtered.length}</span>}>
      <div className="mb-3">
        <div className="relative"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Filter tags..." value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200" /></div>
      </div>
      <div className="max-h-[400px] overflow-y-auto rounded-md border border-slate-100 dark:border-slate-700/50">
        {grouped ? <div>{GROUP_ORDER.map((group) => { const items = grouped.get(group); if (!items || items.length === 0) return null; return <div key={group}><div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">{GROUP_LABELS[group]} ({items.length})</div>{renderTable(items)}</div> })}</div> : renderTable(filtered)}
      </div>
    </InfoSection>
  )
}

