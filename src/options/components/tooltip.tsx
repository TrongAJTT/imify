type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  variant?: "normal" | "wide" | "nowrap"
}

const variants = {
  normal: "whitespace-normal max-w-[200px]",
  wide: "whitespace-normal max-w-[400px]",
  nowrap: "whitespace-nowrap"
}

export function Tooltip({ content, children, variant = "normal" }: TooltipProps) {
  return (
    <div className="relative group w-fit">
      {children}

      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                      opacity-0 group-hover:opacity-100
                      pointer-events-none
                      transition-opacity duration-200
                      bg-black/90 text-white text-[11px] px-2 py-1 rounded shadow-xl z-[9999] 
                      ${variants[variant]}`}
      >
        {content}
      </div>
    </div>
  )
}