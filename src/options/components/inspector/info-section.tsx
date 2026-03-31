import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Kicker } from "@/options/components/ui/typography"

interface InfoSectionProps {
  title: string
  icon?: ReactNode
  badge?: ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  children: ReactNode
}

export function InfoSection({
  title,
  icon,
  badge,
  defaultOpen = true,
  collapsible = true,
  children
}: InfoSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = collapsible ? open : true

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        {collapsible ? (
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 flex-1 text-left"
            onClick={() => setOpen(!open)}
          >
            <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            {icon && (
              <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">{icon}</span>
            )}
            <Kicker className="flex-1">{title}</Kicker>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 flex-1 text-left">
            {icon && (
              <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">{icon}</span>
            )}
            <Kicker className="flex-1">{title}</Kicker>
          </div>
        )}
        {badge ? <div className="px-4 py-2.5">{badge}</div> : null}
      </div>
      {isOpen && (
        <div className="px-4 py-3 bg-white dark:bg-slate-800/30">
          {children}
        </div>
      )}
    </div>
  )
}

export function InfoRow({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="text-slate-500 dark:text-slate-400 flex-shrink-0 min-w-[100px]">{label}</span>
      <span className={`text-slate-800 dark:text-slate-200 text-right break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  )
}
