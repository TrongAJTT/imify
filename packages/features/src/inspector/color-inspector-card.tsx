import { useRef, useState } from "react"
import { Check, ChevronDown, Copy, Palette } from "lucide-react"
import type { ColorInfo, PaletteColor, ColorDisplayFormat } from "./types"
import {
  buildGradientCss,
  buildScssVariables,
  buildTailwindConfig,
  checkContrast,
  generateCssVariables,
  getColorName,
  getSuggestedGradient
} from "./index"
import { InfoSection, InfoRow } from "./info-section"
import { Tooltip } from "@imify/ui"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { INSPECTOR_TOOLTIPS } from "./inspector-tooltips"

function formatColor(c: PaletteColor, format: ColorDisplayFormat): string {
  switch (format) {
    case "hex": return c.hex
    case "rgb": return `rgb(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`
    case "hsl": return `hsl(${c.hsl[0]}, ${c.hsl[1]}%, ${c.hsl[2]}%)`
  }
}

function levelBadge(level: string) {
  const color =
    level === "AAA" ? "text-emerald-600 dark:text-emerald-400" :
    level === "AA" ? "text-sky-600 dark:text-sky-400" :
    level === "AA Large" ? "text-amber-600 dark:text-amber-400" :
    "text-red-500 dark:text-red-400"
  return <span className={`text-[10px] font-bold ${color}`}>{level}</span>
}

