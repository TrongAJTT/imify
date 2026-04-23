import { X } from "lucide-react"
import { Heading } from "./typography"

interface DialogWrapperProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidthClassName?: string
}

export function DialogWrapper({
  title,
  onClose,
  children,
  maxWidthClassName = "max-w-2xl"
}: DialogWrapperProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4">
      <div
        className={`w-full ${maxWidthClassName} max-h-[min(92vh,980px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900`}
      >
        <div className="mb-3 flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <Heading className="text-base font-semibold">{title}</Heading>
          <button
            aria-label="Close dialog"
            className="rounded border border-slate-300 p-1.5 text-slate-700 dark:border-slate-600 dark:text-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[calc(min(92vh,980px)-60px)] overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}
