import { HelpCircle } from "lucide-react"
import { Tooltip } from "@/options/components/tooltip"

interface CheckboxCardProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  tooltip?: string
  variant?: "primary" | "sky"
  className?: string
}

export function CheckboxCard({
  icon,
  title,
  subtitle,
  checked,
  onChange,
  disabled,
  tooltip,
  variant = "sky",
  className = ""
}: CheckboxCardProps) {
  const isSky = variant === "sky"

  const activeClasses = isSky
    ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200"
    : "border-primary-300 bg-primary-50 text-primary-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-200"

  const inactiveClasses = "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"

  return (
    <label
      className={`flex flex-col items-start justify-center rounded border px-2.5 py-1.5 transition-all ${
        checked ? activeClasses : inactiveClasses
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      <div className="flex items-center gap-2 w-full">
        {icon && (
        <div className="shrink-0 flex items-center justify-center text-sky-600 dark:text-sky-400">
          {icon}
        </div>)}
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <span className="font-bold text-[12px] text-slate-700 dark:text-slate-300 whitespace-nowrap truncate">{title}</span>
          <div className="flex items-center gap-2 shrink-0">
            {tooltip && (
              <Tooltip content={tooltip} variant="wide2">
                <HelpCircle size={16} className="text-slate-400 cursor-help" />
              </Tooltip>
            )}
            <input
              checked={checked}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked)}
              type="checkbox"
              className={`rounded border-slate-300 focus:ring-2 focus:ring-offset-0 w-3.5 h-4 ${
                isSky ? "text-sky-500 focus:ring-sky-500/20" : "text-primary-500 focus:ring-primary-500/20"
              }`}
            />
          </div>
        </div>
      </div>
      {subtitle && (
        <span className="text-[10px] mt-0.5 pb-1 opacity-70 ml-6 truncate w-full leading-none">
          {subtitle}
        </span>
      )}
    </label>
  )
}
