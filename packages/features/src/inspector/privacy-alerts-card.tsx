import React from "react"
import { AlertCircle, AlertTriangle, Info, Shield } from "lucide-react"
import { type PrivacyAlert } from "./types"
import { InfoSection } from "./info-section"
import { useTranslation } from "@imify/i18n"

const SEVERITY_STYLES = {
  critical: { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-300", icon: <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-500" /> },
  warning: { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", icon: <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" /> },
  info: { bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-200 dark:border-sky-800", text: "text-sky-700 dark:text-sky-300", icon: <Info size={14} className="mt-0.5 flex-shrink-0 text-sky-500" /> }
} as const

export function PrivacyAlertsCard({ alerts, onNukeExif, isNuking }: { alerts: PrivacyAlert[]; onNukeExif: () => void; isNuking: boolean }) {
  const { t } = useTranslation("inspector")
  if (alerts.length === 0) return null

  const getLocalizedAlert = (alert: PrivacyAlert) => {
    if (alert.title === "GPS Location Embedded") {
      const match = alert.description.match(/\(([^)]+)\)/)
      const coords = match ? match[1] : ""
      const [lat, lng] = coords.split(",").map(c => c.trim())
      return {
        title: t("alerts.gpsLocationEmbedded"),
        description: t("alerts.gpsLocationEmbeddedDesc", { lat, lng })
      }
    }
    if (alert.title === "Camera Identity Exposed") {
      const info = alert.description.replace("Device info found: ", "")
      return {
        title: t("alerts.cameraIdentityExposed"),
        description: t("alerts.cameraIdentityExposedDesc", { info })
      }
    }
    if (alert.title === "Personal Information Found") {
      const info = alert.description.replace("Owner data: ", "")
      return {
        title: t("alerts.personalInformationFound"),
        description: t("alerts.personalInformationFoundDesc", { info })
      }
    }
    if (alert.title === "AI-Generated Content Detected") {
      const match = alert.description.match(/"([^"]+)"\s*suggests.*?\(([^)]+)\)/)
      const software = match ? match[1] : ""
      const sig = match ? match[2] : ""
      return {
        title: t("alerts.aiGeneratedContentDetected"),
        description: t("alerts.aiGeneratedContentDetectedDesc", { software, sig })
      }
    }
    if (alert.title === "Software Signature Found") {
      const match = alert.description.match(/"([^"]+)"/)
      const software = match ? match[1] : ""
      return {
        title: t("alerts.softwareSignatureFound"),
        description: t("alerts.softwareSignatureFoundDesc", { software })
      }
    }
    return { title: alert.title, description: alert.description }
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  return (
    <InfoSection title={t("privacySecurity")} icon={<Shield size={13} />} badge={criticalCount > 0 ? <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/40 dark:text-red-400">{t("criticalBadge", { count: criticalCount })}</span> : null}>
      <div className="flex flex-col gap-2">
        {alerts.map((alert, i) => {
          const style = SEVERITY_STYLES[alert.severity]
          const localized = getLocalizedAlert(alert)
          return <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${style.bg} ${style.border}`}>{style.icon}<div className="min-w-0 flex-1"><div className={`text-xs font-semibold ${style.text}`}>{localized.title}</div><div className={`mt-0.5 text-[11px] ${style.text} opacity-80`}>{localized.description}</div></div></div>
        })}
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700/50">
        <button type="button" onClick={onNukeExif} disabled={isNuking} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"><Shield size={12} />{isNuking ? t("cleaning") : t("removeMetadataDownload")}</button>
      </div>
    </InfoSection>
  )
}
