import { useState, useMemo } from "react"
import { Database, Search, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react"
import type { ExifEntry, ExifGroup } from "@imify/features/inspector"
import { SENSITIVE_TAGS } from "@imify/features/inspector/exif-tags"
import { InfoSection } from "./info-section"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"

interface ExifTableCardProps {
  entries: ExifEntry[]
}

const GROUP_LABELS: Record<ExifGroup, string> = {
  image: "Image",
  photo: "Photo / Camera",
  gps: "GPS",
  icc: "ICC Profile",
  other: "Other"
}

const GROUP_ORDER: ExifGroup[] = ["image", "photo", "gps", "icc", "other"]

function ExifValueCell({ value }: { value: string | number | number[] }) {
  const [expanded, setExpanded] = useState(false)

  const displayValue = Array.isArray(value)
    ? value.join(", ")
    : String(value)

  const isLong = displayValue.length > 60

  return (
    <td className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono break-all max-w-[260px]">
      {isLong && !expanded ? (
        <span>
          {displayValue.slice(0, 60)}...
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1 text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
          >
            <ChevronDown size={10} className="inline" />
          </button>
        </span>
      ) : isLong ? (
        <span>
          {displayValue}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="ml-1 text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
          >
            <ChevronUp size={10} className="inline" />
          </button>
        </span>
      ) : (
        displayValue
      )}
    </td>
  )
}

export function ExifTableCard({ entries }: ExifTableCardProps) {
  const exifSortMode = useInspectorStore((s) => s.exifSortMode)
  const showSensitiveOnly = useInspectorStore((s) => s.showSensitiveOnly)
  const [filter, setFilter] = useState("")

  const filtered = useMemo(() => {
    let result = entries

    if (showSensitiveOnly) {
      result = result.filter((e) => SENSITIVE_TAGS.has(e.tagName))
    }

    if (filter.trim()) {
      const lower = filter.toLowerCase()
      result = result.filter(
        (e) =>
          e.tagName.toLowerCase().includes(lower) ||
          String(e.value).toLowerCase().includes(lower)
      )
    }

    if (exifSortMode === "name") {
      result = [...result].sort((a, b) => a.tagName.localeCompare(b.tagName))
    } else if (exifSortMode === "tag") {
      result = [...result].sort((a, b) => a.tag - b.tag)
    }

    return result
  }, [entries, filter, exifSortMode, showSensitiveOnly])

  const grouped = useMemo(() => {
    if (exifSortMode !== "group") return null

    const groups = new Map<ExifGroup, ExifEntry[]>()
    for (const e of filtered) {
      const list = groups.get(e.group) ?? []
      list.push(e)
      groups.set(e.group, list)
    }
    return groups
  }, [filtered, exifSortMode])

  const countBadge = (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
      {filtered.length}
    </span>
  )

  const renderTable = (items: ExifEntry[]) => {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-slate-500 dark:text-slate-400">No metadata tags found</span>
        </div>
      )
    }
    return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-100 dark:border-slate-700/50">
          <th className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[160px]">Tag</th>
          <th className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Value</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
        {items.map((entry, i) => (
          <tr
            key={`${entry.tag}-${i}`}
            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${SENSITIVE_TAGS.has(entry.tagName) ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}
          >
            <td className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
              {SENSITIVE_TAGS.has(entry.tagName) && (
                <ShieldAlert size={10} className="inline mr-1 text-red-400" />
              )}
              {entry.tagName}
            </td>
            <ExifValueCell value={entry.value} />
          </tr>
        ))}
      </tbody>
    </table>
    )
  }

  return (
    <InfoSection
      title="METADATA"
      icon={<Database size={13} />}
      badge={countBadge}
    >
      <div className="mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter tags..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto rounded-md border border-slate-100 dark:border-slate-700/50">
        {grouped ? (
          <div>
            {GROUP_ORDER.map((group) => {
              const items = grouped.get(group)
              if (!items || items.length === 0) return null
              return (
                <div key={group}>
                  <div className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    {GROUP_LABELS[group]} ({items.length})
                  </div>
                  {renderTable(items)}
                </div>
              )
            })}
          </div>
        ) : (
          renderTable(filtered)
        )}
      </div>
    </InfoSection>
  )
}
