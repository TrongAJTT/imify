import { MapPin, ExternalLink } from "lucide-react"
import type { GpsInfo } from "@/features/inspector"
import { InfoSection, InfoRow } from "./info-section"

interface GpsCardProps {
  gps: GpsInfo
}

function MiniMap({ lat, lon }: { lat: number; lon: number }) {
  const svgWidth = 320
  const svgHeight = 160

  const lonToX = (lng: number) => ((lng + 180) / 360) * svgWidth
  const latToY = (lt: number) => {
    const latRad = (lt * Math.PI) / 180
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
    return svgHeight / 2 - (mercN / Math.PI) * (svgHeight / 2)
  }

  const x = lonToX(lon)
  const y = latToY(lat)

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50"
      style={{ maxHeight: 160 }}
    >
      {/* Simplified world outline */}
      <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="none" />

      {/* Grid lines */}
      {[-60, -30, 0, 30, 60].map((lt) => (
        <line
          key={`lat-${lt}`}
          x1="0"
          y1={latToY(lt)}
          x2={svgWidth}
          y2={latToY(lt)}
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="0.5"
          strokeDasharray="4,4"
        />
      ))}
      {[-120, -60, 0, 60, 120].map((lng) => (
        <line
          key={`lon-${lng}`}
          x1={lonToX(lng)}
          y1="0"
          x2={lonToX(lng)}
          y2={svgHeight}
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="0.5"
          strokeDasharray="4,4"
        />
      ))}

      {/* Equator */}
      <line
        x1="0"
        y1={latToY(0)}
        x2={svgWidth}
        y2={latToY(0)}
        className="stroke-slate-300 dark:stroke-slate-600"
        strokeWidth="0.8"
      />
      {/* Prime meridian */}
      <line
        x1={lonToX(0)}
        y1="0"
        x2={lonToX(0)}
        y2={svgHeight}
        className="stroke-slate-300 dark:stroke-slate-600"
        strokeWidth="0.8"
      />

      {/* Location pin */}
      <circle
        cx={x}
        cy={y}
        r="16"
        className="fill-red-500/15"
      />
      <circle
        cx={x}
        cy={y}
        r="5"
        className="fill-red-500 stroke-white dark:stroke-slate-900"
        strokeWidth="2"
      />

      {/* Coordinate labels */}
      <text
        x={svgWidth - 4}
        y={svgHeight - 4}
        textAnchor="end"
        className="fill-slate-400 dark:fill-slate-500"
        fontSize="8"
        fontFamily="monospace"
      >
        {lat.toFixed(4)}, {lon.toFixed(4)}
      </text>
    </svg>
  )
}

export function GpsCard({ gps }: GpsCardProps) {
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

      <MiniMap lat={gps.latitude} lon={gps.longitude} />

      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/50">
        <InfoRow label="Latitude" value={gps.latitudeDms} mono />
        <InfoRow label="Longitude" value={gps.longitudeDms} mono />
        <InfoRow label="Decimal" value={`${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`} mono />
        {gps.altitude !== null && (
          <InfoRow label="Altitude" value={`${gps.altitude.toFixed(1)} m`} />
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
        >
          <ExternalLink size={12} />
          View on OpenStreetMap
        </a>
      </div>
    </InfoSection>
  )
}
