import React from "react"
import { AnimatingSpinner } from "../components/animating-spinner"
import { Heading, MutedText } from "./typography"

interface WorkspaceLoadingStateProps {
  title?: string
  subtitle?: string
  className?: string
}

export function WorkspaceLoadingState({
  title = "Loading workspace...",
  subtitle = "Restoring presets and syncing workspace state.",
  className = ""
}: WorkspaceLoadingStateProps) {
  return (
    <div className={`p-6 ${className}`}>
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mb-4 rounded-full border border-slate-200 bg-white p-3 text-sky-500 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <AnimatingSpinner size={22} />
        </div>
        <Heading className="text-base font-semibold">{title}</Heading>
        <MutedText className="mt-1.5">{subtitle}</MutedText>
      </div>
    </div>
  )
}

