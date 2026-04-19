import { useEffect, useMemo, useRef, useState } from "react"
import { Ellipse, Group, Layer, Rect, Stage, Text, Transformer } from "react-konva"
import type Konva from "konva"

import type { PatternBoundarySettings } from "@/features/pattern/types"
import type { PatternVisualBoundaryTarget } from "@/options/stores/pattern-store"

const MIN_BOUNDARY_SIZE = 8

const BOUNDARY_COLOR: Record<PatternVisualBoundaryTarget, string> = {
  inbound: "#0ea5e9",
  outbound: "#f97316",
}

const BOUNDARY_LABEL: Record<PatternVisualBoundaryTarget, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
}

interface PatternBoundaryVisualOverlayProps {
  renderScale: number
  displayWidth: number
  displayHeight: number
  inboundBoundary: PatternBoundarySettings
  outboundBoundary: PatternBoundarySettings
  activeTarget: PatternVisualBoundaryTarget | null
  onBoundaryChange: (target: PatternVisualBoundaryTarget, partial: Partial<PatternBoundarySettings>) => void
  onActiveTargetChange: (target: PatternVisualBoundaryTarget | null) => void
}

interface DisplayBoundary {
  target: PatternVisualBoundaryTarget
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

function toDisplayBoundary(
  target: PatternVisualBoundaryTarget,
  boundary: PatternBoundarySettings,
  renderScale: number
): DisplayBoundary {
  const width = Math.max(MIN_BOUNDARY_SIZE * renderScale, boundary.width * renderScale)
  const height = Math.max(MIN_BOUNDARY_SIZE * renderScale, boundary.height * renderScale)

  return {
    target,
    x: (boundary.x + boundary.width / 2) * renderScale,
    y: (boundary.y + boundary.height / 2) * renderScale,
    width,
    height,
    rotation: boundary.rotation,
  }
}

function clampPositive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return value
}

export function PatternBoundaryVisualOverlay({
  renderScale,
  displayWidth,
  displayHeight,
  inboundBoundary,
  outboundBoundary,
  activeTarget,
  onBoundaryChange,
  onActiveTargetChange,
}: PatternBoundaryVisualOverlayProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [isFreeAspectRatio, setIsFreeAspectRatio] = useState(false)

  const activeBoundary = useMemo<DisplayBoundary | null>(() => {
    if (activeTarget === "inbound") {
      if (!inboundBoundary.enabled) {
        return null
      }

      return toDisplayBoundary("inbound", inboundBoundary, renderScale)
    }

    if (activeTarget === "outbound") {
      if (!outboundBoundary.enabled) {
        return null
      }

      return toDisplayBoundary("outbound", outboundBoundary, renderScale)
    }

    return null
  }, [activeTarget, inboundBoundary, outboundBoundary, renderScale])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.shiftKey) {
        return
      }

      setIsFreeAspectRatio(true)
      if (transformerRef.current) {
        transformerRef.current.keepRatio(false)
      }
    }

    const handleKeyUp = () => {
      setIsFreeAspectRatio(false)
      if (transformerRef.current) {
        transformerRef.current.keepRatio(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const transformer = transformerRef.current
    const stage = stageRef.current

    if (!transformer || !stage) {
      return
    }

    if (!activeTarget) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
      return
    }

    const node = stage.findOne(`#pattern-boundary-${activeTarget}`)
    if (!node) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
      return
    }

    transformer.nodes([node])
    transformer.keepRatio(!isFreeAspectRatio)
    transformer.getLayer()?.batchDraw()
  }, [activeBoundary, activeTarget, isFreeAspectRatio])

  const applyNodeToBoundary = (target: PatternVisualBoundaryTarget, node: Konva.Shape) => {
    const normalizedDisplayWidth = clampPositive(
      Math.max(MIN_BOUNDARY_SIZE * renderScale, Math.abs(node.width() * node.scaleX())),
      MIN_BOUNDARY_SIZE * renderScale
    )
    const normalizedDisplayHeight = clampPositive(
      Math.max(MIN_BOUNDARY_SIZE * renderScale, Math.abs(node.height() * node.scaleY())),
      MIN_BOUNDARY_SIZE * renderScale
    )

    node.width(normalizedDisplayWidth)
    node.height(normalizedDisplayHeight)
    node.scaleX(1)
    node.scaleY(1)

    const nextWidth = clampPositive(normalizedDisplayWidth / renderScale, MIN_BOUNDARY_SIZE)
    const nextHeight = clampPositive(normalizedDisplayHeight / renderScale, MIN_BOUNDARY_SIZE)
    const centerX = node.x() / renderScale
    const centerY = node.y() / renderScale

    onBoundaryChange(target, {
      x: centerX - nextWidth / 2,
      y: centerY - nextHeight / 2,
      width: nextWidth,
      height: nextHeight,
      rotation: node.rotation(),
    })
  }

  if (!activeBoundary) {
    return null
  }

  const strokeColor = BOUNDARY_COLOR[activeBoundary.target]
  const label = BOUNDARY_LABEL[activeBoundary.target]
  const isEllipse = activeBoundary.target === "inbound"
    ? inboundBoundary.shape === "ellipse"
    : outboundBoundary.shape === "ellipse"

  const commonProps = {
    id: `pattern-boundary-${activeBoundary.target}`,
    x: activeBoundary.x,
    y: activeBoundary.y,
    rotation: activeBoundary.rotation,
    stroke: strokeColor,
    strokeWidth: 2.2,
    dash: [8, 4],
    fill: `${strokeColor}1c`,
    draggable: true,
    onClick: () => onActiveTargetChange(activeBoundary.target),
    onTap: () => onActiveTargetChange(activeBoundary.target),
    onDragStart: () => onActiveTargetChange(activeBoundary.target),
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      applyNodeToBoundary(activeBoundary.target, event.target as Konva.Shape)
    },
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      applyNodeToBoundary(activeBoundary.target, event.target as Konva.Shape)
    },
  }

  return (
    <Stage
      ref={stageRef}
      width={displayWidth}
      height={displayHeight}
      className="pointer-events-auto"
      onMouseDown={(event) => {
        if (event.target === event.target.getStage()) {
          onActiveTargetChange(null)
        }
      }}
    >
      <Layer>
        <Group key={`group-${activeBoundary.target}`}>
          {isEllipse ? (
            <Ellipse
              {...commonProps}
              radiusX={activeBoundary.width / 2}
              radiusY={activeBoundary.height / 2}
            />
          ) : (
            <Rect
              {...commonProps}
              width={activeBoundary.width}
              height={activeBoundary.height}
              offsetX={activeBoundary.width / 2}
              offsetY={activeBoundary.height / 2}
            />
          )}

          <Text
            x={activeBoundary.x - activeBoundary.width / 2 + 6}
            y={activeBoundary.y - activeBoundary.height / 2 - 18}
            text={label}
            fontSize={11}
            fill={strokeColor}
            listening={false}
          />
        </Group>

        <Transformer
          ref={transformerRef}
          rotateEnabled
          keepRatio={!isFreeAspectRatio}
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          anchorSize={8}
          borderStrokeWidth={1.2}
          boundBoxFunc={(oldBox, newBox) => {
            const minSize = MIN_BOUNDARY_SIZE * renderScale
            if (Math.abs(newBox.width) < minSize || Math.abs(newBox.height) < minSize) {
              return oldBox
            }
            return newBox
          }}
        />
      </Layer>
    </Stage>
  )
}
