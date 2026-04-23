import { HelpCircle } from "lucide-react"
import type { ReactNode } from "react"

import { ControlledPopover } from "./controlled-popover"

interface InfoPopoverProps {
  label: string
  children: ReactNode
  iconClassName?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function InfoPopover({
  label,
  children,
  iconClassName,
  side = "top",
  align = "center"
}: InfoPopoverProps) {
  return (
    <ControlledPopover
      trigger={
        <span className="inline-flex items-center justify-center">
          <HelpCircle
            size={12}
            className={
              iconClassName ??
              "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help"
            }
          />
        </span>
      }
      preset="tooltip"
      behavior="hybrid"
      side={side}
      align={align}
      contentClassName="z-[9999] w-[min(560px,90vw)] rounded-lg border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-black/95"
    >
      <div className="mb-1 px-1 text-[11px] font-semibold text-slate-600 dark:text-slate-200">{label}</div>
      {children}
    </ControlledPopover>
  )
}
