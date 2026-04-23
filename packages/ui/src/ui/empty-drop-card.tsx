import { type ReactNode, useRef } from "react"
import { Heading, MutedText } from "./typography"

interface EmptyDropCardProps {
  icon: ReactNode
  title: string
  subtitle?: string
  topRightSlot?: ReactNode
  onDropFiles?: (files: FileList | null) => void
  onClick?: () => void
  fileInput?: {
    accept?: string
    multiple?: boolean
    onInputFiles: (files: FileList | null) => void
  }
  className?: string
  iconWrapperClassName?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function EmptyDropCard({
  icon,
  title,
  subtitle,
  topRightSlot,
  onDropFiles,
  onClick,
  fileInput,
  className = "",
  iconWrapperClassName = "",
  titleClassName = "",
  subtitleClassName = ""
}: EmptyDropCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (fileInput) {
      inputRef.current?.click()
      return
    }
    onClick?.()
  }

  return (
    <div className={`relative ${className}`}>
      {fileInput ? (
        <input
          ref={inputRef}
          className="hidden"
          accept={fileInput.accept}
          multiple={fileInput.multiple}
          onChange={(event) => fileInput.onInputFiles(event.target.files)}
          type="file"
        />
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleClick()
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          onDropFiles?.(event.dataTransfer.files)
        }}
        className="group flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-12 text-center transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 bg-slate-50"
      >
        <div
          className={`mb-4 rounded-full border border-slate-100 bg-white p-4 shadow-sm transition-transform group-hover:-translate-y-1 dark:border-slate-700/50 dark:bg-slate-800 ${iconWrapperClassName}`}
        >
          {icon}
        </div>
        <Heading className={`text-base font-semibold ${titleClassName}`}>{title}</Heading>
        {subtitle ? <MutedText className={`mt-1.5 ${subtitleClassName}`}>{subtitle}</MutedText> : null}
      </div>

      {topRightSlot ? (
        <div
          className="absolute top-3 right-3"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {topRightSlot}
        </div>
      ) : null}
    </div>
  )
}
