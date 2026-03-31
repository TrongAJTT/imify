import { LabelText } from "@/options/components/ui/typography"

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  value: string
  onChange: (value: string) => void
}

export function TextInput({
  label,
  value,
  onChange,
  disabled,
  className = "",
  ...props
}: TextInputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <LabelText className="text-xs">{label}</LabelText>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs leading-5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  )
}
