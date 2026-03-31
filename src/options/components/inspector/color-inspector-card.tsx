import { Palette } from "lucide-react"
import type { ColorInfo, PaletteColor, ColorDisplayFormat } from "@/features/inspector"
import { InfoSection, InfoRow } from "./info-section"
import { generateCssVariables } from "@/features/inspector"
import { useInspectorStore } from "@/options/stores/inspector-store"

function formatColor(color: PaletteColor, format: ColorDisplayFormat): string {
  switch (format) {
    case "hex":
      return color.hex
    case "rgb":
      return `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`
    case "hsl":
      return `hsl(${color.hsl[0]}, ${color.hsl[1]}%, ${color.hsl[2]}%)`
  }
}

export function ColorInspectorCard({ color, palette }: { color: ColorInfo; palette: PaletteColor[] }) {
  const colorFormat = useInspectorStore((s) => s.colorFormat)
  const setColorFormat = useInspectorStore((s) => s.setColorFormat)

  if (palette.length === 0 && !color) return null

  const handleExportCss = async () => {
    try {
      const css = generateCssVariables(palette)
      await navigator.clipboard.writeText(css)
    } catch {
      // clipboard not available
    }
  }

  const formatToggle = (
    <div className="flex items-center gap-1">
      {(["hex", "rgb", "hsl"] as const).map((fmt) => (
        <button
          key={fmt}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setColorFormat(fmt)
          }}
          className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded transition-colors ${
            colorFormat === fmt
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          {fmt}
        </button>
      ))}
    </div>
  )

  return (
    <InfoSection
      title="COLOR"
      icon={<Palette size={13} />}
      badge={palette.length > 0 ? formatToggle : undefined}
    >
      <div className="space-y-3">
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          <InfoRow label="Color Space" value={color.colorSpace} />
          {color.bitDepth !== null && <InfoRow label="Bit Depth" value={`${color.bitDepth}-bit`} />}
          <InfoRow label="Alpha Channel" value={color.hasAlpha ? "Yes" : "No"} />
          {color.chromaSubsampling && <InfoRow label="Subsampling" value={color.chromaSubsampling} />}
          {color.iccProfileName && <InfoRow label="ICC Profile" value={color.iccProfileName} />}
        </div>

        {palette.length > 0 && (
          <>
            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
              <div className="grid grid-cols-2 gap-3">
                {palette.map((c, i) => {
                  const formatted = formatColor(c, colorFormat)
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-600 flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate">
                            {formatted}
                          </code>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                await navigator.clipboard.writeText(formatted)
                              } catch {
                                // ignore
                              }
                            }}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            title={`Copy ${formatted}`}
                          >
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">COPY</span>
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{c.percentage}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleExportCss}
                className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
              >
                Export as CSS Variables
              </button>
            </div>
          </>
        )}
      </div>
    </InfoSection>
  )
}


