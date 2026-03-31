import { createPortal } from "react-dom"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useDelayedHoverOpen } from "@/options/hooks/use-delayed-hover-open"

type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  /** Optional highlighted label displayed above `content` inside the tooltip */
  label?: React.ReactNode
  variant?: "normal" | "wide1" | "wide2" | "nowrap"
  position?: "top" | "down" | "right"
}

const variants = {
  // `pre-line` respects explicit newlines while still allowing wrapping by width.
  normal: "whitespace-pre-line max-w-[200px]",
  wide1: "whitespace-pre-line min-w-[150px] max-w-[350px]",
  wide2: "whitespace-pre-line min-w-[200px] max-w-[400px]",
  nowrap: "whitespace-nowrap"
} as const

export function Tooltip({
  content,
  children,
  label,
  variant = "normal",
  position = "top"
}: TooltipProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const { open, setOpen, handlers } = useDelayedHoverOpen({ delayMs: 300, openOnFocus: true })
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 })

  const tooltipClassName = useMemo(() => {
    const transform =
      position === "top"
        ? "-translate-x-1/2 -translate-y-full"
        : position === "down"
          ? "-translate-x-1/2 translate-y-0"
          : "translate-x-0 -translate-y-1/2"

    return `fixed left-0 top-0 z-[9999] pointer-events-none bg-black/90 text-white text-[11px] px-2 py-1 rounded shadow-xl ${transform} ${variants[variant]}`
  }, [position, variant])

  useLayoutEffect(() => {
    if (!open) return
    const el = triggerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const GAP = 8

    const left =
      position === "right"
        ? rect.right + GAP
        : rect.left + rect.width / 2

    const top =
      position === "top"
        ? rect.top - GAP
        : position === "down"
          ? rect.bottom + GAP
          : rect.top + rect.height / 2
    setCoords({ left, top })
  }, [open, position])

  const tooltip = open
    ? createPortal(
        <div
          role="tooltip"
          className={tooltipClassName}
          style={{
            left: coords.left,
            top: coords.top
          }}
        >
          {label ? <div className="text-[12px] font-bold mb-0.5">{label}</div> : null}
          <div>{content}</div>
        </div>,
        document.body
      )
    : null

  return (
    <div
      ref={triggerRef}
      className="relative"
      {...handlers}
    >
      {children}
      {tooltip}
    </div>
  )
}