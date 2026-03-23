type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  variant?: "normal" | "wide" | "nowrap"
  position?: "top" | "down"
}

const variants = {
  normal: "whitespace-normal max-w-[200px]",
  wide: "whitespace-normal max-w-[400px]",
  nowrap: "whitespace-nowrap"
}

const positions = {
  top: "bottom-full mb-2",
  down: "top-full mt-2"
}

export function Tooltip({
  content,
  children,
  variant = "normal",
  position = "top"
}: TooltipProps) {
  return (
    <div className="relative group w-fit">
      {children}

      <div
        className={`absolute left-1/2 -translate-x-1/2 
                      opacity-0 group-hover:opacity-100
                      pointer-events-none
                      transition-opacity duration-200
                      bg-black/90 text-white text-[11px] px-2 py-1 rounded shadow-xl z-[9999] 
                      ${positions[position]}
                      ${variants[variant]}`}
      >
        {content}
      </div>
    </div>
  )
}