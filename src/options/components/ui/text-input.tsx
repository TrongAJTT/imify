import { LabelText } from "@/options/components/ui/typography"

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string
  value: string
  onChange: (value: string) => void
  variant?: "default" | "large"
}

export function TextInput({
  label,
  value,
  onChange,
  disabled,
  variant = "default",
  className = "",
  ...props
}: TextInputProps) {
  const isLarge = variant === "large"

  return (
    <div className={`space-y-1 ${className}`}>
      <LabelText className="text-xs uppercase tracking-wider">{label}</LabelText>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 
          px-4 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 
          outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
          ${isLarge ? "h-12 text-sm font-mono py-3" : "h-9 text-xs py-2"}
        `}
        {...props}
      />
    </div>
  )
}
