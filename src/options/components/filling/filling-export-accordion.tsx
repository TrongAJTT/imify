import { useCallback, useState } from "react"
import { Download, Loader2 } from "lucide-react"

import type { FillingTemplate, FillingExportFormat } from "@/features/filling/types"
import { useFillingStore } from "@/options/stores/filling-store"
import { templateStorage } from "@/features/filling/template-storage"
import { renderFilledCanvas, imageDataToBlob } from "@/features/filling/canvas-export-renderer"
import { exportToPsd } from "@/features/filling/psd-export"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { SelectInput } from "@/options/components/ui/select-input"
import { NumberInput } from "@/options/components/ui/number-input"
import { Button } from "@/options/components/ui/button"

const FORMAT_OPTIONS: Array<{ value: FillingExportFormat; label: string }> = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jxl", label: "JPEG XL" },
  { value: "mozjpeg", label: "MozJPEG" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" },
  { value: "psd", label: "PSD (Photoshop)" },
]

const QUALITY_FORMATS = new Set(["jpg", "webp", "avif", "jxl", "mozjpeg"])

interface FillingExportAccordionProps {
  template: FillingTemplate
}

export function FillingExportAccordion({ template }: FillingExportAccordionProps) {
  const exportFormat = useFillingStore((s) => s.exportFormat)
  const exportQuality = useFillingStore((s) => s.exportQuality)
  const setExportFormat = useFillingStore((s) => s.setExportFormat)
  const setExportQuality = useFillingStore((s) => s.setExportQuality)
  const layerFillStates = useFillingStore((s) => s.layerFillStates)
  const canvasFillState = useFillingStore((s) => s.canvasFillState)

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      if (exportFormat === "psd") {
        const images = await loadAllImagesAsElements(layerFillStates)
        const blob = await exportToPsd(template, layerFillStates, canvasFillState, images)
        downloadBlob(blob, `${template.name}.psd`)
      } else {
        const imageBitmaps = await loadAllImagesAsBitmaps(layerFillStates)
        let bgBitmap: ImageBitmap | null = null
        if (canvasFillState.backgroundType === "image" && canvasFillState.backgroundImageUrl) {
          const resp = await fetch(canvasFillState.backgroundImageUrl)
          const bgBlob = await resp.blob()
          bgBitmap = await createImageBitmap(bgBlob)
        }

        const imageData = await renderFilledCanvas({
          template,
          layerFillStates,
          canvasFillState,
          loadedImages: imageBitmaps,
          backgroundImage: bgBitmap,
        })

        const rasterFormat = exportFormat === "mozjpeg" ? "jpeg" : exportFormat
        const blob = await imageDataToBlob(imageData, rasterFormat, exportQuality)
        const ext = exportFormat === "mozjpeg" ? "jpg" : exportFormat
        downloadBlob(blob, `${template.name}.${ext}`)
      }

      await templateStorage.incrementUsage(template.id)
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }, [exportFormat, exportQuality, template, layerFillStates, canvasFillState])

  return (
    <AccordionCard
      icon={<Download size={16} />}
      label="Export"
      sublabel={exportFormat.toUpperCase()}
      colorTheme="blue"
      defaultOpen={false}
    >
      <div className="space-y-3">
        <SelectInput
          label="Format"
          value={exportFormat}
          options={FORMAT_OPTIONS}
          onChange={(v) => setExportFormat(v as FillingExportFormat)}
        />

        {QUALITY_FORMATS.has(exportFormat) && (
          <NumberInput
            label="Quality"
            value={exportQuality}
            onChangeValue={setExportQuality}
            min={1}
            max={100}
            tooltip="Output quality (1-100)"
          />
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={14} />
              Export {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </AccordionCard>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function loadAllImagesAsBitmaps(
  states: ReturnType<typeof useFillingStore.getState>["layerFillStates"]
): Promise<Map<string, ImageBitmap>> {
  const map = new Map<string, ImageBitmap>()
  const promises = states
    .filter((s) => s.imageUrl)
    .map(async (s) => {
      const resp = await fetch(s.imageUrl!)
      const blob = await resp.blob()
      const bitmap = await createImageBitmap(blob)
      map.set(s.layerId, bitmap)
    })
  await Promise.all(promises)
  return map
}

async function loadAllImagesAsElements(
  states: ReturnType<typeof useFillingStore.getState>["layerFillStates"]
): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>()
  const promises = states
    .filter((s) => s.imageUrl)
    .map(
      (s) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            map.set(s.layerId, img)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = s.imageUrl!
        })
    )
  await Promise.all(promises)
  return map
}
