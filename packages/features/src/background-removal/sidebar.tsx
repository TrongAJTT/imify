import React from "react"
import { WorkspaceConfigSidebarPanel, type WorkspaceConfigSidebarItem, BodyText, MutedText } from "@imify/ui"
import { Brain, Sliders, Image } from "lucide-react"
import { useBackgroundRemoverStore } from "@imify/stores"

export const BACKGROUND_REMOVER_SIDEBAR_PANEL_ID = "bg-remover-settings"

export function BackgroundRemoverSidebar() {
  const modelId = useBackgroundRemoverStore((s) => s.modelId)
  const edgeSmoothing = useBackgroundRemoverStore((s) => s.edgeSmoothing)
  const outputFormat = useBackgroundRemoverStore((s) => s.outputFormat)

  const setModelId = useBackgroundRemoverStore((s) => s.setModelId)
  const setEdgeSmoothing = useBackgroundRemoverStore((s) => s.setEdgeSmoothing)
  const setOutputFormat = useBackgroundRemoverStore((s) => s.setOutputFormat)
  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "ai-engine",
      label: "AI Engine",
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Brain size={14} />
              <BodyText className="text-xs font-semibold">AI Model</BodyText>
            </div>
            <select 
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
            >
              <option value="briaai/RMBG-1.4">RMBG v1.4 (Recommended)</option>
            </select>
            <MutedText className="text-[10px]">
              Fast and lightweight model optimized for general subjects.
            </MutedText>
          </div>
        </div>
      )
    },
    {
      id: "refinement",
      label: "Refinement",
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Sliders size={14} />
                <BodyText className="text-xs font-semibold">Edge Smoothing</BodyText>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {edgeSmoothing}px
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="20"
              step="1"
              value={edgeSmoothing}
              onChange={(e) => setEdgeSmoothing(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <MutedText className="text-[10px]">
              Softens the edges of the isolated subject.
            </MutedText>
          </div>
        </div>
      )
    },
    {
      id: "output",
      label: "Output",
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Image size={14} />
              <BodyText className="text-xs font-semibold">Background Type</BodyText>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOutputFormat("transparent")}
                className={`px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                  outputFormat === "transparent"
                    ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                Transparent
              </button>
              <button
                onClick={() => setOutputFormat("color")}
                className={`px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                  outputFormat === "color"
                    ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                Solid Color
              </button>
            </div>
          </div>
        </div>
      )
    }
  ]

  return <WorkspaceConfigSidebarPanel title="REMOVER SETTINGS" items={sidebarItems} />
}
