import type { SplitterSplitPlan } from "@/features/splitter/types"

interface SplitterPreviewProps {
  image: {
    name: string
    previewUrl: string
    width: number
    height: number
  } | null
  plan: SplitterSplitPlan | null
  warningText?: string | null
}

export function SplitterPreview({ image, plan, warningText }: SplitterPreviewProps) {
  if (!image) {
    return null
  }

  const xCuts = plan?.xCuts.slice(1, -1) ?? []
  const yCuts = plan?.yCuts.slice(1, -1) ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate">Preview: {image.name}</span>
        <span>{plan?.rects.length ?? 0} slices</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div
          className="relative mx-auto overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
          style={{
            width: "100%",
            maxHeight: "60vh",
            aspectRatio: `${Math.max(1, image.width)} / ${Math.max(1, image.height)}`
          }}
        >
          <img
            src={image.previewUrl}
            alt={image.name}
            className="h-full w-full object-contain"
            draggable={false}
          />

          <div className="pointer-events-none absolute inset-0">
            {xCuts.map((cut) => (
              <div
                key={`x_${cut}`}
                className="absolute top-0 bottom-0 w-px bg-cyan-500/80"
                style={{ left: `${(cut / image.width) * 100}%` }}
              />
            ))}

            {yCuts.map((cut) => (
              <div
                key={`y_${cut}`}
                className="absolute left-0 right-0 h-px bg-cyan-500/80"
                style={{ top: `${(cut / image.height) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {warningText ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
          {warningText}
        </div>
      ) : null}
    </div>
  )
}
