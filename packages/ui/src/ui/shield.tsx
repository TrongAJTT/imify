import React from "react"
import { cn } from "./utils"

interface ShieldProps {
  left: React.ReactNode
  right: React.ReactNode
  leftBg?: string
  rightBg?: string
  leftColor?: string
  rightColor?: string
  icon?: React.ReactNode
  trailingIcon?: React.ReactNode
  className?: string
  size?: "xs" | "sm" | "md"
}

export function Shield({
  left,
  right,
  leftBg = "bg-slate-200 dark:bg-slate-800",
  rightBg = "bg-blue-500",
  leftColor = "text-slate-700 dark:text-slate-300",
  rightColor = "text-white",
  icon,
  trailingIcon,
  className,
  size = "sm"
}: ShieldProps) {
  const sizeClasses = {
    xs: "text-[9px] h-4.5",
    sm: "text-[11px] h-6",
    md: "text-[12px] h-7.5"
  }[size]

  const paddingClasses = {
    xs: "px-2",
    sm: "px-3",
    md: "px-4"
  }[size]

  const iconSizeClasses = {
    xs: "gap-1",
    sm: "gap-1.5",
    md: "gap-2"
  }[size]

  // If rightBg is a hex color (starts with #), we apply it via style
  const isCustomBg = rightBg.startsWith("#")

  return (
    <div className={cn("inline-flex items-center overflow-hidden rounded-[4px] font-bold tracking-tight shadow-sm select-none", sizeClasses, className)}>
      {/* Left Part */}
      <div className={cn("flex items-center h-full uppercase", leftBg, leftColor, paddingClasses, iconSizeClasses)}>
        {icon && <span className="shrink-0 flex items-center justify-center opacity-80">{icon}</span>}
        <span className="whitespace-nowrap">{left}</span>
      </div>
      
      {/* Right Part */}
      <div 
        className={cn("flex items-center h-full uppercase", !isCustomBg && rightBg, rightColor, paddingClasses, iconSizeClasses)}
        style={isCustomBg ? { backgroundColor: rightBg } : {}}
      >
        <span className="whitespace-nowrap">{right}</span>
        {trailingIcon && <span className="shrink-0 flex items-center justify-center">{trailingIcon}</span>}
      </div>
    </div>
  )
}
