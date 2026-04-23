import { Kicker, MutedText } from "./typography"

interface SettingsItemHeaderProps {
  title: string
  description: string
}

export function SettingsItemHeader({
  title,
  description
}: SettingsItemHeaderProps) {
  return (
    <div>
      <Kicker className="mb-1 uppercase">{title}</Kicker>
      <MutedText className="text-sm">{description}</MutedText>
    </div>
  )
}
