import React from "react"
import { X } from "lucide-react"

import type { ShapeType } from "./types"
import { SHAPE_CATEGORIES, SHAPE_LABELS, generateShapePoints } from "./shape-generators"
import { flattenPoints } from "./vector-math"
import { BaseDialog, Subheading } from "@imify/ui"

interface ShapePickerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: ShapeType) => void
}

export function ShapePickerDialog({ isOpen, onClose, onSelect }: ShapePickerDialogProps) {
  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="rounded-xl w-[600px] max-w-[95vw]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Subheading>Add Shape Layer</Subheading>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {SHAPE_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-2">
                {cat.label}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {cat.shapes.map((shapeType) => (
                  <ShapeButton
                    key={shapeType}
                    shapeType={shapeType}
                    onClick={() => {
                      onSelect(shapeType)
                      onClose()
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseDialog>
  )
}

function ShapeButton({
  shapeType,
  onClick,
}: {
  shapeType: ShapeType
  onClick: () => void
}) {
  const points = generateShapePoints(shapeType, 60, 60)
  const flat = flattenPoints(points)

  const svgPoints = []
  for (let i = 0; i < flat.length; i += 2) {
    svgPoints.push(`${flat[i] + 10},${flat[i + 1] + 10}`)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all group"
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <polygon
          points={svgPoints.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-slate-400 group-hover:text-sky-500 transition-colors"
        />
      </svg>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-300">
        {SHAPE_LABELS[shapeType]}
      </span>
    </button>
  )
}
