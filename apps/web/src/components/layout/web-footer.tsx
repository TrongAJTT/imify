"use client"

import Link from "next/link"
import { getWorkspaceToolsMenuGroups } from "@imify/features/workspace-shell/workspace-tools"
import { IMIFY_LINKS } from "@imify/core"
import { useWebPageMode } from "@/hooks/use-web-page-mode"

const TOOL_GROUPS = getWorkspaceToolsMenuGroups()
const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.items)

export function WebFooter() {
  const { isMonolithicPage: isFullFooter } = useWebPageMode()

  if (!isFullFooter) {
    return (
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Imify Web</span>
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="hidden md:inline">Private & Powerful Client-Side Image Toolkit</span>
          </div>
          <div className="flex items-center gap-6">
            <p>© {new Date().getFullYear()} Imify by TrongAJTT</p>
            <div className="flex gap-4">
              <Link href={IMIFY_LINKS.terms} target="_blank" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</Link>
              <Link href={IMIFY_LINKS.privacy} target="_blank" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <span className="text-xl font-bold text-slate-900 dark:text-white">Imify</span>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              The powerful client-side image toolkit. Fast, private, and powerful image processing directly in your browser. No uploads, no waiting.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Tools</h3>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              {ALL_TOOLS.slice(0, 4).map(tool => (
                <li key={tool.id}>
                  <Link href={tool.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">More Features</h3>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              {ALL_TOOLS.slice(4, 8).map(tool => (
                <li key={tool.id}>
                  <Link href={tool.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Imify by TrongAJTT. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href={IMIFY_LINKS.privacy} target="_blank" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href={IMIFY_LINKS.terms} target="_blank" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
