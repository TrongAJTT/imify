import type { ReactNode } from "react"
import { PanelRightOpen, ScanSearch, Settings2 } from "lucide-react"

import { Button } from "@imify/ui/ui/button"
import { useTranslation } from "@imify/i18n"

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
      className="h-auto w-full min-w-0 items-start justify-start rounded-xl p-3 text-left"
      disabled={disabled}
      onClick={onClick}
    >
      <div className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-300">{icon}</div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words whitespace-normal">
          {title}
        </div>
        <div className="text-xs leading-4 text-slate-500 dark:text-slate-400 break-words whitespace-normal">
          {description}
        </div>
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
  const { t } = useTranslation("workspace")
  return (
    <div className="space-y-2.5 p-3">
      <ActionButton
        title={t("popup.actions.seoTitle", "Page Scanner / SEO Audit")}
        description={t("popup.actions.seoDesc", "Run SEO image diagnostics and open the snapshot in Side Panel SEO Audit Snapshot.")}
        icon={<ScanSearch size={17} />}
        disabled={isScanRunning}
        onClick={onRunScan}
      />

      <ActionButton
        title={t("popup.actions.inspectorTitle", "Side Panel Lite Inspector")}
        description={t("popup.actions.inspectorDesc", "Open compact image inspection tools while keeping your current tab visible.")}
        icon={<PanelRightOpen size={17} />}
        onClick={onOpenSidePanel}
      />

      <ActionButton
        title={t("popup.actions.settingsTitle", "Feature List / Settings")}
        description={t("popup.actions.settingsDesc", "Open the full Imify workspace and configuration panels.")}
        icon={<Settings2 size={17} />}
        onClick={onOpenSettings}
      />
    </div>
  )
}
