import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Line, Rect, Group, Image as KonvaImage, Transformer } from "react-konva"
import type Konva from "konva"

import type { FillingTemplate, VectorLayer } from "@/features/filling/types"
import { useFillingStore } from "@/options/stores/filling-store"
import { generateShapePoints } from "@/features/filling/shape-generators"
import { flattenPoints, roundedPolygonPoints } from "@/features/filling/vector-math"
import { Subheading, MutedText } from "@/options/components/ui/typography"
import { Button } from "@/options/components/ui/button"
import { Download } from "lucide-react"

const CANVAS_PADDING = 40

interface FillWorkspaceProps {
  template: FillingTemplate
}

export function FillWorkspace({ template }: FillWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })

  const canvasFillState = useFillingStore((s) => s.canvasFillState)
  const layerFillStates = useFillingStore((s) => s.layerFillStates)
  const selectedLayerId = useFillingStore((s) => s.selectedLayerId)
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId)

  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())

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
    const newMap = new Map<string, HTMLImageElement>()
    for (const lf of layerFillStates) {
      if (!lf.imageUrl) continue
      const existing = loadedImages.get(lf.layerId)
      if (existing && existing.src === lf.imageUrl) {
        newMap.set(lf.layerId, existing)
        continue
      }
      const img = new window.Image()
      img.src = lf.imageUrl
      img.onload = () => {
        setLoadedImages((prev) => new Map(prev).set(lf.layerId, img))
      }
      newMap.set(lf.layerId, img)
    }
    setLoadedImages(newMap)
  }, [layerFillStates.map((l) => l.imageUrl).join(",")])

  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return

    if (selectedLayerId) {
      const node = stage.findOne(`#fill-img-${selectedLayerId}`)
      if (node) {
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
        return
      }
    }
    tr.nodes([])
    tr.getLayer()?.batchDraw()
  }, [selectedLayerId, layerFillStates])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        setSelectedLayerId(null)
      }
    },
    [setSelectedLayerId]
  )

  const bgColor = canvasFillState.backgroundType === "solid"
    ? canvasFillState.backgroundColor
    : canvasFillState.backgroundType === "transparent"
      ? "transparent"
      : "#ffffff"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Subheading>Fill Images</Subheading>
          <MutedText className="text-xs mt-0.5">
            {template.canvasWidth} x {template.canvasHeight} px &middot; {template.layers.length} layer{template.layers.length !== 1 ? "s" : ""}
          </MutedText>
        </div>
      </div>

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
            {/* Checkerboard for transparent background */}
            {canvasFillState.backgroundType === "transparent" && (
              <CheckerboardPattern
                x={offsetX}
                y={offsetY}
                width={template.canvasWidth * scale}
                height={template.canvasHeight * scale}
              />
            )}

            {/* Canvas background */}
            <Rect
              x={offsetX}
              y={offsetY}
              width={template.canvasWidth * scale}
              height={template.canvasHeight * scale}
              fill={bgColor === "transparent" ? undefined : bgColor}
              stroke="#cbd5e1"
              strokeWidth={1}
              listening={false}
            />

            {/* Filled layers */}
            {template.layers.map((layer) => {
              if (!layer.visible) return null
              const fillState = layerFillStates.find((lf) => lf.layerId === layer.id)
              const loadedImg = loadedImages.get(layer.id)

              return (
                <FilledLayerShape
                  key={layer.id}
                  layer={layer}
                  fillState={fillState}
                  loadedImg={loadedImg?.complete ? loadedImg : undefined}
                  scale={scale}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  isSelected={selectedLayerId === layer.id}
                  onSelect={() => setSelectedLayerId(layer.id)}
                />
              )
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

function FilledLayerShape({
  layer,
  fillState,
  loadedImg,
  scale,
  offsetX,
  offsetY,
  isSelected,
  onSelect,
}: {
  layer: VectorLayer
  fillState: ReturnType<typeof useFillingStore.getState>["layerFillStates"][number] | undefined
  loadedImg: HTMLImageElement | undefined
  scale: number
  offsetX: number
  offsetY: number
  isSelected: boolean
  onSelect: () => void
}) {
  const cornerRadius = fillState?.cornerRadius ?? 0
  const borderWidth = fillState?.borderWidth ?? 0
  const borderColor = fillState?.borderColor ?? "#000000"

  const rawPoints = generateShapePoints(layer.shapeType, layer.width, layer.height)
  const displayPoints = cornerRadius > 0 ? roundedPolygonPoints(rawPoints, cornerRadius) : rawPoints
  const flat = flattenPoints(displayPoints).map((v) => v * scale)

  const x = offsetX + layer.x * scale
  const y = offsetY + layer.y * scale

  return (
    <Group
      x={x}
      y={y}
      rotation={layer.rotation}
      onClick={onSelect}
      onTap={onSelect}
      clipFunc={(ctx: any) => {
        ctx.beginPath()
        for (let i = 0; i < flat.length; i += 2) {
          if (i === 0) ctx.moveTo(flat[i], flat[i + 1])
          else ctx.lineTo(flat[i], flat[i + 1])
        }
        ctx.closePath()
      }}
    >
      {/* Fill background for empty layers */}
      {!loadedImg && (
        <Line
          points={flat}
          closed
          fill="rgba(148, 163, 184, 0.15)"
          listening={false}
        />
      )}

      {/* Filled image */}
      {loadedImg && fillState && (
        <KonvaImage
          id={`fill-img-${layer.id}`}
          image={loadedImg}
          x={fillState.imageTransform.x * scale}
          y={fillState.imageTransform.y * scale}
          scaleX={fillState.imageTransform.scaleX * scale}
          scaleY={fillState.imageTransform.scaleY * scale}
          rotation={fillState.imageTransform.rotation}
          draggable
        />
      )}
    </Group>
  )
}

function CheckerboardPattern({
  x,
  y,
  width,
  height,
}: {
  x: number
  y: number
  width: number
  height: number
}) {
  const size = 10
  const rects: JSX.Element[] = []
  for (let row = 0; row < Math.ceil(height / size); row++) {
    for (let col = 0; col < Math.ceil(width / size); col++) {
      if ((row + col) % 2 === 0) continue
      rects.push(
        <Rect
          key={`cb-${row}-${col}`}
          x={x + col * size}
          y={y + row * size}
          width={Math.min(size, width - col * size)}
          height={Math.min(size, height - row * size)}
          fill="#e2e8f0"
          listening={false}
        />
      )
    }
  }
  return <>{rects}</>
}
