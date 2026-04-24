import * as React from "react"
import { cn } from "./utils"

export function Heading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("text-2xl font-bold text-slate-900 dark:text-white", className)}
      {...props}
    />
  )
}

export function Subheading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-slate-900 dark:text-white", className)}
      {...props}
    />
  )
}

export function BodyText({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-slate-700 dark:text-slate-200", className)}
      {...props}
    />
  )
}

export function MutedText({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  )
}

export function LabelText({ className, as: Component = "label", ...props }: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType, htmlFor?: string }) {
  return (
    <Component
      className={cn("block text-sm font-semibold text-slate-700 dark:text-slate-300", className)}
      {...props}
    />
  )
}

export function Kicker({ className, as: Component = "span", ...props }: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <Component
      className={cn("text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500", className)}
      {...props}
    />
  )
}

