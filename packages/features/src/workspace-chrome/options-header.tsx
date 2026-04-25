"use client"

import React from "react"
import { Heart, Info, Moon, Settings, Sun } from "lucide-react"
import { Tooltip } from "../shared/tooltip"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"

export interface WorkspaceHeaderNavItem {
  href: string
  label: string
}

interface WorkspaceOptionsHeaderProps {
  isLoading: boolean
  isDark: boolean
  logoSrc?: string
  title?: string
  subtitle?: string
  navItems?: WorkspaceHeaderNavItem[]
  activeNavHref?: string | null
  onNavigate?: (href: string) => void
  onToggleDark: () => void
  onOpenAbout: () => void
  onOpenSettings: () => void
  onOpenDonate: () => void
}

function TitleBarButton({
  children,
  onClick,
  tooltipText,
  isDonate = false,
  className = "",
  label
}: {
  children: React.ReactNode
  onClick: () => void
  tooltipText: string
  isDonate?: boolean
  className?: string
  label?: string
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={`${label ? "px-3" : "w-9"} h-9 flex items-center justify-center gap-2 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${isDonate ? "text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300" : ""} ${className}`}
    >
      {children}
      {label ? <span className="text-xs font-bold">{label}</span> : null}
    </button>
  )

  return <Tooltip content={tooltipText}>{button}</Tooltip>
}

export function WorkspaceOptionsHeader({
  isLoading,
  isDark,
  logoSrc,
  title = "Imify",
  subtitle = "Save and Process Images",
  navItems,
  activeNavHref = null,
  onNavigate,
  onToggleDark,
  onOpenAbout,
  onOpenSettings,
  onOpenDonate
}: WorkspaceOptionsHeaderProps) {
  const breadcrumb = useWorkspaceHeaderStore((s) => s.breadcrumb)

  return (
    <header className="h-12 flex items-center justify-between px-4 gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {logoSrc ? (
          <img src={logoSrc} alt="Imify" className="w-6 h-6 rounded shrink-0" />
        ) : null}
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">{title}</span>
        <span className="text-slate-300 dark:text-slate-700 shrink-0 select-none">|</span>
        <span className="text-sm text-slate-500 dark:text-slate-400 truncate hidden sm:block">{subtitle}</span>
        {navItems?.length ? (
          <div className="hidden lg:flex items-center gap-1 pl-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => onNavigate?.(item.href)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeNavHref === item.href
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {breadcrumb ? (
          <>
            <span className="text-slate-300 dark:text-slate-700 shrink-0 select-none">|</span>
            <div className="min-w-0 hidden lg:flex items-center">{breadcrumb}</div>
          </>
        ) : null}
        {isLoading ? (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse shrink-0">Loading...</span>
        ) : null}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <TitleBarButton
          onClick={onToggleDark}
          tooltipText={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </TitleBarButton>
        <TitleBarButton onClick={onOpenAbout} tooltipText="About Imify">
          <Info size={18} />
        </TitleBarButton>
        <TitleBarButton onClick={onOpenSettings} tooltipText="Settings">
          <Settings size={18} />
        </TitleBarButton>
        <TitleBarButton
          onClick={onOpenDonate}
          tooltipText="Support the dev"
          isDonate
          label="Donate"
        >
          <Heart size={16} fill="red" stroke="red" />
        </TitleBarButton>
      </div>
    </header>
  )
}
