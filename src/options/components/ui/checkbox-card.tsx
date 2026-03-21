import { HelpCircle } from "lucide-react"
import { Tooltip } from "@/options/components/tooltip"

interface CheckboxCardProps {
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
        <input
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          type="checkbox"
          className={`rounded border-slate-300 focus:ring-2 focus:ring-offset-0 w-3.5 h-4 ${
            isSky ? "text-sky-500 focus:ring-sky-500/20" : "text-primary-500 focus:ring-primary-500/20"
          }`}
        />
        <div className="flex items-center justify-between w-full min-w-0">
          <span className="font-bold text-[12px] whitespace-nowrap truncate mr-1">{title}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle size={16} className="text-slate-400 cursor-help shrink-0" />
            </Tooltip>
          )}
        </div>
      </div>
      {subtitle && (
        <span className="text-[10px] mt-0.5 opacity-70 ml-5 truncate w-full leading-none">
          {subtitle}
        </span>
      )}
    </label>
  )
}
