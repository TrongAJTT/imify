import { SlidersHorizontal } from "lucide-react"
import { BodyText } from "@imify/ui/ui/typography"

export function FormatOptionsEmptyState() {
  return (
    <div className="p-3 flex flex-1 flex-col items-center justify-center text-center">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <SlidersHorizontal size={14} />
      </div>
      <BodyText className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        No extra options
      </BodyText>
    </div>
  )
}
