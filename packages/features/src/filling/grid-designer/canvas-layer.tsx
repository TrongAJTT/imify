import React from "react"
import { Layer, Line, Rect, Text } from "react-konva"
import type { GridLayoutCell } from "./generator"
import type { GridPrimaryDirection, Point2D } from "../types"

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

function isStandardRect(points?: Point2D[], width?: number, height?: number): boolean {
  if (!points || points.length !== 4 || width === undefined || height === undefined) {
    return false
  }
  return (
    Math.abs(points[0]!.x) < 0.01 &&
    Math.abs(points[0]!.y) < 0.01 &&
    Math.abs(points[1]!.x - width) < 0.01 &&
    Math.abs(points[1]!.y) < 0.01 &&
    Math.abs(points[2]!.x - width) < 0.01 &&
    Math.abs(points[2]!.y - height) < 0.01 &&
    Math.abs(points[3]!.x) < 0.01 &&
    Math.abs(points[3]!.y - height) < 0.01
  )
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
        const isRect = isStandardRect(cell.points, cell.width, cell.height)

        return (
          <React.Fragment key={cell.id}>
            {isRect ? (
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
            ) : (
              <Line
                points={cell.points!.flatMap((p) => [
                  offsetX + (cell.x + p.x) * renderScale,
                  offsetY + (cell.y + p.y) * renderScale,
                ])}
                closed={true}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                dash={dash}
                listening={false}
              />
            )}
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

