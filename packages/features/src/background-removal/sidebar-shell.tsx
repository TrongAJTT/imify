import React from "react"
import { useBackgroundRemoverStore } from "@imify/stores"
import { BackgroundRemoverSidebar } from "./sidebar"
import { SidebarPanel, BodyText, MutedText } from "@imify/ui"
import { Info, Eraser } from "lucide-react"

export function BackgroundRemoverSidebarShell() {
  const hasImage = useBackgroundRemoverStore((s) => s.hasImage)

  if (!hasImage) {
    return (
      <SidebarPanel title="ABOUT THIS TOOL">
        <div className="p-4 space-y-4">
          <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500">
            <Eraser size={24} />
          </div>
          <div className="space-y-2">
            <BodyText className="font-bold">Background Remover</BodyText>
            <MutedText className="text-xs leading-relaxed">
              Isolate subjects from their background instantly using state-of-the-art AI that runs entirely on your device.
            </MutedText>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex gap-3">
            <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <MutedText className="text-[10px] leading-tight">
              Model files are cached after first download for fast, offline processing.
            </MutedText>
          </div>
        </div>
      </SidebarPanel>
    )
  }

  return <BackgroundRemoverSidebar />
}
