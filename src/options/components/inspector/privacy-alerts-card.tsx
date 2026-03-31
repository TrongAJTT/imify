import { Shield, AlertTriangle, AlertCircle, Info } from "lucide-react"
import type { PrivacyAlert } from "@/features/inspector"
import { InfoSection } from "./info-section"

interface PrivacyAlertsCardProps {
  alerts: PrivacyAlert[]
  onNukeExif: () => void
  isNuking: boolean
}

const SEVERITY_STYLES = {
  critical: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
  },
  info: {
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-300",
    icon: <Info size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
  }
}

export function PrivacyAlertsCard({ alerts, onNukeExif, isNuking }: PrivacyAlertsCardProps) {
  if (alerts.length === 0) return null

  const criticalCount = alerts.filter((a) => a.severity === "critical").length

  const badge = criticalCount > 0 ? (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
      {criticalCount} critical
    </span>
  ) : null

  return (
    <InfoSection title="PRIVACY & SECURITY" icon={<Shield size={13} />} badge={badge}>
      <div className="flex flex-col gap-2">
        {alerts.map((alert, i) => {
          const style = SEVERITY_STYLES[alert.severity]
          return (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-lg ${style.bg} border ${style.border} px-3 py-2`}
            >
              {style.icon}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold ${style.text}`}>{alert.title}</div>
                <div className={`text-[11px] mt-0.5 ${style.text} opacity-80`}>{alert.description}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <button
          type="button"
          onClick={onNukeExif}
          disabled={isNuking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shield size={12} />
          {isNuking ? "Cleaning..." : "Remove All Metadata & Download"}
        </button>
        <span className="block mt-1 text-[10px] text-slate-400 dark:text-slate-500">
          Re-encodes the image without any EXIF, GPS, or ICC data.
        </span>
      </div>
    </InfoSection>
  )
}
