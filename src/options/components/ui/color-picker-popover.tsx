import { useMemo, useRef } from "react"
import * as Popover from "@radix-ui/react-popover"
import { HexAlphaColorPicker, HexColorInput, HexColorPicker } from "react-colorful"

import { LabelText } from "@/options/components/ui/typography"

type ColorOutputMode = "rgba" | "hex"

interface ParsedRgba {
  r: number
  g: number
  b: number
  a: number
}

export interface ColorPickerPopoverProps {
  label: string
  value: string
  onChange: (value: string) => void
  enableAlpha?: boolean
  outputMode?: ColorOutputMode
  className?: string
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function clampAlpha(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function parseHexColor(hex: string): ParsedRgba | null {
  const normalized = hex.trim().replace("#", "")
  if (normalized.length === 3) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
      a: 1
    }
  }
  if (normalized.length === 4) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
      a: parseInt(normalized[3] + normalized[3], 16) / 255
    }
  }
  if (normalized.length === 6) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
      a: 1
    }
  }
  if (normalized.length === 8) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
      a: parseInt(normalized.slice(6, 8), 16) / 255
    }
  }
  return null
}

function parseRgbaColor(color: string): ParsedRgba | null {
  const match = color
    .trim()
    .match(/^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)(?:\s*,\s*([+-]?\d*\.?\d+))?\s*\)$/i)
  if (!match) return null
  return {
    r: clampByte(Number(match[1])),
    g: clampByte(Number(match[2])),
    b: clampByte(Number(match[3])),
    a: clampAlpha(match[4] ? Number(match[4]) : 1)
  }
}

function parseColor(value: string): ParsedRgba {
  return parseHexColor(value) || parseRgbaColor(value) || { r: 255, g: 255, b: 255, a: 1 }
}

function toHex2(channel: number): string {
  return clampByte(channel).toString(16).padStart(2, "0")
}

function toHex6(c: ParsedRgba): string {
  return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`
}

function toHex8(c: ParsedRgba): string {
  return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}${toHex2(Math.round(clampAlpha(c.a) * 255))}`
}

function toRgbaString(c: ParsedRgba): string {
  return `rgba(${clampByte(c.r)}, ${clampByte(c.g)}, ${clampByte(c.b)}, ${clampAlpha(c.a).toFixed(2)})`
}

export function ColorPickerPopover({
  label,
  value,
  onChange,
  enableAlpha = false,
  outputMode = "hex",
  className
}: ColorPickerPopoverProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const parsed = useMemo(() => parseColor(value), [value])
  const pickerValue = enableAlpha ? toHex8(parsed) : toHex6(parsed)
  const swatchValue = toRgbaString(parsed)

  const emitColor = (nextHex: string) => {
    const nextParsed = parseHexColor(nextHex)
    if (!nextParsed) return
    if (!enableAlpha) {
      nextParsed.a = 1
    }
    onChange(outputMode === "rgba" ? toRgbaString(nextParsed) : enableAlpha ? toHex8(nextParsed) : toHex6(nextParsed))
  }

  return (
    <Popover.Root>
      <div className={`relative ${className ?? ""}`.trim()}>
        <div className="flex items-center justify-between gap-2">
          <LabelText className="text-xs">{label}</LabelText>
          <Popover.Trigger asChild>
            <button
              ref={triggerRef}
              type="button"
              className="h-7 w-7 rounded border border-slate-200 dark:border-slate-700 bg-transparent p-0.5 transition-all hover:shadow-sm"
              aria-label={`Pick ${label} color`}
            >
              <span className="block h-full w-full rounded-sm" style={{ backgroundColor: swatchValue }} />
            </button>
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Content
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl p-3 z-[9999]"
            sideOffset={8}
            side="bottom"
            align="center"
            collisionPadding={12}
          >
            <div className="w-[200px]">
              {enableAlpha ? (
                <HexAlphaColorPicker color={pickerValue} onChange={emitColor} />
              ) : (
                <HexColorPicker color={pickerValue} onChange={emitColor} />
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <LabelText className="text-[11px]">Hex</LabelText>
                <HexColorInput
                  color={pickerValue}
                  alpha={enableAlpha}
                  prefixed
                  onChange={emitColor}
                  className="w-[112px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 outline-none"
                />
                {enableAlpha ? (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 min-w-[38px] text-right">
                    {Math.round(parsed.a * 100)}%
                  </span>
                ) : null}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  )
}
