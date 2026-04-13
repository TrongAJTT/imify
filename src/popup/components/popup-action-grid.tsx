import type { ReactNode } from "react"
import { PanelRightOpen, ScanSearch, Settings2 } from "lucide-react"

import { Button } from "@/options/components/ui/button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Kicker, MutedText } from "@/options/components/ui/typography"

interface PopupActionGridProps {
  isScanRunning: boolean
  onRunScan: () => void
  onOpenSidePanel: () => void
  onOpenSettings: () => void
}

function ActionButton({
  title,
  description,
  icon,
  disabled,
  onClick
}: {
  title: string
  description: string
  icon: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="secondary"
      className="h-auto w-full items-start justify-start rounded-xl p-3 text-left"
      disabled={disabled}
      onClick={onClick}
    >
      <div className="mt-0.5 text-slate-500 dark:text-slate-300">{icon}</div>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="text-xs leading-4 text-slate-500 dark:text-slate-400">{description}</div>
      </div>
    </Button>
  )
}

export function PopupActionGrid({
  isScanRunning,
  onRunScan,
  onOpenSidePanel,
  onOpenSettings
}: PopupActionGridProps) {
  return (
    <SurfaceCard className="space-y-3 p-4" tone="soft">
      <div className="space-y-1">
        <Kicker>Extension Actions</Kicker>
        <MutedText className="text-xs">Run diagnostics without leaving the current page.</MutedText>
      </div>

      <div className="space-y-2.5">
        <ActionButton
          title="Page Scanner / SEO Audit"
          description="Analyze image SEO and payload opportunities on the active page."
          icon={<ScanSearch size={17} />}
          disabled={isScanRunning}
          onClick={onRunScan}
        />

        <ActionButton
          title="Side Panel Lite Inspector"
          description="Open a compact inspector while keeping your current tab visible."
          icon={<PanelRightOpen size={17} />}
          onClick={onOpenSidePanel}
        />

        <ActionButton
          title="Feature List / Settings"
          description="Open the full Imify workspace and configuration panels."
          icon={<Settings2 size={17} />}
          onClick={onOpenSettings}
        />
      </div>
    </SurfaceCard>
  )
}
