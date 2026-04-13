import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect } from "react-konva"
import type Konva from "konva"

import type { FillingTemplate, SymmetricParams, VectorLayer } from "@/features/filling/types"
import { DEFAULT_SYMMETRIC_PARAMS } from "@/features/filling/types"
import { generateSymmetricLayers } from "@/features/filling/symmetric-generator"
import { flattenPoints } from "@/features/filling/vector-math"
import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import { Button } from "@/options/components/ui/button"
import { Save } from "lucide-react"

const CANVAS_PADDING = 40

interface SymmetricWorkspaceProps {
  template: FillingTemplate
  onRefresh: () => Promise<void>
}

export function SymmetricWorkspace({ template, onRefresh }: SymmetricWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [params, setParams] = useState<SymmetricParams>({ ...DEFAULT_SYMMETRIC_PARAMS })
  const navigateToSelect = useFillingStore((s) => s.navigateToSelect)
  const updateTemplate = useFillingStore((s) => s.updateTemplate)
  const setSymmetricParams = useFillingStore((s) => s.setFillingStep)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setStageSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.max(400, Math.floor(entry.contentRect.height)),
        })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const generatedLayers = useMemo(
    () => generateSymmetricLayers(params, template.canvasWidth, template.canvasHeight),
    [params, template.canvasWidth, template.canvasHeight]
  )

  const scale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2
    const availH = stageSize.height - CANVAS_PADDING * 2
    return Math.min(1, availW / template.canvasWidth, availH / template.canvasHeight)
  }, [stageSize, template.canvasWidth, template.canvasHeight])

  const offsetX = (stageSize.width - template.canvasWidth * scale) / 2
  const offsetY = (stageSize.height - template.canvasHeight * scale) / 2

  const handleSave = useCallback(async () => {
    const updated: FillingTemplate = {
      ...template,
      layers: generatedLayers,
      updatedAt: Date.now(),
    }
    await templateStorage.save(updated)
    updateTemplate(updated)
    await onRefresh()
    navigateToSelect()
  }, [template, generatedLayers, updateTemplate, onRefresh, navigateToSelect])

  // Expose params to sidebar via store (simple approach using window)
  useEffect(() => {
    (window as any).__symmetricParams = params;
    (window as any).__setSymmetricParams = setParams;
    (window as any).__symmetricLayerCount = generatedLayers.length
    return () => {
      delete (window as any).__symmetricParams
      delete (window as any).__setSymmetricParams
      delete (window as any).__symmetricLayerCount
    }
  }, [params, generatedLayers.length])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Subheading>Symmetric Generator</Subheading>
          <MutedText className="text-xs mt-0.5">
            {generatedLayers.length} parallelogram{generatedLayers.length !== 1 ? "s" : ""} generated
            &middot; {template.canvasWidth} x {template.canvasHeight} px
          </MutedText>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave}>
          <Save size={14} />
          Save Template
        </Button>
      </div>

      <div
        ref={containerRef}
        className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        style={{ minHeight: 400 }}
      >
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            <Rect
              x={offsetX}
              y={offsetY}
              width={template.canvasWidth * scale}
              height={template.canvasHeight * scale}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={1}
              listening={false}
            />

            {generatedLayers.map((layer) => {
              const flat = flattenPoints(layer.points).map((v) => v * scale)
              return (
                <Line
                  key={layer.id}
                  points={flat}
                  x={offsetX + layer.x * scale}
                  y={offsetY + layer.y * scale}
                  closed
                  fill="rgba(59, 130, 246, 0.12)"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  listening={false}
                />
              )
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
