import { useState } from "react"
import { Copy, Check, Code, Hash } from "lucide-react"
import { imageToBase64 } from "@/features/inspector"
import { InfoSection } from "./info-section"

interface ExportToolsCardProps {
  bitmap: ImageBitmap
  mimeType: string
  thumbHash: string | null
}

function CopyActionButton({
  label,
  icon,
  getValue
}: {
  label: string
  icon: React.ReactNode
  getValue: () => string | null
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle")

  const handleCopy = async () => {
    const val = getValue()
    if (!val) {
      setState("error")
      setTimeout(() => setState("idle"), 1500)
      return
    }
    try {
      await navigator.clipboard.writeText(val)
      setState("copied")
      setTimeout(() => setState("idle"), 2000)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 1500)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors text-left"
    >
      <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
        {state === "copied" ? <Check size={14} className="text-emerald-500" /> : icon}
      </span>
      <span className="flex-1 truncate">
        {state === "copied" ? "Copied!" : state === "error" ? "Failed" : label}
      </span>
      {state === "idle" && <Copy size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />}
    </button>
  )
}

export function ExportToolsCard({ bitmap, mimeType, thumbHash }: ExportToolsCardProps) {
  return (
    <InfoSection title="DEVELOPER TOOLS" icon={<Code size={13} />} defaultOpen={false}>
      <div className="flex flex-col gap-2">
        <CopyActionButton
          label="Copy as Base64 Data URI"
          icon={<Code size={14} />}
          getValue={() => imageToBase64(bitmap, mimeType)}
        />

        {thumbHash && (
          <CopyActionButton
            label="Copy ThumbHash"
            icon={<Hash size={14} />}
            getValue={() => thumbHash}
          />
        )}
      </div>

      {thumbHash && (
        <div className="mt-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            ThumbHash Preview
          </span>
          <code className="text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all">
            {thumbHash}
          </code>
        </div>
      )}
    </InfoSection>
  )
}
