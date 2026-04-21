import { SquareMousePointer } from "lucide-react"

import { Tooltip } from "@/options/components/tooltip"

interface VisualHelpTooltipProps {
  label?: string
  description: string
  mp4Src?: string
  webmSrc?: string
  buttonAriaLabel?: string
  mediaAlt?: string
}

export function VisualHelpTooltip({
  label = "Visual editing tips",
  description,
  mp4Src,
  webmSrc,
  buttonAriaLabel = "Visual editor help",
  mediaAlt = "Visual editor help preview"
}: VisualHelpTooltipProps) {
  if (!mp4Src && !webmSrc) {
    return null
  }

  return (
    <Tooltip
      variant="gif-preview"
      label={label}
      content={
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
          <video
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            aria-label={mediaAlt}
            className="w-full h-auto rounded-md border border-slate-200 dark:border-white/10 shadow-sm"
          >
            {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
            {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
          </video>
        </div>
      }
    >
      <button
        type="button"
        className="inline-flex items-center text-slate-400 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400 transition-colors"
        aria-label={buttonAriaLabel}
      >
        <SquareMousePointer size={14} />
      </button>
    </Tooltip>
  )
}
