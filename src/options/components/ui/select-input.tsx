import { LabelText } from "@/options/components/ui/typography"

export interface SelectInputOption {
  value: string
  label: string
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
  disabled,
  className = ""
}: {
  label: string
  value: string
  options: SelectInputOption[]
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className="space-y-1">
      <LabelText className="text-xs">{label}</LabelText>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs leading-5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

