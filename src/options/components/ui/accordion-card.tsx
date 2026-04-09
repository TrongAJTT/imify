import React, { useState } from "react"
import * as Collapsible from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"
import { useAccordionGroup } from "@/options/components/ui/accordion-group"
import { getThemeClasses, type ColorTheme } from "@/options/components/ui/theme-config"

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
  /** If true, accordion is always open and chevron is hidden */
  alwaysOpen?: boolean
  /** Unique ID for mutually exclusive accordion group */
  groupId?: string
  /** Color theme for semantic highlights based on SPECIFICATIONS.md */
  colorTheme?: ColorTheme
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
  children,
  alwaysOpen = false,
  groupId,
  colorTheme = "sky",
}: AccordionCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const groupContext = groupId ? useAccordionGroup() : null

  // Determine if this accordion should be open
  const isOpen = alwaysOpen
    ? true
    : groupContext
      ? groupContext.openId === groupId
      : (controlledOpen ?? uncontrolledOpen) && !disabled

  const handleOpenChange = (open: boolean) => {
    if (alwaysOpen) return // Don't allow closing if alwaysOpen

    if (groupContext && groupId) {
      // For grouped accordions, toggle the group's openId
      groupContext.setOpenId(open ? groupId : null)
    } else {
      // For non-grouped accordions, use uncontrolled or callback
      setUncontrolledOpen(open)
      onOpenChange?.(open)
    }
  }

  const isDisabled = disabled || alwaysOpen
  const theme = getThemeClasses(colorTheme)

  return (
    <Collapsible.Root open={isOpen} onOpenChange={handleOpenChange} disabled={isDisabled}>
      <div className={`rounded overflow-hidden transition-all duration-200 border border-l-2 ${
        isOpen
          ? `${theme.accordionOpenEdgeBorder} ${theme.accordionLeftBorder} shadow-sm`
          : `border-slate-200 dark:border-slate-700 ${theme.accordionLeftBorder}`
      }`}>
        <Collapsible.Trigger asChild>
          <button
            type="button"
            disabled={isDisabled}
            className={`w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 transition-all ${
              isOpen
                ? `${theme.activeBg} ${alwaysOpen ? "cursor-default" : "cursor-pointer"}`
                : alwaysOpen
                  ? `${theme.activeBg} cursor-default`
                  : `bg-white hover:shadow-sm dark:bg-slate-900/40 cursor-pointer`
            } disabled:opacity-50 ${className || ""}`}
          >
            {icon ? (
              <div className={`shrink-0 flex items-center justify-center ${theme.icon}`}>
                {icon}
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-bold text-slate-700 dark:text-slate-300">{label}</div>
              {!isOpen && sublabel ? (
                <div className="truncate text-[10px] text-slate-400">{sublabel}</div>
              ) : null}
            </div>

            {/* Only show chevron if not alwaysOpen */}
            {!alwaysOpen && (
              <div className="shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            )}
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content className={`overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up border-t ${
          isOpen
            ? `${theme.accordionContentBorder}`
            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20"
        }`}>
          <div className="p-3">
            {children}
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  )
}

export default AccordionCard
