"use client"

import React from "react"
import { ChevronDown, Heart, Info, Moon, Settings, Sun } from "lucide-react"
import { Tooltip } from "../shared/tooltip"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"

export interface WorkspaceHeaderNavItem {
  href: string
  label: string
  icon?: React.ReactNode
}

export interface WorkspaceHeaderToolsGroup {
  title: string
  items: WorkspaceHeaderNavItem[]
}

interface WorkspaceOptionsHeaderProps {
  isLoading: boolean
  isDark: boolean
  title?: string
  subtitle?: string
  navItems?: WorkspaceHeaderNavItem[]
  toolsMenuGroups?: WorkspaceHeaderToolsGroup[]
  toolsMenuLabel?: string
  activeNavHref?: string | null
  onNavigateHome?: () => void
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
      className={`${label ? "px-3" : "w-9"} h-9 flex items-center justify-center gap-2 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors ${isDonate ? "border border-rose-200 text-rose-500 dark:border-rose-700/70 dark:text-rose-400 hover:border-rose-300 dark:hover:border-rose-600 hover:text-rose-600 dark:hover:text-rose-300" : ""} ${className}`}
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
  title = "Imify",
  subtitle = "Powerful Image Toolkit",
  navItems,
  toolsMenuGroups,
  toolsMenuLabel = "All Tools",
  activeNavHref = null,
  onNavigateHome,
  onNavigate,
  onToggleDark,
  onOpenAbout,
  onOpenSettings,
  onOpenDonate
}: WorkspaceOptionsHeaderProps) {
  const breadcrumb = useWorkspaceHeaderStore((s) => s.breadcrumb)
  const logoSrc = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.imifyLogoPng)
  const [isToolsMenuOpen, setIsToolsMenuOpen] = React.useState(false)
  const closeToolsMenuTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasToolsMenu = Boolean(toolsMenuGroups?.length)

  const clearCloseToolsMenuTimer = React.useCallback(() => {
    if (!closeToolsMenuTimerRef.current) return
    clearTimeout(closeToolsMenuTimerRef.current)
    closeToolsMenuTimerRef.current = null
  }, [])

  const openToolsMenu = React.useCallback(() => {
    clearCloseToolsMenuTimer()
    setIsToolsMenuOpen(true)
  }, [clearCloseToolsMenuTimer])

  const scheduleCloseToolsMenu = React.useCallback(() => {
    clearCloseToolsMenuTimer()
    closeToolsMenuTimerRef.current = setTimeout(() => {
      setIsToolsMenuOpen(false)
      closeToolsMenuTimerRef.current = null
    }, 120)
  }, [clearCloseToolsMenuTimer])

  React.useEffect(() => {
    return () => {
      clearCloseToolsMenuTimer()
    }
  }, [clearCloseToolsMenuTimer])

  return (
    <header className="h-14 flex items-center justify-between px-4 gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex items-center gap-6 min-w-0">
        {onNavigateHome ? (
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 min-w-0 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Go to landing page"
          >
            {logoSrc ? (
              <img src={logoSrc} alt="Imify" className="w-7 h-7 rounded shrink-0" />
            ) : null}
            <div className="min-w-0 text-left">
              <div className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">{title}</div>
              <div className="text-[11px] leading-tight text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {subtitle}
              </div>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            {logoSrc ? (
              <img src={logoSrc} alt="Imify" className="w-7 h-7 rounded shrink-0" />
            ) : null}
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">{title}</div>
              <div className="text-[11px] leading-tight text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {subtitle}
              </div>
            </div>
          </div>
        )}
        {navItems?.length ? (
          <div className="hidden lg:flex items-center gap-1 pl-2">
            <span className="text-slate-300 dark:text-slate-700 shrink-0 select-none">|</span>
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
        {hasToolsMenu ? (
          <div
            className="relative hidden lg:block"
            onMouseEnter={openToolsMenu}
            onMouseLeave={scheduleCloseToolsMenu}
          >
            <button
              type="button"
              onClick={() => {
                clearCloseToolsMenuTimer()
                setIsToolsMenuOpen((prev) => !prev)
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sky-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-sky-50 dark:border-sky-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {toolsMenuLabel}
              <ChevronDown size={13} className={`transition-transform ${isToolsMenuOpen ? "rotate-180" : ""}`} />
            </button>
            <div className="absolute left-0 top-full h-3 w-full" />
            {isToolsMenuOpen ? (
              <div className="absolute left-0 top-[calc(100%+10px)] z-30 min-w-[700px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="grid grid-cols-3 gap-5">
                  {toolsMenuGroups?.map((group) => (
                    <div key={group.title} className="space-y-2">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{group.title}</div>
                      <div className="space-y-1.5">
                        {group.items.map((item) => (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => {
                              onNavigate?.(item.href)
                              setIsToolsMenuOpen(false)
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                          >
                            <span className="flex h-5 w-5 items-center justify-center text-slate-400 dark:text-slate-500">
                              {item.icon ?? <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {breadcrumb ? <div className="min-w-0 hidden lg:flex items-center">{breadcrumb}</div> : null}
        {isLoading ? (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse shrink-0">Loading...</span>
        ) : null}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <TitleBarButton
          onClick={onOpenDonate}
          tooltipText="Support the dev"
          isDonate
          label="Donate"
        >
          <Heart size={16} fill="red" stroke="red" />
        </TitleBarButton>
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
      </div>
    </header>
  )
}
