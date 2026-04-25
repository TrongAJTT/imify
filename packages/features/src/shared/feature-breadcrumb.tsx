import React from "react"
import { ChevronRight } from "lucide-react"
import {
  getWorkspaceToolLabel,
  renderWorkspaceToolIcon,
  type WorkspaceToolDefinition
} from "../workspace-shell/workspace-tools"

interface FeatureBreadcrumbProps {
  rootLabel?: string
  rootToolId?: WorkspaceToolDefinition["id"]
  middleLabel?: string | null
  activeLabel?: string | null
  compact?: boolean
  onRootClick?: () => void
  onMiddleClick?: () => void
}

export function FeatureBreadcrumb({
  rootLabel,
  rootToolId,
  middleLabel = null,
  activeLabel = null,
  compact = false,
  onRootClick,
  onMiddleClick
}: FeatureBreadcrumbProps) {
  const rootLabelClass = compact ? "max-w-[160px]" : "max-w-[220px]"
  const labelClass = compact ? "max-w-[100px]" : "max-w-[180px]"
  const rootIcon = rootToolId ? renderWorkspaceToolIcon(rootToolId, compact ? 14 : 13) : null
  const resolvedRootLabel = rootLabel ?? (rootToolId ? getWorkspaceToolLabel(rootToolId) : null) ?? "Workspace"

  return (
    <nav
      className={`flex items-center gap-1 text-slate-500 dark:text-slate-400 ${
        compact ? "text-sm" : "text-xs mb-4"
      }`}
    >
      <button
        type="button"
        onClick={onRootClick}
        disabled={!onRootClick}
        className={`inline-flex min-w-0 items-center gap-1.5 font-medium transition-colors ${
          onRootClick
            ? "hover:text-sky-600 dark:hover:text-sky-400"
            : "cursor-default"
        } ${rootLabelClass}`}
      >
        {rootIcon ? <span className="shrink-0">{rootIcon}</span> : null}
        <span className="truncate">{resolvedRootLabel}</span>
      </button>

      {middleLabel ? (
        <>
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
          <button
            type="button"
            onClick={onMiddleClick}
            disabled={!onMiddleClick}
            className={`font-medium text-slate-700 dark:text-slate-300 transition-colors ${labelClass} truncate ${
              onMiddleClick
                ? "hover:text-sky-600 dark:hover:text-sky-400"
                : "cursor-default"
            }`}
          >
            {middleLabel}
          </button>
        </>
      ) : null}

      {activeLabel ? (
        <>
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
          <span className={`font-medium text-slate-700 dark:text-slate-300 ${labelClass} truncate`}>
            {activeLabel}
          </span>
        </>
      ) : null}
    </nav>
  )
}

