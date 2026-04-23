import { Palette, AlertTriangle } from "lucide-react"
import type { ColorInfo } from "@imify/features/inspector"
import { InfoSection, InfoRow } from "./info-section"

interface ColorInfoCardProps {
  color: ColorInfo
}

export function ColorInfoCard({ color }: ColorInfoCardProps) {
  return (
    <InfoSection title="COLOR INFORMATION" icon={<Palette size={13} />}>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        <InfoRow label="Color Space" value={color.colorSpace} />
        {color.bitDepth !== null && <InfoRow label="Bit Depth" value={`${color.bitDepth}-bit`} />}
        {color.chromaSubsampling && <InfoRow label="Subsampling" value={color.chromaSubsampling} />}
        <InfoRow label="Alpha Channel" value={color.hasAlpha ? "Yes" : "No"} />
        {color.iccProfileName && <InfoRow label="ICC Profile" value={color.iccProfileName} />}
      </div>
      {color.iccWarning && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-amber-700 dark:text-amber-300">{color.iccWarning}</span>
        </div>
      )}
    </InfoSection>
  )
}
