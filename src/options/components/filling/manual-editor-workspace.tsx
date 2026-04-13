import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect, Transformer } from "react-konva"
import type Konva from "konva"

import type { VectorLayer, FillingTemplate } from "@/features/filling/types"
import { generateShapePoints } from "@/features/filling/shape-generators"
import { flattenPoints, getBoundingBox } from "@/features/filling/vector-math"

interface ManualEditorWorkspaceProps {
  template: FillingTemplate
  layers: VectorLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string | null) => void
  onUpdateLayer: (id: string, partial: Partial<VectorLayer>) => void
}

const CANVAS_PADDING = 40

export function ManualEditorWorkspace({
  template,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
}: ManualEditorWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })

  const scale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2
    const availH = stageSize.height - CANVAS_PADDING * 2
    return Math.min(1, availW / template.canvasWidth, availH / template.canvasHeight)
  }, [stageSize, template.canvasWidth, template.canvasHeight])

  const offsetX = (stageSize.width - template.canvasWidth * scale) / 2
  const offsetY = (stageSize.height - template.canvasHeight * scale) / 2

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

  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return

    if (selectedLayerId) {
      const node = stage.findOne(`#layer-${selectedLayerId}`)
      if (node) {
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
        return
      }
    }
    tr.nodes([])
    tr.getLayer()?.batchDraw()
  }, [selectedLayerId, layers])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        onSelectLayer(null)
      }
    },
    [onSelectLayer]
  )

  const handleDragEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target
      onUpdateLayer(layerId, {
        x: Math.round(node.x() / scale),
        y: Math.round(node.y() / scale),
      })
    },
    [onUpdateLayer, scale]
  )

  const handleTransformEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target
      const scaleXNode = node.scaleX()
      const scaleYNode = node.scaleY()

      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      onUpdateLayer(layerId, {
        x: Math.round(node.x() / scale),
        y: Math.round(node.y() / scale),
        width: Math.round(Math.abs(layer.width * scaleXNode)),
        height: Math.round(Math.abs(layer.height * scaleYNode)),
        rotation: Math.round(node.rotation()),
      })

      node.scaleX(1)
      node.scaleY(1)
    },
    [layers, onUpdateLayer, scale]
  )

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      style={{ minHeight: 400 }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {/* Canvas background */}
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

          {/* Shape layers */}
          {layers.map((layer) => {
            if (!layer.visible) return null

            const shapePoints = generateShapePoints(layer.shapeType, layer.width, layer.height)
            const flat = flattenPoints(shapePoints)
            const scaledFlat = flat.map((v, i) => v * scale)

            return (
              <Line
                key={layer.id}
                id={`layer-${layer.id}`}
                points={scaledFlat}
                x={offsetX + layer.x * scale}
                y={offsetY + layer.y * scale}
                rotation={layer.rotation}
                closed
                fill="rgba(59, 130, 246, 0.15)"
                stroke={selectedLayerId === layer.id ? "#3b82f6" : "#94a3b8"}
                strokeWidth={selectedLayerId === layer.id ? 2 : 1}
                draggable={!layer.locked}
                onClick={() => onSelectLayer(layer.id)}
                onTap={() => onSelectLayer(layer.id)}
                onDragEnd={(e) => handleDragEnd(layer.id, e)}
                onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
              />
            )
          })}

          {/* Transformer for selected layer */}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox
              }
              return newBox
            }}
          />
        </Layer>
      </Stage>
    </div>
  )
}