function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (value: number): number => {
    const normalized = value / 255
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

function pairContrastRatio(foreground: PaletteColor, background: PaletteColor): number {
  const lumA = relativeLuminance(foreground.rgb[0], foreground.rgb[1], foreground.rgb[2])
  const lumB = relativeLuminance(background.rgb[0], background.rgb[1], background.rgb[2])
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

function bestPaletteWcagPair(palette: PaletteColor[]): {
  foreground: PaletteColor
  background: PaletteColor
  ratio: number
  level: "AAA" | "AA" | "AA Large" | "Fail"
} | null {
  if (palette.length < 2) {
    return null
  }

  let best: {
    foreground: PaletteColor
    background: PaletteColor
    ratio: number
  } | null = null

  for (let i = 0; i < palette.length; i += 1) {
    for (let j = i + 1; j < palette.length; j += 1) {
      const ratio = pairContrastRatio(palette[i], palette[j])
      if (!best || ratio > best.ratio) {
        const fore = palette[i].hsl[2] > palette[j].hsl[2] ? palette[i] : palette[j]
        const back = fore === palette[i] ? palette[j] : palette[i]
        best = {
          foreground: fore,
          background: back,
          ratio
        }
      }
    }
  }

  if (!best) {
    return null
  }

  const level = best.ratio >= 7 ? "AAA" : best.ratio >= 4.5 ? "AA" : best.ratio >= 3 ? "AA Large" : "Fail"

  return {
    foreground: best.foreground,
    background: best.background,
    ratio: best.ratio,
    level
  }
}

function PaletteColorItem({ c, format }: { c: PaletteColor; format: ColorDisplayFormat }) {
  const [copied, setCopied] = useState(false)
  const formatted = formatColor(c, format)
  const name = getColorName(c.hsl)
  const contrast = checkContrast(c.rgb[0], c.rgb[1], c.rgb[2])

  const contrastTooltip = (
    <div className="space-y-1.5">
      <div className="font-bold text-[11px]">{INSPECTOR_TOOLTIPS.colorInspector.contrastTitle}</div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center w-7 h-5 rounded text-[11px] font-bold text-white"
          style={{ backgroundColor: c.hex }}
        >
          Aa
        </span>
        <span className="text-[11px]">{INSPECTOR_TOOLTIPS.colorInspector.onDark} &rarr;</span>
        {levelBadge(contrast.onBlack.level)}
        <span className="text-slate-400 text-[10px]">({contrast.onBlack.ratio.toFixed(1)}:1)</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center w-7 h-5 rounded text-[11px] font-bold text-black border border-slate-200"
          style={{ backgroundColor: c.hex }}
        >
          Aa
        </span>
        <span className="text-[11px]">{INSPECTOR_TOOLTIPS.colorInspector.onLight} &rarr;</span>
        {levelBadge(contrast.onWhite.level)}
        <span className="text-slate-400 text-[10px]">({contrast.onWhite.ratio.toFixed(1)}:1)</span>
      </div>
    </div>
  )

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className="flex items-center gap-2.5 group">
      <Tooltip content={contrastTooltip} variant="wide1">
        <div
          className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-600 flex-shrink-0 shadow-sm cursor-help"
          style={{ backgroundColor: c.hex }}
        />
      </Tooltip>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <code className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate">
            {formatted}
          </code>
          <Tooltip content={INSPECTOR_TOOLTIPS.colorInspector.copyColor(formatted)}>
            <button
              type="button"
              onClick={handleCopy}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              aria-label={INSPECTOR_TOOLTIPS.colorInspector.copyColor(formatted)}
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{c.percentage}%</span>
          <span className="text-[10px] text-slate-300 dark:text-slate-600">&middot;</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">{name}</span>
        </div>
      </div>
    </div>
  )
}

function ExportDropdown({ palette }: { palette: PaletteColor[] }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const copyWith = async (key: string, text: string | null) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch { /* ignore */ }
    setOpen(false)
  }

  const gradient = buildGradientCss(palette)

  const items: Array<{ key: string; label: string; getValue: () => string | null }> = [
    { key: "css", label: "CSS Variables (:root)", getValue: () => generateCssVariables(palette) },
    { key: "tailwind", label: "Tailwind Config (JS)", getValue: () => buildTailwindConfig(palette) },
    { key: "scss", label: "SCSS Variables ($var)", getValue: () => buildScssVariables(palette) },
    ...(gradient ? [{ key: "gradient", label: "Gradient (background CSS)", getValue: () => gradient }] : [])
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors font-medium"
      >
        Export Palette
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-1.5 z-50 min-w-[200px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 overflow-hidden">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => copyWith(item.key, item.getValue())}
                className="flex items-center justify-between gap-3 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <span>{item.label}</span>
                {copied === item.key
                  ? <Check size={12} className="text-emerald-500 flex-shrink-0" />
                  : <Copy size={11} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                }
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function GradientPreview({ palette }: { palette: PaletteColor[] }) {
  const [copied, setCopied] = useState(false)
  const suggestion = getSuggestedGradient(palette)
  const css = buildGradientCss(palette)
  if (!suggestion || !css) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(css)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className="mt-1 space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Suggested Gradient
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="relative w-full h-9 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 group"
        style={{ background: suggestion.css }}
        title={css}
      >
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "Copied!" : "Copy CSS"}
          </span>
        </span>
      </button>
    </div>
  )
}

export function ColorInspectorCard({ color, palette }: { color: ColorInfo; palette: PaletteColor[] }) {
  const colorFormat = useInspectorStore((s) => s.colorFormat)
  const setColorFormat = useInspectorStore((s) => s.setColorFormat)
  const [isOpen, setIsOpen] = useState(true)

  if (palette.length === 0 && !color) return null

  const wcagPair = bestPaletteWcagPair(palette)

  const formatToggle = palette.length > 0 && isOpen ? (
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
  ) : undefined

  return (
    <InfoSection
      title="COLOR"
      icon={<Palette size={13} />}
      badge={formatToggle}
      collapsible={true}
      defaultOpen={true}
      onOpenChange={setIsOpen}
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {palette.map((c, i) => (
                  <PaletteColorItem key={i} c={c} format={colorFormat} />
                ))}
              </div>
            </div>

            <GradientPreview palette={palette} />

            {wcagPair && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  WCAG Auto Pair
                </span>
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div
                    className="px-3 py-2 text-xs font-semibold"
                    style={{
                      backgroundColor: wcagPair.background.hex,
                      color: wcagPair.foreground.hex
                    }}
                  >
                    Sample Text Aa • {wcagPair.foreground.hex} on {wcagPair.background.hex}
                  </div>
                  <div className="px-3 py-1.5 text-[10px] flex items-center justify-between bg-white dark:bg-slate-900/40">
                    <span className="text-slate-500 dark:text-slate-400">Contrast {wcagPair.ratio.toFixed(2)}:1</span>
                    {levelBadge(wcagPair.level)}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1 border-t border-slate-100 dark:border-slate-700/50">
              <ExportDropdown palette={palette} />
            </div>
          </>
        )}
      </div>
    </InfoSection>
  )
}
