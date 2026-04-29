import React from "react"
import { Layer, Rect } from "react-konva"
import type { GridLayoutCell } from "./generator"

interface GridDesignCanvasLayerProps {
  canvasWidth: number
  canvasHeight: number
  offsetX: number
  offsetY: number
  renderScale: number
  cells: GridLayoutCell[]
}

export function GridDesignCanvasLayer({
  canvasWidth,
  canvasHeight,
  offsetX,
  offsetY,
  renderScale,
  cells,
}: GridDesignCanvasLayerProps) {
  return (
    <Layer>
      <Rect
        x={offsetX}
        y={offsetY}
        width={canvasWidth * renderScale}
        height={canvasHeight * renderScale}
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth={1}
        listening={false}
      />

      {cells.map((cell) => {
        const isError = cell.hasError
        return (
          <Rect
            key={cell.id}
            x={offsetX + cell.x * renderScale}
            y={offsetY + cell.y * renderScale}
            width={Math.max(1, cell.width * renderScale)}
            height={Math.max(1, cell.height * renderScale)}
            fill={isError ? "rgba(239, 68, 68, 0.18)" : "rgba(59, 130, 246, 0.12)"}
            stroke={isError ? "#ef4444" : "#94a3b8"}
            strokeWidth={isError ? 2 : 1}
            dash={isError ? [6, 4] : undefined}
            cornerRadius={4}
            listening={false}
          />
        )
      })}
    </Layer>
  )
}
