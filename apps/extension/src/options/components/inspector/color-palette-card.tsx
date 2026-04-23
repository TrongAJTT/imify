import { useState, useCallback } from "react"
import { Copy, Check, Code, Palette } from "lucide-react"
import type { PaletteColor, ColorDisplayFormat } from "@imify/features/inspector"
import { generateCssVariables } from "@imify/features/inspector"
import { InfoSection } from "./info-section"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"

interface ColorPaletteCardProps {
  palette: PaletteColor[]
}

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

function CopyButton({ text, size = 12 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard not available */ }
  }, [text])

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        handleCopy()
      }}
      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      title={`Copy ${text}`}
    >
      {copied
        ? <Check size={size} className="text-emerald-500" />
        : <Copy size={size} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
      }
    </button>
  )
}

function PaletteColorItem({ color, format }: { color: PaletteColor; format: ColorDisplayFormat }) {
  const formatted = formatColor(color, format)

  return (
    <div className="flex items-center gap-2.5 group">
      <div
        className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-600 flex-shrink-0 shadow-sm"
        style={{ backgroundColor: color.hex }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <code className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate">
            {formatted}
          </code>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={formatted} size={11} />
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{color.percentage}%</span>
      </div>
    </div>
  )
}

export function ColorPaletteCard({ palette }: ColorPaletteCardProps) {
  const colorFormat = useInspectorStore((s) => s.colorFormat)
  const setColorFormat = useInspectorStore((s) => s.setColorFormat)
  const [cssExported, setCssExported] = useState(false)

  if (palette.length === 0) return null

  const handleExportCss = async () => {
    try {
      const css = generateCssVariables(palette)
      await navigator.clipboard.writeText(css)
      setCssExported(true)
      setTimeout(() => setCssExported(false), 2000)
    } catch { /* clipboard not available */ }
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
      title="COLOR PALETTE"
      icon={<Palette size={13} />}
      badge={formatToggle}
    >
      <div className="grid grid-cols-2 gap-3">
        {palette.map((color, i) => (
          <PaletteColorItem key={i} color={color} format={colorFormat} />
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <button
          type="button"
          onClick={handleExportCss}
          className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
        >
          {cssExported ? <Check size={12} /> : <Code size={12} />}
          {cssExported ? "Copied CSS Variables" : "Export as CSS Variables"}
        </button>
      </div>
    </InfoSection>
  )
}
