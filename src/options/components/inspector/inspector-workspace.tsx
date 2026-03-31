import { useCallback, useState } from "react"
import type { InspectorResult } from "@/features/inspector"
import { BasicInfoCard } from "./basic-info-card"
import { ColorInspectorCard } from "./color-inspector-card"
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
        <BasicInfoCard
          basic={result.basic}
          dimensions={result.dimensions}
          resolution={result.resolution}
          time={result.time}
          imageUrl={imageUrl}
        />
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

        <ColorInspectorCard color={result.color} palette={result.palette} />

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
