import React from "react"
import { Image as ImageIcon, Layers, PenTool, WandSparkles } from "lucide-react"
import { MutedText } from "@imify/ui"

export function FillingInfoPanel() {
  return (
    <div className="space-y-6">
      <MutedText className="text-sm leading-relaxed">
        Build reusable template layouts, then place photos into each shape with clipping and fine-grained styling controls.
      </MutedText>

      <div className="space-y-5">
        <InfoRow
          icon={<Layers size={16} />}
          title="Template Library"
          description="Manage reusable layouts and quickly reopen any template for editing or filling."
        />
        <InfoRow
          icon={<PenTool size={16} />}
          title="Manual / Symmetric Editor"
          description="Create shape structures manually or generate patterned layouts, then adjust groups and layer hierarchy."
        />
        <InfoRow
          icon={<ImageIcon size={16} />}
          title="Fill & Customize"
          description="Drop images into each runtime item, then tune border, corner radius, and canvas background settings."
        />
        <InfoRow
          icon={<WandSparkles size={16} />}
          title="Advanced Export"
          description="Export composites in multiple formats with quality options while keeping the output fully client-side."
        />
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</div>
        <MutedText className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</MutedText>
      </div>
    </div>
  )
}

