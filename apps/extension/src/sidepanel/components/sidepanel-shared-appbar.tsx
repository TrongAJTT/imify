import { Check, ChevronDown, Expand, Moon, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@imify/ui/ui/button"
import { MutedText, Subheading } from "@imify/ui/ui/typography"

import iconImage from "url:@assets/icon.png"

export type SidepanelView = "inspector" | "audit"

interface SidepanelSharedAppbarProps {
  isDark: boolean
  onToggleDarkMode: () => void
  onOpenOptions: () => void
  activeView: SidepanelView
  onSwitchView: (view: SidepanelView) => void
  title: string
  subtitle: string
}

export function SidepanelSharedAppbar({
  isDark,
  onToggleDarkMode,
  onOpenOptions,
  activeView,
  onSwitchView,
  title,
  subtitle
}: SidepanelSharedAppbarProps) {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isViewMenuOpen) {
      return
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsViewMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleDocumentClick)
    return () => document.removeEventListener("mousedown", handleDocumentClick)
  }, [isViewMenuOpen])

  return (
    <header className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={iconImage}
            alt="Imify"
            className="h-8 w-8 rounded-lg shadow-sm"
          />
          <div className="relative min-w-0" ref={menuRef}>
            <div className="flex items-center gap-1.5">
              <Subheading className="truncate text-sm leading-5">{title}</Subheading>
              <button
                type="button"
                onClick={() => setIsViewMenuOpen((current) => !current)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Change sidepanel view"
              >
                <ChevronDown size={13} />
              </button>
            </div>
            <MutedText className="truncate text-[11px]">{subtitle}</MutedText>

            {isViewMenuOpen ? (
              <div className="absolute z-10 mt-1 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    onSwitchView("inspector")
                    setIsViewMenuOpen(false)
                  }}
                >
                  Lite Inspector
                  {activeView === "inspector" ? <Check size={12} /> : null}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    onSwitchView("audit")
                    setIsViewMenuOpen(false)
                  }}
                >
                  SEO Audit
                  {activeView === "audit" ? <Check size={12} /> : null}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleDarkMode}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onOpenOptions}
            title="Open full feature list"
            aria-label="Open full feature list"
          >
            <Expand size={15} />
          </Button>
        </div>
      </div>
    </header>
  )
}

