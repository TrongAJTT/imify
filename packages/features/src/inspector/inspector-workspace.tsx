import { useCallback, useState } from "react"
import { type InspectorResult } from "./types"
import { BasicInfoCard } from "./basic-info-card"
import { ColorInspectorCard } from "./color-inspector-card"
import { ExifTableCard } from "./exif-table-card"
import { GpsCard } from "./gps-card"
import { PrivacyAlertsCard } from "./privacy-alerts-card"
import { DeveloperActionsCard } from "./developer-actions-card"
import { WebPerformanceCard } from "./web-performance-card"
import { VisualAnalysisDialog } from "./visual-analysis-dialog"

interface InspectorWorkspaceProps {
  result: InspectorResult
  bitmap: ImageBitmap
  imageUrl: string
  file: File
  onOptimizeNow?: (recommendedFormat?: "mozjpeg" | "webp" | "avif") => void
}

export function InspectorWorkspace({ result, bitmap, imageUrl, file, onOptimizeNow }: InspectorWorkspaceProps) {
  const [isNuking, setIsNuking] = useState(false)
  const handleNukeExif = useCallback(async () => {
    setIsNuking(true)
    try {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
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
    } finally {
      setIsNuking(false)
    }
  }, [bitmap, result.basic])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <BasicInfoCard basic={result.basic} dimensions={result.dimensions} resolution={result.resolution} time={result.time} imageUrl={imageUrl} />
        <WebPerformanceCard report={result.webPerformance} onOptimizeNow={onOptimizeNow} />
        <DeveloperActionsCard bitmap={bitmap} mimeType={result.basic.mimeType} thumbHash={result.thumbHash} result={result} palette={result.palette} file={file} />
      </div>
      <div className="flex flex-col gap-3">
        {result.privacyAlerts.length > 0 ? <PrivacyAlertsCard alerts={result.privacyAlerts} onNukeExif={handleNukeExif} isNuking={isNuking} /> : null}
        {result.gps ? <GpsCard gps={result.gps} /> : null}
        <ColorInspectorCard color={result.color} palette={result.palette} />
        <ExifTableCard entries={result.exifEntries} />
      </div>
      <VisualAnalysisDialog imageUrl={imageUrl} alt={result.basic.fileName} />
    </div>
  )
}
