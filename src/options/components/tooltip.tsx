type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group w-fit">
      {children}

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                      opacity-0 group-hover:opacity-100
                      pointer-events-none
                      transition-opacity duration-200
                      bg-black text-white text-xs px-2 py-1 rounded whitespace-normal max-w-[400px] z-[9999]">
        {content}
      </div>
    </div>
  )
}