"use client"

import Link from "next/link"
import { Moon, Sun } from "lucide-react"
import { useWebDarkMode } from "@/hooks/use-web-dark-mode"

const NAV_LINKS = [
  { href: "/single-processor", label: "Single" },
  { href: "/batch-processor", label: "Batch" },
  { href: "/splicing", label: "Splicing" },
  { href: "/splitter", label: "Splitter" },
  { href: "/pattern-generator", label: "Pattern" },
  { href: "/filling", label: "Filling" },
  { href: "/diffchecker", label: "Diffchecker" },
  { href: "/inspector", label: "Inspector" }
]

export function WebHeader() {
  const { isDark, toggleDarkMode } = useWebDarkMode()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Imify Web
        </Link>
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
      <div className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
