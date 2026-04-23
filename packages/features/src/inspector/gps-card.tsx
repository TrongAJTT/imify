import { ExternalLink, MapPin } from "lucide-react"
import { type GpsInfo } from "./types"
import { InfoRow, InfoSection } from "./info-section"

export function GpsCard({ gps }: { gps: GpsInfo }) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`
  const osmUrl = `https://www.openstreetmap.org/?mlat=${gps.latitude}&mlon=${gps.longitude}#map=15/${gps.latitude}/${gps.longitude}`
  return (
    <InfoSection title="GPS LOCATION" icon={<MapPin size={13} />}>
      <div className="mb-3 overflow-hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-red-500" /><span className="text-xs font-medium text-red-700 dark:text-red-300">This image contains an exact GPS location. Remove metadata before sharing publicly.</span></div>
      </div>
      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/50">
        <InfoRow label="Latitude" value={gps.latitudeDms} mono />
        <InfoRow label="Longitude" value={gps.longitudeDms} mono />
        <InfoRow label="Decimal" value={`${gps.latitude.toFixed(6)},${gps.longitude.toFixed(6)}`} mono />
        {gps.altitude !== null ? <InfoRow label="Altitude" value={`${gps.altitude.toFixed(1)} m`} /> : null}
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700/50">
        <div className="flex flex-wrap items-center gap-3">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-sky-600 transition-colors hover:bg-slate-100 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-sky-400 dark:hover:bg-slate-800 dark:hover:text-sky-300"><ExternalLink size={12} />View on Google Maps</a>
          <a href={osmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-sky-600 transition-colors hover:bg-slate-100 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-sky-400 dark:hover:bg-slate-800 dark:hover:text-sky-300"><ExternalLink size={12} />View on OpenStreetMap</a>
        </div>
      </div>
    </InfoSection>
  )
}
