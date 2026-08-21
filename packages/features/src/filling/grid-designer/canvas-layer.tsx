import React from "react"
import { Layer, Rect, Text } from "react-konva"
import type { GridLayoutCell } from "./generator"
import type { GridPrimaryDirection } from "../types"

interface GridDesignCanvasLayerProps {
  canvasWidth: number
  canvasHeight: number
  offsetX: number
  offsetY: number
  renderScale: number
  cells: GridLayoutCell[]
  direction?: GridPrimaryDirection
  highlightedIndex?: number | null
}

export function GridDesignCanvasLayer({
  canvasWidth,
  canvasHeight,
  offsetX,
  offsetY,
  renderScale,
  cells,
  direction = "rows",
  highlightedIndex = null,
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
        const isHighlighted =
          highlightedIndex !== null &&
          ((direction === "rows" && cell.rowIndex === highlightedIndex) ||
            (direction === "cols" && cell.colIndex === highlightedIndex))

        let fill = "rgba(59, 130, 246, 0.12)"
        let stroke = "#94a3b8"
        let strokeWidth = 1
        let dash: number[] | undefined = undefined

        if (isError) {
          fill = "rgba(239, 68, 68, 0.18)"
          stroke = "#ef4444"
          strokeWidth = 2
          dash = [6, 4]
        } else if (isHighlighted) {
          fill = "rgba(234, 179, 8, 0.25)"
          stroke = "#eab308"
          strokeWidth = 2
        } else if (cell.isText) {
          fill = "rgba(139, 92, 246, 0.14)"
          stroke = "#8b5cf6"
          strokeWidth = 1.5
          dash = [4, 3]
        }

        const cellW = Math.max(1, cell.width * renderScale)
        const cellH = Math.max(1, cell.height * renderScale)

        return (
          <React.Fragment key={cell.id}>
            <Rect
              x={offsetX + cell.x * renderScale}
              y={offsetY + cell.y * renderScale}
              width={cellW}
              height={cellH}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              dash={dash}
              cornerRadius={4}
              listening={false}
            />
            {cell.isText && !isError && (
              <Text
                x={offsetX + cell.x * renderScale}
                y={offsetY + cell.y * renderScale}
                width={cellW}
                height={cellH}
                text="T"
                fontSize={Math.max(11, Math.min(22, cellH * 0.35))}
                fontStyle="bold"
                fontFamily="sans-serif"
                fill="#8b5cf6"
                align="center"
                verticalAlign="middle"
                listening={false}
              />
            )}
          </React.Fragment>
        )
      })}
    </Layer>
  )
}

