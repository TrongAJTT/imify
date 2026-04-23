import React from "react"
import { SidebarPanel } from "@imify/ui/ui/sidebar-panel"
import { MutedText } from "@imify/ui/ui/typography"
import { Globe, Layers, LayoutTemplate } from "lucide-react"

export function ContextMenuInfoPanel() {
  return (
    <SidebarPanel title="INFORMATION">
      <div className="space-y-6">
        <MutedText className="text-sm leading-relaxed">
          Customize how your context menu looks and behaves. Use these settings to optimize your workflow.
        </MutedText>

        <div className="space-y-5">
          {/* Global Formats */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <Globe size={16} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Global Formats
              </div>
              <MutedText className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Enable each built-in card, then configure its dedicated Export Format & Quality accordion. JPG can switch between JPG and MozJPEG while other cards keep a focused single-target flow.
              </MutedText>
            </div>
          </div>

          {/* Custom Presets */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Layers size={16} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Custom Presets
              </div>
              <MutedText className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Build reusable presets with standardized Target Format and Advanced controls, including AVIF and MozJPEG tuning aligned with Single and Batch processors.
              </MutedText>
            </div>
          </div>

          {/* Menu Preview */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <LayoutTemplate size={16} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Preview & Sorting
              </div>
              <MutedText className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Choose how entries are sorted and preview how the menu will look in the browser.
              </MutedText>
            </div>
          </div>
        </div>
      </div>
    </SidebarPanel>
  )
}
