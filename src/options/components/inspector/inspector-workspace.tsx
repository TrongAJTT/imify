import { useCallback, useState } from "react"
import type { InspectorResult } from "@/features/inspector"
import { BasicInfoCard } from "./basic-info-card"
import { ColorInfoCard } from "./color-info-card"
import { ColorPaletteCard } from "./color-palette-card"
import { ExifTableCard } from "./exif-table-card"
import { GpsCard } from "./gps-card"
import { PrivacyAlertsCard } from "./privacy-alerts-card"
import { ExportToolsCard } from "./export-tools-card"

interface InspectorWorkspaceProps {
  result: InspectorResult
  bitmap: ImageBitmap
  imageUrl: string
}

export function InspectorWorkspace({ result, bitmap, imageUrl }: InspectorWorkspaceProps) {
  const [isNuking, setIsNuking] = useState(false)

  const handleNukeExif = useCallback(async () => {
    setIsNuking(true)
    try {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(bitmap, 0, 0)

      const ext = result.basic.format.toLowerCase()
      const outType = ext === "png" ? "image/png" : "image/jpeg"
      const blob = await canvas.convertToBlob({ type: outType, quality: 0.95 })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const nameWithoutExt = result.basic.fileName.replace(/\.[^.]+$/, "")
      a.href = url
      a.download = `${nameWithoutExt}_clean.${ext === "png" ? "png" : "jpg"}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* re-encode failed */
    } finally {
      setIsNuking(false)
    }
  }, [bitmap, result.basic])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col gap-3">
        {/* Image preview */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
          <div className="relative flex items-center justify-center p-3" style={{ maxHeight: 280 }}>
            <img
              src={imageUrl}
              alt={result.basic.fileName}
              className="max-w-full max-h-[260px] object-contain rounded"
            />
          </div>
        </div>

        <BasicInfoCard
          basic={result.basic}
          dimensions={result.dimensions}
          resolution={result.resolution}
          time={result.time}
        />

        <ColorInfoCard color={result.color} />
      </div>

      <div className="flex flex-col gap-3">
        {result.privacyAlerts.length > 0 && (
          <PrivacyAlertsCard
            alerts={result.privacyAlerts}
            onNukeExif={handleNukeExif}
            isNuking={isNuking}
          />
        )}

        {result.gps && <GpsCard gps={result.gps} />}

        <ColorPaletteCard palette={result.palette} />

        <ExportToolsCard
          bitmap={bitmap}
          mimeType={result.basic.mimeType}
          thumbHash={result.thumbHash}
        />

        <ExifTableCard entries={result.exifEntries} />
      </div>
    </div>
  )
}
