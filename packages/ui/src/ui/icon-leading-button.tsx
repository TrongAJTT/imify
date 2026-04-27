import * as React from "react"
import { cn } from "./utils"

interface IconLeadingButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  leadingIcon: React.ReactNode
  leadingClassName?: string
  labelClassName?: string
}

export function IconLeadingButton({
  leadingIcon,
  className,
  leadingClassName,
  labelClassName,
  children,
  ...props
}: IconLeadingButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-xl border text-sm font-semibold transition-colors",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex h-full min-w-10 items-center justify-center border-r px-2.5",
          leadingClassName
        )}
      >
        {leadingIcon}
      </span>
      <span className={cn("inline-flex items-center justify-center px-3 py-3", labelClassName)}>
        {children}
      </span>
    </a>
  )
}
