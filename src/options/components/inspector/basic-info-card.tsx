import { FileImage, Ruler, Clock } from "lucide-react"
import type { BasicInfo, DimensionInfo, ResolutionInfo, TimeInfo } from "@/features/inspector"
import { formatFileSize } from "@/features/inspector"
import { InfoSection, InfoRow } from "./info-section"

interface BasicInfoCardProps {
  basic: BasicInfo
  dimensions: DimensionInfo
  resolution: ResolutionInfo | null
  time: TimeInfo
}

export function BasicInfoCard({ basic, dimensions, resolution, time }: BasicInfoCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <InfoSection title="FILE INFORMATION" icon={<FileImage size={13} />} collapsible={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          <InfoRow label="File Name" value={basic.fileName} />
          <InfoRow label="Format" value={basic.format} />
          <InfoRow label="MIME Type" value={basic.mimeType} mono />
          <InfoRow label="File Size" value={formatFileSize(basic.fileSize)} />
        </div>
      </InfoSection>

      <InfoSection title="DIMENSIONS" icon={<Ruler size={13} />} collapsible={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          <InfoRow label="Size" value={`${dimensions.width} x ${dimensions.height} px`} />
          <InfoRow label="Megapixels" value={`${dimensions.megapixels} MP`} />
          <InfoRow label="Aspect Ratio" value={dimensions.aspectRatio} />
          <InfoRow label="Orientation" value={dimensions.orientation.charAt(0).toUpperCase() + dimensions.orientation.slice(1)} />
          {resolution && (
            <>
              <InfoRow label="X Resolution" value={`${resolution.xDpi} ${resolution.unit}`} />
              <InfoRow label="Y Resolution" value={`${resolution.yDpi} ${resolution.unit}`} />
            </>
          )}
        </div>
        {dimensions.matchedStandards.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Matching Standards
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {dimensions.matchedStandards.map((std) => (
                <span
                  key={std}
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                >
                  {std}
                </span>
              ))}
            </div>
          </div>
        )}
      </InfoSection>

      <InfoSection title="DATE & TIME" icon={<Clock size={13} />} collapsible={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          <InfoRow label="Last Modified" value={time.lastModified.toLocaleString()} />
          {(time.exifDateTimeOriginal || time.exifDateTime) && (
            <InfoRow label="Created (EXIF)" value={time.exifDateTimeOriginal ?? time.exifDateTime ?? ""} />
          )}
          {time.exifDateTime && <InfoRow label="EXIF DateTime" value={time.exifDateTime} />}
          {time.exifDateTimeDigitized && <InfoRow label="Date Digitized" value={time.exifDateTimeDigitized} />}
        </div>
      </InfoSection>
    </div>
  )
}
