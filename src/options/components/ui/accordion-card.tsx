import React, { useState } from "react"
import * as Collapsible from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"

type AccordionCardProps = {
  icon?: React.ReactNode
  label: string
  sublabel?: string
  disabled?: boolean
  className?: string
  defaultOpen?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/**
 * Accordion Card component that extends SidebarCard functionality
 * with collapsible content. When expanded, sublabel is hidden.
 */
export function AccordionCard({
  icon,
  label,
  sublabel,
  disabled,
  className,
  defaultOpen,
  isOpen: controlledOpen,
  onOpenChange,
  children
}: AccordionCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const isOpen = (controlledOpen ?? uncontrolledOpen) && !disabled
  const handleOpenChange = onOpenChange ?? setUncontrolledOpen

  return (
    <Collapsible.Root open={isOpen} onOpenChange={handleOpenChange} disabled={disabled}>
      <div className="border border-slate-200 rounded dark:border-slate-700 overflow-hidden">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`w-full text-left flex items-center gap-3 bg-white px-2.5 py-1.5 transition-all hover:shadow-sm hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-500/10 dark:hover:border-sky-500 cursor-pointer disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 ${className || ""}`}
          >
            {icon ? (
              <div className="shrink-0 flex items-center justify-center text-sky-600 dark:text-sky-400">
                {icon}
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-bold text-slate-700 dark:text-slate-300">{label}</div>
              {!isOpen && sublabel ? (
                <div className="truncate text-[10px] text-slate-400">{sublabel}</div>
              ) : null}
            </div>

            <div className="shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20">
          <div className="p-3">
            {children}
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  )
}

export default AccordionCard
