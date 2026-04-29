import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AccordionCard } from "./accordion-card"

type BaseAccordionCardProps = React.ComponentProps<typeof AccordionCard>

interface ResizableAccordionCardProps extends BaseAccordionCardProps {
  height: number
  initialHeight: number
  onHeightChange: (height: number) => void
  minHeight?: number
  maxHeight?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function ResizableAccordionCard({
  height,
  initialHeight,
  onHeightChange,
  minHeight = 180,
  maxHeight = 560,
  childrenClassName,
  children,
  ...accordionProps
}: ResizableAccordionCardProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)

  const resolvedHeight = useMemo(() => {
    const baseHeight = Number.isFinite(height) && height > 0 ? height : initialHeight
    return clamp(Math.round(baseHeight), minHeight, maxHeight)
  }, [height, initialHeight, minHeight, maxHeight])

  useEffect(() => {
    if (Number.isFinite(height) && height > 0) return
    onHeightChange(clamp(Math.round(initialHeight), minHeight, maxHeight))
  }, [height, initialHeight, minHeight, maxHeight, onHeightChange])

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = contentRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const nextHeight = clamp(Math.round(e.clientY - rect.top), minHeight, maxHeight)
      onHeightChange(nextHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, minHeight, maxHeight, onHeightChange])

  return (
    <AccordionCard
      {...accordionProps}
      childrenClassName="p-0"
    >
      <div ref={contentRef} className="flex flex-col" style={{ height: `${resolvedHeight}px` }}>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className={childrenClassName ?? "p-3"}>
            {children}
          </div>
        </div>
        <div
          onMouseDown={handleResizeStart}
          className={`h-1 w-full bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors ${
            isResizing ? "bg-sky-400 dark:bg-sky-500" : ""
          }`}
          style={{ cursor: "ns-resize" }}
          role="separator"
          aria-label="Resize accordion content height"
        />
      </div>
    </AccordionCard>
  )
}

export default ResizableAccordionCard

