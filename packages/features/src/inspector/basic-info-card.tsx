import React from "react"
import { FileImage, Ruler, Clock, Pipette } from "lucide-react"
import type { BasicInfo, DimensionInfo, ResolutionInfo, TimeInfo } from "./types"
import { formatFileSize } from "./format-utils"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { InfoSection, InfoRow } from "./info-section"
import { useTranslation } from "@imify/i18n"

interface BasicInfoCardProps {
  basic: BasicInfo
  dimensions: DimensionInfo
  resolution: ResolutionInfo | null
  time: TimeInfo
  imageUrl: string
}

export function BasicInfoCard({ basic, dimensions, resolution, time, imageUrl }: BasicInfoCardProps) {
  const { t } = useTranslation("inspector")
  const setVisualAnalysisDialogOpen = useInspectorStore((s) => s.setVisualAnalysisDialogOpen)

  return (
    <div className="flex flex-col gap-3">
      <InfoSection title={t("fileInformation")} icon={<FileImage size={13} />} collapsible={false}>
        <div className="relative mb-3 pt-4" style={{ maxHeight: 280 }}>
          <div className="w-full h-48 rounded border border-slate-200/80 dark:border-slate-700/70 bg-slate-100/80 dark:bg-slate-900/60 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <img
              src={imageUrl}
              alt={basic.fileName}
              className="max-w-full max-h-full w-auto h-auto rounded"
              style={{ maxHeight: 240, maxWidth: "100%" }}
            />
          </div>

          {/* Color Picker button at bottom-right */}
          <button
            onClick={() => setVisualAnalysisDialogOpen(true)}
            className="absolute bottom-2 right-2 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900/70 hover:bg-slate-900/85 text-white backdrop-blur-sm transition-colors"
            title={t("openVisualAnalysis")}
            aria-label="Color Picker"
          >
            <Pipette size={18} />
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 mt-5">
          <InfoRow label={t("fileName")} value={basic.fileName} />
          <InfoRow label={t("format")} value={basic.format} />
          <InfoRow label={t("mimeType")} value={basic.mimeType} mono />
          <InfoRow label={t("fileSize")} value={formatFileSize(basic.fileSize)} />
        </div>
      </InfoSection>

      <InfoSection title={t("dimensions")} icon={<Ruler size={13} />} collapsible={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          <InfoRow label={t("size")} value={`${dimensions.width} x ${dimensions.height} px`} />
          <InfoRow label={t("megapixels")} value={`${dimensions.megapixels} MP`} />
          <InfoRow label={t("aspectRatio")} value={dimensions.aspectRatio} />
          <InfoRow label={t("orientation")} value={dimensions.orientation.charAt(0).toUpperCase() + dimensions.orientation.slice(1)} />
          {resolution && (
            <>
              <InfoRow label={t("xResolution")} value={`${resolution.xDpi} ${resolution.unit}`} />
              <InfoRow label={t("yResolution")} value={`${resolution.yDpi} ${resolution.unit}`} />
            </>
          )}
        </div>
        {dimensions.matchedStandards.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("matchingStandards")}
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

      <InfoSection title={t("dateTime")} icon={<Clock size={13} />} collapsible={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          <InfoRow label={t("lastModified")} value={time.lastModified.toLocaleString()} />
          {(time.exifDateTimeOriginal || time.exifDateTime) && (
            <InfoRow label={t("createdExif")} value={time.exifDateTimeOriginal ?? time.exifDateTime ?? ""} />
          )}
          {time.exifDateTime && <InfoRow label={t("exifDateTime")} value={time.exifDateTime} />}
          {time.exifDateTimeDigitized && <InfoRow label={t("dateDigitized")} value={time.exifDateTimeDigitized} />}
        </div>
      </InfoSection>
    </div>
  )
}

