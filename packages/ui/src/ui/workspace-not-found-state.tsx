import React from "react"
import type { ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Heading, MutedText } from "./typography"

interface WorkspaceNotFoundStateProps {
  title?: string
  message: string
  action?: ReactNode
  className?: string
}

export function WorkspaceNotFoundState({
  title = "Not found",
  message,
  action,
  className = ""
}: WorkspaceNotFoundStateProps) {
  return (
    <div className={`p-6 ${className}`}>
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mb-4 rounded-full border border-rose-200 bg-rose-50 p-3 text-rose-500 shadow-sm dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-400">
          <AlertCircle size={20} />
        </div>
        <Heading className="text-base font-semibold">{title}</Heading>
        <MutedText className="mt-1.5">{message}</MutedText>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  )
}

