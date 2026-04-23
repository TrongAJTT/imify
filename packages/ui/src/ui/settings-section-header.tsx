import { Kicker, MutedText } from "./typography"

interface SettingsSectionHeaderProps {
  title: string
  description: string
}

export function SettingsSectionHeader({
  title,
  description
}: SettingsSectionHeaderProps) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
        {title}
      </h2>
      <MutedText>{description}</MutedText>
    </div>
  )
}
