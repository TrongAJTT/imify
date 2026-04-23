import { MapPin, ExternalLink } from "lucide-react"
import type { GpsInfo } from "@imify/features/inspector"
import { InfoSection, InfoRow } from "./info-section"

interface GpsCardProps {
  gps: GpsInfo
}

export function GpsCard({ gps }: GpsCardProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`
  const osmUrl = `https://www.openstreetmap.org/?mlat=${gps.latitude}&mlon=${gps.longitude}#map=15/${gps.latitude}/${gps.longitude}`

  return (
    <InfoSection title="GPS LOCATION" icon={<MapPin size={13} />}>
      <div className="mb-3 rounded-lg overflow-hidden bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-red-700 dark:text-red-300 font-medium">
            This image contains an exact GPS location. Remove metadata before sharing publicly.
          </span>
        </div>
      </div>

      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/50">
        <InfoRow label="Latitude" value={gps.latitudeDms} mono />
        <InfoRow label="Longitude" value={gps.longitudeDms} mono />
        <InfoRow label="Decimal" value={`${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`} mono />
        {gps.altitude !== null && (
          <InfoRow label="Altitude" value={`${gps.altitude.toFixed(1)} m`} />
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            <ExternalLink size={12} />
            View on Google Maps
          </a>
          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            <ExternalLink size={12} />
            View on OpenStreetMap
          </a>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          External links will open the Internet and share coordinates with the selected map provider.
        </p>
      </div>
    </InfoSection>
  )
}
