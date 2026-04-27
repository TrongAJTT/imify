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
    <div className={`flex min-h-[60vh] w-full items-center justify-center px-4 py-6 ${className}`}>
      <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
        <div className="mb-4 p-3 text-sky-500">
          <AnimatingSpinner size={22} />
        </div>
        <Heading className="text-base font-semibold">{title}</Heading>
        <MutedText className="mt-1.5">{subtitle}</MutedText>
      </div>
    </div>
  )
}

