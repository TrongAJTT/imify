import { ControlledPopover } from "@/options/components/ui/controlled-popover"

type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  /** Optional highlighted label displayed above `content` inside the tooltip */
  label?: React.ReactNode
  variant?: "normal" | "wide1" | "wide2" | "nowrap"
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
  variant = "normal"
}: TooltipProps) {
  return (
    <ControlledPopover
      trigger={<div className="relative">{children}</div>}
      preset="tooltip"
      contentClassName={`bg-black/90 text-white text-[11px] px-2 py-1 rounded shadow-xl z-[9999] pointer-events-none ${variants[variant]}`}
    >
      {label ? <div className="text-[12px] font-bold mb-0.5">{label}</div> : null}
      <div>{content}</div>
    </ControlledPopover>
  )
}